import * as fs from "node:fs";
import * as path from "node:path";
import type { Connector, PushResult, ConnectorConfig, PushOptions } from "./types.js";
import { injectManagedOverlay, removeManagedOverlay } from "./overlay-block.js";
import { applyConstrainedModelCompatibility } from "./overlay-policy.js";
import { resolveConfiguredPath } from "./path-utils.js";

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

  async push(overlay: string, options?: PushOptions): Promise<PushResult> {
    if (!this.isConfigured()) {
      return { success: false, target: this.id, message: "Set TRAITMIXER_AGENTZERO_PROMPT_PATH (e.g. ~/agent-zero/prompts/default/agent.system.md)" };
    }
    try {
      const { changed, overlay: safeOverlay } = applyConstrainedModelCompatibility(
        overlay,
        options?.compatibilityMode !== false,
      );
      const dir = path.dirname(this.promptPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const existing = fs.existsSync(this.promptPath)
        ? fs.readFileSync(this.promptPath, "utf-8")
        : "";
      fs.writeFileSync(this.promptPath, injectManagedOverlay(existing, safeOverlay), "utf-8");
      return {
        success: true,
        target: this.id,
        message: `Written to ${this.promptPath}${changed ? " (safety wording adjusted for constrained models)" : ""}`,
      };
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

      const removal = removeManagedOverlay(existing);
      if (removal.changed) {
         fs.writeFileSync(this.promptPath, removal.content, "utf-8");
         return { success: true, target: this.id, message: `Uninstalled from ${this.promptPath}` };
      }
      return { success: true, target: this.id, message: `No traits found in ${this.promptPath}` };
    } catch (err) {
      return { success: false, target: this.id, message: `Uninstall failed: ${(err as Error).message}` };
    }
  }
}
