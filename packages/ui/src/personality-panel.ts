import { html, nothing } from "lit";
import { compilePersonalityOverlay } from "traitmixer-core";
import type { PersonalityConfig, PersonalityTraits, TraitMixerConfig } from "traitmixer-core";

export type PersonalityTarget = "agent" | "defaults";
export type PersonalityPreviewMode = "default" | "customer_email" | "stress_debug";

export function renderAgentPersonality(params: {
  agentId: string;
  configForm: TraitMixerConfig | null;
  configDirty: boolean;
  target: PersonalityTarget;
  channel: string;
  mode: string;
  onFieldChange: (args: { target: PersonalityTarget; path: string[]; value: any }) => void;
}) {
  const defaults = params.configForm?.agents?.defaults?.personality;
  const list = params.configForm?.agents?.list;
  const agent = list?.find((a: any) => a.id === params.agentId)?.personality;
  
  const personality = params.target === "agent" ? agent : defaults;
  const baseTraits: PersonalityTraits = personality?.traits || {};
  const channelTraits: Partial<PersonalityTraits> | undefined = personality?.channels?.[params.channel] || {};
  
  const effectiveTraits = { ...defaults?.traits, ...agent?.traits, ...channelTraits };

  const pushOverlay = async () => {
    const overlay = compilePersonalityOverlay(personality, { channel: params.channel === "*" ? undefined : params.channel });
    if (!overlay) {
      alert("No active overlay to push!");
      return;
    }
    try {
      const targetsRes = await fetch("http://localhost:4400/api/targets").then(r => r.json()).catch(() => ({}));
      const onlineTargets = targetsRes.targets?.filter((t: any) => t.configured).map((t: any) => t.name) || ["hermes"];

      const res = await fetch("http://localhost:4400/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overlay, targets: onlineTargets })
      });
      if (!res.ok) throw new Error("Failed to push");
      alert(`Overlay deployed successfully!`);
    } catch (err: any) {
      alert("Error pushing overlay: " + err.message);
    }
  };

  const getVal = (key: keyof PersonalityTraits) => {
    const val = params.channel === "*" ? baseTraits[key] : (channelTraits?.[key]);
    return val !== undefined ? val : (baseTraits[key] !== undefined ? baseTraits[key] : 50);
  };

  const setVal = (key: keyof PersonalityTraits, val: number) => {
    const path = params.channel === "*" ? ["traits", key] : ["channels", params.channel, key];
    params.onFieldChange({ target: params.target, path, value: val });
  };

  const traitsConfig = [
    { key: "humor", label: "Humor", minL: "Dry", maxL: "Hilarious" },
    { key: "flirting", label: "Flirting", minL: "Pro", maxL: "Flirty" },
    { key: "sarcasm", label: "Sarcasm", minL: "Earnest", maxL: "Snarky" },
    { key: "optimism", label: "Optimism", minL: "Cynic", maxL: "Sunny" },
    { key: "directness", label: "Direct", minL: "Soft", maxL: "Blunt" },
    { key: "verbosity", label: "Verbose", minL: "Brief", maxL: "Chatty" },
    { key: "confidence", label: "Cocky", minL: "Timid", maxL: "Cocky" },
    { key: "empathy", label: "Empathy", minL: "Cold", maxL: "Warm" },
    { key: "complexity", label: "Jargon", minL: "Simple", maxL: "Acad" },
    { key: "creativity", label: "Arts", minL: "Literal", maxL: "Poetic" },
    { key: "caution", label: "Risk", minL: "Bold", maxL: "Safe" },
    { key: "formality", label: "Formal", minL: "Slang", maxL: "Stiff" },
    { key: "rating", label: "Rating", minL: "G", maxL: "XXX" },
  ] as const;

  const applyPreset = (preset: Partial<PersonalityTraits>) => {
    traitsConfig.forEach(t => setVal(t.key, 50));
    Object.entries(preset).forEach(([k, v]) => setVal(k as keyof PersonalityTraits, v as number));
  };

  const presets = [
    { name: "The Corporate Intern", traits: { humor: 10, formality: 90, caution: 90, rating: 0, directness: 20, confidence: 10, verbosity: 80 } },
    { name: "The Chad Bro", traits: { humor: 80, formality: 0, confidence: 100, directness: 90, empathy: 20, sarcasm: 60, rating: 60 } },
    { name: "The Dominatrix", traits: { flirting: 100, directness: 100, confidence: 100, empathy: 0, caution: 0, rating: 100, sarcasm: 90 } },
    { name: "The Zen Master", traits: { optimism: 100, empathy: 100, creativity: 100, caution: 80, directness: 10, rating: 0 } },
    { name: "Unhinged Hacker", traits: { complexity: 100, sarcasm: 100, caution: 0, directness: 100, rating: 80, verbosity: 0 } }
  ];

  return html`
    <style>
      .mixer-board {
        background: #1e2025;
        border-radius: 12px;
        padding: 30px;
        color: #e0e2e6;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        max-width: 900px;
        margin: 0 auto;
      }
      .mixer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #2d313a;
        padding-bottom: 15px;
      }
      .mixer-title {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #00d2ff;
      }
      .faders-container {
        display: flex;
        justify-content: space-between;
        gap: 15px;
        background: #141518;
        padding: 30px 20px;
        border-radius: 8px;
        box-shadow: inset 0 5px 15px rgba(0,0,0,0.5);
      }
      .fader-channel {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 70px;
      }
      .fader-label {
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
        color: #8b92a5;
        margin-bottom: 10px;
        text-align: center;
        letter-spacing: 0.5px;
      }
      .fader-slot {
        height: 220px;
        width: 40px;
        background: #0b0c0e;
        border-radius: 20px;
        display: flex;
        justify-content: center;
        padding: 10px 0;
        box-shadow: inset 0 2px 5px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05);
        position: relative;
      }
      input[type=range][orient=vertical] {
        appearance: slider-vertical;
        width: 20px;
        height: 200px;
        background: transparent;
        cursor: pointer;
      }
      /* Custom colored sliders depending on trait */
      .fader-humor input { accent-color: #ff007f; }
      .fader-flirting input { accent-color: #ff00ff; }
      .fader-sarcasm input { accent-color: #00ffcc; }
      .fader-optimism input { accent-color: #ffcc00; }
      .fader-directness input { accent-color: #ff3300; }
      .fader-verbosity input { accent-color: #00ccff; }
      .fader-confidence input { accent-color: #00ff66; }
      .fader-empathy input { accent-color: #ff6699; }
      .fader-complexity input { accent-color: #9966ff; }
      .fader-creativity input { accent-color: #ff9966; }
      .fader-caution input { accent-color: #6699ff; }
      .fader-formality input { accent-color: #aaaaaa; }
      .fader-rating input { accent-color: #ff0000; }
      
      .fader-minmax {
        font-size: 9px;
        color: #5b6275;
        margin-top: 8px;
        text-align: center;
        text-transform: uppercase;
      }
      .presets-panel {
        background: #252830;
        padding: 20px;
        border-radius: 8px;
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
        margin-top: 30px;
      }
      .panel-title {
        font-size: 12px;
        text-transform: uppercase;
        color: #8b92a5;
        margin-top: 0;
        margin-bottom: 15px;
        letter-spacing: 1px;
      }
      .preset-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      .preset-btn {
        background: #363a45;
        color: #e0e2e6;
        border: 1px solid #4a505f;
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
      }
      .preset-btn:hover {
        background: #4a505f;
        border-color: #00d2ff;
        color: white;
      }
      .preset-btn.clear-btn {
        background: #ff330022;
        border-color: #ff330088;
        color: #ffaa99;
      }
      .preset-btn.clear-btn:hover {
        background: #ff330055;
        color: white;
      }
      .push-btn {
        background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);
        color: white;
        border: none;
        padding: 10px 24px;
        font-size: 14px;
        font-weight: bold;
        border-radius: 6px;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: transform 0.1s, box-shadow 0.1s;
        box-shadow: 0 4px 15px rgba(0,210,255,0.3);
      }
      .push-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,210,255,0.4);
      }
      .push-btn:active {
        transform: translateY(1px);
      }
    </style>

    <div class="mixer-board">
      <div class="mixer-header">
        <h1 class="mixer-title">🎙️ TraitMixer Console</h1>
        <button class="push-btn" @click=${pushOverlay}>Push to Agent</button>
      </div>

      <div class="faders-container">
        ${traitsConfig.map(t => html`
          <div class="fader-channel fader-${t.key}">
            <div class="fader-label">${t.label}</div>
            <div class="fader-slot">
              <input type="range" orient="vertical" min="0" max="100" 
                .value=${getVal(t.key)}
                @input=${(e: Event) => setVal(t.key, parseInt((e.target as HTMLInputElement).value, 10))}
              >
            </div>
            <div class="fader-minmax">
              <span>${t.maxL}</span><br>|<br><span>${t.minL}</span>
            </div>
          </div>
        `)}
      </div>

      <div class="presets-panel">
        <h3 class="panel-title">Master Channel Presets</h3>
        <div class="preset-buttons">
          ${presets.map(p => html`<button class="preset-btn" @click=${() => applyPreset(p.traits)}>${p.name}</button>`)}
          <button class="preset-btn clear-btn" @click=${() => applyPreset({})}>Revert to Base (50%)</button>
        </div>
      </div>
    </div>
  `;
}
