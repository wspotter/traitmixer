import { describe, expect, it } from "vitest";
import {
  applyConstrainedModelCompatibility,
  sanitizeOverlayForConstrainedModels,
} from "./overlay-policy.js";

describe("sanitizeOverlayForConstrainedModels", () => {
  it("rewrites high-risk flirting and rating labels for constrained models", () => {
    const rawOverlay = [
      "### Personality & Tone Mixer Settings",
      "- Flirting: 100% (Shamelessly Flirty/Sexy)",
      "- Content Rating: 100% (XXX (Unrestricted, NSFW, Explicit allowed))",
      "",
      "INSTRUCTION: Adopt the above personality traits strictly.",
    ].join("\n");

    const result = sanitizeOverlayForConstrainedModels(rawOverlay);

    expect(result.changed).toBe(true);
    expect(result.overlay).toContain("- Flirting: 100% (Playful and warm)");
    expect(result.overlay).toContain(
      "- Content Rating: 100% (Mature (avoid explicit sexual content))",
    );
    expect(result.overlay).not.toContain("Shamelessly Flirty/Sexy");
    expect(result.overlay).not.toContain("Explicit allowed");
    expect(result.overlay).not.toContain("XXX");
  });

  it("leaves already-safe overlays unchanged", () => {
    const rawOverlay = [
      "### Personality & Tone Mixer Settings",
      "- Humor: 70% (Hilarious/Playful)",
      "- Flirting: 30% (Strictly Professional)",
    ].join("\n");

    const result = sanitizeOverlayForConstrainedModels(rawOverlay);

    expect(result.changed).toBe(false);
    expect(result.overlay).toBe(rawOverlay);
  });

  it("leaves risky overlays untouched when compatibility mode is disabled", () => {
    const rawOverlay = [
      "### Personality & Tone Mixer Settings",
      "- Flirting: 100% (Shamelessly Flirty/Sexy)",
      "- Content Rating: 100% (XXX (Unrestricted, NSFW, Explicit allowed))",
    ].join("\n");

    const result = applyConstrainedModelCompatibility(rawOverlay, false);

    expect(result.changed).toBe(false);
    expect(result.overlay).toBe(rawOverlay);
  });
});
