import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import type {
  AttachmentOptions,
  ComplianceOptions,
  ExportRequest,
  FilterGroup,
  MonitoringOptions,
  OutputStorageOptions,
  OutputTargetMode,
  OutputWebhookOptions,
  RedactionOptions,
  RenderOptions,
  StorageTarget,
  WebhookTarget,
} from "@/types.js";
import { safeJsonParse } from "@/shared/json/safe-json.js";
import {
  parseCliOptions,
  parseFilterGroup,
  parseRedactionCustomFile,
  validateStorageTarget,
  validateWebhookTarget,
} from "@/modules/cli/schemas.js";

export { parseCliOptions } from "@/modules/cli/schemas.js";

export async function buildBaseExportRequest(options: unknown): Promise<Omit<ExportRequest, "channelId">> {
  const parsed = parseCliOptions(options);
  const formats = parseCsv(parsed.formats) ?? [];
  const threadIds = parseCsv(parsed.threads);
  const filters = parsed.filterFile ? await loadFilters(parsed.filterFile) : undefined;

  const attachments: AttachmentOptions = {
    mode: parsed.attachmentsMode as AttachmentOptions["mode"],
    downloadConcurrency: Number(parsed.downloadConcurrency ?? 4),
    maxBase64Bytes: Number(parsed.maxBase64Bytes ?? 1_500_000),
  };

  const outputTarget = parseOutputTarget(parsed.outputTarget ?? "filesystem");
  const outputDir =
    parsed.out?.trim() ||
    (outputTarget === "filesystem" || outputTarget === "both" ? "./exports" : undefined);

  const hasDbConfig = Boolean(
    parsed.dbDriver ||
      parsed.dbConnection ||
      parsed.dbHost ||
      parsed.dbSqlite ||
      parsed.dbName ||
      parsed.dbCollection,
  );

  const storage = buildStorageOptions(parsed);
  const webhooks = buildWebhookOptions(parsed);
  const redaction = await buildRedactionOptions(parsed);
  const compliance = buildComplianceOptions(parsed);
  const monitoring = await buildMonitoringOptions(parsed);

  return {
    token: parsed.token ?? "",
    guildId: parsed.guild,
    threadIds,
    formats,
    filters,
    attachments,
    render: {
      theme: parsed.theme as RenderOptions["theme"],
      timezone: parsed.timezone,
      timestampFormat: parsed.timestampFormat as RenderOptions["timestampFormat"],
      watermark: parsed.watermark,
      readOnly: Boolean(parsed.readOnly),
      rtl: Boolean(parsed.rtl),
      includeTableOfContents: Boolean(parsed.toc),
      html: {
        searchable: Boolean(parsed.htmlSearchable),
        accessibilityMode: Boolean(parsed.htmlAccessibility),
        templatePath: parsed.htmlTemplate,
        panels:
          parsed.htmlNoServerList || parsed.htmlNoChannelList || parsed.htmlNoMembers
            ? {
                serverList: !parsed.htmlNoServerList,
                channelList: !parsed.htmlNoChannelList,
                membersSidebar: !parsed.htmlNoMembers,
              }
            : undefined,
      },
      splitPolicy:
        parsed.splitMaxMessages || parsed.splitMaxBytes
          ? {
              maxMessagesPerChunk: parsed.splitMaxMessages
                ? Math.max(1, Number(parsed.splitMaxMessages))
                : undefined,
              maxBytesPerChunk: parsed.splitMaxBytes
                ? Math.max(1, Number(parsed.splitMaxBytes))
                : undefined,
            }
          : undefined,
    },
    output: {
      dir: outputDir,
      basename: parsed.basename,
      target: outputTarget,
      retainFiles: Boolean(parsed.retainFiles),
      discord: parsed.discordOutputChannel
        ? {
            channelId: parsed.discordOutputChannel,
            token: parsed.discordOutputToken,
            content: parsed.discordOutputContent,
          }
        : undefined,
      database: hasDbConfig
        ? {
            enabled: true,
            driver: parsed.dbDriver ?? (parsed.dbSqlite ? "sqlite" : undefined),
            connectionString: parsed.dbConnection,
            host: parsed.dbHost,
            port: parsed.dbPort && Number.isFinite(Number(parsed.dbPort)) ? Number(parsed.dbPort) : undefined,
            user: parsed.dbUser,
            password: parsed.dbPassword,
            databaseName: parsed.dbName,
            collection: parsed.dbCollection,
            tls: Boolean(parsed.dbTls),
            sqlitePath: parsed.dbSqlite,
            table: parsed.dbTable,
          }
        : undefined,
      storage,
      webhooks,
      encryption: parsed.zipPassword
        ? {
            enabled: true,
            password: parsed.zipPassword,
            method: "zip-aes256",
          }
        : undefined,
      incremental: parsed.incremental
        ? {
            enabled: true,
            stateFile: parsed.incrementalState,
          }
        : undefined,
    },
    analytics: parsed.analytics || parsed.ai
      ? {
          enabled: Boolean(parsed.analytics || parsed.ai),
          includeHeatmap: Boolean(parsed.analyticsHeatmap),
          topWordsLimit: Math.max(5, Number(parsed.topWords ?? 100)),
          topMentionedLimit: Math.max(3, Number(parsed.topMentions ?? 25)),
          ai: parsed.ai
            ? {
                enabled: true,
                providerId: parsed.aiProvider,
                prompt: parsed.aiPrompt,
                maxHighlights: Math.max(3, Number(parsed.aiMaxHighlights ?? 8)),
              }
            : undefined,
        }
      : undefined,
    redaction,
    delta: parsed.delta
      ? {
          enabled: true,
          mode: "best-effort",
          includeEdits: parsed.deltaEdits !== false,
          includeDeletes: parsed.deltaDeletes !== false,
          checkpointFile: parsed.deltaCheckpoint,
        }
      : undefined,
    compliance,
    monitoring,
  };
}

