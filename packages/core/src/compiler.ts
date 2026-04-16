import type { PersonalityConfig, PersonalityTraits, TraitMixerConfig } from "./types.js";

function compactObject<T extends Record<string, unknown>>(value: T | undefined): T | undefined {
  if (!value) return undefined;
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries) as T;
}

function mergeTraits(base?: PersonalityTraits, override?: Partial<PersonalityTraits>): PersonalityTraits | undefined {
  return compactObject({ ...base, ...override });
}

export function resolvePersonalityConfig(
  cfg?: TraitMixerConfig,
  agentId?: string,
): PersonalityConfig | undefined {
  if (!cfg) return undefined;
  const defaults = cfg.agents?.defaults?.personality;
  const list = cfg.agents?.list;
  const agent = agentId && list ? list.find((a) => a.id?.toLowerCase() === agentId.toLowerCase())?.personality : undefined;

  const enabled = agent?.enabled ?? defaults?.enabled;
  const traits = mergeTraits(defaults?.traits, agent?.traits);
  
  let channels: Record<string, Partial<PersonalityTraits>> | undefined = undefined;
  if (defaults?.channels || agent?.channels) {
    channels = {};
    const allKeys = new Set([...Object.keys(defaults?.channels || {}), ...Object.keys(agent?.channels || {})]);
    for (const key of allKeys) {
      channels[key] = { ...(defaults?.channels?.[key] || {}), ...((agent?.channels?.[key] || {}) as any) };
    }
  }

  if (enabled === false || (!traits && !channels)) return undefined;

  return compactObject({ enabled, traits, channels });
}

export const resolveEffectivePersonalityConfig = resolvePersonalityConfig;

function resolveChannelOverride(
  personality: PersonalityConfig,
  channel?: string
): PersonalityTraits | undefined {
  if (!channel || !personality.channels) return undefined;
  return personality.channels[channel.toLowerCase()];
}

function interpretSlider(name: string, value: number, labels: [string, string, string]): string {
  let label = labels[1];
  if (value < 33) label = labels[0];
  if (value >= 67) label = labels[2];
  return `- ${name}: ${value}% (${label})`;
}

export function compilePersonalityOverlay(
  input?: PersonalityConfig | { personality?: PersonalityConfig; runtimeChannel?: string },
  options?: { channel?: string }
): string | undefined {
  const isWrapped = input && typeof input === "object" && "personality" in input;
  const personality = isWrapped ? (input as any).personality : input;
  const runtimeChannel = isWrapped ? (input as any).runtimeChannel : options?.channel;

  if (!personality || personality.enabled === false) return undefined;

  const override = resolveChannelOverride(personality, runtimeChannel);
  const effectiveTraits = mergeTraits(personality.traits, override);

  if (!effectiveTraits || Object.keys(effectiveTraits).length === 0) return undefined;

  const lines: string[] = ["### Personality & Tone Mixer Settings"];
  
  if (effectiveTraits.humor !== undefined) {
    lines.push(interpretSlider("Humor", effectiveTraits.humor, ["Serious/Dry", "Lighthearted", "Hilarious/Playful"]));
  }
  if (effectiveTraits.flirting !== undefined) {
    lines.push(interpretSlider("Flirting", effectiveTraits.flirting, ["Strictly Professional", "Friendly", "Shamelessly Flirty/Sexy"]));
  }
  if (effectiveTraits.sarcasm !== undefined) {
    lines.push(interpretSlider("Sarcasm", effectiveTraits.sarcasm, ["Earnest/Sincere", "Occasional Snark", "Bitingly Sarcastic"]));
  }
  if (effectiveTraits.optimism !== undefined) {
    lines.push(interpretSlider("Optimism", effectiveTraits.optimism, ["Cynical/Pessimistic", "Realistic/Balanced", "Highly Optimistic"]));
  }
  if (effectiveTraits.directness !== undefined) {
    lines.push(interpretSlider("Directness", effectiveTraits.directness, ["Soft/Polite", "Clear/Balanced", "Brutally Blunt"]));
  }
  if (effectiveTraits.verbosity !== undefined) {
    lines.push(interpretSlider("Verbosity", effectiveTraits.verbosity, ["Extremely Brief", "Moderately Detailed", "Very Chatty/Verbose"]));
  }
  if (effectiveTraits.confidence !== undefined) {
    lines.push(interpretSlider("Confidence", effectiveTraits.confidence, ["Timid/Unsure", "Confident/Assertive", "Arrogant/Cocky"]));
  }
  if (effectiveTraits.empathy !== undefined) {
    lines.push(interpretSlider("Empathy", effectiveTraits.empathy, ["Cold/Robotic", "Friendly", "Warm/Nurturing"]));
  }
  if (effectiveTraits.complexity !== undefined) {
    lines.push(interpretSlider("Complexity", effectiveTraits.complexity, ["Layman/Simple", "Professional", "Academic/Jargon"]));
  }
  if (effectiveTraits.creativity !== undefined) {
    lines.push(interpretSlider("Creativity", effectiveTraits.creativity, ["Strict/Literal", "Flexible", "Poetic/Abstract"]));
  }
  if (effectiveTraits.caution !== undefined) {
    lines.push(interpretSlider("Caution", effectiveTraits.caution, ["Reckless/Bold", "Careful", "Paranoid/Safe"]));
  }
  if (effectiveTraits.formality !== undefined) {
    lines.push(interpretSlider("Formality", effectiveTraits.formality, ["Street Slang", "Casual", "Stiff/Formal"]));
  }
  if (effectiveTraits.rating !== undefined) {
    let ratingStr = "PG-13";
    if (effectiveTraits.rating <= 25) ratingStr = "G (Strictly Family Friendly)";
    else if (effectiveTraits.rating <= 50) ratingStr = "PG (General Audience)";
    else if (effectiveTraits.rating <= 75) ratingStr = "R (Mature, Profanity allowed)";
    else ratingStr = "XXX (Unrestricted, NSFW, Explicit allowed)";
    lines.push(`- Content Rating: ${effectiveTraits.rating}% (${ratingStr})`);
  }

  if (lines.length === 1) return undefined;

  lines.push("");
  lines.push("INSTRUCTION: Adopt the above personality traits strictly. The percentages indicate the intensity of each trait on a scale from 0 to 100.");

  return lines.join("\n");
}

export function compilePersonalityOverlayForAgent(params: {
  cfg?: TraitMixerConfig;
  agentId?: string;
  runtimeChannel?: string;
}): string | undefined {
  const personality = resolvePersonalityConfig(params.cfg, params.agentId);
  return compilePersonalityOverlay(personality, { channel: params.runtimeChannel });
}
