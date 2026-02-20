/**
 * Redact PII/sensitive content in transcript based on options.
 */
import type {
  TranscriptDocument,
  RedactionOptions,
  RedactionReport,
  RedactionMatchCount,
} from "@/types.js";

const DEFAULT_REPLACEMENT = "[REDACTED]";

function redactInString(
  text: string,
  pattern: RegExp,
  replacement: string,
  counts: Map<string, number>,
  profileName: string,
): string {
  let count = 0;
  const out = text.replace(pattern, () => {
    count += 1;
    return replacement;
  });
  if (count > 0) {
    counts.set(profileName, (counts.get(profileName) ?? 0) + count);
  }
  return out;
}

export function applyRedaction(
  transcript: TranscriptDocument,
  options: RedactionOptions | undefined,
): { transcript: TranscriptDocument; report: RedactionReport } {
  const replacement = options?.replacement ?? DEFAULT_REPLACEMENT;
  const counts = new Map<string, number>();
  let redactedMessages = 0;

  if (!options?.enabled || !options?.profiles?.length) {
    return {
      transcript,
      report: {
        enabled: false,
        replacement,
        counts: [],
        redactedMessages: 0,
      },
    };
  }

  const profiles = options.profiles;
  const customPatterns = options.customPatterns ?? [];

  for (const msg of transcript.messages) {
    let changed = false;
    let content = msg.content ?? "";

    for (const profile of profiles) {
      if (profile === "email") {
        const re = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
        const next = redactInString(content, re, replacement, counts, "email");
        if (next !== content) changed = true;
        content = next;
      } else if (profile === "phone") {
        const re = /\b(?:\+\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}\b/g;
        const next = redactInString(content, re, replacement, counts, "phone");
        if (next !== content) changed = true;
        content = next;
      } else if (profile === "token") {
        const re = /\b(?:Bearer\s+)?[A-Za-z0-9_-]{20,}\b/g;
        const next = redactInString(content, re, replacement, counts, "token");
        if (next !== content) changed = true;
        content = next;
      }
    }

    for (const cp of customPatterns) {
      const re = new RegExp(cp.pattern, cp.flags ?? "g");
      const next = redactInString(content, re, replacement, counts, cp.name);
      if (next !== content) changed = true;
      content = next;
    }

    if (changed) {
      msg.content = content;
      redactedMessages += 1;
    }
  }

  const countList: RedactionMatchCount[] = [...counts.entries()].map(([profile, count]) => ({
    profile,
    count,
  }));

  return {
    transcript,
    report: {
      enabled: true,
      replacement,
      counts: countList,
      redactedMessages,
    },
  };
}
