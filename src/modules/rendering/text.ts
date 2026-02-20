import { join } from "node:path";
import type { RenderArtifact, RenderContext } from "@/types.js";
import { writeArtifact } from "@/modules/rendering/types.js";

export async function renderText(ctx: RenderContext): Promise<RenderArtifact[]> {
  const lines: string[] = [];
  const watermark = ctx.request.render?.watermark;

  if (watermark) {
    lines.push(`WATERMARK: ${watermark}`);
    lines.push("");
  }
  if (ctx.request.render?.readOnly) {
    lines.push("MODE: READ_ONLY");
    lines.push("");
  }
  if (ctx.transcript.meta.chunk) {
    lines.push(`CHUNK: ${ctx.transcript.meta.chunk.index}/${ctx.transcript.meta.chunk.total}`);
    lines.push("");
  }

  for (const message of ctx.transcript.messages) {
    const author = message.author?.globalName ?? message.author?.username ?? "Unknown";
    lines.push(`[${message.createdAt}] ${author}: ${message.content}`);

    for (const attachment of message.attachments) {
      const target = attachment.localPath || attachment.dataUrl || attachment.url;
      lines.push(`  [attachment] ${attachment.filename} -> ${target}`);
    }

    if (message.embeds.length > 0) {
      lines.push(`  [embeds] ${message.embeds.length}`);
    }

    if (message.reactions.length > 0) {
      lines.push(`  [reactions] ${message.reactions.length}`);
    }
  }

  const filePath = join(ctx.outputDir, `${ctx.outputBaseName}.txt`);
  return [await writeArtifact(filePath, `${lines.join("\n")}\n`, "text/plain", "txt")];
}
