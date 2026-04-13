import type { OpenClawConfig } from "../config/config.js";
import type {
  PersonalityChannelOverrideConfig,
  PersonalityConfig,
} from "../config/types.personality.js";

type ResolvedChannelOverride = {
  channel: string;
  override: PersonalityChannelOverrideConfig;
};

const CHANNEL_OVERRIDE_PART_ORDER = ["tone", "directness", "verbosity", "responseStyle"] as const;

function compactObject<T extends Record<string, unknown>>(value: T | undefined): T | undefined {
  if (!value) {
    return undefined;
  }
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined);
  if (entries.length === 0) {
    return undefined;
  }
  return Object.fromEntries(entries) as T;
}

function mergeChannelMaps(
  base?: PersonalityConfig["channels"],
  override?: PersonalityConfig["channels"],
): PersonalityConfig["channels"] {
  const mergedByNormalized = new Map<
    string,
    { key: string; value: PersonalityChannelOverrideConfig }
  >();

  const applyEntries = (
    source: PersonalityConfig["channels"] | undefined,
    preferSourceKey: boolean,
  ) => {
    if (!source) {
      return;
    }
    for (const [rawKey, rawValue] of Object.entries(source)) {
      const key = rawKey.trim();
      if (!key) {
        continue;
      }
      const value = compactObject(rawValue);
      if (!value) {
        continue;
      }
      const normalized = key.toLowerCase();
      const previous = mergedByNormalized.get(normalized);
      mergedByNormalized.set(normalized, {
        key: preferSourceKey || !previous ? key : previous.key,
        value: compactObject({ ...previous?.value, ...value }) ?? {},
      });
    }
  };

  applyEntries(base, false);
  applyEntries(override, true);

  const entries = Array.from(mergedByNormalized.values()).toSorted((a, b) =>
    a.key.localeCompare(b.key),
  );
  if (entries.length === 0) {
    return undefined;
  }
  return Object.fromEntries(entries.map((entry) => [entry.key, entry.value]));
}

function mergePersonalityConfigs(
  base?: PersonalityConfig,
  override?: PersonalityConfig,
): PersonalityConfig | undefined {
  const style = compactObject({ ...base?.style, ...override?.style });
  const authority = compactObject({ ...base?.authority, ...override?.authority });
  const guardrails = compactObject({ ...base?.guardrails, ...override?.guardrails });
  const channels = mergeChannelMaps(base?.channels, override?.channels);
  const enabled = override?.enabled ?? base?.enabled;

  if (
    enabled === undefined &&
    !style &&
    !authority &&
    !guardrails &&
    (!channels || Object.keys(channels).length === 0)
  ) {
    return undefined;
  }

  return compactObject({
    enabled,
    style,
    authority,
    channels,
    guardrails,
  });
}

export function resolvePersonalityConfig(
  cfg?: OpenClawConfig,
  agentId?: string,
  _runtimeChannel?: string,
): PersonalityConfig | undefined {
  if (!cfg) {
    return undefined;
  }
  const defaults = cfg.agents?.defaults?.personality;
  const normalizedAgentId = agentId?.trim().toLowerCase();
  const perAgent =
    normalizedAgentId && Array.isArray(cfg.agents?.list)
      ? cfg.agents.list.find(
          (entry) =>
            entry &&
            typeof entry === "object" &&
            typeof entry.id === "string" &&
            entry.id.trim().toLowerCase() === normalizedAgentId,
        )?.personality
      : undefined;
  const merged = mergePersonalityConfigs(defaults, perAgent);
  if (!merged || merged.enabled === false) {
    return undefined;
  }
  return merged;
}

export const resolveEffectivePersonalityConfig = resolvePersonalityConfig;

function resolveChannelOverride(params: {
  channels?: PersonalityConfig["channels"];
  runtimeChannel?: string;
}): ResolvedChannelOverride | undefined {
  const runtimeChannel = params.runtimeChannel?.trim().toLowerCase();
  if (!runtimeChannel || !params.channels) {
    return undefined;
  }
  const entries = Object.entries(params.channels).toSorted(([left], [right]) =>
    left.localeCompare(right),
  );
  for (const [channel, override] of entries) {
    if (channel.trim().toLowerCase() !== runtimeChannel) {
      continue;
    }
    const compacted = compactObject(override);
    if (!compacted) {
      return undefined;
    }
    return { channel, override: compacted };
  }
  return undefined;
}

