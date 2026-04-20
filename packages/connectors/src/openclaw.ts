import * as fs from "node:fs";
import * as path from "node:path";
import type { Connector, PushResult, ConnectorConfig, PushOptions } from "./types.js";
import { applyOpenClawCompatibility } from "./overlay-policy.js";
import { injectManagedOverlay, removeManagedOverlay } from "./overlay-block.js";
import { resolveConfiguredPath } from "./path-utils.js";

const OPENCLAW_PERSONALITY_FILE = "SOUL.md";
const OPENCLAW_BOOTSTRAP_FILES = new Set([
  "AGENTS.md",
  "SOUL.md",
  "TOOLS.md",
  "IDENTITY.md",
  "USER.md",
  "HEARTBEAT.md",
  "BOOTSTRAP.md",
  "MEMORY.md",
  "CLAUDE.md",
]);

function resolveOpenClawTargetPath(inputPath: string): string {
  if (!inputPath.trim()) return "";

  const resolved = resolveConfiguredPath(inputPath);
  if (!resolved) return "";

  if (fs.existsSync(resolved)) {
    try {
      if (fs.statSync(resolved).isDirectory()) {
        return path.join(resolved, OPENCLAW_PERSONALITY_FILE);
      }
    } catch {
      return resolved;
    }
  }

  const basename = path.basename(resolved);
  if (OPENCLAW_BOOTSTRAP_FILES.has(basename) || path.extname(basename)) {
    return resolved;
  }

  return path.join(resolved, OPENCLAW_PERSONALITY_FILE);
}

export class OpenClawConnector implements Connector {
  readonly id = "openclaw";
  readonly label = "OpenClaw";
  readonly type = "file" as const;
  readonly description = "Write personality overlay to OpenClaw workspace bootstrap file";
  private targetPath: string;

  constructor(configPath?: string) {
    this.targetPath = resolveOpenClawTargetPath(
      configPath
        ?? process.env.TRAITMIXER_OPENCLAW_WORKSPACE_PATH
        ?? process.env.TRAITMIXER_OPENCLAW_CONFIG_PATH
        ?? ""
    );
  }

  isConfigured(): boolean {
    return this.targetPath.length > 0;
  }

  info(): ConnectorConfig {
    return {
      id: this.id,
      label: this.label,
      type: this.type,
      configured: this.isConfigured(),
      description: this.isConfigured() ? (process.env.HOME ? this.targetPath.replace(process.env.HOME, "~") : this.targetPath) : "Not configured",
      setupHint: "Need workspace path or SOUL.md path",
    };
  }

  async push(overlay: string, options?: PushOptions): Promise<PushResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        target: this.id,
        message:
          "Set TRAITMIXER_OPENCLAW_WORKSPACE_PATH to an OpenClaw workspace directory or bootstrap file path (TRAITMIXER_OPENCLAW_CONFIG_PATH is still supported as a legacy alias)",
      };
    }
    try {
      const { changed, overlay: safeOverlay } = applyOpenClawCompatibility(
        overlay,
        options?.compatibilityMode !== false,
      );
      const dir = path.dirname(this.targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const existing = fs.existsSync(this.targetPath)
        ? fs.readFileSync(this.targetPath, "utf-8")
        : "";
      fs.writeFileSync(this.targetPath, injectManagedOverlay(existing, safeOverlay), "utf-8");
      return {
        success: true,
        target: this.id,
        message: `Written to ${this.targetPath}${changed ? " (OpenClaw compatibility guard applied for constrained models; separate agent identity settings were left alone)" : ""}`,
      };
    } catch (err) {
      return { success: false, target: this.id, message: `Write failed: ${(err as Error).message}` };
    }
  }

  async uninstall(): Promise<PushResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        target: this.id,
        message:
          "Set TRAITMIXER_OPENCLAW_WORKSPACE_PATH to an OpenClaw workspace directory or bootstrap file path (TRAITMIXER_OPENCLAW_CONFIG_PATH is still supported as a legacy alias)",
      };
    }
    try {
      if (!fs.existsSync(this.targetPath)) {
        return { success: true, target: this.id, message: `Nothing to uninstall, file not found: ${this.targetPath}` };
      }
      const existing = fs.readFileSync(this.targetPath, "utf-8");

      const removal = removeManagedOverlay(existing);
      if (removal.changed) {
         fs.writeFileSync(this.targetPath, removal.content, "utf-8");
         return { success: true, target: this.id, message: `Uninstalled from ${this.targetPath}` };
      }
      return { success: true, target: this.id, message: `No traits found in ${this.targetPath}` };
    } catch (err) {
      return { success: false, target: this.id, message: `Uninstall failed: ${(err as Error).message}` };
    }
  }
}
