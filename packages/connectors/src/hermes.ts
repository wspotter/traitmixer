import * as fs from "node:fs";
import * as path from "node:path";
import type { Connector, PushResult, ConnectorConfig } from "./types.js";
import { injectManagedOverlay, removeManagedOverlay } from "./overlay-block.js";
import { sanitizeOverlayForConstrainedModels } from "./overlay-policy.js";
import { resolveConfiguredPath } from "./path-utils.js";

export class HermesConnector implements Connector {
  readonly id = "hermes";
  readonly label = "Hermes Agent";
  readonly type = "file" as const;
  readonly description = "Write personality overlay to Hermes SOUL.md";
  private soulPath: string;

  constructor(soulPath?: string) {
    this.soulPath = resolveConfiguredPath(
      soulPath ?? process.env.TRAITMIXER_HERMES_SOUL_PATH ?? "~/.hermes/SOUL.md"
    );
  }

  isConfigured(): boolean {
    return this.soulPath.length > 0;
  }

  info(): ConnectorConfig {
    return {
      id: this.id,
      label: this.label,
      type: this.type,
      configured: this.isConfigured(),
      description: this.isConfigured() ? (process.env.HOME ? this.soulPath.replace(process.env.HOME, "~") : this.soulPath) : "Not configured",
      setupHint: "Need SOUL.md path",
    };
  }

  async push(overlay: string): Promise<PushResult> {
    if (!this.isConfigured()) {
      return { success: false, target: this.id, message: "TRAITMIXER_HERMES_SOUL_PATH not set" };
    }
    try {
      const { changed, overlay: safeOverlay } = sanitizeOverlayForConstrainedModels(overlay);
      const dir = path.dirname(this.soulPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const existing = fs.existsSync(this.soulPath)
        ? fs.readFileSync(this.soulPath, "utf-8")
        : "";
      fs.writeFileSync(this.soulPath, injectManagedOverlay(existing, safeOverlay), "utf-8");
      return {
        success: true,
        target: this.id,
        message: `Written to ${this.soulPath}${changed ? " (safety wording adjusted for constrained models)" : ""}`,
      };
    } catch (err) {
      return { success: false, target: this.id, message: `Write failed: ${(err as Error).message}` };
    }
  }

  async uninstall(): Promise<PushResult> {
    if (!this.isConfigured()) {
      return { success: false, target: this.id, message: "TRAITMIXER_HERMES_SOUL_PATH not set" };
    }
    try {
      if (!fs.existsSync(this.soulPath)) {
        return { success: true, target: this.id, message: `Nothing to uninstall, file not found: ${this.soulPath}` };
      }
      const existing = fs.readFileSync(this.soulPath, "utf-8");

      const removal = removeManagedOverlay(existing);
      if (removal.changed) {
         fs.writeFileSync(this.soulPath, removal.content, "utf-8");
         return { success: true, target: this.id, message: `Uninstalled from ${this.soulPath}` };
      }
      return { success: true, target: this.id, message: `No traits found in ${this.soulPath}` };
    } catch (err) {
      return { success: false, target: this.id, message: `Uninstall failed: ${(err as Error).message}` };
    }
  }
}
