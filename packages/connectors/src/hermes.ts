import * as fs from "node:fs";
import * as path from "node:path";
import type { Connector, PushResult, ConnectorConfig } from "./types.js";
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
      const dir = path.dirname(this.soulPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const existing = fs.existsSync(this.soulPath)
        ? fs.readFileSync(this.soulPath, "utf-8")
        : "";
      fs.writeFileSync(this.soulPath, injectOverlay(existing, overlay), "utf-8");
      return { success: true, target: this.id, message: `Written to ${this.soulPath}` };
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
      
      const startIdx = existing.indexOf("<!-- traitmixer:start -->");
      const endIdx = existing.indexOf("<!-- traitmixer:end -->");
      if (startIdx !== -1 && endIdx !== -1) {
         const cleaned = existing.slice(0, startIdx).trimEnd() + "\n\n" + existing.slice(endIdx + "<!-- traitmixer:end -->".length).trimStart();
         fs.writeFileSync(this.soulPath, cleaned.trim() + "\n", "utf-8");
         return { success: true, target: this.id, message: `Uninstalled from ${this.soulPath}` };
      }
      return { success: true, target: this.id, message: `No traits found in ${this.soulPath}` };
    } catch (err) {
      return { success: false, target: this.id, message: `Uninstall failed: ${(err as Error).message}` };
    }
  }
}