export function buildStorageOptions(options: ReturnType<typeof parseCliOptions>): OutputStorageOptions | undefined {
  const enabled = Boolean(options.storageEnable);
  const providers = parseStringArray(options.storageProvider);

  if (!enabled && providers.length === 0) {
    return undefined;
  }

  if (providers.length === 0) {
    throw new Error("--storage-enable requires at least one --storage-provider");
  }

  const buckets = parseStringArray(options.storageBucket);
  const prefixes = parseStringArray(options.storagePrefix);
  const endpoints = parseStringArray(options.storageEndpoint);
  const regions = parseStringArray(options.storageRegion);
  const accounts = parseStringArray(options.storageAccount);
  const containers = parseStringArray(options.storageContainer);
  const gcsProjects = parseStringArray(options.storageGcsProject);
  const gcsCreds = parseStringArray(options.storageGcsCredentials);
  const connectionStrings = parseStringArray(options.storageConnectionString);

  const targets: StorageTarget[] = [];

  for (let i = 0; i < providers.length; i += 1) {
    const kind = providers[i] as StorageTarget["kind"];

    if (kind === "s3") {
      const bucket = buckets[i] ?? buckets[0];
      if (!bucket) {
        throw new Error("S3 storage target requires --storage-bucket");
      }
      targets.push(
        validateStorageTarget({
          kind: "s3",
          bucket,
          keyPrefix: prefixes[i] ?? prefixes[0],
          endpoint: endpoints[i] ?? endpoints[0],
          region: regions[i] ?? regions[0],
        }),
      );
      continue;
    }

    if (kind === "gcs") {
      const bucket = buckets[i] ?? buckets[0];
      if (!bucket) {
        throw new Error("GCS storage target requires --storage-bucket");
      }
      targets.push(
        validateStorageTarget({
          kind: "gcs",
          bucket,
          keyPrefix: prefixes[i] ?? prefixes[0],
          projectId: gcsProjects[i] ?? gcsProjects[0],
          credentialsJsonPath: gcsCreds[i] ?? gcsCreds[0],
        }),
      );
      continue;
    }

    if (kind === "azure-blob") {
      const account = accounts[i] ?? accounts[0];
      const container = containers[i] ?? containers[0];
      if (!account || !container) {
        throw new Error("Azure Blob storage target requires --storage-account and --storage-container");
      }

      targets.push(
        validateStorageTarget({
          kind: "azure-blob",
          account,
          container,
          keyPrefix: prefixes[i] ?? prefixes[0],
          connectionString: connectionStrings[i] ?? connectionStrings[0],
        }),
      );
      continue;
    }

    throw new Error(`Unsupported storage provider '${providers[i]}'`);
  }

  return {
    enabled: true,
    strict: Boolean(options.storageStrict),
    providers: targets,
  };
}

