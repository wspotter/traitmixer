export const AGENT_PERSONALITY_ALL_CHANNEL = "*";

type AgentConfigEntry = {
  id?: string;
  personality?: unknown;
  [key: string]: unknown;
};

type ConfigSnapshot = {
  agents?: {
    defaults?: {
      personality?: unknown;
      [key: string]: unknown;
    };
    list?: AgentConfigEntry[];
  };
};

export function resolveAgentConfig(config: Record<string, unknown> | null, agentId: string) {
  const cfg = config as ConfigSnapshot | null;
  const list = cfg?.agents?.list ?? [];
  const entry = list.find((agent) => agent?.id === agentId);
  return {
    entry,
    defaults: cfg?.agents?.defaults,
  };
}
