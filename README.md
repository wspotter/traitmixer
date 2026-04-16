<div align="center">

# TraitMixer

**Personality mixer for AI agents**

Tune tone, directness, humor, formality, authority, and per-channel delivery — then push the compiled overlay to your AI frontend in one click.

[![CI](https://github.com/wspotter/traitmixer/actions/workflows/ci.yml/badge.svg)](https://github.com/wspotter/traitmixer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-20%2B-brightgreen.svg)](https://nodejs.org)

![TraitMixer UI](docs/screenshot.png)

</div>

---

## What is this?

TraitMixer is an open-source personality editor and compiler for AI assistants. Think of it like an audio mixer board, but for controlling how your AI sounds.

- **Adjust personality traits** — tone, directness, verbosity, humor, formality, authority, pushback
- **Per-channel delivery** — different voice for Signal vs Dashboard vs customer-facing email
- **Live preview** — see compiled prompt overlay and sample replies before pushing
- **Push to your AI frontend** — connectors for Open WebUI, AnythingLLM, Hermes Agent, Agent Zero, and OpenClaw

The compiler is deterministic: same inputs always produce the same overlay. The guardrails (truthfulness, uncertainty, corrections) stay enforced regardless of how playful you make the voice.

## Quick Start

```bash
git clone https://github.com/wspotter/traitmixer.git
cd traitmixer
pnpm install
pnpm dev
```

- **Mixer board UI** → http://localhost:5173
- **Push API server** → http://localhost:4400

## Supported Platforms

| Platform | Type | What TraitMixer does |
|----------|------|---------------------|
| [Open WebUI](https://github.com/open-webui/open-webui) | HTTP API | Updates model system prompt |
| [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm) | HTTP API | Updates workspace system prompt |
| [Hermes Agent](https://github.com/NousResearch/hermes-agent) | File write | Injects into `SOUL.md` |
| [Agent Zero](https://github.com/agent0ai/agent-zero) | File write | Injects into `agent.system.md` |
| [OpenClaw](https://github.com/openclaw/openclaw) | File write | Updates workspace config |

Configure targets in `.env` — see [`.env.example`](.env.example) for all options.

## Project Structure

```
packages/
  core/          — compiler, types, Zod schema (zero dependencies)
  ui/            — Lit-based mixer board
  connectors/    — platform adapters
  server/        — push API (port 4400)
```

## How It Works

1. **Schema** defines the personality knobs (tone, directness, humor, etc.)
2. **Compiler** merges defaults + per-agent settings + channel overrides → deterministic prompt overlay
3. **UI** provides the mixer board for editing, previewing, and saving profiles
4. **Connectors** push the compiled overlay to your AI platform

## Testing

```bash
pnpm test           # all tests
pnpm test:core      # compiler only
pnpm test:ui        # UI only
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and guidelines.

## License

[MIT](LICENSE) © Wm. Stacy Potter
