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

export class AgentZeroConnector implements Connector {
  readonly id = "agent-zero";
  readonly label = "Agent Zero";
  readonly type = "file" as const;
  readonly description = "Write personality overlay to Agent Zero system prompt file";
  private promptPath: string;

  constructor(promptPath?: string) {
    this.promptPath = resolveConfiguredPath(
      promptPath ?? process.env.TRAITMIXER_AGENTZERO_PROMPT_PATH ?? ""
    );
  }

  isConfigured(): boolean {
    return this.promptPath.length > 0;
  }

  info(): ConnectorConfig {
    return {
      id: this.id,
      label: this.label,
      type: this.type,
      configured: this.isConfigured(),
      description: this.isConfigured() ? (process.env.HOME ? this.promptPath.replace(process.env.HOME, "~") : this.promptPath) : "Not configured",
      setupHint: "Need agent.system.md path",
    };
  }

  async push(overlay: string): Promise<PushResult> {
    if (!this.isConfigured()) {
      return { success: false, target: this.id, message: "Set TRAITMIXER_AGENTZERO_PROMPT_PATH (e.g. ~/agent-zero/prompts/default/agent.system.md)" };
    }
    try {
      const dir = path.dirname(this.promptPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const existing = fs.existsSync(this.promptPath)
        ? fs.readFileSync(this.promptPath, "utf-8")
        : "";
      fs.writeFileSync(this.promptPath, injectOverlay(existing, overlay), "utf-8");
      return { success: true, target: this.id, message: `Written to ${this.promptPath}` };
    } catch (err) {
      return { success: false, target: this.id, message: `Write failed: ${(err as Error).message}` };
    }
  }

  async uninstall(): Promise<PushResult> {
    if (!this.isConfigured()) {
      return { success: false, target: this.id, message: "Set TRAITMIXER_AGENTZERO_PROMPT_PATH (e.g. ~/agent-zero/prompts/default/agent.system.md)" };
    }
    try {
      if (!fs.existsSync(this.promptPath)) {
        return { success: true, target: this.id, message: `Nothing to uninstall, file not found: ${this.promptPath}` };
      }
      const existing = fs.readFileSync(this.promptPath, "utf-8");
      
      const startIdx = existing.indexOf("<!-- traitmixer:start -->");
      const endIdx = existing.indexOf("<!-- traitmixer:end -->");
      if (startIdx !== -1 && endIdx !== -1) {
         const cleaned = existing.slice(0, startIdx).trimEnd() + "\n\n" + existing.slice(endIdx + "<!-- traitmixer:end -->".length).trimStart();
         fs.writeFileSync(this.promptPath, cleaned.trim() + "\n", "utf-8");
         return { success: true, target: this.id, message: `Uninstalled from ${this.promptPath}` };
      }
      return { success: true, target: this.id, message: `No traits found in ${this.promptPath}` };
    } catch (err) {
      return { success: false, target: this.id, message: `Uninstall failed: ${(err as Error).message}` };
    }
  }
}
