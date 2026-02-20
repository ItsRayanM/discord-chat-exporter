import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ExportRequest } from "@/types.js";

export interface OutputPlan {
  target: "filesystem" | "discord-channel" | "both";
  outputDir: string;
  temporary: boolean;
}

export async function resolveOutputPlan(request: ExportRequest): Promise<OutputPlan> {
  const target = request.output.target ?? "filesystem";
  const explicitDir = request.output.dir?.trim();

  if (explicitDir) {
    return {
      target,
      outputDir: explicitDir,
      temporary: false,
    };
  }

  const temporaryDir = await mkdtemp(join(tmpdir(), "dcexport-"));
  return {
    target,
    outputDir: temporaryDir,
    temporary: true,
  };
}
