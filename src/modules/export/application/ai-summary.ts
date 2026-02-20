import type {
  AIProvider,
  AIResult,
  AnalyticsReport,
  ExportRequest,
  TranscriptDocument,
} from "@/types.js";

/**
 * Runs the configured AI provider to generate a summary when analytics.ai is enabled.
 * Returns undefined if disabled, provider missing, or on error (errors are pushed to warnings).
 */
export async function maybeGenerateAISummary(
  request: ExportRequest,
  transcript: TranscriptDocument,
  report: AnalyticsReport | undefined,
  providers: Map<string, AIProvider>,
  warnings: string[],
): Promise<AIResult | undefined> {
  const aiOptions = request.analytics?.ai;
  if (!aiOptions?.enabled) return undefined;

  const providerId = aiOptions.providerId ?? "heuristic";
  const provider = providers.get(providerId);
  if (!provider) {
    warnings.push(`AI provider '${providerId}' is not registered.`);
    return undefined;
  }

  try {
    return await provider.summarize({
      transcript,
      report,
      options: aiOptions,
    });
  } catch (error) {
    warnings.push(
      `AI provider '${providerId}' failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return undefined;
  }
}
