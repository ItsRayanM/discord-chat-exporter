import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { RenderArtifact, RenderContext } from "@/types.js";
import { hashFileSha256 } from "@/modules/transcript/index.js";
import { OptionalDependencyError } from "@/shared/errors/index.js";

interface PlaywrightLike {
  chromium: {
    launch(options: { headless: boolean }): Promise<{
      newPage(): Promise<{
        goto(url: string, options: { waitUntil: "networkidle" }): Promise<void>;
        pdf(options: {
          path: string;
          format: string;
          printBackground: boolean;
          margin: { top: string; right: string; bottom: string; left: string };
        }): Promise<void>;
      }>;
      close(): Promise<void>;
    }>;
  };
}

export async function renderPdf(
  ctx: RenderContext,
  htmlFilePath: string,
): Promise<RenderArtifact[]> {
  let playwright: PlaywrightLike;

  try {
    playwright = (await import("playwright")) as unknown as PlaywrightLike;
  } catch {
    throw new OptionalDependencyError("playwright", "PDF export");
  }

  const pdfPath = join(ctx.outputDir, `${ctx.outputBaseName}.pdf`);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlFilePath).href, { waitUntil: "networkidle" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "16mm",
        right: "10mm",
        bottom: "16mm",
        left: "10mm",
      },
    });
  } finally {
    await browser.close();
  }

  const info = await hashFileSha256(pdfPath);
  return [
    {
      format: "pdf",
      path: pdfPath,
      contentType: "application/pdf",
      size: info.size,
      checksumSha256: info.checksum,
    },
  ];
}
