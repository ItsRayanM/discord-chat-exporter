/**
 * Delta export: load/save checkpoint and filter messages already exported.
 */
import { readFile, writeFile } from "node:fs/promises";
import type { ExportRequest, TranscriptDocument, DeltaCheckpoint, TranscriptMessage } from "@/types.js";
import { compareSnowflakes, getMaxSnowflakeId } from "@/shared/utils/snowflake.js";

export interface DeltaApplyResult {
  messages: TranscriptMessage[];
  skippedMessages: number;
}

export async function loadDeltaCheckpoint(
  request: ExportRequest,
  _warnings: string[],
): Promise<DeltaCheckpoint | undefined> {
  const path = request.delta?.checkpointFile;
  if (!path?.trim()) return undefined;
  try {
    const raw = await readFile(path, "utf8");
    const data = JSON.parse(raw) as DeltaCheckpoint;
    if (data.channelId && data.lastMessageId && data.exportedAt) return data;
  } catch {
    // no checkpoint yet
  }
  return undefined;
}

export async function saveDeltaCheckpoint(options: {
  request: ExportRequest;
  transcript: TranscriptDocument;
  warnings: string[];
}): Promise<string | undefined> {
  const { request, transcript } = options;
  const path = request.delta?.checkpointFile;
  if (!path?.trim()) return undefined;
  const lastId = getMaxSnowflakeId(transcript.messages) ?? "";
  const checkpoint: DeltaCheckpoint = {
    channelId: transcript.channel.id,
    exportedAt: transcript.exportedAt,
    lastMessageId: lastId,
  };
  await writeFile(path, JSON.stringify(checkpoint, null, 2), "utf8");
  return path;
}

export function applyDeltaFilter(options: {
  request: ExportRequest;
  transcript: TranscriptDocument;
  checkpoint: DeltaCheckpoint | undefined;
}): DeltaApplyResult {
  const { transcript, checkpoint } = options;
  if (!checkpoint) {
    return { messages: [...transcript.messages], skippedMessages: 0 };
  }
  const afterId = checkpoint.lastMessageId;
  const messages = transcript.messages.filter((m) => compareSnowflakes(m.id, afterId) > 0);
  const skippedMessages = transcript.messages.length - messages.length;
  return { messages, skippedMessages };
}
