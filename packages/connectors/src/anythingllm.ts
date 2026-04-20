import type { Connector, PushResult, ConnectorConfig, PushOptions } from "./types.js";
import { applyConstrainedModelCompatibility } from "./overlay-policy.js";

export class AnythingLLMConnector implements Connector {
  readonly id = "anythingllm";
  readonly label = "AnythingLLM";
  readonly type = "http" as const;
  readonly description = "Update workspace system prompt via AnythingLLM REST API";
  private baseUrl: string;
  private apiKey: string;
  private workspaceSlug: string;

  constructor(opts?: { baseUrl?: string; apiKey?: string; workspaceSlug?: string }) {
    this.baseUrl = (opts?.baseUrl ?? process.env.TRAITMIXER_ANYTHINGLLM_URL ?? "").replace(/\/+$/, "");
    this.apiKey = opts?.apiKey ?? process.env.TRAITMIXER_ANYTHINGLLM_API_KEY ?? "";
    this.workspaceSlug = opts?.workspaceSlug ?? process.env.TRAITMIXER_ANYTHINGLLM_WORKSPACE ?? "";
  }

  isConfigured(): boolean {
    return this.baseUrl.length > 0 && this.apiKey.length > 0 && this.workspaceSlug.length > 0;
  }

  info(): ConnectorConfig {
    return {
      id: this.id,
      label: this.label,
      type: this.type,
      configured: this.isConfigured(),
      description: this.isConfigured() ? `${this.baseUrl}/.../${this.workspaceSlug}` : "Not configured",
      setupHint: "Need URL, API key, and workspace slug",
    };
  }

  async push(overlay: string, options?: PushOptions): Promise<PushResult> {
    if (!this.isConfigured()) {
      return { success: false, target: this.id, message: "Set TRAITMIXER_ANYTHINGLLM_URL, TRAITMIXER_ANYTHINGLLM_API_KEY, and TRAITMIXER_ANYTHINGLLM_WORKSPACE" };
    }
    try {
      const { changed, overlay: safeOverlay } = applyConstrainedModelCompatibility(
        overlay,
        options?.compatibilityMode !== false,
      );
      const res = await fetch(
        `${this.baseUrl}/api/v1/workspace/${encodeURIComponent(this.workspaceSlug)}/update`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ openAiPrompt: safeOverlay }),
        },
      );
      if (!res.ok) {
        return { success: false, target: this.id, message: `Update failed: ${res.status} ${res.statusText}` };
      }
      return {
        success: true,
        target: this.id,
        message: `Updated workspace "${this.workspaceSlug}" system prompt${changed ? " (safety wording adjusted for constrained models)" : ""}`,
      };
    } catch (err) {
      return { success: false, target: this.id, message: `Request failed: ${(err as Error).message}` };
    }
  }

  async uninstall(): Promise<PushResult> {
    if (!this.isConfigured()) {
      return { success: false, target: this.id, message: "Set TRAITMIXER_ANYTHINGLLM_URL, TRAITMIXER_ANYTHINGLLM_API_KEY, and TRAITMIXER_ANYTHINGLLM_WORKSPACE" };
    }
    try {
      const res = await fetch(
        `${this.baseUrl}/api/v1/workspace/${encodeURIComponent(this.workspaceSlug)}/update`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ openAiPrompt: "" }),
        },
      );
      if (!res.ok) {
        return { success: false, target: this.id, message: `Uninstall failed: ${res.status} ${res.statusText}` };
      }
      return { success: true, target: this.id, message: `Uninstalled from workspace "${this.workspaceSlug}"` };
    } catch (err) {
      return { success: false, target: this.id, message: `Request failed: ${(err as Error).message}` };
    }
  }
}
