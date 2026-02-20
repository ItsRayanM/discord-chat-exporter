import { createRequire } from "node:module";
import { OptionalDependencyError } from "@/shared/errors/index.js";

const defaultRequire = (): NodeRequire => createRequire(import.meta.url);

/**
 * Requires an optional dependency. Throws OptionalDependencyError if the module is not installed.
 * In ESM, omit `requireFn` to use createRequire(import.meta.url). Pass `require` for CJS or tests.
 */
export function requireOptional<T>(
  packageName: string,
  usage: string,
  requireFn?: NodeRequire,
): T {
  const req = requireFn ?? defaultRequire();
  try {
    return req(packageName) as T;
  } catch {
    throw new OptionalDependencyError(packageName, usage);
  }
}
