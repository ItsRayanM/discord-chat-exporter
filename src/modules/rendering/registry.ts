import type { RendererPlugin } from "@/types.js";

export class RendererRegistry {
  private readonly plugins = new Map<string, RendererPlugin>();

  public register(plugin: RendererPlugin): void {
    this.plugins.set(plugin.format, plugin);
  }

  public get(format: string): RendererPlugin | undefined {
    return this.plugins.get(format);
  }

  public list(): RendererPlugin[] {
    return [...this.plugins.values()];
  }
}
