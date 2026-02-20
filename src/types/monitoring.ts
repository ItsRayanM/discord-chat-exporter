export type ExporterEvent =
  | {
      kind: "start";
      exportId: string;
      channelId?: string;
      batch?: boolean;
    }
  | {
      kind: "collect_progress";
      channelId: string;
      scanned: number;
    }
  | {
      kind: "render_progress";
      channelId: string;
      format: string;
      chunk: number;
      totalChunks: number;
    }
  | {
      kind: "delivery_progress";
      target: "discord" | "database" | "storage" | "webhook";
      detail: string;
    }
  | {
      kind: "warning";
      message: string;
    }
  | {
      kind: "error";
      message: string;
    }
  | {
      kind: "done";
      exportId: string;
      durationMs: number;
    };

export interface MonitoringOptions {
  onEvent?: (event: ExporterEvent) => void | Promise<void>;
}
