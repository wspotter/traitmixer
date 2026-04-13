---
title: "TraitMixer Repo Map"
summary: "Quick orientation for the restored Personality Lab codebase"
read_when:
  - You want to know where the real feature code lives
  - You need to avoid wandering through unrelated inherited OpenClaw files
status: draft
---

# TraitMixer Repo Map

This repo is still an extracted working tree, not a neatly isolated app. The fastest way to stay sane is to ignore most of the inherited platform surface and focus on the files below.

## Core feature files

- `src/agents/personality-overlay.ts`
  The personality compiler. It merges defaults plus per-agent settings, applies channel overrides, and emits the compiled prompt overlay.

- `src/config/types.personality.ts`
  The TypeScript shape for the feature.

- `src/config/zod-schema.personality.ts`
  The runtime validation layer for the same config.

- `src/agents/personality-overlay.test.ts`
  The best fast read if you want to understand intended behavior.

## UI files

- `ui/src/ui/views/agents-panels-personality.ts`
  The main Personality Lab panel UI. This is the mixer-board surface.

- `ui/src/ui/views/agents-panels-personality.test.ts`
  Good for understanding what the UI is already expected to show.

- `ui/src/ui/storage.ts`
  Contains the saved profile shape used by the UI.

- `ui/src/ui/app-render.ts`
  One of the parent render surfaces that wires the panel into the wider UI.

## Runtime integration points

- `src/agents/system-prompt.ts`
  Receives the compiled personality overlay in the final system prompt composition path.

- `src/agents/cli-runner/helpers.ts`
  One of the places where the overlay is injected for agent runs.

- `src/agents/pi-embedded-runner/compact.ts`
- `src/agents/pi-embedded-runner/run/attempt.ts`
  Embedded-runner integration points.

## Docs

- `docs/personality-lab/ARCHITECTURE.md`
  Best short explanation of the intended product.

- `RESTORE_NOTES.md`
  Explains where this repo came from and what is still inherited baggage.

## Safe mental model

If you are resuming work, treat the repo like this:

1. The personality schema defines the knobs.
2. The overlay compiler turns those knobs into prompt text.
3. The UI panel edits and previews those knobs.
4. The runtime integration points inject the compiled result.

Everything else is background noise unless a change forces you to care.
