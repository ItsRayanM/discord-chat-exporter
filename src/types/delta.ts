export interface DeltaOptions {
  enabled?: boolean;
  mode?: "best-effort";
  includeEdits?: boolean;
  includeDeletes?: boolean;
  checkpointFile?: string;
}

export interface DeltaCheckpoint {
  channelId: string;
  exportedAt: string;
  lastMessageId: string;
}
