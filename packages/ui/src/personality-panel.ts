import { html } from "lit";
import { type TraitMixerConfig, type PersonalityTraits } from "traitmixer-core";

export type PersonalityTarget = "agent" | "defaults";

type TargetStatus = {
  configured: boolean;
  description: string;
  id: string;
  label: string;
  setupHint?: string;
  type: "file" | "http";
};

type TargetPushResult = {
  message: string;
  success: boolean;
  target: string;
};

type PanelParams = {
  agentId: string;
  availableTargets: TargetStatus[];
  channel: string;
  configDirty: boolean;
  configForm: TraitMixerConfig | null;
  onChannelChange: (channel: string) => void;
  onFieldChange: (args: { path: string[]; target: PersonalityTarget; value: unknown }) => void;
  onPush: () => void;
  onRefreshTargets: () => void;
  onReset: () => void;
  onTargetChange: (target: PersonalityTarget) => void;
  onTargetMenuToggle: () => void;
  onTargetSelectToggle: (targetId: string) => void;
  pushResults: TargetPushResult[];
  pushing: boolean;
  selectedTargetIds: string[];
  target: PersonalityTarget;
  targetMenuOpen: boolean;
  targetsLoading: boolean;
};

const CHANNELS = [
  { key: "*", label: "Base Mix" },
  { key: "launch", label: "Launch" },
  { key: "signal", label: "Signal" },
  { key: "dashboard", label: "Dashboard" },
  { key: "support", label: "Support" },
];

const TRAITS = [
  { key: "humor", label: "Humor", low: "Dry", high: "Playful", hue: "340" },
  { key: "flirting", label: "Charm", low: "Strict", high: "Flirty", hue: "312" },
  { key: "sarcasm", label: "Snark", low: "Earnest", high: "Sharp", hue: "171" },
  { key: "optimism", label: "Optimism", low: "Sober", high: "Sunny", hue: "45" },
  { key: "directness", label: "Direct", low: "Soft", high: "Blunt", hue: "16" },
  { key: "verbosity", label: "Verbose", low: "Brief", high: "Chatty", hue: "193" },
  { key: "confidence", label: "Confidence", low: "Measured", high: "Bold", hue: "146" },
  { key: "empathy", label: "Empathy", low: "Cool", high: "Warm", hue: "334" },
  { key: "complexity", label: "Jargon", low: "Plain", high: "Dense", hue: "258" },
  { key: "creativity", label: "Creative", low: "Literal", high: "Poetic", hue: "24" },
  { key: "caution", label: "Safety", low: "Risky", high: "Safe", hue: "220" },
  { key: "formality", label: "Formal", low: "Loose", high: "Stiff", hue: "0" },
  { key: "rating", label: "Rating", low: "G", high: "Adult", hue: "5" },
] as const;

const PRESETS: Array<{ name: string; traits: Partial<PersonalityTraits> }> = [
  {
    name: "Founder Mode",
    traits: { confidence: 92, directness: 86, optimism: 80, verbosity: 26, humor: 54 },
  },
  {
    name: "Support Lead",
    traits: { empathy: 92, caution: 74, directness: 56, humor: 20, rating: 2 },
  },
  {
    name: "Deadpan Analyst",
    traits: { humor: 12, directness: 88, verbosity: 18, complexity: 70, sarcasm: 18 },
  },
  {
    name: "Warm Operator",
    traits: { empathy: 86, confidence: 68, formality: 42, directness: 64, optimism: 72 },
  },
  {
    name: "Launch Goblin",
    traits: { humor: 72, creativity: 76, confidence: 90, optimism: 88, sarcasm: 24 },
  },
];

function getPersonalityRoot(config: TraitMixerConfig, agentId: string, target: PersonalityTarget) {
  if (target === "defaults") {
    return config.agents?.defaults?.personality;
  }
  return config.agents?.list?.find((agent) => agent.id === agentId)?.personality;
}

