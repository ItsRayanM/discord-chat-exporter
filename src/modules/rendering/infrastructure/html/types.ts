export interface HtmlMessageView {
  id: string;
  author: string;
  authorId: string;
  avatarUrl?: string;
  createdAt: string;
  dayKey: string;
  editedAt?: string | null;
  contentHtml: string;
  contentText: string;
  attachments: Array<{ filename: string; url: string; localPath?: string; dataUrl?: string; contentType?: string }>;
  embeds: unknown[];
  reactions: unknown[];
  channelId: string;
  type: number;
  pinned: boolean;
  deleted: boolean;
}

export interface TocEntry {
  id: string;
  day: string;
  count: number;
}

/** Guild/server for full Discord UI. */
export interface HtmlGuildView {
  id: string;
  name?: string;
  iconUrl?: string;
}

/** Channel for full Discord UI (channel list). */
export interface HtmlChannelView {
  id: string;
  name?: string;
  type?: number;
  parentId?: string;
}

/** Member for full Discord UI (participants sidebar). */
export interface HtmlMemberView {
  id: string;
  username: string;
  globalName?: string;
  avatarUrl?: string;
  bot?: boolean;
}

export interface HtmlViewData {
  title: string;
  exportedAt: string;
  messages: HtmlMessageView[];
  warnings: string[];
  limitations: string[];
  watermark?: string;
  readOnly: boolean;
  searchable: boolean;
  accessibilityMode: boolean;
  toc: TocEntry[];
  chunk?: { index: number; total: number };
  /** Full Discord UI: current channel (id, name, type, parentId). */
  channel?: HtmlChannelView;
  /** Full Discord UI: guild/server (id, name, iconUrl). */
  guild?: HtmlGuildView;
  /** Full Discord UI: guild channels list for sidebar. */
  channels?: HtmlChannelView[];
  /** Full Discord UI: members (participants) for sidebar. */
  members?: HtmlMemberView[];
  /** Resolved panel visibility: which Discord-style panels to show. */
  panels?: { serverList: boolean; channelList: boolean; membersSidebar: boolean };
}

export interface SearchIndexData {
  tokenMap: Record<string, number[]>;
}

export interface TemplateAssets {
  title: string;
  dir: string;
  appRoot: string;
  stylesInline: string;
  stylesHref: string;
  appScriptInline: string;
  appScriptSrc: string;
  transcriptDataInline: string;
  dataJsonSrc: string;
}
