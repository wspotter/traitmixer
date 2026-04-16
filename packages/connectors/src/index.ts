export type { Connector, ConnectorConfig, PushResult } from "./types.js";
export { OpenClawConnector } from "./openclaw.js";
export { OpenWebUIConnector } from "./open-webui.js";
export { AnythingLLMConnector } from "./anythingllm.js";
export { HermesConnector } from "./hermes.js";
export { AgentZeroConnector } from "./agent-zero.js";
export { ClaudeCodeConnector } from "./claude-code.js";

import type { Connector } from "./types.js";
import { OpenClawConnector } from "./openclaw.js";
import { OpenWebUIConnector } from "./open-webui.js";
import { AnythingLLMConnector } from "./anythingllm.js";
import { HermesConnector } from "./hermes.js";
import { AgentZeroConnector } from "./agent-zero.js";
import { ClaudeCodeConnector } from "./claude-code.js";

export function createAllConnectors(): Connector[] {
  return [
    new OpenClawConnector(),
    new OpenWebUIConnector(),
    new AnythingLLMConnector(),
    new HermesConnector(),
    new AgentZeroConnector(),
    new ClaudeCodeConnector(),
  ];
}
