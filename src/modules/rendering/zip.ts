import { createWriteStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, join } from "node:path";
import archiver from "archiver";
import type { ExportRequest, RenderArtifact, RenderContext } from "@/types.js";
import { hashFileSha256 } from "@/modules/transcript/index.js";
import { ValidationError } from "@/shared/errors/index.js";

interface ZipOptions {
  files: string[];
}

interface ArchiverWithCreate {
  create(format: string, options?: Record<string, unknown>): archiver.Archiver;
}

export async function renderZip(
  ctx: RenderContext,
  request: ExportRequest,
  options: ZipOptions,
): Promise<RenderArtifact[]> {
  const zipPath = join(ctx.outputDir, `${ctx.outputBaseName}.zip`);
  await createArchive(zipPath, options.files, request);
  const info = await hashFileSha256(zipPath);

  return [
    {
      format: "zip",
      path: zipPath,
      contentType: "application/zip",
      size: info.size,
      checksumSha256: info.checksum,
    },
  ];
}

async function createArchive(zipPath: string, files: string[], request: ExportRequest): Promise<void> {
  const outputDir = request.output.dir?.trim();
  if (!outputDir) {
    throw new ValidationError("Internal error: output directory is not resolved.");
  }

  await stat(outputDir);
  const require = createRequire(import.meta.url);

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(zipPath);

    const encryptionEnabled = Boolean(
      request.output.encryption?.enabled &&
        request.output.encryption.password &&
        request.output.encryption.method === "zip-aes256",
    );

    let archive: archiver.Archiver;

    if (encryptionEnabled) {
      try {
        const zipEncrypted = require("archiver-zip-encrypted");
        archiver.registerFormat("zip-encrypted", zipEncrypted);

        const archiverWithCreate = archiver as typeof archiver & ArchiverWithCreate;
        archive = archiverWithCreate.create("zip-encrypted", {
          zlib: { level: 9 },
          encryptionMethod: "aes256",
          password: request.output.encryption?.password,
        });
      } catch {
        archive = archiver("zip", { zlib: { level: 9 } });
      }
    } else {
      archive = archiver("zip", { zlib: { level: 9 } });
    }

    output.on("close", () => resolve());
    archive.on("warning", (error: Error) => {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        reject(error);
      }
    });
    archive.on("error", reject);

    archive.pipe(output);

    for (const filePath of files) {
      if (filePath === zipPath) {
        continue;
      }
      archive.file(filePath, { name: basename(filePath) });
    }

    archive.finalize().catch(reject);
  });
}
