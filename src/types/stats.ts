export interface ExportStats {
  readonly scannedMessages: number;
  readonly exportedMessages: number;
  readonly skippedMessages: number;
  readonly durationMs: number;
  readonly attachmentsProcessed: number;
  readonly attachmentsFailed: number;
  readonly channelsProcessed: number;
}

export interface ExportCheckpoints {
  incrementalStateFile?: string;
  lastMessageId?: string;
  chunkCount: number;
}
