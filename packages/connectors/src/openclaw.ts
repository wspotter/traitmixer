import * as fs from "node:fs";
import type { Connector, PushResult, ConnectorConfig } from "./types.js";
import { sanitizeOverlayForConstrainedModels } from "./overlay-policy.js";
import { resolveConfiguredPath } from "./path-utils.js";

const MARKER_START = "<!-- traitmixer:start -->";
const MARKER_END = "<!-- traitmixer:end -->";

function injectOverlay(existing: string, overlay: string): string {
  const block = `${MARKER_START}\n${overlay}\n${MARKER_END}`;
  const startIdx = existing.indexOf(MARKER_START);
  const endIdx = existing.indexOf(MARKER_END);
  if (startIdx !== -1 && endIdx !== -1) {
    return existing.slice(0, startIdx) + block + existing.slice(endIdx + MARKER_END.length);
  }
  return existing.trimEnd() + "\n\n" + block + "\n";
}

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
      fs.writeFileSync(this.configPath, injectOverlay(existing, safeOverlay), "utf-8");
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
      
      const startIdx = existing.indexOf("<!-- traitmixer:start -->");
      const endIdx = existing.indexOf("<!-- traitmixer:end -->");
      if (startIdx !== -1 && endIdx !== -1) {
         const cleaned = existing.slice(0, startIdx).trimEnd() + "\n\n" + existing.slice(endIdx + "<!-- traitmixer:end -->".length).trimStart();
         fs.writeFileSync(this.configPath, cleaned.trim() + "\n", "utf-8");
         return { success: true, target: this.id, message: `Uninstalled from ${this.configPath}` };
      }
      return { success: true, target: this.id, message: `No traits found in ${this.configPath}` };
    } catch (err) {
      return { success: false, target: this.id, message: `Uninstall failed: ${(err as Error).message}` };
    }
  }
}
