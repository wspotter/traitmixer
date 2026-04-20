const CONSTRAINED_MODEL_REWRITES: Array<[RegExp, string]> = [
  [/Shamelessly Flirty\/Sexy/g, "Playful and warm"],
  [/XXX \(Unrestricted, NSFW, Explicit allowed\)/g, "Mature (avoid explicit sexual content)"],
];

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
