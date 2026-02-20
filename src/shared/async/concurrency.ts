import pLimit from "p-limit";

export type AsyncTask<T = void> = () => Promise<T>;

export function createConcurrencyLimiter(concurrency: number): <T>(task: AsyncTask<T>) => Promise<T> {
  const limit = pLimit(Math.max(1, concurrency));
  return <T>(task: AsyncTask<T>) => limit(task);
}

export async function runWithConcurrencyLimit(
  tasks: Array<AsyncTask<void>>,
  concurrency: number,
): Promise<void> {
  const limit = createConcurrencyLimiter(concurrency);
  await Promise.all(tasks.map((task) => limit(task)));
}
