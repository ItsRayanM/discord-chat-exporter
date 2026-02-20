import { ValidationError } from "@/shared/errors/index.js";

/**
 * Parses a JSON string and returns the result, or throws ValidationError with context.
 */
export function safeJsonParse<T>(raw: string, context?: string): T {
  try {
    const value = JSON.parse(raw) as T;
    return value;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const detail = context ? `${context}: ${message}` : message;
    throw new ValidationError(`Invalid JSON: ${detail}`, { cause: error });
  }
}
