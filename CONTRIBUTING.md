# Contributing to TraitMixer

Thanks for your interest in contributing!

## Getting Started

```bash
git clone https://github.com/wspotter/traitmixer.git
cd traitmixer
pnpm install
pnpm dev          # UI on :5173, server on :4400
pnpm test         # run all tests
```

## Project Structure

- `packages/core/` — compiler, types, schema (pure TypeScript, zero deps)
- `packages/ui/` — Lit-based mixer board
- `packages/connectors/` — platform adapters (Open WebUI, AnythingLLM, Hermes, Agent Zero, OpenClaw)
- `packages/server/` — push API server

## How to Contribute

1. **Bug reports** — open an issue with steps to reproduce
2. **Feature requests** — open an issue describing the use case
3. **New connectors** — add a new file in `packages/connectors/src/` implementing the `Connector` interface
4. **UI improvements** — the mixer board lives in `packages/ui/src/personality-panel.ts`
5. **Compiler changes** — touch `packages/core/src/compiler.ts` and add tests

## Pull Requests

- Fork the repo and create a branch from `main`
- Make sure `pnpm test` passes
- Keep PRs focused — one feature or fix per PR
- Describe what changed and why

## Code Style

- TypeScript strict mode
- ESM imports (`.js` extensions in import paths)
- No runtime platform dependencies in `packages/core/`

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
