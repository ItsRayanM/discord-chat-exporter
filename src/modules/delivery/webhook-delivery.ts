import { createRequire } from "node:module";
import type {
  ComplianceManifest,
  ExportRequest,
  ExportStats,
  RenderArtifact,
  StorageDeliveryResult,
  WebhookDeliveryResult,
  WebhookTarget,
} from "@/types.js";
import { requireOptional } from "@/shared/optional-require.js";

const require = createRequire(import.meta.url);

interface DeliverWebhookTargetsOptions {
  request: ExportRequest;
  artifacts: RenderArtifact[];
  exportId: string;
  stats: ExportStats;
  warnings: string[];
  limitations: string[];
  manifest?: ComplianceManifest;
  storage?: StorageDeliveryResult;
}

interface UnifiedWebhookPayload {
  exportId: string;
  createdAt: string;
  source: {
    guildId?: string;
    channelId: string;
  };
  stats: ExportStats;
  files: Array<{
    format: string;
    path: string;
    size: number;
    contentType: string;
    checksumSha256: string;
  }>;
  storage?: StorageDeliveryResult;
  manifest?: ComplianceManifest;
  warnings: string[];
  limitations: string[];
}

class HttpStatusError extends Error {
  public readonly status: number;
  public readonly retryAfterMs?: number;

