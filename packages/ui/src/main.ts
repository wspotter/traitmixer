import { render } from "lit";
import { renderAgentPersonality } from "./personality-panel.js";
import type { PersonalityPreviewMode, PersonalityTarget } from "./personality-panel.js";

const DEMO_CONFIG = {
  agents: {
    defaults: {
      personality: {
        traits: {
          humor: 50,
          flirting: 0,
          sarcasm: 10,
          optimism: 60,
          directness: 80,
          verbosity: 40,
          confidence: 70
        }
      },
    },
    list: [
      {
        id: "demo",
        personality: {
          channels: {
            signal: {
              humor: 80,
              verbosity: 20
            },
            dashboard: {
              humor: 0,
              directness: 100,
              verbosity: 10
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
