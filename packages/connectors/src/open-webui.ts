import type { Connector, PushResult, ConnectorConfig } from "./types.js";

export class OpenWebUIConnector implements Connector {
  readonly id = "open-webui";
  readonly label = "Open WebUI";
  readonly type = "http" as const;
  readonly description = "Update model system prompt via Open WebUI REST API";
  private baseUrl: string;
  private apiKey: string;
  private modelId: string;

  constructor(opts?: { baseUrl?: string; apiKey?: string; modelId?: string }) {
    this.baseUrl = (opts?.baseUrl ?? process.env.TRAITMIXER_OPENWEBUI_URL ?? "").replace(/\/+$/, "");
    this.apiKey = opts?.apiKey ?? process.env.TRAITMIXER_OPENWEBUI_API_KEY ?? "";
    this.modelId = opts?.modelId ?? process.env.TRAITMIXER_OPENWEBUI_MODEL_ID ?? "";
  }

  isConfigured(): boolean {
    return this.baseUrl.length > 0 && this.apiKey.length > 0 && this.modelId.length > 0;
  }

  info(): ConnectorConfig {
    return {
      id: this.id,
      label: this.label,
      type: this.type,
      configured: this.isConfigured(),
      description: this.isConfigured() ? `${this.baseUrl}/.../${this.modelId}` : "Not configured",
      setupHint: "Need URL, API key, and model ID",
    };
  }

  async push(overlay: string): Promise<PushResult> {
    if (!this.isConfigured()) {
      return { success: false, target: this.id, message: "Set TRAITMIXER_OPENWEBUI_URL, TRAITMIXER_OPENWEBUI_API_KEY, and TRAITMIXER_OPENWEBUI_MODEL_ID" };
    }
    try {
      // First get current model config
      const getRes = await fetch(`${this.baseUrl}/api/v1/models/${encodeURIComponent(this.modelId)}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!getRes.ok) {
        return { success: false, target: this.id, message: `GET model failed: ${getRes.status} ${getRes.statusText}` };
      }
      const model = (await getRes.json()) as Record<string, unknown>;
      const meta = (model.meta ?? {}) as Record<string, unknown>;

      // Update system prompt
      const patchRes = await fetch(`${this.baseUrl}/api/v1/models/${encodeURIComponent(this.modelId)}/update`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...model,
          meta: { ...meta, system: overlay },
        }),
      });
      if (!patchRes.ok) {
        return { success: false, target: this.id, message: `Update failed: ${patchRes.status} ${patchRes.statusText}` };
      }
      return { success: true, target: this.id, message: `Updated model "${this.modelId}" system prompt` };
    } catch (err) {
      return { success: false, target: this.id, message: `Request failed: ${(err as Error).message}` };
    }
  }

  async uninstall(): Promise<PushResult> {
    if (!this.isConfigured()) {
      return { success: false, target: this.id, message: "Set TRAITMIXER_OPENWEBUI_URL, TRAITMIXER_OPENWEBUI_API_KEY, and TRAITMIXER_OPENWEBUI_MODEL_ID" };
    }
    try {
      const getRes = await fetch(`${this.baseUrl}/api/v1/models/${encodeURIComponent(this.modelId)}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!getRes.ok) {
        return { success: false, target: this.id, message: `GET model failed: ${getRes.status} ${getRes.statusText}` };
      }
      const model = (await getRes.json()) as Record<string, unknown>;
      const meta = (model.meta ?? {}) as Record<string, unknown>;

      const patchRes = await fetch(`${this.baseUrl}/api/v1/models/${encodeURIComponent(this.modelId)}/update`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...model,
          meta: { ...meta, system: "" },
        }),
      });
      if (!patchRes.ok) {
        return { success: false, target: this.id, message: `Uninstall failed: ${patchRes.status} ${patchRes.statusText}` };
      }
      return { success: true, target: this.id, message: `Uninstalled from model "${this.modelId}"` };
    } catch (err) {
      return { success: false, target: this.id, message: `Request failed: ${(err as Error).message}` };
    }
  }
}
