import { html, nothing } from "lit";
import {
  compilePersonalityOverlay,
  resolvePersonalityConfig,
} from "traitmixer-core";
import type {
  PersonalityAuthorityConfig,
  PersonalityChannelOverrideConfig,
  PersonalityConfig,
  PersonalityGuardrailsConfig,
  PersonalityStyleConfig,
} from "traitmixer-core";
import type { SavedPersonalityProfile, ChannelsStatusSnapshot } from "./types.js";
import { AGENT_PERSONALITY_ALL_CHANNEL, resolveAgentConfig } from "./utils.js";

export type PersonalityTarget = "agent" | "defaults";

export type PersonalityPreviewMode =
  | "default"
  | "signal"
  | "dashboard"
  | "customer_email"
  | "stress_debug"
  | "bad_news";

type PersonalityRecord = Record<string, unknown>;

type Option = {
  value: string;
  label: string;
};

type VoiceMetric = {
  label: string;
  value: number;
  detail: string;
};

type PersonalityDeltaItem = {
  label: string;
  current: string;
  next: string;
};

type PersonalityScene = {
  id: string;
  label: string;
  eyebrow: string;
  copy: string;
  mode: PersonalityPreviewMode;
  style?: Partial<PersonalityStyleConfig>;
  authority?: Partial<PersonalityAuthorityConfig>;
  guardrails?: Partial<PersonalityGuardrailsConfig>;
  channel?: Partial<PersonalityChannelOverrideConfig>;
};

type EditableField =
  | { kind: "style"; key: keyof PersonalityStyleConfig }
  | { kind: "authority"; key: keyof PersonalityAuthorityConfig }
  | { kind: "guardrails"; key: keyof PersonalityGuardrailsConfig }
  | { kind: "channel"; key: keyof PersonalityChannelOverrideConfig };

const TONE_OPTIONS: Option[] = [
  { value: "neutral", label: "Neutral" },
  { value: "warm", label: "Warm" },
  { value: "playful", label: "Playful" },
  { value: "dry", label: "Dry" },
  { value: "formal", label: "Formal" },
];

const DIRECTNESS_OPTIONS: Option[] = [
  { value: "soft", label: "Soft" },
  { value: "balanced", label: "Balanced" },
  { value: "direct", label: "Direct" },
];

const VERBOSITY_OPTIONS: Option[] = [
  { value: "brief", label: "Brief" },
  { value: "balanced", label: "Balanced" },
  { value: "detailed", label: "Detailed" },
];

const HUMOR_OPTIONS: Option[] = [
  { value: "off", label: "Off" },
  { value: "light", label: "Light" },
  { value: "dry", label: "Dry" },
  { value: "playful", label: "Playful" },
];

const FORMALITY_OPTIONS: Option[] = [
  { value: "casual", label: "Casual" },
  { value: "neutral", label: "Neutral" },
  { value: "formal", label: "Formal" },
];

const STANCE_OPTIONS: Option[] = [
  { value: "collaborative", label: "Collaborative" },
  { value: "advisor", label: "Advisor" },
  { value: "operator", label: "Operator" },
];

const CONFIDENCE_OPTIONS: Option[] = [
  { value: "cautious", label: "Cautious" },
  { value: "balanced", label: "Balanced" },
  { value: "assertive", label: "Assertive" },
];

const PUSHBACK_OPTIONS: Option[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const TRUTHFULNESS_OPTIONS: Option[] = [
  { value: "strict", label: "Strict" },
  { value: "balanced", label: "Balanced" },
];

const UNCERTAINTY_OPTIONS: Option[] = [
  { value: "explicit", label: "Explicit" },
  { value: "brief", label: "Brief" },
];

const CORRECTIONS_OPTIONS: Option[] = [
  { value: "direct", label: "Direct" },
  { value: "gentle", label: "Gentle" },
];

const RESPONSE_STYLE_OPTIONS: Option[] = [
  { value: "plain", label: "Plain" },
  { value: "structured", label: "Structured" },
  { value: "bullet-first", label: "Bullet-first" },
];

const PREVIEW_MODE_OPTIONS: Array<{ value: PersonalityPreviewMode; label: string }> = [
  { value: "default", label: "Casual" },
  { value: "signal", label: "Signal" },
  { value: "dashboard", label: "Dashboard" },
  { value: "customer_email", label: "Customer Email" },
  { value: "stress_debug", label: "Stress / Debug" },
  { value: "bad_news", label: "Bad News" },
];

const GLOBAL_SCENES: PersonalityScene[] = [
  {
    id: "planner",
    label: "Planner Mode",
    eyebrow: "Steady structure",
    copy: "Turns the voice into a calm operator who sequences work cleanly and keeps the scope honest.",
    mode: "dashboard",
    style: {
      tone: "neutral",
      humor: "off",
      directness: "balanced",
      verbosity: "detailed",
      formality: "neutral",
    },
    authority: {
      stance: "operator",
      confidence: "balanced",
      pushback: "medium",
    },
    guardrails: {
      truthfulness: "strict",
      uncertainty: "explicit",
      corrections: "direct",
    },
  },
  {
    id: "idea-man",
    label: "Idea Man",
    eyebrow: "Free-thinking spark",
    copy: "Keeps the voice looser and more associative without letting it get sloppy or fake-confident.",
    mode: "default",
    style: {
      tone: "playful",
      humor: "playful",
      directness: "balanced",
      verbosity: "detailed",
      formality: "casual",
    },
    authority: {
      stance: "collaborative",
      confidence: "balanced",
      pushback: "low",
    },
    guardrails: {
      truthfulness: "strict",
      uncertainty: "explicit",
      corrections: "gentle",
    },
  },
  {
    id: "steady",
    label: "Back Office Bestie",
    eyebrow: "Warm command",
    copy: "Friendly, manager-like, and useful when the user needs a real partner instead of a lecture.",
    mode: "default",
    style: {
      tone: "warm",
      humor: "light",
      directness: "balanced",
      verbosity: "balanced",
      formality: "casual",
    },
    authority: {
      stance: "advisor",
      confidence: "assertive",
      pushback: "medium",
    },
    guardrails: {
      truthfulness: "strict",
      uncertainty: "brief",
      corrections: "gentle",
    },
  },
];

const CHANNEL_SCENES: PersonalityScene[] = [
  {
    id: "signal",
    label: "Signal Banter",
    eyebrow: "Private lane",
    copy: "Casual, quick, and a little wryer for trusted private chat without changing the core contract.",
    mode: "signal",
    channel: {
      tone: "playful",
      directness: "balanced",
      verbosity: "brief",
      responseStyle: "plain",
    },
  },
  {
    id: "dashboard",
    label: "Dashboard Ops",
    eyebrow: "Read it fast",
    copy: "Structured and operator-friendly when someone needs the answer at a glance.",
    mode: "dashboard",
    channel: {
      tone: "neutral",
      directness: "direct",
      verbosity: "brief",
      responseStyle: "structured",
    },
  },
  {
    id: "customer",
    label: "Customer Safe",
    eyebrow: "Polished surface",
    copy: "Keeps delivery steady and clear when the output needs to feel external-facing.",
    mode: "customer_email",
    channel: {
      tone: "warm",
      directness: "soft",
      verbosity: "balanced",
      responseStyle: "plain",
    },
  },
];

function asRecord(value: unknown): PersonalityRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as PersonalityRecord;
}

