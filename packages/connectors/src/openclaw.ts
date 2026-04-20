import * as fs from "node:fs";
import type { Connector, PushResult, ConnectorConfig } from "./types.js";
import { sanitizeOverlayForConstrainedModels } from "./overlay-policy.js";
import { injectManagedOverlay, removeManagedOverlay } from "./overlay-block.js";
import { resolveConfiguredPath } from "./path-utils.js";

export class OpenClawConnector implements Connector {
  readonly id = "openclaw";
  readonly label = "OpenClaw";
  readonly type = "file" as const;
  readonly description = "Write personality overlay to OpenClaw workspace config";
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = resolveConfiguredPath(
      configPath ?? process.env.TRAITMIXER_OPENCLAW_CONFIG_PATH ?? ""
    );
  }

  isConfigured(): boolean {
    return this.configPath.length > 0;
  }

  info(): ConnectorConfig {
    return {
      id: this.id,
      label: this.label,
      type: this.type,
      configured: this.isConfigured(),
      description: this.isConfigured() ? (process.env.HOME ? this.configPath.replace(process.env.HOME, "~") : this.configPath) : "Not configured",
      setupHint: "Need workspace config path",
    };
  }

  async push(overlay: string): Promise<PushResult> {
    if (!this.isConfigured()) {
      return { success: false, target: this.id, message: "TRAITMIXER_OPENCLAW_CONFIG_PATH not set" };
    }
    try {
      const { changed, overlay: safeOverlay } = sanitizeOverlayForConstrainedModels(overlay);
      const existing = fs.existsSync(this.configPath)
        ? fs.readFileSync(this.configPath, "utf-8")
        : "";
      fs.writeFileSync(this.configPath, injectManagedOverlay(existing, safeOverlay), "utf-8");
      return {
        success: true,
        target: this.id,
        message: `Written to ${this.configPath}${changed ? " (safety wording adjusted for constrained models)" : ""}`,
      };
    } catch (err) {
      return { success: false, target: this.id, message: `Write failed: ${(err as Error).message}` };
    }
  }

  async uninstall(): Promise<PushResult> {
    if (!this.isConfigured()) {
      return { success: false, target: this.id, message: "TRAITMIXER_OPENCLAW_CONFIG_PATH not set" };
    }
    try {
      if (!fs.existsSync(this.configPath)) {
        return { success: true, target: this.id, message: `Nothing to uninstall, file not found: ${this.configPath}` };
      }
      const existing = fs.readFileSync(this.configPath, "utf-8");

      const removal = removeManagedOverlay(existing);
      if (removal.changed) {
         fs.writeFileSync(this.configPath, removal.content, "utf-8");
         return { success: true, target: this.id, message: `Uninstalled from ${this.configPath}` };
      }
      return { success: true, target: this.id, message: `No traits found in ${this.configPath}` };
    } catch (err) {
      return { success: false, target: this.id, message: `Uninstall failed: ${(err as Error).message}` };
    }
  }
}
