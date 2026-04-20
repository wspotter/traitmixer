import * as fs from "node:fs";
import * as path from "node:path";
import type { Connector, PushResult, ConnectorConfig, PushOptions } from "./types.js";
import { injectManagedOverlay, removeManagedOverlay } from "./overlay-block.js";
import { applyConstrainedModelCompatibility } from "./overlay-policy.js";
import { resolveConfiguredPath } from "./path-utils.js";

export class ClaudeCodeConnector implements Connector {
  readonly id = "claude-code";
  readonly label = "Claude Code";
  readonly type = "file" as const;
  readonly description = "Write personality overlay to Claude Code project memory";
  private memoryPath: string;

  constructor(memoryPath?: string) {
    this.memoryPath = resolveConfiguredPath(
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
      description: this.isConfigured() ? (process.env.HOME ? this.memoryPath.replace(process.env.HOME, "~") : this.memoryPath) : "Not configured",
      setupHint: "Need CLAUDE.md path",
    };
  }

  async push(overlay: string, options?: PushOptions): Promise<PushResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        target: this.id,
        message:
          "Set TRAITMIXER_CLAUDECODE_PATH (for example: ~/my-project/CLAUDE.md or ~/my-project/.claude/CLAUDE.md)",
      };
    }

    try {
      const { changed, overlay: safeOverlay } = applyConstrainedModelCompatibility(
        overlay,
        options?.compatibilityMode !== false,
      );
      const dir = path.dirname(this.memoryPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const existing = fs.existsSync(this.memoryPath)
        ? fs.readFileSync(this.memoryPath, "utf-8")
        : "";
      fs.writeFileSync(this.memoryPath, injectManagedOverlay(existing, safeOverlay), "utf-8");
      return {
        success: true,
        target: this.id,
        message: `Written to ${this.memoryPath}${changed ? " (safety wording adjusted for constrained models)" : ""}`,
      };
    } catch (err) {
      return {
        success: false,
        target: this.id,
        message: `Write failed: ${(err as Error).message}`,
      };
    }
  }

  async uninstall(): Promise<PushResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        target: this.id,
        message:
          "Set TRAITMIXER_CLAUDECODE_PATH (for example: ~/my-project/CLAUDE.md or ~/my-project/.claude/CLAUDE.md)",
      };
    }
    try {
      if (!fs.existsSync(this.memoryPath)) {
        return { success: true, target: this.id, message: `Nothing to uninstall, file not found: ${this.memoryPath}` };
      }
      const existing = fs.readFileSync(this.memoryPath, "utf-8");

      const removal = removeManagedOverlay(existing);
      if (removal.changed) {
         fs.writeFileSync(this.memoryPath, removal.content, "utf-8");
         return { success: true, target: this.id, message: `Uninstalled from ${this.memoryPath}` };
      }
      return { success: true, target: this.id, message: `No traits found in ${this.memoryPath}` };
    } catch (err) {
      return { success: false, target: this.id, message: `Uninstall failed: ${(err as Error).message}` };
    }
  }
}
