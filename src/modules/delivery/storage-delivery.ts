import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, posix } from "node:path";
import type {
  ExportRequest,
  RenderArtifact,
  StorageDeliveryResult,
  StorageProviderKind,
  StorageTarget,
  StorageUploadResult,
} from "@/types.js";
import { OptionalDependencyError } from "@/shared/errors/index.js";
import { createConcurrencyLimiter } from "@/shared/async/concurrency.js";
import { requireOptional } from "@/shared/optional-require.js";

const require = createRequire(import.meta.url);

interface UploadArtifactsToStorageOptions {
  request: ExportRequest;
  artifacts: RenderArtifact[];
  exportId: string;
  warnings: string[];
}

class StorageHttpStatusError extends Error {
  public readonly status: number;

  public constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function uploadArtifactsToStorage(
  options: UploadArtifactsToStorageOptions,
): Promise<StorageDeliveryResult | undefined> {
  const { request, artifacts, exportId, warnings } = options;
  const storage = request.output.storage;

  if (!storage?.enabled || !storage.providers?.length) {
    return undefined;
  }

  const concurrency = Math.max(1, storage.concurrency ?? 4);
  const strict = storage.strict ?? false;
  const limit = createConcurrencyLimiter(concurrency);
  const retryAttempts = 3;
  const retryBackoffMs = 1000;
  const uploads: StorageUploadResult[] = [];
  const failures: Array<{ provider: StorageProviderKind; objectKey: string; error: string }> = [];

  const tasks: Array<Promise<void>> = [];

  for (const provider of storage.providers) {
    for (const artifact of artifacts) {
      const objectKey = buildObjectKey(provider, artifact.path, exportId);
      tasks.push(
        limit(async () => {
          try {
            const upload = await uploadSingleArtifactWithRetry({
              provider,
              artifact,
              objectKey,
              attempts: retryAttempts,
              backoffMs: retryBackoffMs,
            });
            uploads.push(upload);
          } catch (error) {
            const item = {
              provider: provider.kind,
              objectKey,
              error: error instanceof Error ? error.message : String(error),
            } as const;
            failures.push(item);
            warnings.push(
              `Storage upload failed (${provider.kind}:${objectKey}): ${item.error}`,
            );
            if (strict) {
              throw new Error(
                `Storage strict mode failure (${provider.kind}:${objectKey}): ${item.error}`,
                { cause: error },
              );
            }
          }
        }),
      );
    }
  }

  await Promise.all(tasks);

  return {
    uploads,
    failures,
  };
}

async function uploadSingleArtifactWithRetry(options: {
  provider: StorageTarget;
  artifact: RenderArtifact;
  objectKey: string;
  attempts: number;
  backoffMs: number;
}): Promise<StorageUploadResult> {
  const { provider, artifact, objectKey, attempts, backoffMs } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await uploadSingleArtifact(provider, artifact, objectKey);
    } catch (error) {
      lastError = error;
      if (!isRetryableStorageError(error) || attempt >= attempts) {
        throw error;
      }

      const delayMs = backoffMs * 2 ** (attempt - 1);
      await sleep(delayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Storage upload failed.");
}

async function uploadSingleArtifact(
  provider: StorageTarget,
  artifact: RenderArtifact,
  objectKey: string,
): Promise<StorageUploadResult> {
  const body = await readFile(artifact.path);

  switch (provider.kind) {
    case "s3":
      return uploadToS3(provider, objectKey, body, artifact.contentType);
    case "gcs":
      return uploadToGcs(provider, objectKey, body, artifact.contentType);
    case "azure-blob":
      return uploadToAzureBlob(provider, objectKey, body, artifact.contentType);
    default:
      throw new Error(`Unsupported storage provider ${(provider as { kind?: string }).kind}`);
  }
}

async function uploadToS3(
  provider: Extract<StorageTarget, { kind: "s3" }>,
  objectKey: string,
  body: Buffer,
  contentType: string,
): Promise<StorageUploadResult> {
  let sdk: {
    S3Client: new (config: Record<string, unknown>) => unknown;
    PutObjectCommand: new (input: Record<string, unknown>) => unknown;
  };

  sdk = requireOptional<typeof sdk>("@aws-sdk/client-s3", "S3 storage upload", require);

  const client = new sdk.S3Client({
    region: provider.region ?? process.env.AWS_REGION ?? "us-east-1",
    endpoint: provider.endpoint,
  }) as { send(command: unknown): Promise<{ ETag?: string }> };

  const command = new sdk.PutObjectCommand({
    Bucket: provider.bucket,
    Key: objectKey,
    Body: body,
    ContentType: contentType,
  });

  const response = await client.send(command);
  if ((response as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 429) {
    throw new StorageHttpStatusError(429, "S3 upload rate limited (HTTP 429).");
  }
  const url = provider.endpoint
    ? `${provider.endpoint.replace(/\/$/, "")}/${provider.bucket}/${objectKey}`
    : `https://${provider.bucket}.s3.${provider.region ?? "us-east-1"}.amazonaws.com/${objectKey}`;

  return {
    provider: "s3",
    objectKey,
    url,
    etag: response.ETag,
  };
}

async function uploadToGcs(
  provider: Extract<StorageTarget, { kind: "gcs" }>,
  objectKey: string,
  body: Buffer,
  contentType: string,
): Promise<StorageUploadResult> {
  let sdk: {
    Storage: new (config: Record<string, unknown>) => {
      bucket(name: string): {
        file(path: string): {
          save(content: Buffer, options?: Record<string, unknown>): Promise<void>;
          getMetadata(): Promise<[Record<string, unknown>]>;
        };
      };
    };
  };

  sdk = requireOptional<typeof sdk>("@google-cloud/storage", "GCS storage upload", require);

  const storage = new sdk.Storage({
    projectId: provider.projectId,
    keyFilename: provider.credentialsJsonPath,
  });
  const file = storage.bucket(provider.bucket).file(objectKey);
  await file.save(body, {
    resumable: false,
    contentType,
  });
  const [metadata] = await file.getMetadata();
  if (typeof metadata.status === "number" && metadata.status >= 500) {
    throw new StorageHttpStatusError(metadata.status, `GCS upload failed with status ${metadata.status}.`);
  }

  return {
    provider: "gcs",
    objectKey,
    url: `https://storage.googleapis.com/${provider.bucket}/${objectKey}`,
    etag: typeof metadata.etag === "string" ? metadata.etag : undefined,
  };
}

async function uploadToAzureBlob(
  provider: Extract<StorageTarget, { kind: "azure-blob" }>,
  objectKey: string,
  body: Buffer,
  contentType: string,
): Promise<StorageUploadResult> {
  let sdk: {
    BlobServiceClient: {
      fromConnectionString(connectionString: string): {
        getContainerClient(name: string): {
          createIfNotExists(): Promise<void>;
          getBlockBlobClient(blobName: string): {
            uploadData(data: Buffer, options?: Record<string, unknown>): Promise<{ etag?: string }>;
            url: string;
          };
        };
      };
      new (url: string): unknown;
    };
  };

  sdk = requireOptional<typeof sdk>("@azure/storage-blob", "Azure Blob storage upload", require);

  const connectionString =
    provider.connectionString ?? process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error(
      "Azure Blob upload requires provider.connectionString or AZURE_STORAGE_CONNECTION_STRING",
    );
  }

  const service = sdk.BlobServiceClient.fromConnectionString(connectionString);
  const container = service.getContainerClient(provider.container);
  await container.createIfNotExists();
  const blob = container.getBlockBlobClient(objectKey);
  const response = await blob.uploadData(body, {
    blobHTTPHeaders: {
      blobContentType: contentType,
    },
  });
  if ((response as { _response?: { status?: number } })._response?.status === 429) {
    throw new StorageHttpStatusError(429, "Azure Blob upload rate limited (HTTP 429).");
  }

  return {
    provider: "azure-blob",
    objectKey,
    url: blob.url,
    etag: response.etag,
  };
}

function buildObjectKey(provider: StorageTarget, filePath: string, exportId: string): string {
  const baseName = basename(filePath);
  const prefix =
    provider.kind === "s3" || provider.kind === "gcs" || provider.kind === "azure-blob"
      ? provider.keyPrefix
      : undefined;
  return posix.join(prefix ?? "", exportId, baseName).replace(/^\/+/, "");
}

function isRetryableStorageError(error: unknown): boolean {
  if (error instanceof OptionalDependencyError) {
    return false;
  }

  if (error instanceof StorageHttpStatusError) {
    return error.status === 429 || error.status >= 500;
  }

  return true;
}

async function sleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return;
  }

  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
