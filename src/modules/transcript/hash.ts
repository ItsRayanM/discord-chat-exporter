import { createHash } from "node:crypto";
import { stat } from "node:fs/promises";
import { createReadStream } from "node:fs";

export function hashStringSha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export async function hashFileSha256(filePath: string): Promise<{ checksum: string; size: number }> {
  const hash = createHash("sha256");

  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });

  const info = await stat(filePath);
  return {
    checksum: hash.digest("hex"),
    size: info.size,
  };
}
