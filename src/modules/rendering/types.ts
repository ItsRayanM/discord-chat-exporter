import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { RenderArtifact } from "@/types.js";
import { hashFileSha256 } from "@/modules/transcript/index.js";

export async function writeArtifact(
  filePath: string,
  content: string | Buffer,
  contentType: string,
  format: string,
): Promise<RenderArtifact> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content);

  const info = await hashFileSha256(filePath);
  return {
    format,
    path: filePath,
    contentType,
    size: info.size,
    checksumSha256: info.checksum,
  };
}
