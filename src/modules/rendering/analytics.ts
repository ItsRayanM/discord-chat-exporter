import { join } from "node:path";
import type { AnalyticsReport, RenderArtifact } from "@/types.js";
import { writeArtifact } from "@/modules/rendering/types.js";

export async function renderAnalyticsJson(
  outputDir: string,
  outputBaseName: string,
  report: AnalyticsReport,
): Promise<RenderArtifact[]> {
  const filePath = join(outputDir, `${outputBaseName}.analytics.json`);
  const content = JSON.stringify(report, null, 2);
  return [await writeArtifact(filePath, content, "application/json", "analytics-json")];
}
