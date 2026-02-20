import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import type { SchedulerJob } from "@/modules/scheduler/index.js";
import { safeJsonParse } from "@/shared/json/safe-json.js";
import { parseSchedulerJobsFile } from "@/modules/cli/schemas.js";
import { parseCsv } from "@/modules/cli/build-request.js";

export async function resolveBatchChannels(
  channels: string | undefined,
  channelsFile: string | undefined,
): Promise<string[]> {
  const parsed = parseCsv(channels) ?? [];

  if (!channelsFile) {
    return parsed;
  }

  const raw = await readFile(String(channelsFile), "utf8");
  const ext = extname(String(channelsFile)).toLowerCase();

  if (ext === ".json") {
    const data = safeJsonParse<unknown>(raw, `channels file ${channelsFile}`);
    const fromJson = Array.isArray(data)
      ? data
      : data && typeof data === "object" && Array.isArray((data as { channels?: unknown[] }).channels)
        ? (data as { channels: unknown[] }).channels
        : [];

    return [...new Set([...parsed, ...fromJson.map((entry) => String(entry))])];
  }

  const fromText = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return [...new Set([...parsed, ...fromText])];
}

export async function loadJobsFromFile(path: string): Promise<SchedulerJob[]> {
  const raw = await readFile(path, "utf8");
  const parsed = safeJsonParse<unknown>(raw, `scheduler jobs file ${path}`);
  return parseSchedulerJobsFile(parsed);
}
