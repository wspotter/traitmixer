import { render } from "lit";
import { describe, expect, it } from "vitest";
import {
  buildPersonalitySampleReply,
  renderAgentPersonality,
} from "./agents-panels-personality.ts";

describe("buildPersonalitySampleReply", () => {
  it("adapts the sample reply to warm assertive profiles", () => {
    const sample = buildPersonalitySampleReply({
      personality: {
        style: {
          tone: "warm",
          directness: "balanced",
          verbosity: "brief",
        },
        authority: {
          confidence: "assertive",
        },
      },
      mode: "default",
    });

    expect(sample).toContain("I’ve got you. Here’s the clean path.");
    expect(sample).toContain("I recommend we do the simple thing first");
  });

  it("uses structured phrasing for dashboard-style previews", () => {
    const sample = buildPersonalitySampleReply({
      personality: {
        style: {
          tone: "dry",
          directness: "direct",
          verbosity: "detailed",
        },
      },
      mode: "dashboard",
    });

    expect(sample).toContain("Status snapshot:");
    expect(sample).toContain("1. Confirm the exact problem.");
  });
});

describe("renderAgentPersonality", () => {
  it("renders compiled overlay preview from effective personality config", async () => {
    const container = document.createElement("div");
    render(
      renderAgentPersonality({
        agentId: "ollie",
        configForm: {
          agents: {
            defaults: {
              personality: {
                style: {
                  tone: "warm",
                  directness: "balanced",
                },
                guardrails: {
                  truthfulness: "strict",
                },
              },
            },
            list: [
              {
                id: "ollie",
                personality: {
                  channels: {
                    signal: {
                      responseStyle: "structured",
                    },
                  },
                },
              },
            ],
          },
        },
        configLoading: false,
        configSaving: false,
        configApplying: false,
        configDirty: false,
        channelSnapshot: null,
        target: "agent",
        channel: "signal",
        mode: "signal",
        profileId: "signal-board",
        profiles: [
          {
            id: "signal-board",
            name: "Signal Board",
            target: "agent",
            channel: "signal",
            mode: "signal",
            updatedAt: 1,
            personality: {
              channels: {
                signal: {
                  responseStyle: "structured",
                },
              },
            },
          },
        ],
        onTargetChange: () => undefined,
        onChannelChange: () => undefined,
        onModeChange: () => undefined,
        onProfileChange: () => undefined,
        onProfileSave: () => undefined,
        onProfileApply: () => undefined,
        onProfileRename: () => undefined,
        onProfileDelete: () => undefined,
        onFieldChange: () => undefined,
        onConfigReload: () => undefined,
        onConfigSave: () => undefined,
        onConfigApply: () => undefined,
      }),
      container,
    );
    await Promise.resolve();

    expect(container.textContent).toContain("Personality Lab");
    expect(container.textContent).toContain("Saved Board");
    expect(container.textContent).toContain("Apply board");
    expect(container.textContent).toContain("Rename board");
    expect(container.textContent).toContain("Signal Banter");
    expect(container.textContent).toContain("Saved Board Snapshot");
    expect(container.textContent).toContain("What Changes");
    expect(container.textContent).toContain("Saved Board Reply");
    expect(container.textContent).toContain("Compiled Overlay");
    expect(container.textContent).toContain("responseStyle=structured");
    expect(container.textContent).toContain("Truthfulness: strict.");
  });
});