function buildBehaviorLines(params: {
  personality: PersonalityConfig;
  channelOverride?: ResolvedChannelOverride;
}): string[] {
  const lines: string[] = [];
  const style = params.personality.style;
  const authority = params.personality.authority;
  const override = params.channelOverride?.override;

  const communicationParts: string[] = [];
  const tone = override?.tone ?? style?.tone;
  const directness = override?.directness ?? style?.directness;
  const verbosity = override?.verbosity ?? style?.verbosity;
  if (tone) {
    communicationParts.push(`tone=${tone}`);
  }
  if (directness) {
    communicationParts.push(`directness=${directness}`);
  }
  if (verbosity) {
    communicationParts.push(`verbosity=${verbosity}`);
  }
  if (communicationParts.length > 0) {
    lines.push(`- Communication: ${communicationParts.join(", ")}.`);
  }
  if (style?.humor) {
    lines.push(`- Humor: ${style.humor}.`);
  }
  if (style?.formality) {
    lines.push(`- Formality: ${style.formality}.`);
  }

  const authorityParts: string[] = [];
  if (authority?.stance) {
    authorityParts.push(`stance=${authority.stance}`);
  }
  if (authority?.confidence) {
    authorityParts.push(`confidence=${authority.confidence}`);
  }
  if (authority?.pushback) {
    authorityParts.push(`pushback=${authority.pushback}`);
  }
  if (authorityParts.length > 0) {
    lines.push(`- Authority: ${authorityParts.join(", ")}.`);
  }

  if (params.channelOverride) {
    const channelParts: string[] = [];
    for (const field of CHANNEL_OVERRIDE_PART_ORDER) {
      const value = params.channelOverride.override[field];
      if (!value) {
        continue;
      }
      channelParts.push(`${field}=${value}`);
    }
    if (channelParts.length > 0) {
      lines.push(
        `- Channel override (${params.channelOverride.channel}): ${channelParts.join(", ")}.`,
      );
    }
  }

  return lines;
}

function buildGuardrailLines(personality: PersonalityConfig): string[] {
  const guardrails = personality.guardrails;
  if (!guardrails) {
    return [];
  }
  const lines: string[] = [];
  if (guardrails.truthfulness) {
    lines.push(`- Truthfulness: ${guardrails.truthfulness}.`);
  }
  if (guardrails.uncertainty) {
    lines.push(`- Uncertainty handling: ${guardrails.uncertainty}.`);
  }
  if (guardrails.corrections) {
    lines.push(`- Correction style: ${guardrails.corrections}.`);
  }
  return lines;
}

type PersonalityOverlayCompileInput =
  | PersonalityConfig
  | {
      personality?: PersonalityConfig;
      runtimeChannel?: string;
    }
  | undefined;

function isCompileOptionsObject(
  value: PersonalityOverlayCompileInput,
): value is { personality?: PersonalityConfig; runtimeChannel?: string } {
  return Boolean(value) && typeof value === "object" && "personality" in value;
}

export function compilePersonalityOverlay(
  input?: PersonalityOverlayCompileInput,
  options?: { channel?: string },
): string | undefined {
  const personality = isCompileOptionsObject(input) ? input.personality : input;
  const runtimeChannel = isCompileOptionsObject(input) ? input.runtimeChannel : options?.channel;
  if (!personality || personality.enabled === false) {
    return undefined;
  }

  const channelOverride = resolveChannelOverride({
    channels: personality.channels,
    runtimeChannel,
  });
  const behaviorLines = buildBehaviorLines({
    personality,
    channelOverride,
  });
  const guardrailLines = buildGuardrailLines(personality);

  if (behaviorLines.length === 0 && guardrailLines.length === 0) {
    return undefined;
  }

  const lines: string[] = [];
  if (behaviorLines.length > 0) {
    lines.push("### Behavior", ...behaviorLines);
  }
  if (guardrailLines.length > 0) {
    if (lines.length > 0) {
      lines.push("");
    }
    lines.push("### Truth & Integrity Guardrails", ...guardrailLines);
  }
  return lines.join("\n");
}

export function compilePersonalityOverlayForAgent(params: {
  cfg?: OpenClawConfig;
  agentId?: string;
  runtimeChannel?: string;
}): string | undefined {
  const personality = resolvePersonalityConfig(params.cfg, params.agentId);
  return compilePersonalityOverlay(personality, { channel: params.runtimeChannel });
}