  public constructor(status: number, message: string, retryAfterMs?: number) {
    super(message);
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export async function deliverWebhookTargets(
  options: DeliverWebhookTargetsOptions,
): Promise<WebhookDeliveryResult | undefined> {
  const { request, artifacts, exportId, stats, warnings, limitations, manifest, storage } = options;
  const webhooks = request.output.webhooks;

  if (!webhooks?.enabled || !webhooks.targets?.length) {
    return undefined;
  }

  const strict = webhooks.strict ?? false;
  const retryAttempts = Math.max(1, webhooks.retry?.attempts ?? 3);
  const retryBackoffMs = Math.max(100, webhooks.retry?.backoffMs ?? 1000);

  const payload: UnifiedWebhookPayload = {
    exportId,
    createdAt: new Date().toISOString(),
    source: {
      guildId: request.guildId,
      channelId: request.channelId,
    },
    stats,
    files: artifacts.map((artifact) => ({
      format: artifact.format,
      path: artifact.path,
      size: artifact.size,
      contentType: artifact.contentType,
      checksumSha256: artifact.checksumSha256,
    })),
    storage,
    manifest,
    warnings: [...warnings],
    limitations: [...limitations],
  };

  const delivered: WebhookDeliveryResult["delivered"] = [];
  const failures: WebhookDeliveryResult["failures"] = [];

  for (const target of webhooks.targets) {
    const targetUrl = getTargetUrl(target);

    try {
      const status = await sendTargetWithRetry({
        target,
        payload,
        attempts: retryAttempts,
        backoffMs: retryBackoffMs,
      });

      delivered.push({
        kind: target.kind,
        url: targetUrl,
        status,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({
        kind: target.kind,
        url: targetUrl,
        error: message,
      });
      warnings.push(`Webhook delivery failed (${target.kind}:${targetUrl}): ${message}`);

      if (strict) {
        throw new Error(`Webhook strict mode failure (${target.kind}:${targetUrl}): ${message}`, {
          cause: error,
        });
      }
    }
  }

  return {
    delivered,
    failures,
  };
}

async function sendTargetWithRetry(options: {
  target: WebhookTarget;
  payload: UnifiedWebhookPayload;
  attempts: number;
  backoffMs: number;
}): Promise<number> {
  const { target, payload, attempts, backoffMs } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await sendToTarget(target, payload);
    } catch (error) {
      lastError = error;
      const retryable = isRetryableWebhookError(error);

      if (!retryable || attempt >= attempts) {
        throw error;
      }

      const retryAfterMs = error instanceof HttpStatusError ? error.retryAfterMs : undefined;
      const sleepMs = retryAfterMs ?? backoffMs * 2 ** (attempt - 1);
      await sleep(sleepMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Webhook delivery failed.");
}

async function sendToTarget(target: WebhookTarget, payload: UnifiedWebhookPayload): Promise<number> {
  switch (target.kind) {
    case "generic":
      return sendGenericWebhook(target, payload);
    case "discord":
      return sendDiscordWebhook(target, payload);
    case "slack":
      return sendSlackWebhook(target, payload);
    default:
      throw new Error(`Unsupported webhook target ${(target as { kind?: string }).kind}`);
  }
}

async function sendGenericWebhook(
  target: Extract<WebhookTarget, { kind: "generic" }>,
  payload: UnifiedWebhookPayload,
): Promise<number> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(target.headers ?? {}),
  };

  if (target.secretHeader) {
    headers[target.secretHeader.name] = target.secretHeader.value;
  }

  return sendJsonRequest({
    url: target.url,
    method: target.method ?? "POST",
    headers,
    body: payload,
  });
}

async function sendDiscordWebhook(
  target: Extract<WebhookTarget, { kind: "discord" }>,
  payload: UnifiedWebhookPayload,
): Promise<number> {
  const body = {
    username: target.username ?? "Discord Chat Exporter",
    avatar_url: target.avatarUrl,
    content: `Export ${payload.exportId} finished for channel ${payload.source.channelId}`,
    embeds: [
      {
        title: "Discord Transcript Export",
        description: `Messages exported: ${payload.stats.exportedMessages}`,
        fields: [
          {
            name: "Files",
            value: String(payload.files.length),
            inline: true,
          },
          {
            name: "Warnings",
            value: String(payload.warnings.length),
            inline: true,
          },
          {
            name: "Limitations",
            value: String(payload.limitations.length),
            inline: true,
          },
        ],
        timestamp: payload.createdAt,
      },
    ],
    allowed_mentions: {
      parse: [],
    },
  };

  return sendJsonRequest({
    url: target.url,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
}

async function sendSlackWebhook(
  target: Extract<WebhookTarget, { kind: "slack" }>,
  payload: UnifiedWebhookPayload,
): Promise<number> {
  type SlackSdk = {
    IncomingWebhook: new (
      url: string,
      options?: { username?: string; icon_emoji?: string },
    ) => {
      send(message: Record<string, unknown>): Promise<unknown>;
    };
  };
  const sdk = requireOptional<SlackSdk>("@slack/webhook", "Slack webhook delivery", require);
  const hook = new sdk.IncomingWebhook(target.url, {
    username: target.username,
  });

  try {
    await hook.send({
      channel: target.channel,
      text: `Discord export ${payload.exportId} completed for channel ${payload.source.channelId}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Discord export complete*\\nChannel: \`${payload.source.channelId}\`\\nMessages: *${payload.stats.exportedMessages}*`,
          },
        },
      ],
    });
    return 200;
  } catch {
    const body = {
      channel: target.channel,
      username: target.username,
      text: `Discord export ${payload.exportId} completed for channel ${payload.source.channelId}. Messages: ${payload.stats.exportedMessages}. Files: ${payload.files.length}.`,
    };

    return sendJsonRequest({
      url: target.url,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });
  }
}

async function sendJsonRequest(options: {
  url: string;
  method: "POST" | "PUT";
  headers: Record<string, string>;
  body: unknown;
}): Promise<number> {
  const response = await fetch(options.url, {
    method: options.method,
    headers: options.headers,
    body: JSON.stringify(options.body),
  });

  if (!response.ok) {
    const body = await response.text();
    const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"));
    throw new HttpStatusError(
      response.status,
      `HTTP ${response.status} - ${body || "empty response body"}`,
      retryAfterMs,
    );
  }

  return response.status;
}

function isRetryableWebhookError(error: unknown): boolean {
  if (error instanceof HttpStatusError) {
    return error.status === 429 || error.status >= 500;
  }

  return true;
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    return Math.max(0, Math.ceil(seconds * 1000));
  }

  return undefined;
}

function getTargetUrl(target: WebhookTarget): string {
  return target.url;
}

async function sleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return;
  }

  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
