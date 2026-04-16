import { html } from "lit";
import { type TraitMixerConfig, type PersonalityTraits } from "traitmixer-core";

export type PersonalityTarget = "agent" | "defaults";

type PanelParams = {
  agentId: string;
  channel: string;
  configDirty: boolean;
  configForm: TraitMixerConfig | null;
  onChannelChange: (channel: string) => void;
  onFieldChange: (args: { path: string[]; target: PersonalityTarget; value: unknown }) => void;
  onReset: () => void;
  onTargetChange: (target: PersonalityTarget) => void;
  target: PersonalityTarget;
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

  const getValue = (key: keyof PersonalityTraits) => {
    const channelValue = params.channel === "*" ? undefined : channelTraits[key];
    const value = channelValue ?? baseTraits[key] ?? 50;
    return typeof value === "number" ? value : 50;
  };

  const setValue = (key: keyof PersonalityTraits, value: number) => {
    const path =
      params.channel === "*" ? ["traits", key] : ["channels", params.channel, key];
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
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
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

      .segment button:hover,
      .channel-strip button:hover,
      .preset-row button:hover,
      .utility-button:hover {
        transform: translateY(-1px);
        border-color: rgba(255, 255, 255, 0.18);
      }

      .segment button.active,
      .channel-strip button.active {
        background: rgba(255, 138, 61, 0.12);
        border-color: rgba(255, 178, 124, 0.48);
        color: #fff3e7;
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

      .preset-panel {
        display: grid;
        gap: 14px;
        padding: 18px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.07);
      }

      .preset-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      .preset-panel-header strong {
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

      @media (max-width: 720px) {
        .console {
          padding: 18px;
        }

        .console-header,
        .control-bar,
        .preset-panel-header {
          align-items: flex-start;
        }
      }
    </style>

    <section class="console">
      <div class="console-header">
        <div class="console-title">
          <strong>TraitMixer Console</strong>
          <span>Visual prompt voice control for one agent, many contexts</span>
        </div>
        <div class="console-status">${params.configDirty ? "Draft mix" : "Ready to ship"}</div>
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
    </section>
  `;
}
