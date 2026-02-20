import { z } from "zod";
import type { FilterGroup, StorageTarget, WebhookTarget } from "@/types.js";
import type { SchedulerJob } from "@/modules/scheduler/index.js";

const stringArrayLikeSchema = z.union([z.string(), z.array(z.string())]).optional();
const stringOrNumberSchema = z.union([z.string(), z.number()]).optional();

export const cliOptionsSchema = z
  .object({
    token: z.string().optional(),
    channel: z.string().optional(),
    channels: z.string().optional(),
    channelsFile: z.string().optional(),
    batchOutputDirName: z.string().optional(),
    batchConcurrency: stringOrNumberSchema,
    batchMasterIndex: z.boolean().optional(),
    batchMerged: z.boolean().optional(),
    guild: z.string().optional(),
    threads: z.string().optional(),
    formats: z.string().optional(),
    out: z.string().optional(),
    outputTarget: z.string().optional(),
    retainFiles: z.boolean().optional(),
    discordOutputChannel: z.string().optional(),
    discordOutputToken: z.string().optional(),
    discordOutputContent: z.string().optional(),
    dbDriver: z.string().optional(),
    dbConnection: z.string().optional(),
    dbHost: z.string().optional(),
    dbPort: stringOrNumberSchema,
    dbUser: z.string().optional(),
    dbPassword: z.string().optional(),
    dbName: z.string().optional(),
    dbCollection: z.string().optional(),
    dbTls: z.boolean().optional(),
    dbSqlite: z.string().optional(),
    dbTable: z.string().optional(),
    basename: z.string().optional(),
    filterFile: z.string().optional(),
    attachmentsMode: z.string().optional(),
    downloadConcurrency: stringOrNumberSchema,
    maxBase64Bytes: stringOrNumberSchema,
    zipPassword: z.string().optional(),
    theme: z.string().optional(),
    timezone: z.string().optional(),
    timestampFormat: z.string().optional(),
    watermark: z.string().optional(),
    readOnly: z.boolean().optional(),
    rtl: z.boolean().optional(),
    toc: z.boolean().optional(),
    htmlAccessibility: z.boolean().optional(),
    htmlTemplate: z.string().optional(),
    htmlSearchable: z.boolean().optional(),
    splitMaxMessages: stringOrNumberSchema,
    splitMaxBytes: stringOrNumberSchema,
    incremental: z.boolean().optional(),
    incrementalState: z.string().optional(),
    analytics: z.boolean().optional(),
    analyticsHeatmap: z.boolean().optional(),
    topWords: stringOrNumberSchema,
    topMentions: stringOrNumberSchema,
    ai: z.boolean().optional(),
    aiProvider: z.string().optional(),
    aiPrompt: z.string().optional(),
    aiMaxHighlights: stringOrNumberSchema,
    storageEnable: z.boolean().optional(),
    storageProvider: stringArrayLikeSchema,
    storageBucket: stringArrayLikeSchema,
    storagePrefix: stringArrayLikeSchema,
    storageEndpoint: stringArrayLikeSchema,
    storageRegion: stringArrayLikeSchema,
    storageAccount: stringArrayLikeSchema,
    storageContainer: stringArrayLikeSchema,
    storageGcsProject: stringArrayLikeSchema,
    storageGcsCredentials: stringArrayLikeSchema,
    storageConnectionString: stringArrayLikeSchema,
    storageStrict: z.boolean().optional(),
    webhookGeneric: stringArrayLikeSchema,
    webhookDiscord: stringArrayLikeSchema,
    webhookSlack: stringArrayLikeSchema,
    webhookStrict: z.boolean().optional(),
    webhookRetryAttempts: stringOrNumberSchema,
    webhookRetryBackoff: stringOrNumberSchema,
    redaction: z.boolean().optional(),
    redactionProfiles: z.string().optional(),
    redactionReplacement: z.string().optional(),
    redactionCustomFile: z.string().optional(),
    delta: z.boolean().optional(),
    deltaCheckpoint: z.string().optional(),
    deltaEdits: z.boolean().optional(),
    deltaDeletes: z.boolean().optional(),
    manifest: z.boolean().optional(),
    signEd25519Key: z.string().optional(),
    signKeyId: z.string().optional(),
    progressJsonl: z.string().optional(),
    verboseProgress: z.boolean().optional(),
    guilds: z.string().optional(),
    jobs: z.string().optional(),
    jobFile: z.string().optional(),
    jobId: z.string().optional(),
    state: z.string().optional(),
    outFile: z.string().optional(),
    sessionFile: z.string().optional(),
  })
  .passthrough();

