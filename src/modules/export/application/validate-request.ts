import type { BatchExportRequest, ExportRequest } from "@/types.js";
import { ValidationError } from "@/shared/errors/index.js";

export function validateRequest(request: ExportRequest): void {
  if (!request.token?.trim()) {
    throw new ValidationError("token is required");
  }
  if (!request.channelId?.trim()) {
    throw new ValidationError("channelId is required");
  }
  if (!request.formats || request.formats.length === 0) {
    throw new ValidationError("At least one output format is required");
  }

  const target = request.output?.target ?? "filesystem";
  if (target !== "filesystem" && target !== "discord-channel" && target !== "both") {
    throw new ValidationError("output.target must be one of: filesystem, discord-channel, both");
  }

  if ((target === "filesystem" || target === "both") && !request.output?.dir?.trim()) {
    throw new ValidationError("output.dir is required for filesystem/both output targets");
  }

  if ((target === "discord-channel" || target === "both") && !request.output?.discord?.channelId?.trim()) {
    throw new ValidationError("output.discord.channelId is required for discord-channel/both output targets");
  }

  if (request.output?.database?.enabled) {
    const driver = (request.output.database.driver ?? "sqlite").trim().toLowerCase();
    if (!driver) {
      throw new ValidationError("output.database.driver must not be empty");
    }
    if (driver === "sqlite" && !request.output.database.sqlitePath?.trim()) {
      throw new ValidationError("output.database.sqlitePath is required when output.database.driver=sqlite");
    }
  }

  if (request.output?.storage?.enabled) {
    if (!request.output.storage.providers?.length) {
      throw new ValidationError("output.storage.providers is required when output.storage.enabled=true");
    }
  }

  if (request.output?.webhooks?.enabled) {
    if (!request.output.webhooks.targets?.length) {
      throw new ValidationError("output.webhooks.targets is required when output.webhooks.enabled=true");
    }
  }
}

export function validateBatchRequest(request: BatchExportRequest): void {
  if (!request.channelIds?.length) {
    throw new ValidationError("channelIds is required for batch export");
  }

  if (!request.formats || request.formats.length === 0) {
    throw new ValidationError("At least one output format is required");
  }

  if (!request.token?.trim()) {
    throw new ValidationError("token is required");
  }
}
