import type { RedactionReport } from "./redaction.js";
import type { ExportStats } from "./stats.js";

export interface ComplianceOptions {
  manifest?: {
    enabled?: boolean;
    includeLimitations?: boolean;
    includeWarnings?: boolean;
    canonicalJson?: boolean;
  };
  signature?: {
    enabled?: boolean;
    algorithm?: "ed25519";
    privateKeyPem?: string;
    privateKeyPath?: string;
    keyId?: string;
  };
}

export interface ComplianceManifest {
  exportId: string;
  createdAt: string;
  channelId: string;
  guildId?: string;
  formats: string[];
  artifacts: Array<{
    format: string;
    path: string;
    contentType: string;
    size: number;
    checksumSha256: string;
  }>;
  stats: ExportStats;
  warnings?: string[];
  limitations?: string[];
  redaction?: RedactionReport;
  signature?: {
    algorithm: "ed25519";
    keyId?: string;
    signatureBase64: string;
  };
}
