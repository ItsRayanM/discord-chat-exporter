import type { SplitPolicy, TranscriptDocument, TranscriptMessage } from "@/types.js";

/** Builds a base filename for export artifacts (channel id + ISO timestamp). */
export function buildBaseName(channelId: string): string {
  const now = new Date().toISOString().replace(/[:.]/g, "-");
  return `transcript-${channelId}-${now}`;
}

/** Splits a transcript into chunks by message count and/or byte size. */
export function splitTranscriptByPolicy(
  transcript: TranscriptDocument,
  policy: SplitPolicy | undefined,
): TranscriptDocument[] {
  const maxMessages = Math.max(1, policy?.maxMessagesPerChunk ?? Number.POSITIVE_INFINITY);
  const maxBytes = Math.max(1, policy?.maxBytesPerChunk ?? Number.POSITIVE_INFINITY);

  if (!Number.isFinite(maxMessages) && !Number.isFinite(maxBytes)) {
    return [transcript];
  }

  const chunks: TranscriptDocument[] = [];
  let current: TranscriptMessage[] = [];
  let currentBytes = 0;

  for (const message of transcript.messages) {
    const messageBytes = Buffer.byteLength(JSON.stringify(message), "utf8");
    const overflowByCount = current.length + 1 > maxMessages;
    const overflowByBytes = current.length > 0 && currentBytes + messageBytes > maxBytes;

    if (overflowByCount || overflowByBytes) {
      chunks.push(cloneTranscriptWithMessages(transcript, current));
      current = [];
      currentBytes = 0;
    }

    current.push(message);
    currentBytes += messageBytes;
  }

  if (current.length > 0 || chunks.length === 0) {
    chunks.push(cloneTranscriptWithMessages(transcript, current));
  }

  const total = chunks.length;
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    if (!chunk) continue;
    chunk.meta.chunk = { index: index + 1, total };
  }

  return chunks;
}

/** Returns a copy of the transcript with only the given messages and matching attachment manifest. */
export function cloneTranscriptWithMessages(
  transcript: TranscriptDocument,
  messages: TranscriptMessage[],
): TranscriptDocument {
  const messageIds = new Set(messages.map((m) => m.id));
  return {
    ...transcript,
    meta: { ...transcript.meta },
    messages,
    attachmentsManifest: transcript.attachmentsManifest.filter((item) =>
      messageIds.has(item.messageId),
    ),
  };
}
