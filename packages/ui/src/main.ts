import { render } from "lit";
import { renderAgentPersonality } from "./personality-panel.js";
import type { PersonalityPreviewMode, PersonalityTarget } from "./personality-panel.js";

const DEMO_CONFIG = {
  agents: {
    defaults: {
      personality: {
        style: {
          tone: "warm" as const,
          directness: "balanced" as const,
          verbosity: "balanced" as const,
          humor: "light" as const,
          formality: "casual" as const,
        },
        authority: {
          stance: "advisor" as const,
          confidence: "assertive" as const,
          pushback: "medium" as const,
        },
        guardrails: {
          truthfulness: "strict" as const,
          uncertainty: "explicit" as const,
          corrections: "gentle" as const,
        },
      },
    },
    list: [
      {
        id: "demo",
        personality: {
          channels: {
            signal: {
              tone: "playful" as const,
              verbosity: "brief" as const,
              responseStyle: "plain" as const,
            },
            dashboard: {
              tone: "neutral" as const,
              directness: "direct" as const,
              verbosity: "brief" as const,
              responseStyle: "structured" as const,
            },
          },
        },
      },
    ],
  },
};

let state = {
  target: "agent" as PersonalityTarget,
  channel: "*",
  mode: "default" as string,
  profileId: "",
  configDirty: false,
};

function rerender() {
  const app = document.getElementById("app");
  if (!app) return;

  render(
    renderAgentPersonality({
      agentId: "demo",
      configForm: DEMO_CONFIG,
      configLoading: false,
      configSaving: false,
      configApplying: false,
      configDirty: state.configDirty,
      channelSnapshot: {
        ts: Date.now(),
        channelOrder: ["signal", "dashboard", "telegram", "discord"],
        channelLabels: {
          signal: "Signal",
          dashboard: "Dashboard",
          telegram: "Telegram",
          discord: "Discord",
        },
        channels: {},
        channelAccounts: {},
        channelDefaultAccountId: {},
      },
      target: state.target,
      channel: state.channel,
      mode: state.mode,
      profileId: state.profileId,
      profiles: [],
      onTargetChange: (target) => {
        state = { ...state, target };
        rerender();
      },
      onChannelChange: (channel) => {
        state = { ...state, channel };
        rerender();
      },
      onModeChange: (mode: PersonalityPreviewMode) => {
        state = { ...state, mode };
        rerender();
      },
      onProfileChange: (profileId) => {
        state = { ...state, profileId };
        rerender();
      },
      onProfileSave: () => {},
      onProfileApply: () => {},
      onProfileRename: () => {},
      onProfileDelete: () => {},
      onFieldChange: () => {
        state = { ...state, configDirty: true };
        rerender();
      },
      onConfigReload: () => {
        state = { ...state, configDirty: false };
        rerender();
      },
      onConfigSave: () => {
        state = { ...state, configDirty: false };
        rerender();
      },
      onConfigApply: () => {},
    }),
    app,
  );
}

rerender();