export function buildWebhookOptions(options: ReturnType<typeof parseCliOptions>): OutputWebhookOptions | undefined {
  const targets: WebhookTarget[] = [];

  const generic = parseStringArray(options.webhookGeneric);
  const discord = parseStringArray(options.webhookDiscord);
  const slack = parseStringArray(options.webhookSlack);

  for (const url of generic) {
    targets.push(
      validateWebhookTarget({
        kind: "generic",
        url,
        method: "POST",
      }),
    );
  }

  for (const url of discord) {
    targets.push(
      validateWebhookTarget({
        kind: "discord",
        url,
      }),
    );
  }

  for (const url of slack) {
    targets.push(
      validateWebhookTarget({
        kind: "slack",
        url,
      }),
    );
  }

  if (targets.length === 0) {
    return undefined;
  }

  return {
    enabled: true,
    strict: Boolean(options.webhookStrict),
    targets,
    retry: {
      attempts: Math.max(1, Number(options.webhookRetryAttempts ?? 3)),
      backoffMs: Math.max(100, Number(options.webhookRetryBackoff ?? 1000)),
    },
  };
}

export async function buildRedactionOptions(
  options: ReturnType<typeof parseCliOptions>,
): Promise<RedactionOptions | undefined> {
  if (!options.redaction) {
    return undefined;
  }

  const profiles = options.redactionProfiles
    ? (parseCsv(options.redactionProfiles) as RedactionOptions["profiles"])
    : undefined;

  let customPatterns = undefined;
  if (options.redactionCustomFile) {
    const raw = await readFile(options.redactionCustomFile, "utf8");
    const parsed = safeJsonParse<unknown>(raw, "redaction custom pattern file");
    customPatterns = parseRedactionCustomFile(parsed);
  }

  return {
    enabled: true,
    profiles,
    replacement: options.redactionReplacement,
    customPatterns,
  };
}

export function buildComplianceOptions(options: ReturnType<typeof parseCliOptions>): ComplianceOptions | undefined {
  if (!options.manifest && !options.signEd25519Key) {
    return undefined;
  }

  return {
    manifest: {
      enabled: Boolean(options.manifest || options.signEd25519Key),
      includeLimitations: true,
      includeWarnings: true,
      canonicalJson: true,
    },
    signature: options.signEd25519Key
      ? {
          enabled: true,
          algorithm: "ed25519",
          privateKeyPath: options.signEd25519Key,
          keyId: options.signKeyId,
        }
      : undefined,
  };
}

export async function buildMonitoringOptions(
  options: ReturnType<typeof parseCliOptions>,
): Promise<MonitoringOptions | undefined> {
  const progressFile = options.progressJsonl ? options.progressJsonl : undefined;
  const verbose = Boolean(options.verboseProgress);

  if (!progressFile && !verbose) {
    return undefined;
  }

  if (progressFile) {
    await mkdir(dirname(progressFile), { recursive: true });
  }

  return {
    onEvent: async (event) => {
      if (verbose) {
        process.stderr.write(`[progress] ${JSON.stringify(event)}\n`);
      }

      if (progressFile) {
        await appendFile(progressFile, `${JSON.stringify(event)}\n`, "utf8");
      }
    },
  };
}

export async function loadFilters(filePath: string): Promise<FilterGroup> {
  const raw = await readFile(filePath, "utf8");
  return parseFilterGroup(safeJsonParse<unknown>(raw, `filter file ${filePath}`));
}

export function collectValues(value: string, previous: string[]): string[] {
  previous.push(value);
  return previous;
}

export function parseCsv(value: string | undefined): string[] | undefined {
  if (!value || value.trim().length === 0) {
    return undefined;
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function parseStringArray(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter((entry) => entry.length > 0);
  }

  const single = String(value).trim();
  return single ? [single] : [];
}

export function parseOutputTarget(value: string): OutputTargetMode {
  if (value === "filesystem" || value === "discord-channel" || value === "both") {
    return value;
  }

  throw new Error("Invalid --output-target value. Use: filesystem | discord-channel | both");
}
