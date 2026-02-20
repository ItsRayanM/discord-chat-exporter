export class DiscordExporterError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  public constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export class OptionalDependencyError extends DiscordExporterError {
  public constructor(packageName: string, usage: string) {
    super(
      "OPTIONAL_DEPENDENCY_MISSING",
      `Optional dependency '${packageName}' is required for ${usage}. Install it to continue.`,
      { packageName, usage },
    );
  }
}

export class DiscordApiError extends DiscordExporterError {
  public readonly status: number;

  public constructor(status: number, message: string, details?: Record<string, unknown>) {
    super("DISCORD_API_ERROR", message, details);
    this.status = status;
  }
}

export class ValidationError extends DiscordExporterError {
  public constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, details);
  }
}
