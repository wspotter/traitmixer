export type PersonalityTraits = {
  humor?: number;       // 0-100
  flirting?: number;    // 0-100
  optimism?: number;    // 0-100
  directness?: number;  // 0-100
  sarcasm?: number;     // 0-100
  confidence?: number;  // 0-100
  empathy?: number;     // 0-100
  complexity?: number;  // 0-100
  creativity?: number;  // 0-100
  caution?: number;     // 0-100
  formality?: number;   // 0-100
  verbosity?: number;   // 0-100
  rating?: number;      // 0-100
};

export type PersonalityConfig = {
  enabled?: boolean;
  traits?: PersonalityTraits;
  channels?: Record<string, Partial<PersonalityTraits>>;
};

export type TraitMixerConfig = {
  agents?: {
    defaults?: {
      personality?: PersonalityConfig;
    };
    list?: Array<{
      id?: string;
      personality?: PersonalityConfig;
      [key: string]: unknown;
    }>;
  };
};

export type AgentPersonalityConfig = PersonalityConfig;
