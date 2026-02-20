export interface RedactionOptions {
  enabled?: boolean;
  profiles?: Array<"email" | "phone" | "ip" | "token" | "credit-card" | "custom-regex">;
  replacement?: string;
  customPatterns?: Array<{ name: string; pattern: string; flags?: string }>;
  applyTo?: Array<"content" | "embeds" | "attachments-filenames" | "usernames">;
  preserveOriginalInRaw?: boolean;
}

export interface RedactionMatchCount {
  profile: string;
  count: number;
}

export interface RedactionReport {
  enabled: boolean;
  replacement: string;
  counts: RedactionMatchCount[];
  redactedMessages: number;
}
