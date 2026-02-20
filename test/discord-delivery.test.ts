import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { deliverArtifactsToDiscordChannel } from "../src/modules/delivery/discord-delivery.js";
import type { RenderArtifact } from "../src/types.ts";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("discord delivery", () => {
  it("uploads files in batches of 10 per message", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "dcexport-delivery-test-"));

    try {
      const artifacts: RenderArtifact[] = [];
      for (let i = 0; i < 11; i += 1) {
        const filePath = join(tempDir, `artifact-${i + 1}.txt`);
        await writeFile(filePath, `file ${i + 1}`, "utf8");
        artifacts.push({
          format: "txt",
          path: filePath,
          contentType: "text/plain",
          size: 6,
          checksumSha256: `sha-${i + 1}`,
        });
      }

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: "msg-1" }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: "msg-2" }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        );

      vi.stubGlobal("fetch", fetchMock);

      const result = await deliverArtifactsToDiscordChannel({
        token: "token",
        delivery: {
          channelId: "123456789012345678",
          content: "Ticket transcript",
        },
        artifacts,
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.channelId).toBe("123456789012345678");
      expect(result.messageIds).toEqual(["msg-1", "msg-2"]);
      expect(result.uploadedFiles).toBe(11);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
