import { html, render } from "lit";
import {
  compilePersonalityOverlay,
  resolvePersonalityConfig,
  type TraitMixerConfig,
} from "traitmixer-core";
import {
  renderAgentPersonality,
  type PersonalityTarget,
} from "./personality-panel.js";

const REPO_URL = "https://github.com/wspotter/traitmixer";
const AGENT_ID = "demo";

const INITIAL_CONFIG: TraitMixerConfig = {
  agents: {
    defaults: {
      personality: {
        traits: {
          humor: 42,
          flirting: 8,
          sarcasm: 18,
          optimism: 62,
          directness: 76,
          verbosity: 36,
          confidence: 74,
          empathy: 58,
          complexity: 46,
          creativity: 54,
          caution: 44,
          formality: 38,
          rating: 18,
        },
      },
    },
    list: [
      {
        id: AGENT_ID,
        personality: {
          traits: {
            humor: 56,
            directness: 82,
            verbosity: 28,
            confidence: 78,
            empathy: 50,
          },
          channels: {
            signal: {
              humor: 72,
              directness: 88,
              verbosity: 18,
            },
            dashboard: {
              humor: 12,
              directness: 94,
              verbosity: 10,
              formality: 54,
            },
            support: {
              empathy: 84,
              caution: 68,
              directness: 58,
              rating: 4,
            },
            launch: {
              humor: 64,
              confidence: 90,
              creativity: 68,
              optimism: 84,
            },
          },
        },
      },
    ],
  },
};

type ResponseExample = {
  after: string;
  before: string;
  context: string;
  note: string;
  prompt: string;
  traits: string[];
};

const RESPONSE_EXAMPLES: Record<string, ResponseExample> = {
  "*": {
    context: "Base mix example",
    note: "Voice here means written reply style, not TTS. Same task, different text output.",
    prompt: "A user says our agent feels robotic. How should we respond?",
    before:
      "Thanks for your feedback. We understand your concern and will work to improve the experience moving forward. Please let us know if you have any additional details to share.",
    after:
      "Thanks for saying it plainly. That cold, canned tone is exactly the failure mode we're trying to remove. We want the assistant to stay accurate without sounding like it was assembled from policy fragments, and we're tuning that now.",
    traits: ["balanced", "clear", "human"],
  },
  dashboard: {
    context: "Dashboard example",
    note: "Operator-facing voice should get to the point fast and keep the status legible.",
    prompt: "We missed the deploy window. What happened and what now?",
    before:
      "Thanks for flagging this. We encountered an issue during deployment and are actively investigating the cause. We appreciate your patience while we work through next steps and will provide an update as soon as possible.",
    after:
      "We missed the window because the migration lock held longer than expected. Production is stable, rollout is paused, and the next attempt is 6:30 PM ET. I’m confirming blocker ownership now and posting the rollback decision in 10 minutes.",
    traits: ["direct", "brief", "operator-safe"],
  },
  launch: {
    context: "Launch example",
    note: "Launch copy can afford more confidence and more heat as long as the claim stays true.",
    prompt: "Tell a builder why TraitMixer matters in one short reply.",
    before:
      "TraitMixer is a helpful tool for adjusting AI assistant personalities and improving how they communicate across different scenarios.",
    after:
      "TraitMixer gives builders a direct way to shape agent persona, so response style can be tuned visually instead of disappearing into prompt edits.",
    traits: ["confident", "clear", "product-led"],
  },
  signal: {
    context: "Signal example",
    note: "Chat channels reward speed. The best version says the thing and gets out of the way.",
    prompt: "We missed the deploy window. What happened and what now?",
    before:
      "We ran into an issue during the deployment process and are currently looking into it. We will share more details once we know more and have a clear next step.",
    after:
      "Missed the window. Migration lock ran long. App is fine, rollout is paused, next shot is 6:30 PM ET. I’ll post the exact blocker in 10.",
    traits: ["fast", "blunt", "low-ceremony"],
  },
  support: {
    context: "Support example",
    note: "Support voice should stay warm without becoming mushy or evasive.",
    prompt: "A customer says the bot sounded cold and dismissive. Reply.",
    before:
      "We apologize for the inconvenience and appreciate you bringing this to our attention. Your feedback is valuable and we will use it to improve our service going forward.",
    after:
      "You're right to call that out. If the bot felt cold, we missed the mark. Thank you for saying it directly. We're tuning the response style to sound more human without losing accuracy, and I’m happy to look at the exact reply if you want to send it over.",
    traits: ["warm", "owning", "reassuring"],
  },
};

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

