import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { RenderArtifact, RenderContext } from "@/types.js";
import { writeArtifact } from "@/modules/rendering/types.js";
import { buildViewData, buildSearchIndex } from "@/modules/rendering/infrastructure/html/view-data.js";
import { buildStyles } from "@/modules/rendering/infrastructure/html/styles.js";
import { buildAppScript } from "@/modules/rendering/infrastructure/html/client-script.js";
import {
  buildBundleIndexHtml,
  buildSingleFileHtml,
  resolveHtmlTemplate,
} from "@/modules/rendering/infrastructure/html/template-engine.js";

export async function renderHtmlSingle(ctx: RenderContext): Promise<RenderArtifact[]> {
  const viewData = buildViewData(ctx);
  const htmlTemplate = await resolveHtmlTemplate(ctx);
  const html = buildSingleFileHtml({
    ctx,
    viewData,
    template: htmlTemplate,
    styles: buildStyles(ctx),
    appScript: buildAppScript(),
  });
  const filePath = join(ctx.outputDir, `${ctx.outputBaseName}.html`);
  return [await writeArtifact(filePath, html, "text/html", "html-single")];
}

export async function renderHtmlBundle(ctx: RenderContext): Promise<RenderArtifact[]> {
  const viewData = buildViewData(ctx);
  const searchIndex = buildSearchIndex(viewData.messages);
  const htmlTemplate = await resolveHtmlTemplate(ctx);
  const siteDir = join(ctx.outputDir, `${ctx.outputBaseName}-site`);
  await mkdir(siteDir, { recursive: true });

  const artifacts: RenderArtifact[] = [];
  const htmlPath = join(siteDir, "index.html");
  const jsPath = join(siteDir, "app.js");
  const cssPath = join(siteDir, "styles.css");
  const dataPath = join(siteDir, "data.json");
  const searchIndexPath = join(siteDir, "search-index.json");

  artifacts.push(
    await writeArtifact(
      htmlPath,
      buildBundleIndexHtml({
        ctx,
        viewData,
        template: htmlTemplate,
      }),
      "text/html",
      "html-bundle",
    ),
  );
  artifacts.push(await writeArtifact(jsPath, buildAppScript(), "application/javascript", "html-bundle"));
  artifacts.push(await writeArtifact(cssPath, buildStyles(ctx), "text/css", "html-bundle"));
  artifacts.push(await writeArtifact(dataPath, JSON.stringify(viewData), "application/json", "html-bundle"));
  artifacts.push(
    await writeArtifact(searchIndexPath, JSON.stringify(searchIndex), "application/json", "html-bundle"),
  );

  return artifacts;
}
