# TraitMixer

A personality editor and compiler for AI assistants. Adjust tone, directness, verbosity, humor, formality, and authority — then preview the compiled prompt overlay before it reaches runtime.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173 to see the mixer board.

## Project Structure

```
packages/
  core/     — compiler, types, schema (zero UI dependencies)
  ui/       — Lit-based mixer board UI
docs/
  personality-lab/   — architecture and design docs
```

## How It Works

1. **Schema** defines the personality knobs (tone, directness, humor, etc.)
2. **Compiler** merges defaults + per-agent settings + channel overrides → deterministic prompt overlay text
3. **UI** provides the mixer board for editing, previewing, and saving personality profiles

## Testing

```bash
pnpm test           # all tests
pnpm test:core      # compiler only
pnpm test:ui        # UI only
```

## Origin

TraitMixer was extracted from unfinished personality work inside the OpenClaw project. See [RESTORE_NOTES.md](RESTORE_NOTES.md) for provenance.
