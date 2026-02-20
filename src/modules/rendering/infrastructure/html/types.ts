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
