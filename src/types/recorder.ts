export interface RecorderMergeOptions {
  eventsFile?: string;
  includeDeletedPlaceholders?: boolean;
}

export interface RecorderStartOptions {
  token: string;
  outFile: string;
  guildIds?: string[];
  channelIds?: string[];
}

export interface LiveRecorderHandle {
  stop: () => Promise<void>;
}
