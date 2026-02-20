import { describe, expect, it } from "vitest";
import * as api from "../src/index.ts";

describe("public api contract", () => {
  it("keeps expected runtime exports", () => {
    const keys = new Set(Object.keys(api));
    const expected = [
      "createExporter",
      "DiscordChatExporter",
      "createTicketCloseHandler",
      "createAdvancedTicketCloseHandler",
      "startLiveRecorder",
      "loadSchedulerState",
      "saveSchedulerState",
      "upsertSchedulerJob",
      "runScheduledJobById",
      "startSchedulerDaemon",
      "validateCronExpression",
      "HeuristicAIProvider",
      "OpenAICompatibleProvider",
      "OpenAIProvider",
      "GoogleGeminiProvider",
      "AnthropicClaudeProvider",
    ];

    for (const name of expected) {
      expect(keys.has(name)).toBe(true);
    }
  });
});
