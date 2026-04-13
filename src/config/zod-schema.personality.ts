import { z } from "zod";

const PersonalityToneSchema = z.enum(["neutral", "warm", "playful", "dry", "formal"]);
const PersonalityDirectnessSchema = z.enum(["soft", "balanced", "direct"]);
const PersonalityVerbositySchema = z.enum(["brief", "balanced", "detailed"]);
const PersonalityHumorSchema = z.enum(["off", "light", "dry", "playful"]);
const PersonalityFormalitySchema = z.enum(["casual", "neutral", "formal"]);
const PersonalityResponseStyleSchema = z.enum(["plain", "structured", "bullet-first"]);

const PersonalityStyleSchema = z
  .object({
    tone: PersonalityToneSchema.optional(),
    directness: PersonalityDirectnessSchema.optional(),
    verbosity: PersonalityVerbositySchema.optional(),
    humor: PersonalityHumorSchema.optional(),
    formality: PersonalityFormalitySchema.optional(),
  })
  .strict()
  .optional();

const PersonalityAuthoritySchema = z
  .object({
    stance: z.enum(["collaborative", "advisor", "operator"]).optional(),
    confidence: z.enum(["cautious", "balanced", "assertive"]).optional(),
    pushback: z.enum(["low", "medium", "high"]).optional(),
  })
  .strict()
  .optional();

const PersonalityChannelOverrideSchema = z
  .object({
    tone: PersonalityToneSchema.optional(),
    directness: PersonalityDirectnessSchema.optional(),
    verbosity: PersonalityVerbositySchema.optional(),
    responseStyle: PersonalityResponseStyleSchema.optional(),
  })
  .strict();

const PersonalityGuardrailsSchema = z
  .object({
    truthfulness: z.enum(["strict", "balanced"]).optional(),
    uncertainty: z.enum(["explicit", "brief"]).optional(),
    corrections: z.enum(["direct", "gentle"]).optional(),
  })
  .strict()
  .optional();

export const PersonalitySchema = z
  .object({
    enabled: z.boolean().optional(),
    style: PersonalityStyleSchema,
    authority: PersonalityAuthoritySchema,
    channels: z.record(z.string(), PersonalityChannelOverrideSchema).optional(),
    guardrails: PersonalityGuardrailsSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    const channelKeys = Object.keys(value.channels ?? {});
    if (channelKeys.length > 12) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["channels"],
        message: "personality.channels supports up to 12 channel overrides.",
      });
    }
    for (const key of channelKeys) {
      if (!key.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["channels", key],
          message: "personality.channels keys must be non-empty channel names.",
        });
      }
    }
  })
  .optional();

// Backward-compatible alias for callers that prefer explicit config naming.
export const PersonalityConfigSchema = PersonalitySchema;
