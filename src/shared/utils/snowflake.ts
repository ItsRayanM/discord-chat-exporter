export function compareSnowflakes(a: string, b: string): number {
  try {
    const aBig = BigInt(a);
    const bBig = BigInt(b);
    if (aBig < bBig) return -1;
    if (aBig > bBig) return 1;
    return 0;
  } catch {
    return a.localeCompare(b);
  }
}

export function getMaxSnowflakeId<T extends { id: string }>(items: T[]): string | undefined {
  if (items.length === 0) {
    return undefined;
  }

  const first = items[0];
  if (!first) {
    return undefined;
  }

  let maxId = first.id;
  for (let i = 1; i < items.length; i += 1) {
    const item = items[i];
    if (!item) {
      continue;
    }
    if (compareSnowflakes(item.id, maxId) > 0) {
      maxId = item.id;
    }
  }

  return maxId;
}
