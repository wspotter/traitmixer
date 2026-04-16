import * as fs from "node:fs";
import * as path from "node:path";
import type { Connector, PushResult, ConnectorConfig } from "./types.js";

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

function resolveHome(filePath: string): string {
  if (filePath.startsWith("~/")) {
    return path.join(process.env.HOME ?? "/root", filePath.slice(2));
  }
  return filePath;
}

export class ClaudeCodeConnector implements Connector {
  readonly id = "claude-code";
  readonly label = "Claude Code";
  readonly type = "file" as const;
  readonly description = "Write personality overlay to Claude Code project memory";
  private memoryPath: string;

  constructor(memoryPath?: string) {
    this.memoryPath = resolveHome(
      memoryPath ?? process.env.TRAITMIXER_CLAUDECODE_PATH ?? ""
    );
  }

  isConfigured(): boolean {
    return this.memoryPath.length > 0;
  }

  info(): ConnectorConfig {
    return {
      id: this.id,
      label: this.label,
      type: this.type,
      configured: this.isConfigured(),
      description: this.description,
      setupHint: "Need CLAUDE.md path",
    };
  }

  async push(overlay: string): Promise<PushResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        target: this.id,
        message:
          "Set TRAITMIXER_CLAUDECODE_PATH (for example: ~/my-project/CLAUDE.md or ~/my-project/.claude/CLAUDE.md)",
      };
    }

    try {
      const dir = path.dirname(this.memoryPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const existing = fs.existsSync(this.memoryPath)
        ? fs.readFileSync(this.memoryPath, "utf-8")
        : "";
      fs.writeFileSync(this.memoryPath, injectOverlay(existing, overlay), "utf-8");
      return { success: true, target: this.id, message: `Written to ${this.memoryPath}` };
    } catch (err) {
      return {
        success: false,
        target: this.id,
        message: `Write failed: ${(err as Error).message}`,
      };
    }
  }
}
