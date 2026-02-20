import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { BatchExportRequest, ExportRequest } from "@/types.js";

export interface SchedulerJob {
  id: string;
  cron: string;
  enabled?: boolean;
  batch?: boolean;
  request: ExportRequest | BatchExportRequest;
  createdAt?: string;
  updatedAt?: string;
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface SchedulerState {
  jobs: SchedulerJob[];
  updatedAt: string;
}

export async function loadSchedulerState(path: string): Promise<SchedulerState> {
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as Partial<SchedulerState>;

    return {
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        jobs: [],
        updatedAt: new Date().toISOString(),
      };
    }

    throw error;
  }
}

export async function saveSchedulerState(path: string, state: SchedulerState): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(state, null, 2), "utf8");
}

export async function upsertSchedulerJob(path: string, job: SchedulerJob): Promise<SchedulerState> {
  const state = await loadSchedulerState(path);
  const now = new Date().toISOString();
  const normalized: SchedulerJob = {
    ...job,
    createdAt: job.createdAt ?? now,
    updatedAt: now,
  };

  const index = state.jobs.findIndex((item) => item.id === job.id);
  if (index >= 0) {
    const existing = state.jobs[index];
    if (!existing) {
      return state;
    }
    state.jobs[index] = {
      ...existing,
      ...normalized,
      createdAt: existing.createdAt ?? normalized.createdAt,
      updatedAt: now,
    };
  } else {
    state.jobs.push(normalized);
  }

  state.updatedAt = now;
  await saveSchedulerState(path, state);
  return state;
}

export async function updateSchedulerJob(path: string, jobId: string, patch: Partial<SchedulerJob>): Promise<void> {
  const state = await loadSchedulerState(path);
  const index = state.jobs.findIndex((item) => item.id === jobId);
  if (index < 0) {
    return;
  }

  const existing = state.jobs[index];
  if (!existing) {
    return;
  }

  state.jobs[index] = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  state.updatedAt = new Date().toISOString();

  await saveSchedulerState(path, state);
}
