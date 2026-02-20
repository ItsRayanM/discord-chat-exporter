import type { OutputFormat } from "./formats.js";
import type { ExportRequest } from "./request.js";
import type { TranscriptDocument } from "./transcript.js";

export interface RenderArtifact {
  readonly format: string;
  readonly path: string;
  readonly contentType: string;
  readonly size: number;
  readonly checksumSha256: string;
}

export interface RenderContext {
  transcript: TranscriptDocument;
  request: ExportRequest;
  outputBaseName: string;
  outputDir: string;
  chunkIndex?: number;
  chunkTotal?: number;
}

export interface RendererPlugin {
  id: string;
  format: OutputFormat | string;
  supportsStreaming: boolean;
  render(ctx: RenderContext): Promise<RenderArtifact[]>;
}