const FALLBACK_TARGETS: TargetStatus[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    type: "file",
    configured: true,
    description: "Write personality overlay to Claude Code project memory",
    setupHint: "Need CLAUDE.md path",
  },
  {
    id: "open-webui",
    label: "Open WebUI",
    type: "http",
    configured: true,
    description: "Update model system prompt via Open WebUI REST API",
    setupHint: "Need URL, API key, and model ID",
  },
  {
    id: "agent-zero",
    label: "Agent Zero",
    type: "file",
    configured: true,
    description: "Write personality overlay to Agent Zero system prompt file",
    setupHint: "Need agent.system.md path",
  },
  {
    id: "anythingllm",
    label: "AnythingLLM",
    type: "http",
    configured: false,
    description: "Update workspace system prompt via AnythingLLM REST API",
    setupHint: "Need URL, API key, and workspace slug",
  },
  {
    id: "hermes",
    label: "Hermes Agent",
    type: "file",
    configured: false,
    description: "Write personality overlay to Hermes SOUL.md",
    setupHint: "Need SOUL.md path",
  },
  {
    id: "openclaw",
    label: "OpenClaw",
    type: "file",
    configured: false,
    description: "Write personality overlay to OpenClaw workspace config",
    setupHint: "Need workspace config path",
  },
];

type AppState = {
  availableTargets: TargetStatus[];
  channel: string;
  configDirty: boolean;
  configForm: TraitMixerConfig;
  pushResults: TargetPushResult[];
  pushing: boolean;
  selectedTargetIds: string[];
  target: PersonalityTarget;
  targetMenuOpen: boolean;
  targetSelectionTouched: boolean;
  targetsLoading: boolean;
};

function defaultSelectedTargetIds(targets: TargetStatus[]): string[] {
  return targets.filter((target) => target.configured).map((target) => target.id);
}

function syncSelectedTargetIds(
  targets: TargetStatus[],
  currentTargetIds: string[],
  targetSelectionTouched: boolean,
): string[] {
  const configuredTargetIds = new Set(
    targets.filter((target) => target.configured).map((target) => target.id),
  );
  const preservedSelection = currentTargetIds.filter((id) => configuredTargetIds.has(id));

  if (targetSelectionTouched) {
    return preservedSelection;
  }

  return preservedSelection.length > 0 ? preservedSelection : defaultSelectedTargetIds(targets);
}

let state: AppState = {
  availableTargets: FALLBACK_TARGETS,
  channel: "launch",
  configDirty: false,
  configForm: structuredClone(INITIAL_CONFIG),
  pushResults: [],
  pushing: false,
  selectedTargetIds: defaultSelectedTargetIds(FALLBACK_TARGETS),
  target: "agent",
  targetMenuOpen: false,
  targetSelectionTouched: false,
  targetsLoading: false,
};

function formatPercent(value: number | undefined): string {
  return `${value ?? 0}%`;
}

