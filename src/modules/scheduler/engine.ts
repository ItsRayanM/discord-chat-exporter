import { createRequire } from "node:module";
import { requireOptional } from "@/shared/optional-require.js";

const require = createRequire(import.meta.url);

interface CronModule {
  validate(expression: string): boolean;
  schedule(expression: string, task: () => void | Promise<void>): {
    start(): void;
    stop(): void;
    destroy?: () => void;
  };
}

export function validateCronExpression(expression: string): boolean {
  if (!expression || !expression.trim()) {
    return false;
  }

  try {
    const cron = require("node-cron") as CronModule;
    return cron.validate(expression);
  } catch {
    return basicCronFallback(expression);
  }
}

export function requireCronModule(): CronModule {
  return requireOptional<CronModule>("node-cron", "scheduler daemon", require);
}

export function computeApproxNextRunAt(from = new Date()): string {
  return new Date(from.getTime() + 60_000).toISOString();
}

function basicCronFallback(expression: string): boolean {
  const parts = expression.trim().split(/\s+/);
  return parts.length >= 5 && parts.length <= 6;
}
