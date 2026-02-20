/**
 * Process attachments: optional download, manifest updates.
 */
import type { ExportRequest, TranscriptDocument, AttachmentManifestEntry } from "@/types.js";
import { mkdir } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function processAttachments(options: {
  transcript: TranscriptDocument;
  request: ExportRequest;
  warnings: string[];
}): Promise<{ processed: number; failed: number }> {
  const { transcript, request, warnings } = options;
  const mode = request.attachments?.mode ?? "external-link";
  const outputDir = request.output?.dir ?? ".";
  const outputFolder = request.attachments?.outputFolder ?? "attachments";
  let processed = 0;
  let failed = 0;

  if (mode === "external-link") {
    for (const entry of transcript.attachmentsManifest) {
      entry.status = "linked";
      processed += 1;
    }
    return { processed, failed };
  }

  const attachmentDir = join(outputDir, outputFolder);
  await mkdir(attachmentDir, { recursive: true });

  for (const entry of transcript.attachmentsManifest) {
    try {
      const res = await fetch(entry.sourceUrl, { redirect: "follow" });
      if (!res.ok) {
        entry.status = "failed";
        entry.error = `HTTP ${res.status}`;
        failed += 1;
        continue;
      }
      const buf = await res.arrayBuffer();
      const filename = entry.id + "-" + (entry.sourceUrl.split("/").pop() ?? "file");
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const localPath = join(attachmentDir, safeName);
      await writeFile(localPath, new Uint8Array(buf));
      entry.localPath = localPath;
      entry.status = "downloaded";
      processed += 1;

      const msg = transcript.messages.find((m) => m.id === entry.messageId);
      const att = msg?.attachments?.find((a) => a.id === entry.id);
      if (att) att.localPath = localPath;
    } catch (err) {
      entry.status = "failed";
      entry.error = err instanceof Error ? err.message : String(err);
      failed += 1;
    }
  }

  return { processed, failed };
}
