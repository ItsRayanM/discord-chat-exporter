import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import type {
  AIResult,
  AnalyticsReport,
  DatabaseDeliveryAdapter,
  DatabaseDeliveryContext,
  DatabaseDeliveryResult,
  ExportRequest,
  ExportStats,
  OutputDatabaseOptions,
  RenderArtifact,
  TranscriptDocument,
} from "@/types.js";
import { OptionalDependencyError, ValidationError } from "@/shared/errors/index.js";
import { requireOptional } from "@/shared/optional-require.js";

const require = createRequire(import.meta.url);

interface PersistExportToDatabaseOptions {
  database: OutputDatabaseOptions;
  request: ExportRequest;
  transcript: TranscriptDocument;
  artifacts: RenderArtifact[];
  analyticsReport?: AnalyticsReport;
  aiResult?: AIResult;
  stats: ExportStats;
  adapters?: Map<string, DatabaseDeliveryAdapter>;
}

interface SerializedExportPayload {
  exportedAt: string;
  channelId: string;
  guildId: string | null;
  formatsJson: string;
  transcriptJson: string;
  analyticsJson: string | null;
  aiJson: string | null;
  statsJson: string;
  artifactsJson: string;
  requestJson: string;
}

export async function persistExportToDatabase(
  options: PersistExportToDatabaseOptions,
): Promise<DatabaseDeliveryResult> {
  const {
    database,
    request,
    transcript,
    artifacts,
    analyticsReport,
    aiResult,
    stats,
    adapters,
  } = options;

  const driver = normalizeDriver(database.driver);
  const normalizedDatabase: OutputDatabaseOptions = {
    ...database,
    driver,
  };

  const ctx: DatabaseDeliveryContext = {
    database: normalizedDatabase,
    request,
    transcript,
    artifacts,
    analyticsReport,
    aiResult,
    stats,
  };

  const adapter = adapters?.get(driver);
  if (adapter) {
    return adapter.persist(ctx);
  }

  switch (driver) {
    case "sqlite":
      return persistWithSqlite(ctx);
    case "postgres":
      return persistWithPostgres(ctx);
    case "mysql":
      return persistWithMysql(ctx);
    case "mongodb":
      return persistWithMongodb(ctx);
    case "mongoose":
      return persistWithMongoose(ctx);
    default:
      throw new ValidationError(
        `Unsupported output.database.driver '${driver}'. Built-ins: sqlite, postgres, mysql, mongodb, mongoose.`,
      );
  }
}

