import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type {
  DiscordDeliveryResult,
  OutputDiscordOptions,
  RenderArtifact,
} from "@/types.js";
import { ValidationError } from "@/shared/errors/index.js";

const DISCORD_API_BASE = "https://discord.com/api/v10";
const DISCORD_MAX_FILES_PER_MESSAGE = 10;

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
    const id = await sendDiscordMessage({
      token,
      channelId: delivery.channelId,
      content: delivery.content ?? "Transcript export completed with no file artifacts.",
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
    const content =
      index === 0
        ? delivery.content ?? `Transcript export files (${artifacts.length})`
        : `Transcript export files (part ${index + 1}/${batches.length})`;

    const id = await sendDiscordMessage({
      token,
      channelId: delivery.channelId,
      content,
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

async function sendDiscordMessage(options: {
  token: string;
  channelId: string;
  content?: string;
  files: RenderArtifact[];
}): Promise<string> {
  const form = new FormData();

  const attachments = options.files.map((file, index) => ({
    id: index,
    filename: basename(file.path),
    description: `format:${file.format}`,
  }));

  form.set(
    "payload_json",
    JSON.stringify({
      content: options.content,
      attachments,
      allowed_mentions: {
        parse: [],
      },
    }),
  );

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
