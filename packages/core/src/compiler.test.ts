import { describe, it, expect } from "vitest";
import { compilePersonalityOverlay, resolvePersonalityConfig } from "./compiler.js";

describe("TraitMixer Compiler", () => {
  it("compiles standard numeric traits", () => {
    const config = {
      traits: {
        humor: 80,
        flirting: 90,
        sarcasm: 10,
        optimism: 100
      }
    };
    const overlay = compilePersonalityOverlay(config);
    expect(overlay).toMatch(/Humor: 80%/);
    expect(overlay).toMatch(/Hilarious/);
    expect(overlay).toMatch(/Flirting: 90%/);
    expect(overlay).toMatch(/Sexy/);
    expect(overlay).toMatch(/Sarcasm: 10%/);
    expect(overlay).toMatch(/Earnest/);
    expect(overlay).toMatch(/Optimism: 100%/);
  });

  it("handles channel overrides", () => {
    const config = {
      traits: {
        directness: 50,
      },
      channels: {
        urgent: {
          directness: 100,
          verbosity: 0
        }
      }
    };
    const overlay = compilePersonalityOverlay(config, { channel: "urgent" });
    expect(overlay).toMatch(/Directness: 100%/);
    expect(overlay).toMatch(/Verbosity: 0%/);
  });
});
