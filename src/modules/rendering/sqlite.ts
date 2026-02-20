import { createRequire } from "node:module";
import { join } from "node:path";
import type { RenderArtifact, RenderContext } from "@/types.js";
import { hashFileSha256 } from "@/modules/transcript/index.js";
import { requireOptional } from "@/shared/optional-require.js";

export async function renderSqlite(ctx: RenderContext): Promise<RenderArtifact[]> {
  const require = createRequire(import.meta.url);
  const Database = requireOptional<typeof import("better-sqlite3")>(
    "better-sqlite3",
    "SQLite export",
    require,
  );

  const filePath = join(ctx.outputDir, `${ctx.outputBaseName}.sqlite`);
  const db = new Database(filePath);

  try {
    db.pragma("journal_mode = WAL");

    db.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS participants (
        id TEXT PRIMARY KEY,
        username TEXT,
        global_name TEXT,
        discriminator TEXT,
        avatar_url TEXT,
        bot INTEGER
      );
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        channel_id TEXT,
        guild_id TEXT,
        type INTEGER,
        created_at TEXT,
        edited_at TEXT,
        pinned INTEGER,
        deleted INTEGER,
        author_id TEXT,
        content TEXT,
        raw_json TEXT
      );
      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT,
        message_id TEXT,
        filename TEXT,
        source_url TEXT,
        local_path TEXT,
        content_type TEXT,
        size INTEGER,
        status TEXT,
        PRIMARY KEY (id, message_id)
      );
    `);

    const insertMeta = db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)`);
    insertMeta.run("exportedAt", ctx.transcript.exportedAt);
    insertMeta.run("channelId", ctx.transcript.channel.id);
    insertMeta.run("messageCount", String(ctx.transcript.messages.length));

    const insertParticipant = db.prepare(`
      INSERT OR REPLACE INTO participants (id, username, global_name, discriminator, avatar_url, bot)
      VALUES (@id, @username, @global_name, @discriminator, @avatar_url, @bot)
    `);

    const insertMessage = db.prepare(`
      INSERT OR REPLACE INTO messages
      (id, channel_id, guild_id, type, created_at, edited_at, pinned, deleted, author_id, content, raw_json)
      VALUES
      (@id, @channel_id, @guild_id, @type, @created_at, @edited_at, @pinned, @deleted, @author_id, @content, @raw_json)
    `);

    const insertAttachment = db.prepare(`
      INSERT OR REPLACE INTO attachments
      (id, message_id, filename, source_url, local_path, content_type, size, status)
      VALUES
      (@id, @message_id, @filename, @source_url, @local_path, @content_type, @size, @status)
    `);

    const transaction = db.transaction(() => {
      for (const participant of ctx.transcript.participants) {
        insertParticipant.run({
          id: participant.id,
          username: participant.username,
          global_name: participant.globalName ?? null,
          discriminator: participant.discriminator ?? null,
          avatar_url: participant.avatarUrl ?? null,
          bot: participant.bot ? 1 : 0,
        });
      }

      for (const message of ctx.transcript.messages) {
        insertMessage.run({
          id: message.id,
          channel_id: message.channelId,
          guild_id: message.guildId ?? null,
          type: message.type,
          created_at: message.createdAt,
          edited_at: message.editedAt ?? null,
          pinned: message.pinned ? 1 : 0,
          deleted: message.deleted ? 1 : 0,
          author_id: message.author?.id ?? null,
          content: message.content,
          raw_json: JSON.stringify(message.raw),
        });
      }

      for (const attachment of ctx.transcript.attachmentsManifest) {
        insertAttachment.run({
          id: attachment.id,
          message_id: attachment.messageId,
          filename: findAttachmentName(ctx, attachment.messageId, attachment.id),
          source_url: attachment.sourceUrl,
          local_path: attachment.localPath ?? null,
          content_type: attachment.contentType ?? null,
          size: attachment.size,
          status: attachment.status,
        });
      }
    });

    transaction();
  } finally {
    db.close();
  }

  const info = await hashFileSha256(filePath);
  return [
    {
      format: "sqlite",
      path: filePath,
      contentType: "application/x-sqlite3",
      size: info.size,
      checksumSha256: info.checksum,
    },
  ];
}

function findAttachmentName(ctx: RenderContext, messageId: string, attachmentId: string): string {
  const message = ctx.transcript.messages.find((entry) => entry.id === messageId);
  const attachment = message?.attachments.find((entry) => entry.id === attachmentId);
  return attachment?.filename ?? "attachment";
}
