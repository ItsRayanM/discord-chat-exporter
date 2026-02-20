import { join } from "node:path";
import type { RenderContext, RenderArtifact, TranscriptMessage } from "@/types.js";
import { writeArtifact } from "@/modules/rendering/types.js";

export async function renderJsonFull(ctx: RenderContext): Promise<RenderArtifact[]> {
  const filePath = join(ctx.outputDir, `${ctx.outputBaseName}.json`);
  const content = JSON.stringify(ctx.transcript, null, 2);
  return [await writeArtifact(filePath, content, "application/json", "json-full")];
}

export async function renderJsonClean(ctx: RenderContext): Promise<RenderArtifact[]> {
  const filePath = join(ctx.outputDir, `${ctx.outputBaseName}.clean.json`);
  const content = JSON.stringify(
    {
      exportedAt: ctx.transcript.exportedAt,
      channel: ctx.transcript.channel,
      messageCount: ctx.transcript.messages.length,
      messages: ctx.transcript.messages.map(simplifyMessage),
    },
    null,
    2,
  );

  return [await writeArtifact(filePath, content, "application/json", "json-clean")];
}

function simplifyMessage(message: TranscriptMessage): Record<string, unknown> {
  return {
    id: message.id,
    timestamp: message.createdAt,
    editedAt: message.editedAt,
    authorId: message.author?.id,
    authorName: message.author?.globalName ?? message.author?.username,
    content: message.content,
    attachments: message.attachments.map((attachment) => ({
      id: attachment.id,
      filename: attachment.filename,
      url: attachment.url,
      localPath: attachment.localPath,
      size: attachment.size,
      contentType: attachment.contentType,
    })),
    embeds: message.embeds,
    reactions: message.reactions,
    components: message.components,
    messageType: message.type,
    pinned: message.pinned,
    deleted: message.deleted,
  };
}