export type CliOptions = z.infer<typeof cliOptionsSchema>;

const redactionCustomPatternSchema = z.object({
  name: z.string().min(1),
  pattern: z.string().min(1),
  flags: z.string().optional(),
});

export const redactionCustomFileSchema = z.union([
  z.array(redactionCustomPatternSchema),
  z.object({
    customPatterns: z.array(redactionCustomPatternSchema).optional(),
  }),
]);

export const storageTargetSchema = z.union([
  z.object({
    kind: z.literal("s3"),
    bucket: z.string().min(1),
    region: z.string().optional(),
    endpoint: z.string().optional(),
    keyPrefix: z.string().optional(),
    credentialsFromEnv: z.boolean().optional(),
  }),
  z.object({
    kind: z.literal("gcs"),
    bucket: z.string().min(1),
    keyPrefix: z.string().optional(),
    projectId: z.string().optional(),
    credentialsJsonPath: z.string().optional(),
  }),
  z.object({
    kind: z.literal("azure-blob"),
    account: z.string().min(1),
    container: z.string().min(1),
    keyPrefix: z.string().optional(),
    connectionString: z.string().optional(),
  }),
]);

export const webhookTargetSchema = z.union([
  z.object({
    kind: z.literal("generic"),
    url: z.string().url(),
    method: z.enum(["POST", "PUT"]).optional(),
    headers: z.record(z.string(), z.string()).optional(),
    secretHeader: z
      .object({
        name: z.string().min(1),
        value: z.string().min(1),
      })
      .optional(),
  }),
  z.object({
    kind: z.literal("discord"),
    url: z.string().url(),
    username: z.string().optional(),
    avatarUrl: z.string().url().optional(),
  }),
  z.object({
    kind: z.literal("slack"),
    url: z.string().url(),
    channel: z.string().optional(),
    username: z.string().optional(),
  }),
]);

const schedulerJobSchema = z.object({
  id: z.string().min(1),
  cron: z.string().min(1),
  enabled: z.boolean().optional(),
  batch: z.boolean().optional(),
  request: z.record(z.string(), z.unknown()),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  lastRunAt: z.string().optional(),
  nextRunAt: z.string().optional(),
});

export const schedulerJobsFileSchema = z.union([
  schedulerJobSchema,
  z.array(schedulerJobSchema),
  z.object({
    jobs: z.array(schedulerJobSchema).optional(),
  }),
]);

export function parseCliOptions(options: unknown): CliOptions {
  return cliOptionsSchema.parse(options);
}

export function parseRedactionCustomFile(value: unknown): Array<{ name: string; pattern: string; flags?: string }> {
  const parsed = redactionCustomFileSchema.parse(value);
  return Array.isArray(parsed) ? parsed : parsed.customPatterns ?? [];
}

export function validateStorageTarget(target: StorageTarget): StorageTarget {
  return storageTargetSchema.parse(target) as StorageTarget;
}

export function validateWebhookTarget(target: WebhookTarget): WebhookTarget {
  return webhookTargetSchema.parse(target) as WebhookTarget;
}

export function parseSchedulerJobsFile(value: unknown): SchedulerJob[] {
  const parsed = schedulerJobsFileSchema.parse(value);
  if (Array.isArray(parsed)) {
    return parsed as unknown as SchedulerJob[];
  }
  if ("jobs" in parsed) {
    return (parsed.jobs ?? []) as unknown as SchedulerJob[];
  }
  return [parsed as unknown as SchedulerJob];
}

const filterGroupSchema = z.object({
  op: z.enum(["AND", "OR"]),
  conditions: z.array(z.unknown()),
});

export function parseFilterGroup(value: unknown): FilterGroup {
  return filterGroupSchema.parse(value) as FilterGroup;
}
