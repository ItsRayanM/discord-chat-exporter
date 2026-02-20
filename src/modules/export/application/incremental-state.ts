import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ExportRequest, IncrementalState, TranscriptDocument } from "@/types.js";
import { getMaxSnowflakeId } from "@/shared/utils/snowflake.js";
import { INCREMENTAL_STATE_DIR } from "@/shared/constants.js";

export async function loadIncrementalState(
  request: ExportRequest,
  warnings: string[],
): Promise<IncrementalState | undefined> {
  if (!request.output.incremental?.enabled) {
    return undefined;
  }

  const stateFile = resolveIncrementalStateFile(request);

  try {
    const raw = await readFile(stateFile, "utf8");
    return JSON.parse(raw) as IncrementalState;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      warnings.push(
        `Incremental state load failed (${stateFile}): ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return undefined;
  }
}

export async function saveIncrementalStateIfNeeded(
  request: ExportRequest,
  transcript: TranscriptDocument,
  warnings: string[],
): Promise<string | undefined> {
  if (!request.output.incremental?.enabled) {
    return undefined;
  }

  const lastMessageId = getMaxSnowflakeId(transcript.messages);
  if (!lastMessageId) {
    warnings.push("Incremental state not updated: no exported messages available.");
    return resolveIncrementalStateFile(request);
  }

  const stateFile = resolveIncrementalStateFile(request);

  try {
    await mkdir(dirname(stateFile), { recursive: true });
    const payload: IncrementalState = {
      channelId: request.channelId,
      guildId: request.guildId,
      exportedAt: new Date().toISOString(),
      lastMessageId,
      exportedMessages: transcript.messages.length,
    };
    await writeFile(stateFile, JSON.stringify(payload, null, 2), "utf8");
    return stateFile;
  } catch (error) {
    warnings.push(
      `Incremental state save failed (${stateFile}): ${error instanceof Error ? error.message : String(error)}`,
    );
    return stateFile;
  }
}

export function resolveIncrementalStateFile(request: ExportRequest): string {
  if (request.output.incremental?.stateFile) {
    return request.output.incremental.stateFile;
  }

  const baseDir = request.output.dir?.trim() || process.cwd();
  return join(baseDir, INCREMENTAL_STATE_DIR, `state-${request.channelId}.json`);
}
