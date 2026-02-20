import { describe, expect, it } from "vitest";
import {
  buildStorageOptions,
  buildWebhookOptions,
  parseOutputTarget,
} from "../src/modules/cli/build-request.js";
import { parseCliOptions } from "../src/modules/cli/schemas.js";

describe("cli build request", () => {
  it("validates option shapes at runtime", () => {
    expect(() => parseCliOptions({ token: 123 })).toThrow();
  });

  it("requires providers when storage is enabled", () => {
    const options = parseCliOptions({ storageEnable: true });
    expect(() => buildStorageOptions(options)).toThrow(
      "--storage-enable requires at least one --storage-provider",
    );
  });

  it("builds storage target options with validation", () => {
    const options = parseCliOptions({
      storageEnable: true,
      storageProvider: ["s3"],
      storageBucket: ["exports-bucket"],
      storageRegion: ["eu-central-1"],
      storagePrefix: ["archive"],
    });

    expect(buildStorageOptions(options)).toEqual({
      enabled: true,
      strict: false,
      providers: [
        {
          kind: "s3",
          bucket: "exports-bucket",
          region: "eu-central-1",
          keyPrefix: "archive",
          endpoint: undefined,
        },
      ],
    });
  });

  it("validates webhook URLs", () => {
    const options = parseCliOptions({
      webhookGeneric: ["not-a-url"],
    });

    expect(() => buildWebhookOptions(options)).toThrow();
  });

  it("parses valid output target values only", () => {
    expect(parseOutputTarget("filesystem")).toBe("filesystem");
    expect(parseOutputTarget("discord-channel")).toBe("discord-channel");
    expect(parseOutputTarget("both")).toBe("both");
    expect(() => parseOutputTarget("invalid")).toThrow(
      "Invalid --output-target value. Use: filesystem | discord-channel | both",
    );
  });
});
