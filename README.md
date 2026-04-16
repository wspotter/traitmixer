# TraitMixer

**Mix the voice. Keep the brains.**

TraitMixer is an open-source personality mixer for AI agents. It gives you a visual control surface for text-response traits like tone, directness, humor, empathy, formality, safety, and per-channel delivery, then compiles those choices into a deterministic prompt overlay you can actually ship.

If your agents are capable but their text replies still sound generic, brittle, too polite, too stiff, too chatty, or wrong for the room, this is the repo.

![TraitMixer UI](docs/screenshot.png)

[View the main repo](https://github.com/wspotter/traitmixer)

Built by [Wm. Stacy Potter](https://github.com/wspotter/traitmixer).

## Why this exists

Most prompt tuning is still a pile of invisible text edits and wishful thinking.

TraitMixer makes personality work legible:

- You can see the voice you are shaping.
- You can vary behavior by channel without rewriting the whole system prompt.
- You can preview the compiled output before you push it into a real stack.
- You can keep the runtime layer deterministic instead of hand-tuning magic strings forever.

The goal is simple: make agent voice control feel more like mixing audio and less like arguing with a haunted Markdown file.

## What makes it interesting

- **Deterministic compiler**: same inputs produce the same overlay.
- **Channel overrides**: different delivery for `signal`, `dashboard`, support flows, launch copy, or whatever else you need.
- **Visual mixer UI**: sliders are faster to understand, easier to demo, and frankly more fun than raw prompt surgery.
- **Connector layer**: push compiled overlays into the platforms people already use.
- **Git-friendly config**: personality inputs live in plain files instead of being trapped in UI state.

## Before / after agent voice

In TraitMixer, `voice` means the agent's **written response style**, not text-to-speech.

Same prompt:

> Tell a builder why TraitMixer matters in one short reply.

Before:

> TraitMixer is a helpful tool for adjusting AI assistant personalities and improving how they communicate across different scenarios.

After TraitMixer:

> TraitMixer gives you an actual control surface for agent personality, so you're not stuck doing blind prompt surgery every time the bot sounds weird in public.

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

TraitMixer is for people who already have an AI agent working and are tired of it sounding like the same vacuum-sealed assistant every other stack ships.

## What would make this repo worth starring

- It solves a real, easy-to-recognize problem.
- The concept is screenshot-friendly and demo-friendly.
- It is weird enough to be memorable without being useless.
- It can turn into a plugin, hosted product, or consulting wedge later.

That last part matters. Stars are nice. A repo people can imagine using in production is better.

## Configuration

TraitMixer reads personality config from plain data structures and compiles a prompt overlay from:

- default personality traits
- per-agent trait overrides
- per-channel delivery overrides

For Claude Code specifically, point `TRAITMIXER_CLAUDECODE_PATH` at the project memory file you want TraitMixer to manage, for example:

- `~/my-project/CLAUDE.md`
- `~/my-project/.claude/CLAUDE.md`

See [ARCHITECTURE.md](docs/personality-lab/ARCHITECTURE.md) for the current mental model.

## Contributing

If you want to add a connector, improve the compiler, or push the UI further, start with [CONTRIBUTING.md](CONTRIBUTING.md).

If you use TraitMixer publicly, please link back to the main repo:

`https://github.com/wspotter/traitmixer`

## License

[MIT](LICENSE) © Wm. Stacy Potter
