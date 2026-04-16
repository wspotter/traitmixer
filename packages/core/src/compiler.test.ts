import { describe, expect, it } from "vitest";
import type { TraitMixerConfig } from "./compiler.js";
import {
  compilePersonalityOverlay,
  compilePersonalityOverlayForAgent,
  resolvePersonalityConfig,
} from "./compiler.js";

describe("personality overlay compiler", () => {
  it("builds a deterministic overlay with separate behavior and guardrail blocks", () => {
    const overlay = compilePersonalityOverlay(
      {
        style: {
          tone: "warm",
          directness: "balanced",
          verbosity: "brief",
          humor: "light",
        },
        authority: {
          stance: "advisor",
          confidence: "assertive",
        },
        channels: {
          telegram: {
            verbosity: "detailed",
            responseStyle: "structured",
          },
        },
        guardrails: {
          truthfulness: "strict",
          uncertainty: "explicit",
          corrections: "direct",
        },
      },
      { channel: "Telegram" },
    );

    expect(overlay).toBe(
      [
        "### Behavior",
        "- Communication: tone=warm, directness=balanced, verbosity=detailed.",
        "- Humor: light.",
        "- Authority: stance=advisor, confidence=assertive.",
        "- Channel override (telegram): verbosity=detailed, responseStyle=structured.",
        "",
        "### Truth & Integrity Guardrails",
        "- Truthfulness: strict.",
        "- Uncertainty handling: explicit.",
        "- Correction style: direct.",
      ].join("\n"),
    );
  });

  it("merges agents.defaults + agents.list personality, with per-agent precedence", () => {
    const cfg = {
      agents: {
        defaults: {
          personality: {
            style: {
              tone: "warm",
              verbosity: "brief",
            },
            guardrails: {
              truthfulness: "strict",
            },
          },
        },
        list: [
          {
            id: "main",
            personality: {
              style: {
                verbosity: "balanced",
              },
              channels: {
                telegram: {
                  responseStyle: "bullet-first",
                },
              },
              guardrails: {
                corrections: "gentle",
              },
            },
          },
        ],
      },
    } as TraitMixerConfig;

    const merged = resolvePersonalityConfig(cfg, "main");
    expect(merged?.style?.tone).toBe("warm");
    expect(merged?.style?.verbosity).toBe("balanced");
    expect(merged?.guardrails?.truthfulness).toBe("strict");
    expect(merged?.guardrails?.corrections).toBe("gentle");

    const overlay = compilePersonalityOverlayForAgent({
      cfg,
      agentId: "main",
      runtimeChannel: "telegram",
    });
    expect(overlay).toContain("- Communication: tone=warm, verbosity=balanced.");
    expect(overlay).toContain("- Channel override (telegram): responseStyle=bullet-first.");
    expect(overlay).toContain("- Truthfulness: strict.");
    expect(overlay).toContain("- Correction style: gentle.");
  });

  it("suppresses overlay when a per-agent personality explicitly disables it", () => {
    const cfg = {
      agents: {
        defaults: {
          personality: {
            enabled: true,
            style: { tone: "warm" },
          },
        },
        list: [
          {
            id: "main",
            personality: {
              enabled: false,
            },
          },
        ],
      },
    } as TraitMixerConfig;

    expect(resolvePersonalityConfig(cfg, "main")).toBeUndefined();
    expect(
      compilePersonalityOverlayForAgent({
        cfg,
        agentId: "main",
      }),
    ).toBeUndefined();
  });
});
