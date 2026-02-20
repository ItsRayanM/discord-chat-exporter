import { format } from "@fast-csv/format";
import { join } from "node:path";
import type { RenderArtifact, RenderContext } from "@/types.js";
import { writeArtifact } from "@/modules/rendering/types.js";

export async function renderCsv(ctx: RenderContext): Promise<RenderArtifact[]> {
  const rows = ctx.transcript.messages.map((message) => ({
    id: message.id,
    channelId: message.channelId,
    createdAt: message.createdAt,
    editedAt: message.editedAt ?? "",
    authorId: message.author?.id ?? "",
    author: message.author?.globalName ?? message.author?.username ?? "",
    content: message.content,
    attachmentCount: message.attachments.length,
    embedCount: message.embeds.length,
    reactionCount: message.reactions.length,
    messageType: message.type,
    pinned: message.pinned,
    deleted: Boolean(message.deleted),
  }));

  const csvContent = await stringifyCsv(rows);
  const filePath = join(ctx.outputDir, `${ctx.outputBaseName}.csv`);
  return [await writeArtifact(filePath, csvContent, "text/csv", "csv")];
}

function stringifyCsv(rows: Array<Record<string, unknown>>): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = format({ headers: true });
    let buffer = "";

    stream.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
    });

    stream.on("error", reject);
    stream.on("end", () => resolve(buffer));

    for (const row of rows) {
      stream.write(row);
    }

    stream.end();
  });
}