export function renderAgentPersonality(params: PanelParams) {
  const personality = params.configForm
    ? getPersonalityRoot(params.configForm, params.agentId, params.target)
    : undefined;
  const baseTraits = personality?.traits ?? {};
  const channelTraits = params.channel === "*" ? {} : personality?.channels?.[params.channel] ?? {};
  const configuredTargets = params.availableTargets.filter((target) => target.configured);
  const selectedTargets = configuredTargets.filter((target) =>
    params.selectedTargetIds.includes(target.id),
  );
  const orderedTargets = [...params.availableTargets].sort((left, right) => {
    const leftSelected = params.selectedTargetIds.includes(left.id) ? 1 : 0;
    const rightSelected = params.selectedTargetIds.includes(right.id) ? 1 : 0;
    if (rightSelected !== leftSelected) {
      return rightSelected - leftSelected;
    }
    if (right.configured !== left.configured) {
      return Number(right.configured) - Number(left.configured);
    }
    return left.label.localeCompare(right.label);
  });
  const selectedTargetCount = selectedTargets.length;
  const pushLabel = params.pushing
    ? "Pushing..."
    : selectedTargetCount === 0
      ? "Select targets"
      : `Push to ${selectedTargetCount === 1 ? "1 install" : `${selectedTargetCount} installs`}`;

  const getValue = (key: keyof PersonalityTraits) => {
    const channelValue = params.channel === "*" ? undefined : channelTraits[key];
    const value = channelValue ?? baseTraits[key] ?? 50;
    return typeof value === "number" ? value : 50;
  };

  const setValue = (key: keyof PersonalityTraits, value: number) => {
    const path = params.channel === "*" ? ["traits", key] : ["channels", params.channel, key];
    params.onFieldChange({ path, target: params.target, value });
  };

  const resetTarget = () => {
    for (const trait of TRAITS) {
      setValue(trait.key, 50);
    }
  };

  const applyPreset = (preset: Partial<PersonalityTraits>) => {
    resetTarget();
    for (const [key, value] of Object.entries(preset)) {
      setValue(key as keyof PersonalityTraits, value);
    }
  };

  const resolveTargetLabel = (targetId: string) =>
    params.availableTargets.find((target) => target.id === targetId)?.label ??
    (targetId === "traitmixer" ? "TraitMixer" : targetId);

  return html`
    <style>
      .console {
        display: grid;
        gap: 18px;
        padding: 24px;
        border-radius: 22px;
        background:
          linear-gradient(180deg, rgba(23, 25, 31, 0.94), rgba(13, 15, 20, 0.98));
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #efe7d9;
      }

      .console-header {
        position: relative;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .console-title {
        display: grid;
        gap: 5px;
      }

      .console-title strong {
        font-family: "Space Grotesk", sans-serif;
        font-size: 1.3rem;
        letter-spacing: -0.04em;
        text-transform: uppercase;
      }

      .console-title span {
        font-size: 0.8rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(239, 231, 217, 0.6);
      }

      .console-status {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 0.78rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: ${params.configDirty ? "#ffb27c" : "rgba(239, 231, 217, 0.62)"};
      }

      .console-status::before {
        content: "";
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: ${params.configDirty ? "#ff8a3d" : "#56d6ff"};
        box-shadow: 0 0 18px ${params.configDirty ? "rgba(255, 138, 61, 0.45)" : "rgba(86, 214, 255, 0.35)"};
      }

      .console-head-main {
        display: grid;
        gap: 10px;
      }

      .console-actions {
        position: relative;
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .action-button,
      .segment button,
      .channel-strip button,
      .preset-row button,
      .utility-button {
        appearance: none;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.035);
        color: rgba(239, 231, 217, 0.8);
        padding: 10px 14px;
        font: inherit;
        font-size: 0.82rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        cursor: pointer;
        transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
      }

      .action-button:hover,
      .segment button:hover,
      .channel-strip button:hover,
      .preset-row button:hover,
      .utility-button:hover {
        transform: translateY(-1px);
        border-color: rgba(255, 255, 255, 0.18);
      }

      .action-button[targeted],
      .segment button.active,
      .channel-strip button.active {
        background: rgba(255, 138, 61, 0.12);
        border-color: rgba(255, 178, 124, 0.48);
        color: #fff3e7;
      }

      .push-button {
        background: linear-gradient(135deg, rgba(255, 138, 61, 0.98), rgba(255, 79, 108, 0.92));
        border-color: transparent;
        color: #140f14;
        box-shadow: 0 12px 28px rgba(255, 96, 104, 0.24);
      }

      .push-button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        box-shadow: none;
      }

      .target-count {
        color: rgba(239, 231, 217, 0.56);
      }

      .target-popover {
        position: absolute;
        top: calc(100% + 12px);
        right: 0;
        z-index: 5;
        width: min(360px, 82vw);
        display: grid;
        gap: 14px;
        padding: 18px;
        border-radius: 18px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background:
          linear-gradient(180deg, rgba(22, 24, 30, 0.98), rgba(12, 14, 20, 0.98));
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
      }

      .target-popover-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .target-popover-header strong {
        font-size: 0.82rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #ffddc1;
      }

      .target-popover-header span {
        font-size: 0.76rem;
        color: rgba(239, 231, 217, 0.6);
      }

      .target-refresh {
        appearance: none;
        border: 0;
        background: transparent;
        color: rgba(239, 231, 217, 0.64);
        font: inherit;
        font-size: 0.76rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        cursor: pointer;
      }

      .target-list {
        display: grid;
        gap: 8px;
      }

      .target-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.025);
      }

      button.target-item {
        width: 100%;
        text-align: left;
        cursor: pointer;
        transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
      }

      button.target-item:hover {
        transform: translateY(-1px);
        border-color: rgba(255, 255, 255, 0.18);
      }

      .target-item.selected {
        border-color: rgba(255, 178, 124, 0.34);
        background: rgba(255, 138, 61, 0.08);
      }

      .target-item.disabled {
        opacity: 0.58;
      }

      .target-item-main {
        display: grid;
        gap: 4px;
      }

      .target-item-label {
        font-size: 0.84rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #efe7d9;
      }

      .target-item-copy {
        color: rgba(239, 231, 217, 0.62);
        font-size: 0.74rem;
        line-height: 1.45;
      }

      .target-item-state {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 0.72rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(239, 231, 217, 0.72);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .target-item.selected .target-item-state {
        color: #ffddc1;
        border-color: rgba(255, 178, 124, 0.3);
      }

      .target-summary {
        font-size: 0.74rem;
        line-height: 1.5;
        color: rgba(239, 231, 217, 0.58);
      }

      .control-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        flex-wrap: wrap;
      }

      .segment,
      .channel-strip {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .board {
        padding: 22px 18px 18px;
        border-radius: 18px;
        background:
          linear-gradient(180deg, rgba(6, 8, 12, 0.94), rgba(11, 13, 17, 0.98));
        border: 1px solid rgba(255, 255, 255, 0.06);
        overflow-x: auto;
      }

      .fader-grid {
        display: grid;
        grid-template-columns: repeat(13, minmax(56px, 1fr));
        gap: 10px;
        min-width: 820px;
      }

      .fader {
        display: grid;
        justify-items: center;
        gap: 10px;
      }

      .fader-header {
        display: grid;
        gap: 4px;
        justify-items: center;
      }

      .fader-value {
        font-family: "IBM Plex Mono", monospace;
        font-size: 0.76rem;
        color: rgba(239, 231, 217, 0.6);
      }

      .fader-label {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: rgba(239, 231, 217, 0.82);
      }

      .fader-slot {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 248px;
        padding: 12px 0;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.45);
      }

      .fader-slot::before {
        content: "";
        position: absolute;
        inset: 14px 17px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
      }

      .fader input[type="range"] {
        appearance: none;
        width: 214px;
        height: 28px;
        margin: 0;
        background: transparent;
        transform: rotate(-90deg);
      }

      .fader input[type="range"]::-webkit-slider-runnable-track {
        height: 10px;
        border-radius: 999px;
        background: linear-gradient(
          90deg,
          hsla(var(--hue), 92%, 58%, 0.98),
          hsla(var(--hue), 92%, 74%, 0.98)
        );
      }

      .fader input[type="range"]::-moz-range-track {
        height: 10px;
        border-radius: 999px;
        background: linear-gradient(
          90deg,
          hsla(var(--hue), 92%, 58%, 0.98),
          hsla(var(--hue), 92%, 74%, 0.98)
        );
      }

      .fader input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 22px;
        height: 22px;
        margin-top: -6px;
        border-radius: 999px;
        border: 2px solid rgba(255, 255, 255, 0.78);
        background: #0f1318;
        box-shadow: 0 0 0 3px hsla(var(--hue), 92%, 60%, 0.28);
      }

      .fader input[type="range"]::-moz-range-thumb {
        width: 22px;
        height: 22px;
        border-radius: 999px;
        border: 2px solid rgba(255, 255, 255, 0.78);
        background: #0f1318;
        box-shadow: 0 0 0 3px hsla(var(--hue), 92%, 60%, 0.28);
      }

      .fader-legend {
        display: grid;
        gap: 3px;
        justify-items: center;
        font-size: 0.64rem;
        line-height: 1.45;
        color: rgba(239, 231, 217, 0.54);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .preset-panel,
      .result-panel {
        display: grid;
        gap: 14px;
        padding: 18px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.07);
      }

      .preset-panel-header,
      .result-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      .preset-panel-header strong,
      .result-panel-header strong {
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: rgba(239, 231, 217, 0.7);
      }

      .preset-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .utility-button {
        color: #ffddc1;
      }

      .result-list {
        display: grid;
        gap: 10px;
      }

      .result-item {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.02);
      }

      .result-item.success {
        border-color: rgba(111, 255, 191, 0.18);
        background: rgba(40, 255, 166, 0.05);
      }

      .result-item.failure {
        border-color: rgba(255, 120, 120, 0.18);
        background: rgba(255, 87, 87, 0.04);
      }

      .result-item-main {
        display: grid;
        gap: 4px;
      }

      .result-item-label {
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #efe7d9;
      }

      .result-item-copy {
        font-size: 0.76rem;
        line-height: 1.5;
        color: rgba(239, 231, 217, 0.68);
      }

      .result-item-state {
        flex: 0 0 auto;
        font-size: 0.72rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(239, 231, 217, 0.72);
      }

      @media (max-width: 720px) {
        .console {
          padding: 18px;
        }

        .console-header,
        .control-bar,
        .preset-panel-header,
        .result-panel-header {
          align-items: flex-start;
        }

        .console-actions {
          width: 100%;
          justify-content: flex-start;
        }

        .target-popover {
          left: 0;
          right: auto;
          width: min(100%, 380px);
        }
      }
    </style>

    <section class="console">
      <div class="console-header">
        <div class="console-head-main">
          <div class="console-title">
            <strong>TraitMixer Console</strong>
            <span>Visual prompt voice control for one agent, many contexts</span>
          </div>
          <div class="console-status">${params.configDirty ? "Draft mix" : "Ready to ship"}</div>
        </div>

        <div class="console-actions">
          <button
            class="action-button"
            ?targeted=${params.targetMenuOpen}
            @click=${params.onTargetMenuToggle}
          >
            Targets <span class="target-count">(${selectedTargetCount})</span>
          </button>
          <button
            class="action-button push-button"
            ?disabled=${params.pushing || selectedTargetCount === 0}
            @click=${params.onPush}
          >
            ${pushLabel}
          </button>

          ${params.targetMenuOpen
            ? html`
                <div class="target-popover">
                  <div class="target-popover-header">
                    <div>
                      <strong>Push targets</strong>
                      <span>${configuredTargets.length} configured of ${params.availableTargets.length} supported</span>
                    </div>
                    <button class="target-refresh" @click=${params.onRefreshTargets}>
                      ${params.targetsLoading ? "Checking..." : "Refresh"}
                    </button>
                  </div>

                  <div class="target-list">
                    ${orderedTargets.map((target) => {
                      const isSelected = params.selectedTargetIds.includes(target.id);
                      if (!target.configured) {
                        return html`
                          <div class="target-item disabled">
                            <div class="target-item-main">
                              <span class="target-item-label">${target.label}</span>
                              <span class="target-item-copy">${target.setupHint ?? "Setup required"}</span>
                            </div>
                            <span class="target-item-state">Setup</span>
                          </div>
                        `;
                      }

                      return html`
                        <button
                          class="target-item ${isSelected ? "selected" : ""}"
                          @click=${() => params.onTargetSelectToggle(target.id)}
                        >
                          <span class="target-item-main">
                            <span class="target-item-label">${target.label}</span>
                            <span class="target-item-copy">${target.description}</span>
                          </span>
                          <span class="target-item-state">${isSelected ? "Selected" : "Ready"}</span>
                        </button>
                      `;
                    })}
                  </div>

                  <div class="target-summary">
                    Supported means TraitMixer can talk to it. Configured means it is ready. Selected
                    means this push will include it.
                  </div>
                </div>
              `
            : null}
        </div>
      </div>

      <div class="control-bar">
        <div class="segment">
          <button
            class=${params.target === "agent" ? "active" : ""}
            @click=${() => params.onTargetChange("agent")}
          >
            Agent voice
          </button>
          <button
            class=${params.target === "defaults" ? "active" : ""}
            @click=${() => params.onTargetChange("defaults")}
          >
            Default voice
          </button>
        </div>

        <div class="channel-strip">
          ${CHANNELS.map(
            (channel) => html`
              <button
                class=${params.channel === channel.key ? "active" : ""}
                @click=${() => params.onChannelChange(channel.key)}
              >
                ${channel.label}
              </button>
            `,
          )}
        </div>
      </div>

      <div class="board">
        <div class="fader-grid">
          ${TRAITS.map((trait) => html`
            <label class="fader" style=${`--hue:${trait.hue};`}>
              <div class="fader-header">
                <span class="fader-value">${getValue(trait.key)}%</span>
                <span class="fader-label">${trait.label}</span>
              </div>
              <div class="fader-slot">
                <input
                  type="range"
                  min="0"
                  max="100"
                  .value=${String(getValue(trait.key))}
                  @input=${(event: Event) =>
                    setValue(trait.key, parseInt((event.target as HTMLInputElement).value, 10))}
                />
              </div>
              <div class="fader-legend">
                <span>${trait.high}</span>
                <span>${trait.low}</span>
              </div>
            </label>
          `)}
        </div>
      </div>

      <div class="preset-panel">
        <div class="preset-panel-header">
          <strong>Quick mixes</strong>
          <button class="utility-button" @click=${params.onReset}>Reset demo</button>
        </div>
        <div class="preset-row">
          ${PRESETS.map(
            (preset) => html`
              <button @click=${() => applyPreset(preset.traits)}>${preset.name}</button>
            `,
          )}
          <button @click=${resetTarget}>Flat 50</button>
        </div>
      </div>

      ${params.pushResults.length > 0
        ? html`
            <div class="result-panel">
              <div class="result-panel-header">
                <strong>Last push</strong>
                <span>${selectedTargetCount} target${selectedTargetCount === 1 ? "" : "s"} selected</span>
              </div>
              <div class="result-list">
                ${params.pushResults.map(
                  (result) => html`
                    <div class="result-item ${result.success ? "success" : "failure"}">
                      <div class="result-item-main">
                        <span class="result-item-label">${resolveTargetLabel(result.target)}</span>
                        <span class="result-item-copy">${result.message}</span>
                      </div>
                      <span class="result-item-state">${result.success ? "Success" : "Failed"}</span>
                    </div>
                  `,
                )}
              </div>
            </div>
          `
        : null}
    </section>
  `;
}
