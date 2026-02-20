import { XMLBuilder } from "fast-xml-parser";
import { join } from "node:path";
import type { RenderArtifact, RenderContext } from "@/types.js";
import { writeArtifact } from "@/modules/rendering/types.js";

export async function renderXml(ctx: RenderContext): Promise<RenderArtifact[]> {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    suppressBooleanAttributes: false,
  });

  const payload = {
    transcript: {
      "@_version": ctx.transcript.version,
      exportedAt: ctx.transcript.exportedAt,
      channel: ctx.transcript.channel,
      participants: {
        participant: ctx.transcript.participants,
      },
      messages: {
        message: ctx.transcript.messages.map((message) => ({
          "@_id": message.id,
          "@_type": message.type,
          "@_channelId": message.channelId,
          createdAt: message.createdAt,
          editedAt: message.editedAt,
          author: message.author,
          content: message.content,
          attachments: {
            attachment: message.attachments,
          },
          embeds: {
            embed: message.embeds,
          },
          reactions: {
            reaction: message.reactions,
          },
        })),
      },
      warnings: {
        warning: ctx.transcript.warnings,
      },
      limitations: {
        limitation: ctx.transcript.limitations,
      },
    },
  };

  const xml = builder.build(payload);
  const filePath = join(ctx.outputDir, `${ctx.outputBaseName}.xml`);
  return [await writeArtifact(filePath, xml, "application/xml", "xml")];
}