async function persistWithSqlite(ctx: DatabaseDeliveryContext): Promise<DatabaseDeliveryResult> {
  const sqlitePath = ctx.database.sqlitePath?.trim();
  if (!sqlitePath) {
    throw new ValidationError("output.database.sqlitePath is required when output.database.driver=sqlite");
  }

  let DatabaseCtor: new (path: string) => {
    exec(sql: string): void;
    prepare(sql: string): {
      run(params: Record<string, unknown>): { lastInsertRowid?: number | bigint };
    };
    close(): void;
  };

  DatabaseCtor = requireOptional<typeof DatabaseCtor>("better-sqlite3", "SQLite database delivery", require);

  const table = sanitizeSqlIdentifier(ctx.database.table ?? "exports_log", "table");
  const payload = buildSerializedPayload(ctx);

  await mkdir(dirname(sqlitePath), { recursive: true });

  const db = new DatabaseCtor(sqlitePath);
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${table} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exported_at TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        guild_id TEXT,
        formats_json TEXT NOT NULL,
        transcript_json TEXT NOT NULL,
        analytics_json TEXT,
        ai_json TEXT,
        stats_json TEXT NOT NULL,
        artifacts_json TEXT NOT NULL,
        request_json TEXT NOT NULL
      );
    `);

    const statement = db.prepare(`
      INSERT INTO ${table}
      (
        exported_at,
        channel_id,
        guild_id,
        formats_json,
        transcript_json,
        analytics_json,
        ai_json,
        stats_json,
        artifacts_json,
        request_json
      )
      VALUES
      (
        @exported_at,
        @channel_id,
        @guild_id,
        @formats_json,
        @transcript_json,
        @analytics_json,
        @ai_json,
        @stats_json,
        @artifacts_json,
        @request_json
      );
    `);

    const result = statement.run({
      exported_at: payload.exportedAt,
      channel_id: payload.channelId,
      guild_id: payload.guildId,
      formats_json: payload.formatsJson,
      transcript_json: payload.transcriptJson,
      analytics_json: payload.analyticsJson,
      ai_json: payload.aiJson,
      stats_json: payload.statsJson,
      artifacts_json: payload.artifactsJson,
      request_json: payload.requestJson,
    });

    return {
      driver: "sqlite",
      exportId: Number(result.lastInsertRowid ?? 0),
      location: sqlitePath,
      metadata: { table },
    };
  } finally {
    db.close();
  }
}

async function persistWithPostgres(ctx: DatabaseDeliveryContext): Promise<DatabaseDeliveryResult> {
  let pgModule: {
    Client: new (config: unknown) => {
      connect(): Promise<void>;
      query(sql: string, params?: unknown[]): Promise<{ rows: Array<{ id: number | string }> }>;
      end(): Promise<void>;
    };
  };

  pgModule = requireOptional<typeof pgModule>("pg", "PostgreSQL database delivery", require);

  const table = sanitizeSqlIdentifier(ctx.database.table ?? "exports_log", "table");
  const payload = buildSerializedPayload(ctx);
  const connectionConfig = resolveSqlConnectionConfig(ctx.database, "postgres");
  const client = new pgModule.Client(connectionConfig);

  try {
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${table} (
        id BIGSERIAL PRIMARY KEY,
        exported_at TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        guild_id TEXT,
        formats_json TEXT NOT NULL,
        transcript_json TEXT NOT NULL,
        analytics_json TEXT,
        ai_json TEXT,
        stats_json TEXT NOT NULL,
        artifacts_json TEXT NOT NULL,
        request_json TEXT NOT NULL
      );
    `);

    const result = await client.query(
      `
      INSERT INTO ${table}
      (
        exported_at,
        channel_id,
        guild_id,
        formats_json,
        transcript_json,
        analytics_json,
        ai_json,
        stats_json,
        artifacts_json,
        request_json
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )
      RETURNING id;
      `,
      [
        payload.exportedAt,
        payload.channelId,
        payload.guildId,
        payload.formatsJson,
        payload.transcriptJson,
        payload.analyticsJson,
        payload.aiJson,
        payload.statsJson,
        payload.artifactsJson,
        payload.requestJson,
      ],
    );

    const insertedId = result.rows[0]?.id ?? "unknown";
    return {
      driver: "postgres",
      exportId: insertedId,
      location: `${resolveDatabaseName(ctx.database, "postgres")}.${table}`,
      metadata: { table },
    };
  } finally {
    await client.end();
  }
}

