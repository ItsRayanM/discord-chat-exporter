export interface AnalyticsOptions {
  enabled?: boolean;
  includeHeatmap?: boolean;
  topWordsLimit?: number;
  topMentionedLimit?: number;
  highlightCount?: number;
  responseWindowMinutes?: number;
  ai?: AIRequestOptions;
}

export interface AIRequestOptions {
  enabled?: boolean;
  providerId?: string;
  prompt?: string;
  maxHighlights?: number;
  temperature?: number;
}

export interface AnalyticsReport {
  exportedAt: string;
  messageCountPerUser: Array<{ userId: string; username: string; count: number }>;
  attachmentStats: {
    total: number;
    byContentType: Array<{ contentType: string; count: number }>;
    totalBytes: number;
  };
  reactionStats: {
    totalReactionEntries: number;
    messagesWithReactions: number;
  };
  wordFrequency: Array<{ word: string; count: number }>;
  activityTimelineByHour: Array<{ hour: number; count: number }>;
  peakActivityHours: Array<{ hour: number; count: number }>;
  topMentionedUsers: Array<{ userId: string; username: string; count: number }>;
  responseTimeMetrics: {
    sampledTransitions: number;
    averageSeconds: number;
    medianSeconds: number;
    p95Seconds: number;
  };
  conversationHeatmap?: Array<{ day: string; hour: number; count: number }>;
  highlights: Array<{ messageId: string; reason: string }>;
}
