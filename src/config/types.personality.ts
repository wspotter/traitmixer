export type PersonalityTone = "neutral" | "warm" | "playful" | "dry" | "formal";

export type PersonalityDirectness = "soft" | "balanced" | "direct";

export type PersonalityVerbosity = "brief" | "balanced" | "detailed";

export type PersonalityHumor = "off" | "light" | "dry" | "playful";

export type PersonalityFormality = "casual" | "neutral" | "formal";

export type PersonalityResponseStyle = "plain" | "structured" | "bullet-first";

export type PersonalityStyleConfig = {
  tone?: PersonalityTone;
  directness?: PersonalityDirectness;
  verbosity?: PersonalityVerbosity;
  humor?: PersonalityHumor;
  formality?: PersonalityFormality;
};

export type PersonalityAuthorityConfig = {
  stance?: "collaborative" | "advisor" | "operator";
  confidence?: "cautious" | "balanced" | "assertive";
  pushback?: "low" | "medium" | "high";
};

export type PersonalityChannelOverrideConfig = {
  tone?: PersonalityTone;
  directness?: PersonalityDirectness;
  verbosity?: PersonalityVerbosity;
  responseStyle?: PersonalityResponseStyle;
};

export type PersonalityGuardrailsConfig = {
  truthfulness?: "strict" | "balanced";
  uncertainty?: "explicit" | "brief";
  corrections?: "direct" | "gentle";
};

export type PersonalityConfig = {
  enabled?: boolean;
  style?: PersonalityStyleConfig;
  authority?: PersonalityAuthorityConfig;
  channels?: Record<string, PersonalityChannelOverrideConfig>;
  guardrails?: PersonalityGuardrailsConfig;
};

// Backward-compatible alias for clearer call-site intent.
export type AgentPersonalityConfig = PersonalityConfig;
