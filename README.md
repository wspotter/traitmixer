# TraitMixer

TraitMixer is a personality editor and preview app for shaping how an AI assistant sounds before those changes reach runtime.

Think of it like an audio mixer, but for assistant behavior:
- adjust tone, directness, verbosity, humor, formality, and authority
- add channel-specific delivery overrides without rewriting the core voice
- compile those settings into a deterministic prompt overlay
- preview both the compiled overlay and a sample reply before shipping changes

This repository was restored from unfinished OpenClaw Personality Lab work. It is not a clean-room standalone app yet, but it now has a clear home and a focused purpose.

## Ownership

TraitMixer is its own repo and its own working product surface.

- This repository is the canonical home for TraitMixer work.
- The current codebase is maintained here as TraitMixer, not as a mirror of `openclaw/openclaw`.
- Some code and wiring were restored from unfinished OpenClaw Personality Lab work, and that provenance should remain documented.
- Ongoing product decisions, cleanup, and new implementation happen in this repo.

## What Exists Today

- A structured personality schema with validation.
- A compiler that turns personality settings into a prompt overlay.
- Prompt-path wiring so the compiled overlay reaches the runtime.
- A UI panel for editing traits, previewing the overlay, and viewing sample replies.
- Early docs describing the intended product shape.

## Start Here

- Product overview: [docs/personality-lab/ARCHITECTURE.md](docs/personality-lab/ARCHITECTURE.md)
- Repo orientation: [docs/personality-lab/REPO_MAP.md](docs/personality-lab/REPO_MAP.md)
- Restore context: [RESTORE_NOTES.md](RESTORE_NOTES.md)

## Important Paths

- Compiler: [src/agents/personality-overlay.ts](src/agents/personality-overlay.ts)
- Compiler tests: [src/agents/personality-overlay.test.ts](src/agents/personality-overlay.test.ts)
- Personality types: [src/config/types.personality.ts](src/config/types.personality.ts)
- Personality schema: [src/config/zod-schema.personality.ts](src/config/zod-schema.personality.ts)
- UI panel: [ui/src/ui/views/agents-panels-personality.ts](ui/src/ui/views/agents-panels-personality.ts)
- UI panel tests: [ui/src/ui/views/agents-panels-personality.test.ts](ui/src/ui/views/agents-panels-personality.test.ts)

## Running The UI

This repo still carries the OpenClaw build surface, so the UI commands are inherited from that structure:

```bash
pnpm install
pnpm ui:dev
```

Useful related commands:

```bash
pnpm ui:build
pnpm test:ui
```

## Current Reality

What this repo is:
- the restored working surface for the personality feature
- good enough to resume implementation without more archaeology

What this repo is not yet:
- a trimmed standalone app
- a polished product with isolated dependencies and branding throughout

## Next Cleanup Targets

- reduce the repo to just the personality-related runtime, config, and UI pieces
- replace inherited OpenClaw naming in the remaining user-facing surfaces
- separate the compiler core from the larger host app assumptions
