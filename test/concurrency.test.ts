import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import { runWithConcurrencyLimit } from "../src/shared/async/concurrency.ts";

describe("concurrency limiter", () => {
  it("caps concurrent task execution", async () => {
    let active = 0;
    let maxActive = 0;

    const tasks = Array.from({ length: 8 }, (_, index) => async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await delay(20 + index);
      active -= 1;
    });

    await runWithConcurrencyLimit(tasks, 3);

    expect(maxActive).toBeLessThanOrEqual(3);
  });

  it("normalizes invalid concurrency to one", async () => {
    let active = 0;
    let maxActive = 0;

    const tasks = Array.from({ length: 3 }, () => async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await delay(10);
      active -= 1;
    });

    await runWithConcurrencyLimit(tasks, 0);

    expect(maxActive).toBe(1);
  });
});
