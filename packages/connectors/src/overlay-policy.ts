const CONSTRAINED_MODEL_REWRITES: Array<[RegExp, string]> = [
  [/Shamelessly Flirty\/Sexy/g, "Playful and warm"],
  [/XXX \(Unrestricted, NSFW, Explicit allowed\)/g, "Mature (avoid explicit sexual content)"],
];

const OPENCLAW_CONSTRAINED_MODEL_NOTE = [
  "COMPATIBILITY NOTE:",
  "- Keep warmth, affection, and flirting playful and non-explicit.",
  "- Do not escalate into sexual roleplay or graphic sexual language.",
  "- Treat mature tone as emotional candor, not explicit sexual content.",
].join("\n");

export function sanitizeOverlayForConstrainedModels(overlay: string): {
  changed: boolean;
  overlay: string;
} {
  let sanitized = overlay;

  for (const [pattern, replacement] of CONSTRAINED_MODEL_REWRITES) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  return {
    changed: sanitized !== overlay,
    overlay: sanitized,
  };
}

export function applyConstrainedModelCompatibility(
  overlay: string,
  compatibilityMode = true,
): {
  changed: boolean;
  overlay: string;
} {
  if (!compatibilityMode) {
    return { changed: false, overlay };
  }

  return sanitizeOverlayForConstrainedModels(overlay);
}

export function sanitizeOverlayForOpenClaw(overlay: string): {
  changed: boolean;
  overlay: string;
} {
  const sanitized = sanitizeOverlayForConstrainedModels(overlay);

  if (!sanitized.changed || sanitized.overlay.includes(OPENCLAW_CONSTRAINED_MODEL_NOTE)) {
    return sanitized;
  }

  return {
    changed: true,
    overlay: `${sanitized.overlay}\n\n${OPENCLAW_CONSTRAINED_MODEL_NOTE}`,
  };
}

export function applyOpenClawCompatibility(
  overlay: string,
  compatibilityMode = true,
): {
  changed: boolean;
  overlay: string;
} {
  if (!compatibilityMode) {
    return { changed: false, overlay };
  }

  return sanitizeOverlayForOpenClaw(overlay);
}
