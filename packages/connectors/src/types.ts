export type PushResult = {
  success: boolean;
  target: string;
  message: string;
  detail?: string;
};

export type PushOptions = {
  compatibilityMode?: boolean;
};

export type ConnectorConfig = {
  id: string;
  label: string;
  type: "http" | "file";
  configured: boolean;
  description: string;
  setupHint?: string;
};

export interface Connector {
  readonly id: string;
  readonly label: string;
  readonly type: "http" | "file";
  readonly description: string;
  isConfigured(): boolean;
  info(): ConnectorConfig;
  push(overlay: string, options?: PushOptions): Promise<PushResult>;
  uninstall(): Promise<PushResult>;
}