function asConfig(value: Record<string, unknown> | null): PersonalityRecord {
  return value ?? {};
}

function asPersonality(value: unknown): PersonalityConfig | undefined {
  const record = asRecord(value);
  return record ? (record as PersonalityConfig) : undefined;
}

function findOptionLabel(options: Option[], value: string | undefined): string {
  if (!value) {
    return "Inherited";
  }
  return options.find((option) => option.value === value)?.label ?? value;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function buildVoiceMetrics(personality: PersonalityConfig | undefined): VoiceMetric[] {
  const tone = personality?.style?.tone;
  const humor = personality?.style?.humor;
  const directness = personality?.style?.directness;
  const verbosity = personality?.style?.verbosity;
  const confidence = personality?.authority?.confidence;
  const pushback = personality?.authority?.pushback;
  const truthfulness = personality?.guardrails?.truthfulness;
  const uncertainty = personality?.guardrails?.uncertainty;

  const warmthScore = clamp01(
    (tone === "warm" ? 0.88 : tone === "playful" ? 0.74 : tone === "neutral" ? 0.52 : 0.3) +
      (humor === "playful" ? 0.14 : humor === "light" ? 0.08 : humor === "dry" ? 0.03 : 0),
  );
  const edgeScore = clamp01(
    (directness === "direct" ? 0.86 : directness === "balanced" ? 0.56 : 0.28) +
      (pushback === "high" ? 0.12 : pushback === "medium" ? 0.06 : 0),
  );
  const presenceScore = clamp01(
    (confidence === "assertive" ? 0.84 : confidence === "balanced" ? 0.58 : 0.34) +
      (verbosity === "detailed" ? 0.1 : verbosity === "balanced" ? 0.05 : 0),
  );
  const guardrailScore = clamp01(
    (truthfulness === "strict" ? 0.9 : 0.64) + (uncertainty === "explicit" ? 0.08 : 0),
  );

  return [
    {
      label: "Warmth",
      value: warmthScore,
      detail: `${findOptionLabel(TONE_OPTIONS, tone)} tone`,
    },
    {
      label: "Edge",
      value: edgeScore,
      detail: `${findOptionLabel(DIRECTNESS_OPTIONS, directness)} delivery`,
    },
    {
      label: "Presence",
      value: presenceScore,
      detail: `${findOptionLabel(CONFIDENCE_OPTIONS, confidence)} confidence`,
    },
    {
      label: "Guardrails",
      value: guardrailScore,
      detail: `${findOptionLabel(TRUTHFULNESS_OPTIONS, truthfulness)} truth`,
    },
  ];
}

function summarizeVoice(personality: PersonalityConfig | undefined): string {
  const parts = [
    findOptionLabel(TONE_OPTIONS, personality?.style?.tone),
    findOptionLabel(DIRECTNESS_OPTIONS, personality?.style?.directness),
    findOptionLabel(CONFIDENCE_OPTIONS, personality?.authority?.confidence),
  ].filter((value) => value !== "Inherited");
  return parts.length > 0 ? parts.join(" / ") : "Calibrating from inherited defaults";
}

function summarizeBoundary(personality: PersonalityConfig | undefined): string {
  const truth = findOptionLabel(TRUTHFULNESS_OPTIONS, personality?.guardrails?.truthfulness);
  const uncertainty = findOptionLabel(UNCERTAINTY_OPTIONS, personality?.guardrails?.uncertainty);
  const corrections = findOptionLabel(CORRECTIONS_OPTIONS, personality?.guardrails?.corrections);
  return (
    [truth, uncertainty, corrections].filter((value) => value !== "Inherited").join(" / ") ||
    "Global guardrails stay inherited"
  );
}

function readChannelOverride(
  personality: PersonalityConfig | undefined,
  channel: string,
): PersonalityChannelOverrideConfig | undefined {
  if (!personality || channel === AGENT_PERSONALITY_ALL_CHANNEL) {
    return undefined;
  }
  const override = personality.channels?.[channel];
  return override ? { ...override } : undefined;
}

function resolveSurfacePersonality(
  personality: PersonalityConfig | undefined,
  channel: string,
): PersonalityConfig | undefined {
  if (!personality) {
    return undefined;
  }
  const override = readChannelOverride(personality, channel);
  if (!override) {
    return personality;
  }
  return {
    ...personality,
    style: {
      ...personality.style,
      tone: override.tone ?? personality.style?.tone,
      directness: override.directness ?? personality.style?.directness,
      verbosity: override.verbosity ?? personality.style?.verbosity,
    },
  };
}

function resolveSurfaceResponseStyle(
  personality: PersonalityConfig | undefined,
  channel: string | undefined,
): PersonalityChannelOverrideConfig["responseStyle"] | undefined {
  if (!channel || channel === AGENT_PERSONALITY_ALL_CHANNEL) {
    return undefined;
  }
  return readChannelOverride(personality, channel)?.responseStyle;
}

function collectChannelIds(
  snapshot: ChannelsStatusSnapshot | null,
  defaultsPersonality: PersonalityConfig | undefined,
  agentPersonality: PersonalityConfig | undefined,
): string[] {
  const ids = new Set<string>([AGENT_PERSONALITY_ALL_CHANNEL]);
  for (const id of snapshot?.channelOrder ?? []) {
    const normalized = id.trim();
    if (normalized) {
      ids.add(normalized);
    }
  }
  for (const meta of snapshot?.channelMeta ?? []) {
    const normalized = meta.id.trim();
    if (normalized) {
      ids.add(normalized);
    }
  }
  for (const source of [defaultsPersonality, agentPersonality]) {
    for (const id of Object.keys(source?.channels ?? {})) {
      const normalized = id.trim();
      if (normalized) {
        ids.add(normalized);
      }
    }
  }
  return [
    AGENT_PERSONALITY_ALL_CHANNEL,
    ...Array.from(ids)
      .filter((id) => id !== AGENT_PERSONALITY_ALL_CHANNEL)
      .toSorted((a, b) => a.localeCompare(b)),
  ];
}

function resolveChannelLabel(snapshot: ChannelsStatusSnapshot | null, id: string): string {
  if (id === AGENT_PERSONALITY_ALL_CHANNEL) {
    return "All channels";
  }
  const metaLabel = snapshot?.channelMeta?.find((entry) => entry.id === id)?.label;
  return metaLabel || snapshot?.channelLabels?.[id] || id;
}

function fieldRelativePath(params: { channel: string; field: EditableField }): string[] {
  if (params.field.kind === "channel") {
    return ["channels", params.channel, params.field.key];
  }
  return [params.field.kind, params.field.key];
}

function joinVoiceSummary(values: Array<string | null | undefined>): string {
  return values.filter((value): value is string => Boolean(value && value.trim())).join(", ");
}

function renderVoiceMetric(metric: VoiceMetric) {
  return html`
    <div class="personality-lab__metric">
      <div class="personality-lab__metric-top">
        <span>${metric.label}</span>
        <strong>${Math.round(metric.value * 100)}%</strong>
      </div>
      <div class="personality-lab__meter" aria-hidden="true">
        <span
          class="personality-lab__meter-fill"
          style=${`width:${Math.max(10, Math.round(metric.value * 100))}%`}
        ></span>
      </div>
      <div class="personality-lab__metric-detail">${metric.detail}</div>
    </div>
  `;
}

function pickOpener(
  personality: PersonalityConfig | undefined,
  mode: PersonalityPreviewMode,
): string {
  const tone = personality?.style?.tone;
  if (mode === "bad_news") {
    return tone === "warm"
      ? "Here's the hard truth, and I'll keep it steady."
      : "Here's the hard truth.";
  }
  if (mode === "stress_debug") {
    return tone === "playful"
      ? "All right, this thing is acting up, so let's get surgical."
      : "Here's the clean read on what's broken.";
  }
  if (mode === "signal") {
    return tone === "playful"
      ? "All right, friend, here's the lay of the land."
      : "Here's the lay of the land.";
  }
  if (mode === "customer_email") {
    return "Hello, here's the clean update.";
  }
  if (mode === "dashboard") {
    return "Status snapshot:";
  }
  switch (tone) {
    case "warm":
      return "I've got you. Here's the clean path.";
    case "playful":
      return "All right, let's make this less messy.";
    case "dry":
      return "Here's the clean read.";
    case "formal":
      return "Here is the recommended path.";
    default:
      return "Here's the situation.";
  }
}

function pickBody(params: {
  personality: PersonalityConfig | undefined;
  mode: PersonalityPreviewMode;
  responseStyle?: PersonalityChannelOverrideConfig["responseStyle"];
}): string {
  const { personality, mode, responseStyle } = params;
  const directness = personality?.style?.directness ?? "balanced";
  const verbosity = personality?.style?.verbosity ?? "balanced";
  const confidence = personality?.authority?.confidence ?? "balanced";
  const structuredLead =
    mode === "dashboard" || mode === "customer_email" || responseStyle === "structured";

  const recommendation =
    confidence === "assertive"
      ? "I recommend we do the simple thing first and verify before we get fancy."
      : confidence === "cautious"
        ? "My best read is to start simple and verify each step as we go."
        : "The clean move is to start simple and verify before we widen scope.";

  const tail =
    directness === "direct"
      ? "No guessing, no drift."
      : directness === "soft"
        ? "We can keep it calm and still stay honest."
        : "Keep it honest and keep it moving.";

  if (structuredLead) {
    return verbosity === "brief"
      ? `1. Confirm the problem.\n2. Fix the shortest path.\n3. Verify the result.\n${tail}`
      : `1. Confirm the exact problem.\n2. Fix the shortest path first.\n3. Verify the result before calling it done.\n${recommendation}\n${tail}`;
  }

  if (verbosity === "brief") {
    return `${recommendation} ${tail}`;
  }
  if (verbosity === "detailed") {
    return `${recommendation} Then we can widen out if the first fix does not hold. ${tail}`;
  }
  return `${recommendation} ${tail}`;
}

function pickCloser(
  personality: PersonalityConfig | undefined,
  mode: PersonalityPreviewMode,
): string {
  const humor = personality?.style?.humor;
  if (mode === "customer_email") {
    return "Thank you.";
  }
  if (mode === "dashboard") {
    return humor === "dry" ? "Nothing cute, just signal." : "Clean and readable.";
  }
  if (humor === "playful") {
    return "Let's keep it cute and correct.";
  }
  if (humor === "dry") {
    return "No need to make it weird.";
  }
  return "I'll keep the wheels on it.";
}

export function buildPersonalitySampleReply(params: {
  personality: PersonalityConfig | undefined;
  mode: PersonalityPreviewMode;
  runtimeChannel?: string;
}): string {
  const surfacePersonality = resolveSurfacePersonality(
    params.personality,
    params.runtimeChannel ?? AGENT_PERSONALITY_ALL_CHANNEL,
  );
  const opener = pickOpener(surfacePersonality, params.mode);
  const body = pickBody({
    personality: surfacePersonality,
    mode: params.mode,
    responseStyle: resolveSurfaceResponseStyle(params.personality, params.runtimeChannel),
  });
  const closer = pickCloser(surfacePersonality, params.mode);
  return [opener, "", body, "", closer].join("\n");
}

function renderSelectField(params: {
  label: string;
  value: string | undefined;
  options: Option[];
  disabled: boolean;
  hint?: string;
  onChange: (value: string | null) => void;
}) {
  return html`
    <label class="field personality-lab__field">
      <span>${params.label}</span>
      <select
        .value=${params.value ?? ""}
        ?disabled=${params.disabled}
        @change=${(event: Event) => {
          const next = (event.target as HTMLSelectElement).value.trim();
          params.onChange(next.length > 0 ? next : null);
        }}
      >
        <option value="">Inherit</option>
        ${params.options.map(
          (option) => html`<option value=${option.value}>${option.label}</option>`,
        )}
      </select>
      ${params.hint ? html`<span class="personality-lab__hint">${params.hint}</span>` : nothing}
    </label>
  `;
}

function renderSceneCard(params: {
  scene: PersonalityScene;
  disabled: boolean;
  onApply: () => void;
}) {
  return html`
    <button
      type="button"
      class="personality-lab__scene"
      ?disabled=${params.disabled}
      @click=${params.onApply}
    >
      <span class="personality-lab__scene-eyebrow">${params.scene.eyebrow}</span>
      <span class="personality-lab__scene-title">${params.scene.label}</span>
      <span class="personality-lab__scene-copy">${params.scene.copy}</span>
      <span class="personality-lab__scene-action">Apply scene</span>
    </button>
  `;
}

type DeltaSpec = {
  label: string;
  currentValue: string | undefined;
  nextValue: string | undefined;
  options: Option[];
};

function buildPersonalityDelta(specs: DeltaSpec[]): PersonalityDeltaItem[] {
  const deltas: PersonalityDeltaItem[] = [];
  for (const spec of specs) {
    const current = findOptionLabel(spec.options, spec.currentValue);
    const next = findOptionLabel(spec.options, spec.nextValue);
    if (current !== next) {
      deltas.push({
        label: spec.label,
        current,
        next,
      });
    }
  }
  return deltas;
}

function buildProfileDelta(params: {
  effectivePersonality: PersonalityConfig | undefined;
  profile: SavedPersonalityProfile | null;
}): PersonalityDeltaItem[] {
  if (!params.profile) {
    return [];
  }

  const profileChannel = params.profile.channel || AGENT_PERSONALITY_ALL_CHANNEL;
  const currentSurface = resolveSurfacePersonality(params.effectivePersonality, profileChannel);
  const nextSurface = resolveSurfacePersonality(params.profile.personality, profileChannel);
  if (profileChannel === AGENT_PERSONALITY_ALL_CHANNEL) {
    return buildPersonalityDelta([
      {
        label: "Tone",
        currentValue: currentSurface?.style?.tone,
        nextValue: nextSurface?.style?.tone,
        options: TONE_OPTIONS,
      },
      {
        label: "Formality",
        currentValue: currentSurface?.style?.formality,
        nextValue: nextSurface?.style?.formality,
        options: FORMALITY_OPTIONS,
      },
      {
        label: "Humor",
        currentValue: currentSurface?.style?.humor,
        nextValue: nextSurface?.style?.humor,
        options: HUMOR_OPTIONS,
      },
      {
        label: "Directness",
        currentValue: currentSurface?.style?.directness,
        nextValue: nextSurface?.style?.directness,
        options: DIRECTNESS_OPTIONS,
      },
      {
        label: "Verbosity",
        currentValue: currentSurface?.style?.verbosity,
        nextValue: nextSurface?.style?.verbosity,
        options: VERBOSITY_OPTIONS,
      },
      {
        label: "Stance",
        currentValue: currentSurface?.authority?.stance,
        nextValue: nextSurface?.authority?.stance,
        options: STANCE_OPTIONS,
      },
      {
        label: "Confidence",
        currentValue: currentSurface?.authority?.confidence,
        nextValue: nextSurface?.authority?.confidence,
        options: CONFIDENCE_OPTIONS,
      },
      {
        label: "Pushback",
        currentValue: currentSurface?.authority?.pushback,
        nextValue: nextSurface?.authority?.pushback,
        options: PUSHBACK_OPTIONS,
      },
      {
        label: "Truthfulness",
        currentValue: currentSurface?.guardrails?.truthfulness,
        nextValue: nextSurface?.guardrails?.truthfulness,
        options: TRUTHFULNESS_OPTIONS,
      },
      {
        label: "Uncertainty",
        currentValue: currentSurface?.guardrails?.uncertainty,
        nextValue: nextSurface?.guardrails?.uncertainty,
        options: UNCERTAINTY_OPTIONS,
      },
      {
        label: "Corrections",
        currentValue: currentSurface?.guardrails?.corrections,
        nextValue: nextSurface?.guardrails?.corrections,
        options: CORRECTIONS_OPTIONS,
      },
    ]);
  }

  return buildPersonalityDelta([
    {
      label: "Tone",
      currentValue: currentSurface?.style?.tone,
      nextValue: nextSurface?.style?.tone,
      options: TONE_OPTIONS,
    },
    {
      label: "Directness",
      currentValue: currentSurface?.style?.directness,
      nextValue: nextSurface?.style?.directness,
      options: DIRECTNESS_OPTIONS,
    },
    {
      label: "Verbosity",
      currentValue: currentSurface?.style?.verbosity,
      nextValue: nextSurface?.style?.verbosity,
      options: VERBOSITY_OPTIONS,
    },
    {
      label: "Response Style",
      currentValue: resolveSurfaceResponseStyle(params.effectivePersonality, profileChannel),
      nextValue: resolveSurfaceResponseStyle(params.profile.personality, profileChannel),
      options: RESPONSE_STYLE_OPTIONS,
    },
  ]);
}

function formatUpdatedAt(timestamp: number): string {
  return new Date(timestamp).toISOString().replace("T", " ").slice(0, 16);
}

export function renderAgentPersonality(params: {
  agentId: string;
  configForm: Record<string, unknown> | null;
  configLoading: boolean;
  configSaving: boolean;
  configApplying: boolean;
  configDirty: boolean;
  channelSnapshot: ChannelsStatusSnapshot | null;
  target: PersonalityTarget;
  channel: string;
  mode: string;
  profileId: string;
  profiles: SavedPersonalityProfile[];
  onTargetChange: (target: PersonalityTarget) => void;
  onChannelChange: (channel: string) => void;
  onModeChange: (mode: PersonalityPreviewMode) => void;
  onProfileChange: (profileId: string) => void;
  onProfileSave: () => void;
  onProfileApply: (profileId: string) => void;
  onProfileRename: (params: { profileId: string; name: string }) => void;
  onProfileDelete: (profileId: string) => void;
  onFieldChange: (params: {
    target: PersonalityTarget;
    path: string[];
    value: string | null;
  }) => void;
  onConfigReload: () => void;
  onConfigSave: () => void;
  onConfigApply: () => void;
}) {
  const resolvedConfig = resolveAgentConfig(params.configForm, params.agentId);
  const defaultsPersonality = asPersonality(resolvedConfig.defaults?.personality);
  const agentPersonality = asPersonality(resolvedConfig.entry?.personality);
  const targetPersonality = params.target === "agent" ? agentPersonality : defaultsPersonality;
  const selectedChannel = params.channel || AGENT_PERSONALITY_ALL_CHANNEL;
  const previewMode = (
    PREVIEW_MODE_OPTIONS.some((option) => option.value === params.mode) ? params.mode : "default"
  ) as PersonalityPreviewMode;
  const channelOptions = collectChannelIds(
    params.channelSnapshot,
    defaultsPersonality,
    agentPersonality,
  );
  const isGlobal = selectedChannel === AGENT_PERSONALITY_ALL_CHANNEL;
  const currentChannelOverride = readChannelOverride(targetPersonality, selectedChannel);
  const effectivePersonality =
    resolvePersonalityConfig(asConfig(params.configForm), params.agentId) ?? targetPersonality;
  const effectiveSurfacePersonality = resolveSurfacePersonality(
    effectivePersonality,
    selectedChannel,
  );
  const effectiveChannel =
    selectedChannel === AGENT_PERSONALITY_ALL_CHANNEL ? undefined : selectedChannel;
  const overlay = compilePersonalityOverlay({
    personality: effectivePersonality,
    runtimeChannel: effectiveChannel,
  });
  const voiceMetrics = buildVoiceMetrics(effectiveSurfacePersonality);
  const previewReply = buildPersonalitySampleReply({
    personality: effectivePersonality,
    mode: previewMode,
    runtimeChannel: effectiveChannel,
  });

  const disabled =
    !params.configForm || params.configLoading || params.configSaving || params.configApplying;
  const canSave = Boolean(params.configForm) && params.configDirty && !params.configSaving;
  const canApply =
    Boolean(params.configForm) &&
    params.configDirty &&
    !params.configSaving &&
    !params.configApplying;

  const baseStyle = targetPersonality?.style;
  const baseAuthority = targetPersonality?.authority;
  const baseGuardrails = targetPersonality?.guardrails;
  const scenes = isGlobal ? GLOBAL_SCENES : CHANNEL_SCENES;
  const visibleProfiles = params.profiles
    .filter((profile) => profile.target === params.target)
    .toSorted(
      (a, b) =>
        (b.metadata?.lastAppliedAt ?? b.updatedAt) - (a.metadata?.lastAppliedAt ?? a.updatedAt) ||
        a.name.localeCompare(b.name),
    );
  const selectedProfile =
    visibleProfiles.find((profile) => profile.id === params.profileId) ??
    visibleProfiles[0] ??
    null;
  const profileSurfacePersonality = selectedProfile
    ? resolveSurfacePersonality(selectedProfile.personality, selectedProfile.channel)
    : undefined;
  const profileChannelLabel = selectedProfile
    ? resolveChannelLabel(params.channelSnapshot, selectedProfile.channel)
    : null;
  const profileDelta = buildProfileDelta({
    effectivePersonality,
    profile: selectedProfile,
  });
  const profilePreviewReply = selectedProfile
    ? buildPersonalitySampleReply({
        personality: selectedProfile.personality,
        mode: previewMode,
        runtimeChannel:
          selectedProfile.channel === AGENT_PERSONALITY_ALL_CHANNEL
            ? undefined
            : selectedProfile.channel,
      })
    : "";
  const profileOverlay = selectedProfile
    ? compilePersonalityOverlay({
        personality: selectedProfile.personality,
        runtimeChannel:
          selectedProfile.channel === AGENT_PERSONALITY_ALL_CHANNEL
            ? undefined
            : selectedProfile.channel,
      })
    : "";

  const applyScene = (scene: PersonalityScene) => {
    params.onModeChange(scene.mode);
    if (isGlobal) {
      for (const [key, value] of Object.entries(scene.style ?? {})) {
        params.onFieldChange({
          target: params.target,
          path: fieldRelativePath({
            channel: selectedChannel,
            field: { kind: "style", key: key as keyof PersonalityStyleConfig },
          }),
          value: value ?? null,
        });
      }
      for (const [key, value] of Object.entries(scene.authority ?? {})) {
        params.onFieldChange({
          target: params.target,
          path: fieldRelativePath({
            channel: selectedChannel,
            field: { kind: "authority", key: key as keyof PersonalityAuthorityConfig },
          }),
          value: value ?? null,
        });
      }
      for (const [key, value] of Object.entries(scene.guardrails ?? {})) {
        params.onFieldChange({
          target: params.target,
          path: fieldRelativePath({
            channel: selectedChannel,
            field: { kind: "guardrails", key: key as keyof PersonalityGuardrailsConfig },
          }),
          value: value ?? null,
        });
      }
      return;
    }
    for (const [key, value] of Object.entries(scene.channel ?? {})) {
      params.onFieldChange({
        target: params.target,
        path: fieldRelativePath({
          channel: selectedChannel,
          field: { kind: "channel", key: key as keyof PersonalityChannelOverrideConfig },
        }),
        value: value ?? null,
      });
    }
  };

  return html`
    <section class="card personality-lab">
      <div class="row personality-lab__header">
        <div style="min-width: 0;">
          <div class="card-title">Personality Lab</div>
          <div class="card-sub">
            Tune voice and posture without weakening truth, evidence, or operator safety.
          </div>
        </div>
        <div class="row personality-lab__actions">
          <button
            class="btn btn--sm"
            ?disabled=${params.configLoading}
            @click=${params.onConfigReload}
          >
            Revert draft
          </button>
          <button class="btn btn--sm primary" ?disabled=${!canSave} @click=${params.onConfigSave}>
            ${params.configSaving ? "Saving..." : "Save config"}
          </button>
          <button class="btn btn--sm" ?disabled=${!canApply} @click=${params.onConfigApply}>
            ${params.configApplying ? "Applying..." : "Apply live"}
          </button>
        </div>
      </div>

      <div class="callout info" style="margin-top: 12px;">
        Personality is adjustable. Integrity is not. This panel writes structured config, then
        compiles it into a prompt overlay for the agent runtime.
      </div>

      <div class="personality-lab__summary">
        <section class="personality-lab__summary-card personality-lab__summary-card--voice">
          <div class="personality-lab__summary-label">Current Voice</div>
          <div class="personality-lab__summary-value">
            ${summarizeVoice(effectiveSurfacePersonality)}
          </div>
          <div class="personality-lab__metric-grid">
            ${voiceMetrics.map((metric) => renderVoiceMetric(metric))}
          </div>
        </section>
        <section class="personality-lab__summary-card">
          <div class="personality-lab__summary-label">Active Layer</div>
          <div class="personality-lab__summary-value">
            ${params.target === "agent" ? "Agent override board" : "Default voice board"}
          </div>
          <div class="personality-lab__summary-copy">
            ${isGlobal
              ? "Editing the baseline voice that the runtime will merge first."
              : "Editing one surface only while the core voice stays anchored globally."}
          </div>
        </section>
        <section class="personality-lab__summary-card">
          <div class="personality-lab__summary-label">Channel Scope</div>
          <div class="personality-lab__summary-value">
            ${resolveChannelLabel(params.channelSnapshot, selectedChannel)}
          </div>
          <div class="personality-lab__summary-copy">
            ${isGlobal
              ? "All channels inherit this posture unless a channel override says otherwise."
              : "This surface gets delivery tuning without mutating identity or proof standards."}
          </div>
        </section>
        <section class="personality-lab__summary-card">
          <div class="personality-lab__summary-label">Boundary Contract</div>
          <div class="personality-lab__summary-value">
            ${summarizeBoundary(effectivePersonality)}
          </div>
          <div class="personality-lab__summary-copy">
            Safety stays above style, and this preview uses the same compiler as the runtime path.
          </div>
        </section>
      </div>

      <div class="personality-lab__context">
        <span class="agent-pill">Agent: ${params.agentId}</span>
        <span class="agent-pill"
          >Layer: ${params.target === "agent" ? "Agent override" : "Defaults"}</span
        >
        <span class="agent-pill"
          >Channel: ${resolveChannelLabel(params.channelSnapshot, selectedChannel)}</span
        >
        <span class="agent-pill"
          >Preview:
          ${PREVIEW_MODE_OPTIONS.find((option) => option.value === previewMode)?.label ??
          "Casual"}</span
        >
      </div>

      <div class="personality-lab__pickers">
        <label class="field">
          <span>Edit Layer</span>
          <select
            .value=${params.target}
            ?disabled=${disabled}
            @change=${(event: Event) =>
              params.onTargetChange((event.target as HTMLSelectElement).value as PersonalityTarget)}
          >
            <option value="agent">Agent override</option>
            <option value="defaults">Defaults</option>
          </select>
        </label>
        <label class="field">
          <span>Channel</span>
          <select
            .value=${selectedChannel}
            ?disabled=${disabled}
            @change=${(event: Event) =>
              params.onChannelChange((event.target as HTMLSelectElement).value)}
          >
            ${channelOptions.map(
              (id) =>
                html`<option value=${id}>
                  ${resolveChannelLabel(params.channelSnapshot, id)}
                </option>`,
            )}
          </select>
        </label>
        <label class="field">
          <span>Preview Mode</span>
          <select
            .value=${previewMode}
            ?disabled=${disabled}
            @change=${(event: Event) =>
              params.onModeChange(
                (event.target as HTMLSelectElement).value as PersonalityPreviewMode,
              )}
          >
            ${PREVIEW_MODE_OPTIONS.map(
              (option) => html`<option value=${option.value}>${option.label}</option>`,
            )}
          </select>
        </label>
        <label class="field">
          <span>Saved Board</span>
          <select
            .value=${selectedProfile?.id ?? ""}
            ?disabled=${disabled || visibleProfiles.length === 0}
            @change=${(event: Event) =>
              params.onProfileChange((event.target as HTMLSelectElement).value)}
          >
            <option value="">
              ${visibleProfiles.length === 0 ? "No saved boards yet" : "Select a board"}
            </option>
            ${visibleProfiles.map(
              (profile) => html`<option value=${profile.id}>${profile.name}</option>`,
            )}
          </select>
        </label>
      </div>

      <div class="personality-lab__profile-actions">
        <button
          class="btn btn--sm btn--ghost"
          ?disabled=${disabled || !targetPersonality}
          @click=${params.onProfileSave}
        >
          Save board
        </button>
        <button
          class="btn btn--sm"
          ?disabled=${disabled || !selectedProfile}
          @click=${() => selectedProfile && params.onProfileApply(selectedProfile.id)}
        >
          Apply board
        </button>
        <button
          class="btn btn--sm btn--ghost"
          ?disabled=${disabled || !selectedProfile}
          @click=${() => {
            if (!selectedProfile) {
              return;
            }
            const nextName = window.prompt("Rename this saved board", selectedProfile.name)?.trim();
            if (!nextName) {
              return;
            }
            params.onProfileRename({ profileId: selectedProfile.id, name: nextName });
          }}
        >
          Rename board
        </button>
        <button
          class="btn btn--sm btn--ghost"
          ?disabled=${disabled || !selectedProfile}
          @click=${() => selectedProfile && params.onProfileDelete(selectedProfile.id)}
        >
          Delete Board
        </button>
      </div>

      ${selectedProfile
        ? html`
            <section class="personality-lab__board-snapshot">
              <div class="personality-lab__board-header">
                <div>
                  <div class="personality-lab__group-title">Saved Board Snapshot</div>
                  <div class="personality-lab__group-copy">
                    Compare this board to the current effective voice before applying it.
                  </div>
                </div>
                <div class="personality-lab__board-name">${selectedProfile.name}</div>
              </div>
              <div class="personality-lab__board-meta">
                <span class="agent-pill"
                  >Layer:
                  ${selectedProfile.target === "agent" ? "Agent override" : "Defaults"}</span
                >
                <span class="agent-pill">Channel: ${profileChannelLabel ?? "Unknown"}</span>
                <span class="agent-pill">Saved: ${formatUpdatedAt(selectedProfile.updatedAt)}</span>
                ${selectedProfile.metadata?.lastAppliedAt
                  ? html`<span class="agent-pill"
                      >Last used: ${formatUpdatedAt(selectedProfile.metadata.lastAppliedAt)}</span
                    >`
                  : nothing}
                ${typeof selectedProfile.metadata?.applyCount === "number"
                  ? html`<span class="agent-pill"
                      >Uses: ${selectedProfile.metadata.applyCount}</span
                    >`
                  : nothing}
              </div>
              <div class="personality-lab__board-summary-grid">
                <section class="personality-lab__board-summary">
                  <div class="personality-lab__summary-label">Board Voice</div>
                  <div class="personality-lab__summary-value">
                    ${summarizeVoice(profileSurfacePersonality)}
                  </div>
                  <div class="personality-lab__summary-copy">
                    ${selectedProfile.summary ?? summarizeBoundary(selectedProfile.personality)}
                  </div>
                </section>
                <section class="personality-lab__board-summary">
                  <div class="personality-lab__summary-label">What Changes</div>
                  <div class="personality-lab__delta-list">
                    ${profileDelta.length > 0
                      ? profileDelta.map(
                          (item) => html`
                            <div class="personality-lab__delta-item">
                              <span class="personality-lab__delta-label">${item.label}</span>
                              <span class="personality-lab__delta-values"
                                >${item.current} -> ${item.next}</span
                              >
                            </div>
                          `,
                        )
                      : html`<span class="personality-lab__delta-empty">
                          No trait shifts from the current board.
                        </span>`}
                  </div>
                </section>
              </div>
            </section>
          `
        : nothing}

      <section class="personality-lab__scene-strip">
        <div class="personality-lab__group-title">
          ${isGlobal ? "Voice Scenes" : "Channel Scenes"}
        </div>
        <div class="personality-lab__group-copy">
          ${isGlobal
            ? "Quick-start the board with a personality stance, then fine-tune the edges."
            : "Shape one delivery surface fast without changing the deeper personality contract."}
        </div>
        <div class="personality-lab__scene-grid">
          ${scenes.map((scene) =>
            renderSceneCard({
              scene,
              disabled,
              onApply: () => applyScene(scene),
            }),
          )}
        </div>
      </section>

      ${isGlobal
        ? html`
            <div class="personality-lab__grid personality-lab__grid--quad">
              <section class="personality-lab__group personality-lab__group--heart">
                <div class="personality-lab__group-title">Heart</div>
                <div class="personality-lab__group-copy">
                  Warmth, playfulness, and how the agent lands emotionally.
                </div>
                ${renderSelectField({
                  label: "Tone",
                  value: baseStyle?.tone,
                  options: TONE_OPTIONS,
                  disabled,
                  hint: joinVoiceSummary([baseStyle?.tone, baseStyle?.formality]) || "Inherited",
                  onChange: (value) =>
                    params.onFieldChange({
                      target: params.target,
                      path: fieldRelativePath({
                        channel: selectedChannel,
                        field: { kind: "style", key: "tone" },
                      }),
                      value,
                    }),
                })}
                ${renderSelectField({
                  label: "Formality",
                  value: baseStyle?.formality,
                  options: FORMALITY_OPTIONS,
                  disabled,
                  onChange: (value) =>
                    params.onFieldChange({
                      target: params.target,
                      path: fieldRelativePath({
                        channel: selectedChannel,
                        field: { kind: "style", key: "formality" },
                      }),
                      value,
                    }),
                })}
                ${renderSelectField({
                  label: "Humor",
                  value: baseStyle?.humor,
                  options: HUMOR_OPTIONS,
                  disabled,
                  onChange: (value) =>
                    params.onFieldChange({
                      target: params.target,
                      path: fieldRelativePath({
                        channel: selectedChannel,
                        field: { kind: "style", key: "humor" },
                      }),
                      value,
                    }),
                })}
              </section>

              <section class="personality-lab__group personality-lab__group--mouth">
                <div class="personality-lab__group-title">Mouth</div>
                <div class="personality-lab__group-copy">
                  Directness, pacing, and how the agent phrases the answer.
                </div>
                ${renderSelectField({
                  label: "Directness",
                  value: baseStyle?.directness,
                  options: DIRECTNESS_OPTIONS,
                  disabled,
                  onChange: (value) =>
                    params.onFieldChange({
                      target: params.target,
                      path: fieldRelativePath({
                        channel: selectedChannel,
                        field: { kind: "style", key: "directness" },
                      }),
                      value,
                    }),
                })}
                ${renderSelectField({
                  label: "Verbosity",
                  value: baseStyle?.verbosity,
                  options: VERBOSITY_OPTIONS,
                  disabled,
                  onChange: (value) =>
                    params.onFieldChange({
                      target: params.target,
                      path: fieldRelativePath({
                        channel: selectedChannel,
                        field: { kind: "style", key: "verbosity" },
                      }),
                      value,
                    }),
                })}
              </section>

              <section class="personality-lab__group personality-lab__group--spine">
                <div class="personality-lab__group-title">Spine</div>
                <div class="personality-lab__group-copy">
                  The agent's operational posture under pressure.
                </div>
                ${renderSelectField({
                  label: "Stance",
                  value: baseAuthority?.stance,
                  options: STANCE_OPTIONS,
                  disabled,
                  onChange: (value) =>
                    params.onFieldChange({
                      target: params.target,
                      path: fieldRelativePath({
                        channel: selectedChannel,
                        field: { kind: "authority", key: "stance" },
                      }),
                      value,
                    }),
                })}
                ${renderSelectField({
                  label: "Confidence",
                  value: baseAuthority?.confidence,
                  options: CONFIDENCE_OPTIONS,
                  disabled,
                  onChange: (value) =>
                    params.onFieldChange({
                      target: params.target,
                      path: fieldRelativePath({
                        channel: selectedChannel,
                        field: { kind: "authority", key: "confidence" },
                      }),
                      value,
                    }),
                })}
                ${renderSelectField({
                  label: "Pushback",
                  value: baseAuthority?.pushback,
                  options: PUSHBACK_OPTIONS,
                  disabled,
                  onChange: (value) =>
                    params.onFieldChange({
                      target: params.target,
                      path: fieldRelativePath({
                        channel: selectedChannel,
                        field: { kind: "authority", key: "pushback" },
                      }),
                      value,
                    }),
                })}
              </section>

              <section class="personality-lab__group personality-lab__group--guardrails">
                <div class="personality-lab__group-title">Guardrails</div>
                <div class="personality-lab__group-copy">
                  These shape delivery, but they never loosen truth or proof standards.
                </div>
                ${renderSelectField({
                  label: "Truthfulness",
                  value: baseGuardrails?.truthfulness,
                  options: TRUTHFULNESS_OPTIONS,
                  disabled,
                  onChange: (value) =>
                    params.onFieldChange({
                      target: params.target,
                      path: fieldRelativePath({
                        channel: selectedChannel,
                        field: { kind: "guardrails", key: "truthfulness" },
                      }),
                      value,
                    }),
                })}
                ${renderSelectField({
                  label: "Uncertainty",
                  value: baseGuardrails?.uncertainty,
                  options: UNCERTAINTY_OPTIONS,
                  disabled,
                  onChange: (value) =>
                    params.onFieldChange({
                      target: params.target,
                      path: fieldRelativePath({
                        channel: selectedChannel,
                        field: { kind: "guardrails", key: "uncertainty" },
                      }),
                      value,
                    }),
                })}
                ${renderSelectField({
                  label: "Corrections",
                  value: baseGuardrails?.corrections,
                  options: CORRECTIONS_OPTIONS,
                  disabled,
                  onChange: (value) =>
                    params.onFieldChange({
                      target: params.target,
                      path: fieldRelativePath({
                        channel: selectedChannel,
                        field: { kind: "guardrails", key: "corrections" },
                      }),
                      value,
                    }),
                })}
              </section>
            </div>
          `
        : html`
            <div class="personality-lab__grid">
              <section class="personality-lab__group personality-lab__group--channel">
                <div class="personality-lab__group-title">Channel Override</div>
                <div class="personality-lab__group-copy">
                  This layer only changes the selected channel. Base identity still comes from the
                  global profile.
                </div>
                ${renderSelectField({
                  label: "Tone",
                  value: currentChannelOverride?.tone,
                  options: TONE_OPTIONS,
                  disabled,
                  onChange: (value) =>
                    params.onFieldChange({
                      target: params.target,
                      path: fieldRelativePath({
                        channel: selectedChannel,
                        field: { kind: "channel", key: "tone" },
                      }),
                      value,
                    }),
                })}
                ${renderSelectField({
                  label: "Directness",
                  value: currentChannelOverride?.directness,
                  options: DIRECTNESS_OPTIONS,
                  disabled,
                  onChange: (value) =>
                    params.onFieldChange({
                      target: params.target,
                      path: fieldRelativePath({
                        channel: selectedChannel,
                        field: { kind: "channel", key: "directness" },
                      }),
                      value,
                    }),
                })}
                ${renderSelectField({
                  label: "Verbosity",
                  value: currentChannelOverride?.verbosity,
                  options: VERBOSITY_OPTIONS,
                  disabled,
                  onChange: (value) =>
                    params.onFieldChange({
                      target: params.target,
                      path: fieldRelativePath({
                        channel: selectedChannel,
                        field: { kind: "channel", key: "verbosity" },
                      }),
                      value,
                    }),
                })}
                ${renderSelectField({
                  label: "Response Style",
                  value: currentChannelOverride?.responseStyle,
                  options: RESPONSE_STYLE_OPTIONS,
                  disabled,
                  onChange: (value) =>
                    params.onFieldChange({
                      target: params.target,
                      path: fieldRelativePath({
                        channel: selectedChannel,
                        field: { kind: "channel", key: "responseStyle" },
                      }),
                      value,
                    }),
                })}
              </section>

              <section class="personality-lab__group personality-lab__group--guardrails">
                <div class="personality-lab__group-title">Guardrails Stay Global</div>
                <div class="personality-lab__group-copy">
                  Channel overrides only tune delivery. Truthfulness, uncertainty handling, and
                  correction style stay in the global personality layer so the agent does not drift
                  by surface.
                </div>
                <pre class="code-block personality-lab__preview">
${overlay ?? "No compiled overlay yet."}</pre
                >
              </section>
            </div>
          `}

      <div class="personality-lab__preview-grid">
        <section class="personality-lab__preview-card personality-lab__preview-card--sample">
          <div class="personality-lab__group-title">Sample Reply</div>
          <div class="personality-lab__group-copy">
            A deterministic preview for the selected mode so you can feel the voice before applying
            it.
          </div>
          <pre class="code-block personality-lab__preview">${previewReply}</pre>
        </section>

        ${selectedProfile
          ? html`
              <section class="personality-lab__preview-card personality-lab__preview-card--board">
                <div class="personality-lab__group-title">Saved Board Reply</div>
                <div class="personality-lab__group-copy">
                  Same scenario, rendered with the selected board for a direct before/after read.
                </div>
                <pre class="code-block personality-lab__preview">${profilePreviewReply}</pre>
              </section>
            `
          : nothing}

        <section class="personality-lab__preview-card personality-lab__preview-card--overlay">
          <div class="personality-lab__group-title">Compiled Overlay</div>
          <div class="personality-lab__group-copy">
            This is the prompt overlay the runtime will inject after safety rules.
          </div>
          <pre class="code-block personality-lab__preview">
${overlay ?? "No overlay generated yet."}</pre
          >
          ${selectedProfile
            ? html`
                <div class="personality-lab__group-copy personality-lab__overlay-compare-copy">
                  Saved board overlay (comparison):
                </div>
                <pre class="code-block personality-lab__preview">
${profileOverlay ?? "No overlay generated for selected board."}</pre
                >
              `
            : nothing}
        </section>
      </div>
    </section>
  `;
}
