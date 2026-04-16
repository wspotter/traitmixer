---
title: "TraitMixer Repo Map"
summary: "Quick orientation for the standalone TraitMixer codebase"
read_when:
  - You want to know where the feature code lives
  - You need to navigate the project structure
status: current
---

# TraitMixer Repo Map

This repo is a clean standalone project with two packages and supporting docs.

## Core package (`packages/core/`)

- `packages/core/src/types.ts`
  The TypeScript shape for the personality feature.

- `packages/core/src/schema.ts`
  The runtime validation layer (Zod) for the same config.

- `packages/core/src/compiler.ts`
  The personality compiler. It merges defaults plus per-agent settings, applies channel overrides, and emits the compiled prompt overlay.

- `packages/core/src/compiler.test.ts`
  The best fast read if you want to understand intended behavior.

- `packages/core/src/index.ts`
  Barrel export for the public API.

## UI package (`packages/ui/`)

- `packages/ui/src/personality-panel.ts`
  The main Personality Lab panel UI. This is the mixer-board surface.

- `packages/ui/src/personality-panel.test.ts`
  Good for understanding what the UI is already expected to show.

- `packages/ui/src/types.ts`
  Local UI types (SavedPersonalityProfile, ChannelsStatusSnapshot).

- `packages/ui/src/utils.ts`
  Constants and helpers (AGENT_PERSONALITY_ALL_CHANNEL, resolveAgentConfig).

- `packages/ui/src/main.ts`
  Demo entry point that renders the panel with sample data.

- `packages/ui/index.html`
  Vite entry HTML.

## Docs

- `docs/personality-lab/ARCHITECTURE.md`
  Best short explanation of the intended product.

- `docs/personality-lab/NAME_IDEAS.md`
  Name brainstorming context.

- `RESTORE_NOTES.md`
  Explains where this repo came from (provenance).

## Mental model

1. The personality schema defines the knobs.
2. The overlay compiler turns those knobs into prompt text.
3. The UI panel edits and previews those knobs.
4. Everything is self-contained — no external platform dependencies.
