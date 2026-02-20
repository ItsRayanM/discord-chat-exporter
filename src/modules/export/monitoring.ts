import type { ExporterEvent, MonitoringOptions } from "@/types.js";
import { EXPORT_ID_PREFIX } from "@/shared/constants.js";

interface MonitoringCarrier {
  monitoring?: MonitoringOptions;
}

export async function emitMonitoringEvent(
  request: MonitoringCarrier,
  event: ExporterEvent,
  warnings?: string[],
): Promise<void> {
  const callback = request.monitoring?.onEvent;
  if (!callback) {
    return;
  }

  try {
    await callback(event);
  } catch (error) {
    if (warnings) {
      warnings.push(
        `Monitoring hook failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

export function createExportId(channelId?: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return channelId ? `${EXPORT_ID_PREFIX}${channelId}-${timestamp}` : `${EXPORT_ID_PREFIX}${timestamp}`;
}
