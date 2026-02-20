import { join } from "node:path";
import MarkdownIt from "markdown-it";
import type { RenderArtifact, RenderContext } from "@/types.js";
import { writeArtifact } from "@/modules/rendering/types.js";

export async function renderMarkdown(ctx: RenderContext): Promise<RenderArtifact[]> {
  const md = new MarkdownIt({ linkify: true, breaks: true });
  const lines: string[] = [];

  lines.push(`# Transcript: ${ctx.transcript.channel.name ?? ctx.transcript.channel.id}`);
  lines.push("");
  lines.push(`- Exported at: ${ctx.transcript.exportedAt}`);
  lines.push(`- Messages: ${ctx.transcript.messages.length}`);
  if (ctx.transcript.meta.chunk) {
    lines.push(`- Chunk: ${ctx.transcript.meta.chunk.index}/${ctx.transcript.meta.chunk.total}`);
  }
  if (ctx.request.render?.readOnly) {
    lines.push(`- Mode: READ_ONLY`);
  }
  if (ctx.request.render?.watermark) {
    lines.push(`- Watermark: ${ctx.request.render.watermark}`);
  }
  lines.push("");

  if (ctx.request.render?.includeTableOfContents) {
    const groupedByDay = new Map<string, number>();
    for (const message of ctx.transcript.messages) {
      const day = new Date(message.createdAt).toISOString().slice(0, 10);
      groupedByDay.set(day, (groupedByDay.get(day) ?? 0) + 1);
    }
    lines.push("## Table of Contents");
    lines.push("");
    for (const [day, count] of groupedByDay.entries()) {
      lines.push(`- ${day} (${count} messages)`);
    }
    lines.push("");
  }

  for (const message of ctx.transcript.messages) {
    const author = message.author?.globalName ?? message.author?.username ?? "Unknown";
    lines.push(`## ${author} (${message.createdAt})`);
    lines.push("");

    if (message.content) {
      lines.push(md.renderInline(escapeMd(message.content)));
      lines.push("");
    }

    if (message.attachments.length > 0) {
      lines.push("Attachments:");
      for (const attachment of message.attachments) {
        const target = attachment.localPath || attachment.dataUrl || attachment.url;
        lines.push(`- [${attachment.filename}](${target})`);
      }
      lines.push("");
    }

    if (message.embeds.length > 0) {
      lines.push(`Embeds: ${message.embeds.length}`);
      lines.push("");
    }
  }

  const filePath = join(ctx.outputDir, `${ctx.outputBaseName}.md`);
  return [await writeArtifact(filePath, `${lines.join("\n")}\n`, "text/markdown", "md")];
}

function escapeMd(content: string): string {
  return content.replace(/\r\n/g, "\n");
}
