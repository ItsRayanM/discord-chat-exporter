import { readFile } from "node:fs/promises";
import { createExporter, type DiscordChatExporter } from "@/core/exporter.js";
import type { BatchExportRequest, ExportRequest } from "@/types.js";
import { computeApproxNextRunAt, requireCronModule, validateCronExpression } from "@/modules/scheduler/engine.js";
import { loadSchedulerState, saveSchedulerState, type SchedulerJob } from "@/modules/scheduler/store.js";

export interface SchedulerRunResult {
  jobId: string;
  ok: boolean;
  startedAt: string;
  endedAt: string;
  error?: string;
}

export async function runScheduledJob(
  exporter: DiscordChatExporter,
  job: SchedulerJob,
): Promise<SchedulerRunResult> {
  const startedAt = new Date().toISOString();

  try {
    if (job.batch || isBatchRequest(job.request)) {
      await exporter.exportBatch(job.request as BatchExportRequest);
    } else {
      await exporter.exportChannel(job.request as ExportRequest);
    }

    return {
      jobId: job.id,
      ok: true,
      startedAt,
      endedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      jobId: job.id,
      ok: false,
      startedAt,
      endedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runScheduledJobById(options: {
  statePath: string;
  jobId: string;
  exporter?: DiscordChatExporter;
}): Promise<SchedulerRunResult> {
  const state = await loadSchedulerState(options.statePath);
  const job = state.jobs.find((entry) => entry.id === options.jobId);

  if (!job) {
    return {
      jobId: options.jobId,
      ok: false,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      error: `Job '${options.jobId}' not found.`,
    };
  }

  const exporter = options.exporter ?? createExporter();
  const result = await runScheduledJob(exporter, job);

  const now = new Date().toISOString();
  job.lastRunAt = now;
  job.nextRunAt = computeApproxNextRunAt();
  job.updatedAt = now;
  state.updatedAt = now;

  await saveSchedulerState(options.statePath, state);
  return result;
}

export async function startSchedulerDaemon(options: {
  jobsPath: string;
  statePath?: string;
  exporter?: DiscordChatExporter;
  onLog?: (message: string) => void;
}): Promise<{ stop: () => Promise<void> }> {
  const cron = requireCronModule();
  const exporter = options.exporter ?? createExporter();
  const jobs = await loadJobsFile(options.jobsPath);
  const tasks: Array<{ stop: () => void; destroy?: () => void }> = [];
  const running = new Set<string>();

  for (const job of jobs) {
    if (job.enabled === false) {
      continue;
    }

    if (!validateCronExpression(job.cron)) {
      options.onLog?.(`Skipped invalid cron expression for job ${job.id}: ${job.cron}`);
      continue;
    }

    const task = cron.schedule(job.cron, async () => {
      if (running.has(job.id)) {
        options.onLog?.(`Job ${job.id} is still running; skipping this tick.`);
        return;
      }

      running.add(job.id);
      try {
        const result = await runScheduledJob(exporter, job);
        options.onLog?.(
          result.ok
            ? `Job ${job.id} completed.`
            : `Job ${job.id} failed: ${result.error ?? "unknown error"}`,
        );

        if (options.statePath) {
          await updateStateAfterRun(options.statePath, job.id);
        }
      } finally {
        running.delete(job.id);
      }
    });

    task.start();
    tasks.push(task);
    options.onLog?.(`Scheduled job ${job.id} with cron '${job.cron}'.`);
  }

  return {
    stop: async () => {
      for (const task of tasks) {
        task.stop();
        if (typeof task.destroy === "function") {
          task.destroy();
        }
      }
    },
  };
}

async function loadJobsFile(path: string): Promise<SchedulerJob[]> {
  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw) as SchedulerJob[] | { jobs?: SchedulerJob[] };

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (Array.isArray(parsed.jobs)) {
    return parsed.jobs;
  }

  return [];
}

async function updateStateAfterRun(path: string, jobId: string): Promise<void> {
  const state = await loadSchedulerState(path);
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job) {
    return;
  }

  const now = new Date().toISOString();
  job.lastRunAt = now;
  job.nextRunAt = computeApproxNextRunAt();
  job.updatedAt = now;
  state.updatedAt = now;
  await saveSchedulerState(path, state);
}

function isBatchRequest(request: ExportRequest | BatchExportRequest): request is BatchExportRequest {
  return Array.isArray((request as BatchExportRequest).channelIds);
}
