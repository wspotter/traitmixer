export type TargetStatus = {
  configured: boolean;
  description: string;
  id: string;
  label: string;
  setupHint?: string;
  type: "file" | "http";
};

export type TargetPushResult = {
  message: string;
  success: boolean;
  target: string;
};

export const FALLBACK_TARGETS: TargetStatus[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    type: "file",
    configured: true,
    description: "~/project/.claude/CLAUDE.md",
    setupHint: "Need CLAUDE.md path",
  },
  {
    id: "open-webui",
    label: "Open WebUI",
    type: "http",
    configured: true,
    description: "http://localhost:8080/api/v1/models/my-agent",
    setupHint: "Need URL, API key, and model ID",
  },
  {
    id: "agent-zero",
    label: "Agent Zero",
    type: "file",
    configured: true,
    description: "~/agent-zero/prompts/default/agent.system.md",
    setupHint: "Need agent.system.md path",
  },
  {
    id: "anythingllm",
    label: "AnythingLLM",
    type: "http",
    configured: false,
    description: "Not configured",
    setupHint: "Need URL, API key, and workspace slug",
  },
  {
    id: "hermes",
    label: "Hermes Agent",
    type: "file",
    configured: false,
    description: "Not configured",
    setupHint: "Need SOUL.md path",
  },
  {
    id: "openclaw",
    label: "OpenClaw",
    type: "file",
    configured: false,
    description: "~/.openclaw/workspace or ~/.openclaw/workspace/SOUL.md",
    setupHint: "Need workspace path or SOUL.md path",
  },
];
