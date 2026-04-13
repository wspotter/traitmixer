## Restore Notes

TraitMixer was restored from unfinished Personality Lab work that originally lived inside an OpenClaw review checkout.

What was preserved:
- the personality compiler
- the config schema and types
- the UI panel and preview work
- the supporting docs for the feature

What was intentionally not preserved:
- original git history
- build artifacts and installed dependencies

Why the repo still feels bigger than the feature:
- this is a rescue extraction, not a fully isolated standalone app yet
- some inherited OpenClaw files still exist because they provide context or wiring for the restored feature

If you are resuming implementation, read these first:
- `README.md`
- `docs/personality-lab/ARCHITECTURE.md`
- `docs/personality-lab/REPO_MAP.md`
