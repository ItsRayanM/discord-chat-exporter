import { createSign, sign as signDirect } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import type {
  ComplianceManifest,
  ExportRequest,
  ExportStats,
  RedactionReport,
  RenderArtifact,
  TranscriptDocument,
} from "@/types.js";
import { ValidationError } from "@/shared/errors/index.js";
import { hashFileSha256 } from "@/modules/transcript/index.js";

const require = createRequire(import.meta.url);

export async function generateComplianceArtifacts(options: {
  request: ExportRequest;
  transcript: TranscriptDocument;
  artifacts: RenderArtifact[];
  stats: ExportStats;
  outputBaseName: string;
  outputDir: string;
  warnings: string[];
  limitations: string[];
  redactionReport?: RedactionReport;
  exportId: string;
}): Promise<{ artifacts: RenderArtifact[]; manifest?: ComplianceManifest }> {
  const {
    request,
    artifacts,
    stats,
    outputBaseName,
    outputDir,
    warnings,
    limitations,
    redactionReport,
    exportId,
  } = options;

  const compliance = request.compliance;
  if (!compliance) {
    return { artifacts: [] };
  }

  const manifestEnabled = compliance.manifest?.enabled ?? true;
  if (!manifestEnabled) {
    return { artifacts: [] };
  }

  const manifest: ComplianceManifest = {
    exportId,
    createdAt: new Date().toISOString(),
    channelId: request.channelId,
    guildId: request.guildId,
    formats: request.formats.map(String),
    artifacts: artifacts.map((artifact) => ({
      format: artifact.format,
      path: artifact.path,
      contentType: artifact.contentType,
      size: artifact.size,
      checksumSha256: artifact.checksumSha256,
    })),
    stats,
    warnings: compliance.manifest?.includeWarnings ?? true ? [...warnings] : undefined,
    limitations: compliance.manifest?.includeLimitations ?? true ? [...limitations] : undefined,
    redaction: redactionReport,
  };

  const canonical = compliance.manifest?.canonicalJson ?? true;
  let manifestPayload = canonical
    ? canonicalizeJson(manifest)
    : JSON.stringify(manifest, null, 2);

  if (compliance.signature?.enabled) {
    const privateKey = await resolveSigningKey(compliance.signature.privateKeyPem, compliance.signature.privateKeyPath);
    const signature = signPayload(manifestPayload, privateKey);
    manifest.signature = {
      algorithm: compliance.signature.algorithm ?? "ed25519",
      keyId: compliance.signature.keyId,
      signatureBase64: signature,
    };
    manifestPayload = canonical
      ? canonicalizeJson(manifest)
      : JSON.stringify(manifest, null, 2);
  }

  const manifestPath = join(outputDir, `${outputBaseName}.manifest.json`);
  await writeFile(manifestPath, manifestPayload, "utf8");
  const manifestInfo = await hashFileSha256(manifestPath);

  const outputArtifacts: RenderArtifact[] = [
    {
      format: "manifest",
      path: manifestPath,
      contentType: "application/json",
      size: manifestInfo.size,
      checksumSha256: manifestInfo.checksum,
    },
  ];

  if (manifest.signature) {
    const signaturePath = join(outputDir, `${outputBaseName}.manifest.sig`);
    await writeFile(signaturePath, manifest.signature.signatureBase64, "utf8");
    const sigInfo = await hashFileSha256(signaturePath);
    outputArtifacts.push({
      format: "manifest-signature",
      path: signaturePath,
      contentType: "text/plain",
      size: sigInfo.size,
      checksumSha256: sigInfo.checksum,
    });
  }

  return {
    artifacts: outputArtifacts,
    manifest,
  };
}

async function resolveSigningKey(privateKeyPem?: string, privateKeyPath?: string): Promise<string> {
  if (privateKeyPem?.trim()) {
    return privateKeyPem.trim();
  }

  if (privateKeyPath?.trim()) {
    return readFile(privateKeyPath.trim(), "utf8");
  }

  throw new ValidationError(
    "compliance.signature.enabled=true requires privateKeyPem or privateKeyPath",
  );
}

function signPayload(payload: string, privateKey: string): string {
  try {
    const buffer = signDirect(null, Buffer.from(payload, "utf8"), privateKey);
    return buffer.toString("base64");
  } catch {
    // Fallback path for runtimes needing explicit Sign instance.
    const signer = createSign("SHA256");
    signer.update(payload, "utf8");
    signer.end();
    const signature = signer.sign(privateKey);
    return signature.toString("base64");
  }
}

function canonicalizeJson(value: unknown): string {
  try {
    const { canonicalize } = require("json-canonicalize") as {
      canonicalize: (input: unknown) => string;
    };
    return canonicalize(value);
  } catch {
    return stableStringify(value);
  }
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value), null, 2);
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const output: Record<string, unknown> = {};
    for (const [key, nested] of entries) {
      output[key] = sortValue(nested);
    }
    return output;
  }
  return value;
}
