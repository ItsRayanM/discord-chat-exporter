import type { TranscriptDocument } from "./transcript.js";
import type { AnalyticsReport } from "./analytics.js";
import type { AIRequestOptions } from "./analytics.js";

export interface AIResult {
  providerId: string;
  summary: string;
  highlights: string[];
  model?: string;
}

export interface AIProviderContext {
  transcript: TranscriptDocument;
  report?: AnalyticsReport;
  options?: AIRequestOptions;
}

export interface AIProvider {
  id: string;
  summarize(ctx: AIProviderContext): Promise<AIResult>;
}
