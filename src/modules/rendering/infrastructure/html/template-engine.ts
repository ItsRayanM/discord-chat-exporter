import { readFile } from "node:fs/promises";
import type { RenderContext } from "@/types.js";
import { escapeHtml } from "@/modules/rendering/infrastructure/html/escape-html.js";
import type { HtmlViewData, TemplateAssets } from "@/modules/rendering/infrastructure/html/types.js";

export async function resolveHtmlTemplate(ctx: RenderContext): Promise<string | undefined> {
  const inlineTemplate = ctx.request.render?.html?.template?.trim();
  if (inlineTemplate) {
    return inlineTemplate;
  }

  const templatePath = ctx.request.render?.html?.templatePath?.trim();
  if (!templatePath) {
    return undefined;
  }

  return readFile(templatePath, "utf8");
}

export function buildSingleFileHtml(options: {
  ctx: RenderContext;
  viewData: HtmlViewData;
  template?: string;
  styles: string;
  appScript: string;
}): string {
  const { ctx, viewData, template, styles, appScript } = options;
  const json = JSON.stringify(viewData).replace(/</g, "\\u003c");
  const assets = buildTemplateAssets(ctx, viewData, {
    stylesInline: `<style>${styles}</style>`,
    appScriptInline: `<script>${appScript}</script>`,
    transcriptDataInline: `<script id="transcript-data" type="application/json">${json}</script>`,
  });

  if (template) {
    return applyCustomTemplate({
      template,
      assets,
      fallbackHead: assets.stylesInline,
      fallbackBody: `${assets.appRoot}${assets.transcriptDataInline}${assets.appScriptInline}`,
      ensureTranscriptData: true,
      ensureInlineScript: true,
      ensureStylesInline: true,
    });
  }

  return `<!doctype html>
<html lang="en" dir="${ctx.request.render?.rtl ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(viewData.title)}</title>
  <style>${styles}</style>
</head>
<body>
  <div id="app"></div>
  <script id="transcript-data" type="application/json">${json}</script>
  <script>${appScript}</script>
</body>
</html>`;
}

export function buildBundleIndexHtml(options: {
  ctx: RenderContext;
  viewData: HtmlViewData;
  template?: string;
}): string {
  const { ctx, viewData, template } = options;
  const assets = buildTemplateAssets(ctx, viewData, {
    stylesInline: "",
    appScriptInline: "",
    transcriptDataInline: "",
  });

  if (template) {
    return applyCustomTemplate({
      template,
      assets,
      fallbackHead: `<link rel="stylesheet" href="${assets.stylesHref}">`,
      fallbackBody: `${assets.appRoot}<script type="module" src="${assets.appScriptSrc}"></script>`,
      ensureModuleScript: true,
      ensureStylesHref: true,
    });
  }

  return `<!doctype html>
<html lang="en" dir="${ctx.request.render?.rtl ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Discord Transcript</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./app.js"></script>
</body>
</html>`;
}

function buildTemplateAssets(
  ctx: RenderContext,
  viewData: HtmlViewData,
  payload: {
    stylesInline: string;
    appScriptInline: string;
    transcriptDataInline: string;
  },
): TemplateAssets {
  return {
    title: escapeHtml(viewData.title),
    dir: ctx.request.render?.rtl ? "rtl" : "ltr",
    appRoot: `<div id="app"></div>`,
    stylesInline: payload.stylesInline,
    stylesHref: "./styles.css",
    appScriptInline: payload.appScriptInline,
    appScriptSrc: "./app.js",
    transcriptDataInline: payload.transcriptDataInline,
    dataJsonSrc: "./data.json",
  };
}

function applyCustomTemplate(options: {
  template: string;
  assets: TemplateAssets;
  fallbackHead: string;
  fallbackBody: string;
  ensureTranscriptData?: boolean;
  ensureInlineScript?: boolean;
  ensureModuleScript?: boolean;
  ensureStylesInline?: boolean;
  ensureStylesHref?: boolean;
}): string {
  const { template, assets } = options;
  let output = template;

  const tokens: Record<string, string> = {
    title: assets.title,
    dir: assets.dir,
    app_root: assets.appRoot,
    styles_inline: assets.stylesInline,
    styles_href: assets.stylesHref,
    app_script_inline: assets.appScriptInline,
    app_script_src: assets.appScriptSrc,
    transcript_data_json: assets.transcriptDataInline,
    data_json_src: assets.dataJsonSrc,
  };

  for (const [key, value] of Object.entries(tokens)) {
    output = output.replaceAll(`{{${key}}}`, value);
  }

  if (!/id=["']app["']/.test(output)) {
    output = injectBeforeClosingTag(output, "body", assets.appRoot);
  }

  if (options.ensureStylesInline && !/<style[\s>]/i.test(output)) {
    output = injectBeforeClosingTag(output, "head", options.fallbackHead);
  }

  if (options.ensureStylesHref && !/<link[^>]+href=["'][^"']*styles\.css["']/i.test(output)) {
    output = injectBeforeClosingTag(output, "head", options.fallbackHead);
  }

  if (options.ensureTranscriptData && !/id=["']transcript-data["']/.test(output)) {
    output = injectBeforeClosingTag(output, "body", assets.transcriptDataInline);
  }

  if (options.ensureInlineScript && !/<script(?![^>]*src=)[^>]*>[\s\S]*?<\/script>/i.test(output)) {
    output = injectBeforeClosingTag(output, "body", assets.appScriptInline);
  }

  if (options.ensureModuleScript && !/<script[^>]+src=["'][^"']*app\.js["']/i.test(output)) {
    output = injectBeforeClosingTag(output, "body", `<script type="module" src="${assets.appScriptSrc}"></script>`);
  }

  return output;
}

function injectBeforeClosingTag(html: string, tag: "head" | "body", content: string): string {
  const closeTag = `</${tag}>`;
  const lower = html.toLowerCase();
  const index = lower.lastIndexOf(closeTag);

  if (index < 0) {
    return `${html}\n${content}`;
  }

  return `${html.slice(0, index)}${content}\n${html.slice(index)}`;
}
