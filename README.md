# TraitMixer

**Persona Mixing Made Easy**

TraitMixer is an open-source personality mixer for AI agents. It provides a visual control surface for text-response traits like tone, directness, humor, empathy, formality, safety, and per-channel delivery, then compiles those choices into a deterministic prompt overlay.

TraitMixer is built for agent workflows where the underlying system is capable, but the written responses still feel generic, brittle, too stiff, too chatty, or wrong for the context.

![TraitMixer UI](docs/screenshot.png)

[View the main repo](https://github.com/wspotter/traitmixer)

Built by [Wm. Stacy Potter](https://github.com/wspotter/traitmixer).

## Why this exists

Most prompt tuning is still a pile of invisible text edits and wishful thinking.

TraitMixer makes personality work legible:

- The active persona can be seen instead of inferred from prompt text alone.
- Behavior can vary by channel without rewriting the whole system prompt.
- The compiled output can be previewed before it is pushed into a real stack.
- The runtime layer stays deterministic instead of drifting through hand-tuned prompt edits.

The goal is simple: make agent persona control feel more like mixing a board and less like editing invisible prompt fragments.

## What makes it interesting

- **Deterministic compiler**: same inputs produce the same overlay.
- **Channel overrides**: different delivery for `signal`, `dashboard`, support flows, launch copy, or whatever else you need.
- **Visual mixer UI**: sliders make persona changes faster to understand and easier to compare.
- **Connector layer**: push compiled overlays into the platforms people already use.
- **Git-friendly config**: personality inputs live in plain files instead of being trapped in UI state.

## Before / after agent voice

In TraitMixer, `voice` means the agent's **written response style**, not text-to-speech.

Same prompt:

> Tell a builder why TraitMixer matters in one short reply.

Before:

> TraitMixer is a helpful tool for adjusting AI assistant personalities and improving how they communicate across different scenarios.

After TraitMixer:

> TraitMixer gives builders a direct way to shape agent persona, so response style can be tuned visually instead of buried inside prompt edits.

That is the whole pitch in miniature: same job, better written delivery.

## Supported targets

| Target | Integration | What TraitMixer changes |
| --- | --- | --- |
| [Open WebUI](https://github.com/open-webui/open-webui) | HTTP API | Updates model system prompt |
| [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm) | HTTP API | Updates workspace prompt |
| [Hermes Agent](https://github.com/NousResearch/hermes-agent) | File write | Injects into `SOUL.md` |
| [Agent Zero](https://github.com/agent0ai/agent-zero) | File write | Injects into `agent.system.md` |
| [OpenClaw](https://github.com/openclaw/openclaw) | File write | Updates workspace config |
| [Claude Code](https://code.claude.com/docs/en/memory) | File write | Injects into `CLAUDE.md` or `.claude/CLAUDE.md` |

## Quick start

```bash
git clone https://github.com/wspotter/traitmixer.git
cd traitmixer
pnpm install
pnpm dev
```

Then open:

- UI: `http://localhost:5173`
- Push API: `http://localhost:4400`

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Runs the UI and local push server |
| `pnpm dev:ui` | Runs only the UI |
| `pnpm dev:server` | Runs only the push server |
| `pnpm build` | Builds the UI |
| `pnpm test` | Runs all tests |
| `pnpm test:core` | Runs compiler tests |
| `pnpm test:ui` | Runs UI tests |
| `pnpm typecheck` | Runs TypeScript project checks |

## How it works

TraitMixer is deliberately small and split into four boring parts:

1. `packages/core`
   The schema, compiler, and prompt-resolution logic.
2. `packages/ui`
   The mixer board and launch-facing UI.
3. `packages/connectors`
   Adapters for pushing overlays into external tools.
4. `packages/server`
   A thin local API that lists targets and pushes compiled overlays.

That separation matters. The compiler should be usable without the screen, and the screen should never become the only source of truth.

## The pitch in one sentence

TraitMixer helps agent builders tune written persona visually, preview the result, and push it into the tools they already run.

## Configuration

TraitMixer reads personality config from plain data structures and compiles a prompt overlay from:

- default personality traits
- per-agent trait overrides
- per-channel delivery overrides

For Claude Code specifically, point `TRAITMIXER_CLAUDECODE_PATH` at the project memory file TraitMixer should manage, for example:

- `~/my-project/CLAUDE.md`
- `~/my-project/.claude/CLAUDE.md`

See [ARCHITECTURE.md](docs/personality-lab/ARCHITECTURE.md) for the current mental model.

## Contributing

Contributions are welcome. For setup and guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © Wm. Stacy Potter
