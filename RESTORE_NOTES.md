## Restore Notes

TraitMixer was restored from unfinished Personality Lab work that originally lived inside an OpenClaw review checkout.

This repo is now the canonical home for TraitMixer. It is maintained as its own project with all OpenClaw platform dependencies removed.

What was preserved:
- the personality compiler (now `packages/core/src/compiler.ts`)
- the config schema and types (now `packages/core/src/types.ts` and `schema.ts`)
- the UI panel and preview work (now `packages/ui/src/personality-panel.ts`)
- the supporting docs for the feature (still in `docs/personality-lab/`)

What was intentionally not preserved:
- original git history
- build artifacts and installed dependencies
- all OpenClaw platform infrastructure (89 channel plugins, gateway, CLI, Docker configs)

The `pre-trim` branch contains the full extracted repo before cleanup for reference.
