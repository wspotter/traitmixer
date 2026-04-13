## Restore Notes

This repository was restored from Personality Lab work that originally lived inside an OpenClaw review checkout.

What is here:
- the OpenClaw-derived source tree needed to continue the feature
- the restored `docs/personality-lab/` notes
- the personality compiler, config schema, and UI panel work already in progress

What is not here:
- git history from the old checkout
- bulky build artifacts and installed dependencies like `node_modules/` and `dist/`

Important paths for the feature:
- `docs/personality-lab/`
- `src/agents/personality-overlay.ts`
- `src/config/types.personality.ts`
- `src/config/zod-schema.personality.ts`
- `ui/src/ui/views/agents-panels-personality.ts`

Suggested next step:
- install deps and continue extracting this into a cleaner standalone app if that is still the goal