function setNestedValue(target: Record<string, unknown>, path: string[], value: unknown) {
  let cursor: Record<string, unknown> = target;
  for (const key of path.slice(0, -1)) {
    const next = cursor[key];
    if (!next || typeof next !== "object") {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[path[path.length - 1]] = value;
}

function updateField(args: { path: string[]; target: PersonalityTarget; value: unknown }) {
  const configForm = structuredClone(state.configForm);
  const personalityRoot =
    args.target === "defaults"
      ? configForm.agents?.defaults?.personality
      : configForm.agents?.list?.find((agent) => agent.id === AGENT_ID)?.personality;

  if (!personalityRoot) return;

  setNestedValue(personalityRoot as Record<string, unknown>, args.path, args.value);
  state = { ...state, configDirty: true, configForm, pushResults: [] };
  rerender();
}

async function loadTargets() {
  state = { ...state, targetsLoading: true };
  rerender();

  try {
    const response = await fetch("http://localhost:4400/api/targets");
    if (!response.ok) {
      throw new Error(`Target lookup failed: ${response.status}`);
    }

    const data = (await response.json()) as { targets?: TargetStatus[] };
    const availableTargets = data.targets?.length ? data.targets : FALLBACK_TARGETS;
    state = {
      ...state,
      availableTargets,
      selectedTargetIds: syncSelectedTargetIds(
        availableTargets,
        state.selectedTargetIds,
        state.targetSelectionTouched,
      ),
      targetsLoading: false,
    };
  } catch {
    state = {
      ...state,
      availableTargets: FALLBACK_TARGETS,
      selectedTargetIds: syncSelectedTargetIds(
        FALLBACK_TARGETS,
        state.selectedTargetIds,
        state.targetSelectionTouched,
      ),
      targetsLoading: false,
    };
  }

  rerender();
}

function toggleTargetSelection(targetId: string) {
  const target = state.availableTargets.find((item) => item.id === targetId);
  if (!target?.configured) return;

  const selectedTargetIds = state.selectedTargetIds.includes(targetId)
    ? state.selectedTargetIds.filter((id) => id !== targetId)
    : [...state.selectedTargetIds, targetId];

  state = {
    ...state,
    pushResults: [],
    selectedTargetIds,
    targetSelectionTouched: true,
  };
  rerender();
}

async function pushSelectedTargets() {
  const selectedTargets = state.availableTargets.filter(
    (target) => target.configured && state.selectedTargetIds.includes(target.id),
  );
  if (selectedTargets.length === 0) {
    state = {
      ...state,
      pushResults: [
        {
          success: false,
          target: "traitmixer",
          message: "Select at least one configured target before pushing.",
        },
      ],
      targetMenuOpen: true,
    };
    rerender();
    return;
  }

  const personality = resolvePersonalityConfig(state.configForm, AGENT_ID);
  const overlay = compilePersonalityOverlay(personality, {
    channel: state.channel === "*" ? undefined : state.channel,
  });

  if (!overlay) {
    state = {
      ...state,
      pushResults: [
        {
          success: false,
          target: "traitmixer",
          message: "No overlay was generated for the current mix.",
        },
      ],
    };
    rerender();
    return;
  }

  state = { ...state, pushResults: [], pushing: true, targetMenuOpen: false };
  rerender();

  try {
    const response = await fetch("http://localhost:4400/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overlay,
        targets: selectedTargets.map((target) => target.id),
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      results?: TargetPushResult[];
    };
    state = {
      ...state,
      pushResults:
        data.results && data.results.length > 0
          ? data.results
          : [
              {
                success: false,
                target: "traitmixer",
                message: data.error ?? "Push failed without a detailed response.",
              },
            ],
      pushing: false,
    };
  } catch {
    state = {
      ...state,
      pushResults: [
        {
          success: false,
          target: "traitmixer",
          message: "Could not reach the local push server on port 4400.",
        },
      ],
      pushing: false,
    };
  }

  rerender();
}

function getEffectiveTraits() {
  const personality = resolvePersonalityConfig(state.configForm, AGENT_ID);
  const overlay = compilePersonalityOverlay(personality, {
    channel: state.channel === "*" ? undefined : state.channel,
  });

  const baseTraits = personality?.traits ?? {};
  const channelTraits = state.channel === "*" ? {} : personality?.channels?.[state.channel] ?? {};
  const effectiveTraits = { ...baseTraits, ...channelTraits };

  return { channelTraits, effectiveTraits, overlay };
}

function renderApp() {
  return html`
    <style>
      .page {
        min-height: 100vh;
        padding: 32px 20px 72px;
      }

      .shell {
        width: min(1240px, 100%);
        margin: 0 auto;
      }

      .topline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 28px;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: rgba(239, 231, 217, 0.7);
      }

      .topline a,
      .hero-actions a,
      .proof-link,
      .footer a {
        color: inherit;
        text-decoration: none;
      }

      .brandline {
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }

      .brandmark {
        width: 12px;
        height: 12px;
        border-radius: 999px;
        background: linear-gradient(135deg, #ff8a3d, #ff4f6c);
        box-shadow: 0 0 22px rgba(255, 119, 86, 0.45);
      }

      .creditline {
        color: rgba(239, 231, 217, 0.62);
      }

      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.06fr) minmax(420px, 0.94fr);
        gap: 36px;
        align-items: start;
      }

      .hero-copy {
        padding-top: 10px;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: #ffb27c;
      }

      .hero-copy h1 {
        margin: 18px 0 18px;
        max-width: 11ch;
        font-family: "Space Grotesk", sans-serif;
        font-size: clamp(3.4rem, 8vw, 7.4rem);
        line-height: 0.92;
        letter-spacing: -0.06em;
        text-transform: uppercase;
      }

      .hero-lead {
        max-width: 60ch;
        margin: 0;
        font-size: 1.06rem;
        line-height: 1.7;
        color: rgba(239, 231, 217, 0.8);
      }

      .hero-actions {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        margin-top: 28px;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        min-height: 46px;
        padding: 0 18px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        font-size: 0.88rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
      }

      .button:hover {
        transform: translateY(-1px);
      }

      .button-primary {
        background: linear-gradient(135deg, #ff8a3d, #ff4f6c);
        color: #140f14;
        border-color: transparent;
        box-shadow: 0 18px 40px rgba(255, 96, 104, 0.24);
      }

      .button-secondary {
        background: rgba(255, 255, 255, 0.03);
        color: #efe7d9;
      }

      .hero-notes {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
        margin-top: 34px;
        padding-top: 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }

      .hero-note {
        display: grid;
        gap: 6px;
      }

      .hero-note strong {
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #ffb27c;
      }

      .hero-note span {
        color: rgba(239, 231, 217, 0.72);
        line-height: 1.55;
      }

      .hero-stage {
        position: relative;
      }

      .hero-stage::before {
        content: "";
        position: absolute;
        inset: -24px 6% auto auto;
        width: 280px;
        height: 280px;
        background:
          radial-gradient(circle, rgba(255, 124, 79, 0.36) 0%, rgba(255, 124, 79, 0) 68%);
        filter: blur(16px);
        pointer-events: none;
      }

      .hero-stage::after {
        content: "";
        position: absolute;
        inset: auto auto -50px -20px;
        width: 320px;
        height: 200px;
        background:
          radial-gradient(circle, rgba(84, 214, 255, 0.18) 0%, rgba(84, 214, 255, 0) 74%);
        filter: blur(16px);
        pointer-events: none;
      }

      .showcase {
        position: relative;
        z-index: 1;
        padding: 18px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 28px;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
          rgba(16, 18, 24, 0.86);
        backdrop-filter: blur(18px);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
      }

      .stage-caption {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 4px 6px 16px;
        color: rgba(239, 231, 217, 0.72);
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .stage-caption strong {
        color: #efe7d9;
      }

      .section {
        margin-top: 84px;
      }

      .section-head {
        display: grid;
        gap: 12px;
        max-width: 760px;
        margin-bottom: 28px;
      }

      .section-head h2 {
        margin: 0;
        font-family: "Space Grotesk", sans-serif;
        font-size: clamp(2.3rem, 4vw, 4rem);
        line-height: 0.95;
        letter-spacing: -0.05em;
        text-transform: uppercase;
      }

      .section-head p {
        margin: 0;
        color: rgba(239, 231, 217, 0.74);
        line-height: 1.7;
      }

      .proof-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
        gap: 24px;
      }

      .proof-panel {
        padding: 26px;
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.03);
      }

      .proof-kicker {
        margin: 0 0 10px;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: #ffb27c;
      }

      .proof-panel h3 {
        margin: 0;
        font-family: "Space Grotesk", sans-serif;
        font-size: 1.7rem;
        letter-spacing: -0.04em;
      }

      .proof-panel p {
        margin: 12px 0 0;
        color: rgba(239, 231, 217, 0.76);
        line-height: 1.65;
      }

      .proof-rows {
        display: grid;
        gap: 16px;
        margin-top: 22px;
      }

      .proof-row {
        display: grid;
        grid-template-columns: 140px 1fr;
        gap: 14px;
        align-items: start;
        padding-top: 14px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }

      .proof-row strong {
        font-size: 0.82rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(239, 231, 217, 0.82);
      }

      .proof-row span {
        color: rgba(239, 231, 217, 0.7);
        line-height: 1.65;
      }

      .stat-grid {
        display: grid;
        gap: 14px;
      }

      .stat {
        display: grid;
        gap: 6px;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .stat:last-child {
        padding-bottom: 0;
        border-bottom: 0;
      }

      .stat-value {
        font-family: "Space Grotesk", sans-serif;
        font-size: 2.2rem;
        line-height: 1;
        letter-spacing: -0.06em;
      }

      .stat-label {
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: #ffb27c;
      }

      .stat-copy {
        color: rgba(239, 231, 217, 0.68);
        line-height: 1.6;
      }

      .overlay-grid {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
        gap: 24px;
      }

      .example-grid {
        display: grid;
        grid-template-columns: minmax(280px, 0.86fr) minmax(0, 1.14fr);
        gap: 24px;
      }

      .example-prompt {
        display: grid;
        gap: 18px;
        align-content: start;
      }

      .example-prompt-block {
        padding: 22px;
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background:
          linear-gradient(180deg, rgba(255, 138, 61, 0.08), rgba(255, 255, 255, 0.02)),
          rgba(255, 255, 255, 0.02);
      }

      .example-prompt-label {
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: #ffb27c;
      }

      .example-prompt-text {
        margin-top: 14px;
        font-family: "Space Grotesk", sans-serif;
        font-size: 1.55rem;
        line-height: 1.1;
        letter-spacing: -0.04em;
      }

      .example-note {
        color: rgba(239, 231, 217, 0.72);
        line-height: 1.7;
      }

      .example-replies {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .reply-card {
        min-height: 100%;
        padding: 22px;
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.03);
      }

      .reply-card.after {
        border-color: rgba(255, 178, 124, 0.28);
        background:
          linear-gradient(180deg, rgba(255, 138, 61, 0.08), rgba(255, 255, 255, 0.02)),
          rgba(255, 255, 255, 0.03);
      }

      .reply-label {
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: rgba(239, 231, 217, 0.72);
      }

      .reply-card.after .reply-label {
        color: #ffb27c;
      }

      .reply-body {
        margin-top: 14px;
        white-space: pre-line;
        color: rgba(239, 231, 217, 0.88);
        font-size: 0.92rem;
        line-height: 1.78;
      }

      .reply-card.before .reply-body {
        color: rgba(239, 231, 217, 0.68);
      }

      .example-traits {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }

      .example-traits span {
        display: inline-flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.025);
        color: rgba(239, 231, 217, 0.78);
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.025);
        color: rgba(239, 231, 217, 0.78);
        font-size: 0.8rem;
      }

      .chip strong {
        color: #efe7d9;
      }

      .overlay-box {
        min-height: 100%;
        padding: 22px;
        border-radius: 24px;
        background: linear-gradient(180deg, rgba(9, 13, 18, 0.92), rgba(15, 18, 24, 0.84));
        border: 1px solid rgba(84, 214, 255, 0.14);
      }

      .overlay-box pre {
        margin: 16px 0 0;
        white-space: pre-wrap;
        word-break: break-word;
        color: rgba(223, 240, 247, 0.88);
        font-size: 0.87rem;
        line-height: 1.66;
      }

      .connector-strip {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }

      .connector {
        padding: 18px 16px;
        border-radius: 18px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.025);
      }

      .connector strong {
        display: block;
        font-size: 0.88rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #efe7d9;
      }

      .connector span {
        display: block;
        margin-top: 8px;
        color: rgba(239, 231, 217, 0.66);
        line-height: 1.55;
      }

      .footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-top: 84px;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        color: rgba(239, 231, 217, 0.64);
        font-size: 0.92rem;
      }

      .footer strong {
        color: #efe7d9;
      }

      @media (max-width: 1080px) {
        .hero,
        .proof-grid,
        .example-grid,
        .example-replies,
        .overlay-grid {
          grid-template-columns: 1fr;
        }

      }

      @media (max-width: 720px) {
        .page {
          padding-inline: 14px;
        }

        .topline,
        .footer {
          flex-direction: column;
          align-items: flex-start;
        }

        .hero-copy h1 {
          max-width: 8ch;
        }

        .hero-notes {
          grid-template-columns: 1fr;
        }

        .proof-row {
          grid-template-columns: 1fr;
        }

      }
    </style>

    <div class="page">
      <header class="app-header">
        <div class="logo">
          <span class="logo-mark"></span>
          <h1>TraitMixer</h1>
        </div>
      </header>

      <div class="shell" style="margin-top: 40px;">
        <div class="showcase">
          ${renderAgentPersonality({
            availableTargets: state.availableTargets,
            agentId: AGENT_ID,
            configDirty: state.configDirty,
            configForm: state.configForm,
            channel: state.channel,
            onPush: pushSelectedTargets,
            onRefreshTargets: loadTargets,
            target: state.target,
            pushResults: state.pushResults,
            pushing: state.pushing,
            selectedTargetIds: state.selectedTargetIds,
            targetMenuOpen: state.targetMenuOpen,
            targetsLoading: state.targetsLoading,
            onChannelChange: (channel) => {
              state = { ...state, channel, pushResults: [] };
              rerender();
            },
            onFieldChange: updateField,
            onReset: () => {
              state = {
                ...state,
                channel: "launch",
                configDirty: false,
                configForm: structuredClone(INITIAL_CONFIG),
                pushResults: [],
                target: "agent",
              };
              rerender();
            },
            onTargetChange: (target) => {
              state = { ...state, pushResults: [], target };
              rerender();
            },
            onTargetMenuToggle: () => {
              state = { ...state, targetMenuOpen: !state.targetMenuOpen };
              rerender();
            },
            onTargetSelectToggle: toggleTargetSelection,
          })}
        </div>
      </div>

        <footer class="app-footer">
          <div class="footer-content">
            <p>
              TraitMixer is an open-source project.
            </p>
          </div>
        </footer>
      </div>
    </div>
  `;
}

function rerender() {
  const app = document.getElementById("app");
  if (!app) return;
  render(renderApp(), app);
}

rerender();
void loadTargets();
