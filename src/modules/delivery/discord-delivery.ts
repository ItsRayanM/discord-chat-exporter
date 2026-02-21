import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type {
  DiscordDeliveryResult,
  DiscordDeliveryContext,
  DiscordEmbedData,
  OutputDiscordOptions,
  RenderArtifact,
} from "@/types.js";
import { ValidationError } from "@/shared/errors/index.js";

const DISCORD_API_BASE = "https://discord.com/api/v10";
const DISCORD_MAX_FILES_PER_MESSAGE = 10;
const DISCORD_MAX_MESSAGE_CHARS = 2000;
const DISCORD_MAX_EMBEDS = 10;

export async function deliverArtifactsToDiscordChannel(options: {
  token: string;
  delivery: OutputDiscordOptions;
  artifacts: RenderArtifact[];
}): Promise<DiscordDeliveryResult> {
  const { token, delivery, artifacts } = options;

  if (!delivery.channelId?.trim()) {
    throw new ValidationError("output.discord.channelId is required for discord-channel delivery");
  }

  const batches = chunkArray(artifacts, DISCORD_MAX_FILES_PER_MESSAGE);
  const messageIds: string[] = [];
  let uploadedFiles = 0;

  if (batches.length === 0) {
    const fileListText = renderFileList([]);
    const ctx: DiscordDeliveryContext = {
      artifacts: [],
      channelId: delivery.channelId,
      fileListText,
      batchIndex: 0,
      batchCount: 0,
    };
    const content = await resolveContent(delivery, ctx, [], 0, 0, "Transcript export completed with no file artifacts.");
    const embeds = await resolveEmbeds(delivery, ctx);
    const id = await sendDiscordMessage({
      token,
      channelId: delivery.channelId,
      content,
      embeds,
      files: [],
    });
    messageIds.push(id);

    return {
      channelId: delivery.channelId,
      messageIds,
      uploadedFiles,
    };
  }

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    if (!batch) {
      continue;
    }
    const fileListText = renderFileList(batch);
    const ctx: DiscordDeliveryContext = {
      artifacts: batch,
      channelId: delivery.channelId,
      fileListText,
      batchIndex: index,
      batchCount: batches.length,
    };
    const defaultContent =
      index === 0
        ? `Transcript export files (${artifacts.length})`
        : `Transcript export files (part ${index + 1}/${batches.length})`;
    const content = await resolveContent(delivery, ctx, artifacts, batch.length, index, defaultContent);
    const embeds = await resolveEmbeds(delivery, ctx);

    const id = await sendDiscordMessage({
      token,
      channelId: delivery.channelId,
      content,
      embeds,
      files: batch,
    });

    uploadedFiles += batch.length;
    messageIds.push(id);
  }

  return {
    channelId: delivery.channelId,
    messageIds,
    uploadedFiles,
  };
}

async function resolveContent(
  delivery: OutputDiscordOptions,
  ctx: DiscordDeliveryContext,
  allArtifacts: RenderArtifact[],
  batchArtifactsLength: number,
  batchIndex: number,
  defaultContent: string,
): Promise<string | undefined> {
  let base: string | undefined;
  if (delivery.getContent) {
    base = await Promise.resolve(delivery.getContent(ctx));
  } else {
    base = buildDiscordMessageContent({
      delivery,
      allArtifacts,
      batchArtifacts: ctx.artifacts,
      batchIndex,
      batchCount: ctx.batchCount,
      defaultContent,
    });
  }
  if (!base) {
    return undefined;
  }
  let out = base;
  if (out.includes("{{files}}")) {
    out = out.replaceAll("{{files}}", ctx.fileListText);
  }
  if (out.length > DISCORD_MAX_MESSAGE_CHARS) {
    out = `${out.slice(0, DISCORD_MAX_MESSAGE_CHARS - 14)}\n…(truncated)`;
  }
  return out;
}

