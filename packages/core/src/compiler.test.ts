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

  it("drops the trailing instruction block in lite mode", () => {
    const overlay = compilePersonalityOverlay(
      {
        traits: {
          humor: 80,
          empathy: 70,
        },
      },
      { contextWeight: "lite" },
    );

    expect(overlay).toMatch(/Humor: 80%/);
    expect(overlay).not.toMatch(/INSTRUCTION:/);
  });

  it("uses a fuller instruction line in rich mode", () => {
    const overlay = compilePersonalityOverlay(
      {
        traits: {
          humor: 80,
          empathy: 70,
        },
      },
      { contextWeight: "rich" },
    );

    expect(overlay).toMatch(/steady voice-and-tone brief/);
    expect(overlay).toMatch(/never use personality to hide weak evidence/);
  });

  it("resolves through 3 variable levels: defaults, agent, and channel overrides", () => {
    const config = {
      agents: {
        defaults: {
          personality: {
            traits: {
              humor: 50,
              empathy: 50
            },
            channels: {
              support: {
                empathy: 90
              }
            }
          }
        },
        list: [
          {
            id: "bot",
            personality: {
              traits: {
                humor: 20
              },
              channels: {
                support: {
                  formality: 80
                }
              }
            }
          }
        ]
      }
    };

    // Resolving defaults + agent base traits
    const agentPersonality = resolvePersonalityConfig(config as any, "bot");
    expect(agentPersonality?.traits).toEqual({ humor: 20, empathy: 50 });
    expect(agentPersonality?.channels?.support).toEqual({ empathy: 90, formality: 80 });

    // Compiling with a specific channel overrides the base agent traits
    const overlay = compilePersonalityOverlay(agentPersonality, { channel: "support" });
    expect(overlay).toMatch(/Empathy: 90%/);
    expect(overlay).toMatch(/Formality: 80%/);
    expect(overlay).toMatch(/Humor: 20%/);
  });
});
