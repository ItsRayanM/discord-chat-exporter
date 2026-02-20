import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { ExportRequest, TranscriptDocument, TranscriptEvent, TranscriptMessage } from "@/types.js";
import { compareSnowflakes } from "@/shared/utils/snowflake.js";

export async function mergeRecorderEvents(
  transcript: TranscriptDocument,
  request: ExportRequest,
  warnings: string[],
): Promise<void> {
  if (!request.recorder?.eventsFile) {
    return;
  }

  try {
    const content = await readFile(request.recorder.eventsFile, "utf8");
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const events: TranscriptEvent[] = lines.map((line) => JSON.parse(line) as TranscriptEvent);
    transcript.eventLog = events;

    const messageMap = new Map<string, TranscriptMessage>(
      transcript.messages.map((message) => [message.id, message]),
    );

    for (const event of events) {
      if (event.kind === "message_update") {
        const current = event.messageId ? messageMap.get(event.messageId) : undefined;
        if (!current) continue;

        const contentUpdate = event.payload.content;
        if (typeof contentUpdate === "string") {
          current.content = contentUpdate;
        }

        const editedAt = event.payload.edited_timestamp;
        if (typeof editedAt === "string") {
          current.editedAt = editedAt;
        }
      }

      if (event.kind === "message_delete") {
        const current = event.messageId ? messageMap.get(event.messageId) : undefined;

        if (current) {
          current.deleted = true;
          continue;
        }

        if (request.recorder.includeDeletedPlaceholders && event.messageId) {
          const placeholder: TranscriptMessage = {
            id: event.messageId,
            channelId: event.channelId,
            type: 0,
            createdAt: event.timestamp,
            editedAt: null,
            pinned: false,
            deleted: true,
            content: "[deleted message placeholder]",
            mentions: { everyone: false, users: [], roles: [], channels: [] },
            attachments: [],
            embeds: [],
            reactions: [],
            components: [],
            stickerItems: [],
            raw: {
              generated: true,
              reason: "message_delete event",
            },
          };

          transcript.messages.push(placeholder);
          messageMap.set(placeholder.id, placeholder);
        }
      }
    }

    transcript.messages.sort((a, b) => compareSnowflakes(a.id, b.id));
  } catch (error) {
    warnings.push(
      `Recorder merge failed for ${basename(request.recorder.eventsFile)}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
