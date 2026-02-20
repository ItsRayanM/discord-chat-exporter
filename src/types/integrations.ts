import type { OutputFormat } from "./formats.js";
import type { ExportRequest } from "./request.js";

export interface TicketCloseHandlerOptions {
  token: string;
  logChannelId: string;
  formats?: Array<OutputFormat | string>;
  outputDir?: string;
  archiveThread?: boolean;
  closeReason?: string;
}

export interface AdvancedTicketCloseHandlerOptions extends TicketCloseHandlerOptions {
  exportRequestFactory?: (channelId: string) => Partial<ExportRequest>;
  postActions?: {
    archiveThread?: boolean;
    deleteChannel?: boolean;
    notifyUserDm?: boolean;
  };
}
