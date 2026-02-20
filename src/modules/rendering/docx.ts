import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import type { RenderArtifact, RenderContext } from "@/types.js";
import { OptionalDependencyError } from "@/shared/errors/index.js";
import { hashFileSha256 } from "@/modules/transcript/index.js";

interface DocxModule {
  Paragraph: new (options: { text: string; heading?: unknown }) => unknown;
  HeadingLevel: {
    HEADING_1: unknown;
    HEADING_3: unknown;
  };
  Document: new (options: {
    sections: Array<{ properties: Record<string, unknown>; children: unknown[] }>;
  }) => unknown;
  Packer: {
    toBuffer(document: unknown): Promise<Buffer>;
  };
}

export async function renderDocx(ctx: RenderContext): Promise<RenderArtifact[]> {
  let docx: DocxModule;

  try {
    docx = (await import("docx")) as unknown as DocxModule;
  } catch {
    throw new OptionalDependencyError("docx", "DOCX export");
  }

  const filePath = join(ctx.outputDir, `${ctx.outputBaseName}.docx`);
  const paragraphs: unknown[] = [];

  paragraphs.push(
    new docx.Paragraph({
      text: `Transcript: ${ctx.transcript.channel.name ?? ctx.transcript.channel.id}`,
      heading: docx.HeadingLevel.HEADING_1,
    }),
  );

  paragraphs.push(
    new docx.Paragraph({
      text: `Exported at: ${ctx.transcript.exportedAt}`,
    }),
  );

  if (ctx.request.render?.watermark) {
    paragraphs.push(
      new docx.Paragraph({
        text: `Watermark: ${ctx.request.render.watermark}`,
      }),
    );
  }

  if (ctx.transcript.meta.chunk) {
    paragraphs.push(
      new docx.Paragraph({
        text: `Chunk: ${ctx.transcript.meta.chunk.index}/${ctx.transcript.meta.chunk.total}`,
      }),
    );
  }

  for (const message of ctx.transcript.messages) {
    const author = message.author?.globalName ?? message.author?.username ?? "Unknown";
    paragraphs.push(
      new docx.Paragraph({
        text: `${author} (${message.createdAt})`,
        heading: docx.HeadingLevel.HEADING_3,
      }),
    );

    paragraphs.push(
      new docx.Paragraph({
        text: message.content || "(empty)",
      }),
    );

    if (message.attachments.length > 0) {
      for (const attachment of message.attachments) {
        paragraphs.push(
          new docx.Paragraph({
            text: `Attachment: ${attachment.filename} -> ${attachment.localPath ?? attachment.url}`,
          }),
        );
      }
    }
  }

  const document = new docx.Document({
    sections: [{ properties: {}, children: paragraphs }],
  });

  const buffer = await docx.Packer.toBuffer(document);
  await writeFile(filePath, buffer);

  const info = await hashFileSha256(filePath);
  return [
    {
      format: "docx",
      path: filePath,
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: info.size,
      checksumSha256: info.checksum,
    },
  ];
}