async function resolveEmbeds(
  delivery: OutputDiscordOptions,
  ctx: DiscordDeliveryContext,
): Promise<Array<Record<string, unknown>>> {
  let list: Array<Record<string, unknown>> = [];
  if (delivery.getEmbed) {
    const one = await Promise.resolve(delivery.getEmbed(ctx));
    list = one ? [sanitizeEmbed(one)] : [];
  } else if (delivery.getEmbeds) {
    const many = await Promise.resolve(delivery.getEmbeds(ctx));
    list = (many ?? []).slice(0, DISCORD_MAX_EMBEDS).map((e) => sanitizeEmbed(e));
  } else if (delivery.embed) {
    list = [sanitizeEmbed(delivery.embed)];
  } else if (delivery.embeds?.length) {
    list = delivery.embeds.slice(0, DISCORD_MAX_EMBEDS).map((e) => sanitizeEmbed(e));
  }
  return list;
}

function sanitizeEmbed(embed: DiscordEmbedData): Record<string, unknown> {
  return { ...embed, type: "rich" };
}

function buildDiscordMessageContent(options: {
  delivery: OutputDiscordOptions;
  allArtifacts: RenderArtifact[];
  batchArtifacts: RenderArtifact[];
  batchIndex: number;
  batchCount: number;
  defaultContent: string;
}): string | undefined {
  const { delivery, allArtifacts, batchArtifacts, defaultContent } = options;

  const fileListWanted = Boolean(delivery.includeFileList);
  const base =
    delivery.content && delivery.content.trim().length > 0
      ? delivery.content
      : fileListWanted
        ? defaultContent
        : delivery.content; // allow undefined when caller provided none and file list not requested

  if (!base) {
    return undefined;
  }

  const fileList = renderFileList(batchArtifacts.length ? batchArtifacts : allArtifacts);
  let out = base;

  if (out.includes("{{files}}")) {
    out = out.replaceAll("{{files}}", fileList);
  } else if (fileListWanted) {
    out = `${out}\n\n${fileList}`;
  }

  if (out.length > DISCORD_MAX_MESSAGE_CHARS) {
    out = `${out.slice(0, DISCORD_MAX_MESSAGE_CHARS - 14)}\n…(truncated)`;
  }

  return out;
}

function renderFileList(artifacts: RenderArtifact[]): string {
  if (artifacts.length === 0) {
    return "Files:\n- (none)";
  }

  const lines = artifacts.map((a) => {
    const name = basename(a.path);
    return `- ${name} (${String(a.format)}, ${formatBytes(a.size)})`;
  });

  return `Files:\n${lines.join("\n")}`;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return `${bytes} B`;
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"] as const;
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  const unit = units[i] ?? "KB";
  return `${v.toFixed(v >= 10 ? 1 : 2)} ${unit}`;
}

async function sendDiscordMessage(options: {
  token: string;
  channelId: string;
  content?: string;
  embeds?: Array<Record<string, unknown>>;
  files: RenderArtifact[];
}): Promise<string> {
  const form = new FormData();

  const attachments = options.files.map((file, index) => ({
    id: index,
    filename: basename(file.path),
    description: `format:${file.format}`,
  }));

  const payload: Record<string, unknown> = {
    content: options.content ?? null,
    attachments,
    allowed_mentions: { parse: [] },
  };
  if (options.embeds?.length) {
    payload.embeds = options.embeds;
  }

  form.set("payload_json", JSON.stringify(payload));

  for (let i = 0; i < options.files.length; i += 1) {
    const artifact = options.files[i];
    if (!artifact) {
      continue;
    }
    const raw = await readFile(artifact.path);
    const blob = new Blob([Uint8Array.from(raw)], {
      type: artifact.contentType || "application/octet-stream",
    });
    form.append(`files[${i}]`, blob, basename(artifact.path));
  }

  const response = await fetch(`${DISCORD_API_BASE}/channels/${options.channelId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${options.token}`,
    },
    body: form,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Discord delivery failed (${response.status}) for channel ${options.channelId}: ${body}`,
    );
  }

  const json = (await response.json()) as { id?: string };
  if (!json.id) {
    throw new Error("Discord delivery succeeded but no message id was returned.");
  }

  return json.id;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  if (items.length === 0) {
    return [];
  }

  const output: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    output.push(items.slice(i, i + size));
  }

  return output;
}
