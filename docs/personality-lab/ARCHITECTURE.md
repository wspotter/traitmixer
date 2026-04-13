---
title: "Personality Lab Architecture"
summary: "MVP notes for the Personality Lab prompt pipeline and UI"
read_when:
  - You need a quick mental model of how the Personality Lab MVP is wired
  - You are changing prompts, config, or the operator-facing UI
status: draft
---

# Personality Lab Architecture

The Personality Lab MVP is a small loop with a narrow job: let an operator edit personality inputs, compile them into a usable prompt, and preview the result before it reaches the agent.

## What changed

Personality Lab is no longer just “some personality text in a box.” The MVP now centers on a compiled personality overlay that:

- merges `agents.defaults.personality` with per-agent personality
- lets channel-specific overrides adjust delivery without rewriting the core voice
- injects the result into the agent prompt path after safety and before project context
- shows the compiled overlay and a sample reply in the UI so operators can preview the effect before they trust it

That makes the feature teachable: edit inputs, see the compiled result, then decide whether the behavior is actually worth shipping.

## MVP shape

The MVP has four pieces:

- **Config storage** - the source of truth lives in plain workspace files, not a database.
- **Prompt compiler** - turns those files into a single runtime prompt or prompt bundle.
- **UI surface** - a thin operator screen for editing inputs and viewing the compiled result.
- **Agent runtime** - consumes the compiled output and keeps the runtime behavior separate from the editor.

This keeps the system easy to inspect, diff, and recover. If something looks wrong, you can read the files and see what changed.

## Config storage

Store personality inputs as human-readable files so they can be reviewed in git. The MVP should keep the model simple:

- one place for the editable personality source
- one place for lab settings or flags
- optional per-agent overrides, if needed later

Avoid hiding important behavior in the UI state. The UI may write values, but it should not be the only place those values exist.

## Prompt compiler

The compiler is the boring part, which is exactly what we want.

- Read the stored config.
- Normalize and merge the inputs in a predictable order.
- Produce the final prompt text or prompt object used by the agent.
- Fail loudly when required pieces are missing instead of guessing.

Keep the compiler deterministic. Same input files should produce the same output. That makes review, testing, and debugging much less annoying.

## UI surface

The UI should stay thin:

- edit the personality source
- preview the compiled output
- expose only the controls the operator actually needs

The UI should not become a second configuration system. If a setting matters, it should end up in the stored config and in the compiled output.

## Preview and test

Use the UI package scripts when you want to inspect the feature locally:

- `pnpm ui:dev` - run the Personality Lab UI in development mode.
- `pnpm ui:build` - build the UI the same way the shipped bundle is built.
- `pnpm --dir ui preview` - preview the built UI bundle.
- `pnpm test:ui` - run the UI test path after linting the UI boundary check.

If the UI dependencies are missing, the root `ui` wrapper installs them before running the requested action. That keeps the preview loop boring, which is the best kind of boring.

## Future path

The MVP should be easy to split into either of these later:

- **Standalone app** - the lab becomes its own product with its own storage and compiler service.
- **Plugin** - the lab becomes a package or extension that plugs into OpenClaw without changing the core model.

The main design rule for that future is simple: keep the compiler core independent from the UI. If the prompt compiler can run without the screen, we can move it almost anywhere later.