async function persistWithMysql(ctx: DatabaseDeliveryContext): Promise<DatabaseDeliveryResult> {
  let mysqlModule: {
    createConnection(config: unknown): Promise<{
      execute(sql: string, params?: unknown[]): Promise<[unknown, unknown]>;
      end(): Promise<void>;
    }>;
  };

  mysqlModule = requireOptional<typeof mysqlModule>("mysql2/promise", "MySQL database delivery", require);

  const table = sanitizeSqlIdentifier(ctx.database.table ?? "exports_log", "table");
  const payload = buildSerializedPayload(ctx);
  const connectionConfig = resolveSqlConnectionConfig(ctx.database, "mysql");
  const connection = await mysqlModule.createConnection(connectionConfig);

  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ${table} (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        exported_at TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        guild_id TEXT,
        formats_json LONGTEXT NOT NULL,
        transcript_json LONGTEXT NOT NULL,
        analytics_json LONGTEXT NULL,
        ai_json LONGTEXT NULL,
        stats_json LONGTEXT NOT NULL,
        artifacts_json LONGTEXT NOT NULL,
        request_json LONGTEXT NOT NULL
      );
    `);

    const [result] = await connection.execute(
      `
      INSERT INTO ${table}
      (
        exported_at,
        channel_id,
        guild_id,
        formats_json,
        transcript_json,
        analytics_json,
        ai_json,
        stats_json,
        artifacts_json,
        request_json
      )
      VALUES
      (
        ?,?,?,?,?,?,?,?,?,?
      );
      `,
      [
        payload.exportedAt,
        payload.channelId,
        payload.guildId,
        payload.formatsJson,
        payload.transcriptJson,
        payload.analyticsJson,
        payload.aiJson,
        payload.statsJson,
        payload.artifactsJson,
        payload.requestJson,
      ],
    );

    const insertId = Number((result as { insertId?: number }).insertId ?? 0);
    return {
      driver: "mysql",
      exportId: insertId,
      location: `${resolveDatabaseName(ctx.database, "mysql")}.${table}`,
      metadata: { table },
    };
  } finally {
    await connection.end();
  }
}

async function persistWithMongodb(ctx: DatabaseDeliveryContext): Promise<DatabaseDeliveryResult> {
  let mongodbModule: {
    MongoClient: new (uri: string, options?: Record<string, unknown>) => {
      connect(): Promise<void>;
      db(name: string): {
        collection(name: string): {
          insertOne(doc: Record<string, unknown>): Promise<{ insertedId: { toString(): string } }>;
        };
      };
      close(): Promise<void>;
    };
  };

  mongodbModule = requireOptional<typeof mongodbModule>("mongodb", "MongoDB database delivery", require);

  const connectionString = resolveConnectionString(ctx.database, "mongodb");
  const databaseName = resolveDatabaseName(ctx.database, "mongodb");
  const collection = sanitizeCollectionName(ctx.database.collection ?? ctx.database.table ?? "exports_log");
  const doc = buildDocumentPayload(ctx);

  const client = new mongodbModule.MongoClient(connectionString, {
    tls: ctx.database.tls,
    ...(ctx.database.options ?? {}),
  });

  try {
    await client.connect();
    const result = await client.db(databaseName).collection(collection).insertOne(doc);
    return {
      driver: "mongodb",
      exportId: result.insertedId.toString(),
      location: `${databaseName}.${collection}`,
      metadata: { collection },
    };
  } finally {
    await client.close();
  }
}

async function persistWithMongoose(ctx: DatabaseDeliveryContext): Promise<DatabaseDeliveryResult> {
  let mongooseModule: {
    connect(uri: string, options?: Record<string, unknown>): Promise<unknown>;
    disconnect(): Promise<void>;
    models: Record<string, unknown>;
    model(name: string, schema?: unknown, collection?: string): {
      create(doc: Record<string, unknown>): Promise<{ _id?: { toString(): string } }>;
    };
    Schema: new (definition?: Record<string, unknown>, options?: Record<string, unknown>) => unknown;
  };

  mongooseModule = requireOptional<typeof mongooseModule>("mongoose", "Mongoose database delivery", require);

  const connectionString = resolveConnectionString(ctx.database, "mongoose");
  const databaseName = resolveDatabaseName(ctx.database, "mongoose");
  const collection = sanitizeCollectionName(ctx.database.collection ?? ctx.database.table ?? "exports_log");
  const modelName = toMongooseModelName(collection);
  const doc = buildDocumentPayload(ctx);

  try {
    await mongooseModule.connect(connectionString, {
      dbName: databaseName,
      tls: ctx.database.tls,
      ...(ctx.database.options ?? {}),
    });

    const model =
      (mongooseModule.models[modelName] as
        | { create(doc: Record<string, unknown>): Promise<{ _id?: { toString(): string } }> }
        | undefined) ??
      mongooseModule.model(
        modelName,
        new mongooseModule.Schema({}, { strict: false, versionKey: false }),
        collection,
      );

    const created = await model.create(doc);
    return {
      driver: "mongoose",
      exportId: created._id?.toString() ?? "unknown",
      location: `${databaseName}.${collection}`,
      metadata: { collection, modelName },
    };
  } finally {
    await mongooseModule.disconnect();
  }
}

function buildSerializedPayload(ctx: DatabaseDeliveryContext): SerializedExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    channelId: ctx.request.channelId,
    guildId: ctx.request.guildId ?? null,
    formatsJson: JSON.stringify(ctx.request.formats),
    transcriptJson: JSON.stringify(ctx.transcript),
    analyticsJson: ctx.analyticsReport ? JSON.stringify(ctx.analyticsReport) : null,
    aiJson: ctx.aiResult ? JSON.stringify(ctx.aiResult) : null,
    statsJson: JSON.stringify(ctx.stats),
    artifactsJson: JSON.stringify(ctx.artifacts),
    requestJson: JSON.stringify(ctx.request),
  };
}

function buildDocumentPayload(ctx: DatabaseDeliveryContext): Record<string, unknown> {
  return {
    exportedAt: new Date().toISOString(),
    channelId: ctx.request.channelId,
    guildId: ctx.request.guildId ?? null,
    formats: ctx.request.formats,
    transcript: ctx.transcript,
    analytics: ctx.analyticsReport ?? null,
    ai: ctx.aiResult ?? null,
    stats: ctx.stats,
    artifacts: ctx.artifacts,
    request: ctx.request,
  };
}

function normalizeDriver(value: string | undefined): string {
  const normalized = (value ?? "sqlite").trim().toLowerCase();

  if (normalized === "pg" || normalized === "postgresql") return "postgres";
  if (normalized === "sqlite3") return "sqlite";
  if (normalized === "mongo") return "mongodb";
  return normalized;
}

function sanitizeSqlIdentifier(value: string, kind: "table" | "database"): string {
  const trimmed = value.trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    throw new ValidationError(
      `Invalid output.database.${kind} '${value}'. Use only letters, numbers, and underscores.`,
    );
  }
  return trimmed;
}

function sanitizeCollectionName(value: string): string {
  const trimmed = value.trim();
  if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    throw new ValidationError(
      `Invalid output.database.collection '${value}'. Use letters, numbers, dot, dash, underscore.`,
    );
  }
  return trimmed;
}

function resolveConnectionString(database: OutputDatabaseOptions, driver: string): string {
  const connectionString = database.connectionString?.trim();
  if (!connectionString) {
    throw new ValidationError(
      `output.database.connectionString is required when output.database.driver=${driver}`,
    );
  }
  return connectionString;
}

function resolveDatabaseName(database: OutputDatabaseOptions, driver: string): string {
  const fromOption = database.databaseName?.trim();
  if (fromOption) {
    if (driver === "postgres" || driver === "mysql") {
      return sanitizeSqlIdentifier(fromOption, "database");
    }
    return fromOption;
  }

  const connectionString = database.connectionString?.trim();
  if (connectionString) {
    try {
      const parsed = new URL(connectionString);
      const fromPath = parsed.pathname.replace(/^\/+/, "").trim();
      if (fromPath) {
        if (driver === "postgres" || driver === "mysql") {
          return sanitizeSqlIdentifier(fromPath, "database");
        }
        return fromPath;
      }
    } catch {
      // ignored: invalid URL format; fallback below
    }
  }

  if (driver === "postgres" || driver === "mysql") {
    throw new ValidationError(`Could not resolve database name for ${driver}. Set output.database.databaseName.`);
  }

  return "discord_chat_exporter";
}

function resolveSqlConnectionConfig(
  database: OutputDatabaseOptions,
  driver: "postgres" | "mysql",
): string | Record<string, unknown> {
  if (database.connectionString?.trim()) {
    return database.connectionString.trim();
  }

  if (!database.host?.trim()) {
    throw new ValidationError(`output.database.host is required when output.database.driver=${driver}`);
  }

  const databaseName = resolveDatabaseName(database, driver);
  const config: Record<string, unknown> = {
    host: database.host.trim(),
    port: database.port,
    user: database.user,
    password: database.password,
    database: databaseName,
    ...(database.options ?? {}),
  };

  if (driver === "postgres" && database.tls) {
    config.ssl = { rejectUnauthorized: false };
  }

  if (driver === "mysql" && database.tls) {
    config.ssl = {};
  }

  return config;
}

function toMongooseModelName(collection: string): string {
  return collection
    .split(/[^a-zA-Z0-9]+/)
    .filter((entry) => entry.length > 0)
    .map((entry) => `${entry.charAt(0).toUpperCase()}${entry.slice(1)}`)
    .join("") || "ExportLog";
}
