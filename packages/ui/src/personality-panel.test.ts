import { render } from "lit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderAgentPersonality } from "./personality-panel.js";
import type { TraitMixerConfig } from "traitmixer-core";

describe("UI Panel Tests", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  const baseConfig: TraitMixerConfig = {
    agents: {
      defaults: { personality: { traits: {} } },
      list: [{ id: "demo", personality: { traits: {} } }],
    },
  };

  it("renders the compatibility toggle checked when enabled", () => {
    const host = document.getElementById("app");
    if (!host) throw new Error("missing host");

    render(
      renderAgentPersonality({
        agentId: "demo",
        availableTargets: [],
        channel: "*",
        compatibilityMode: true,
        configDirty: false,
        configForm: baseConfig,
        contextWeight: "balanced",
        onChannelChange: vi.fn(),
        onCompatibilityModeChange: vi.fn(),
        onContextWeightChange: vi.fn(),
        onFieldChange: vi.fn(),
        onPush: vi.fn(),
        onRefreshTargets: vi.fn(),
        onReset: vi.fn(),
        onTargetActionSet: vi.fn(),
        onTargetChange: vi.fn(),
        onTargetMenuToggle: vi.fn(),
        pushResults: [],
        pushing: false,
        target: "agent",
        targetActions: {},
        targetMenuOpen: false,
        targetsLoading: false,
      }),
      host,
    );

    const checkbox = host.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    expect(checkbox).not.toBeNull();
    expect(checkbox?.checked).toBe(true);
    expect(host.textContent).toContain("Compatibility Mode");
    expect(host.textContent).toContain("Context Weight");
    expect(host.textContent).toContain("Balanced");
  });
});
