---
title: "Git Notes for Stacy"
summary: "Safe working notes for the Personality Lab fork"
read_when:
  - You are resuming Personality Lab work after a break
  - You want the shortest safe summary of fork, branch, and commit expectations
status: draft
---

# Git Notes for Stacy

This repo is a fork. Treat the fork as the working surface and upstream as the source of truth for anything you want to pull forward.

## Fork vs upstream

- Make changes here in the fork.
- Treat upstream as the reference for feature shape and long-term direction.
- Compare against upstream before you assume a local file is canonical.
- Pull upstream ideas across intentionally instead of blending them in by accident.

## Branch expectations

- The current working branch is expected to stay on `main` unless a task explicitly asks for a branch.
- Do not rename branches or rewrite history just to make the tree look tidy.
- Keep the branch state boring. Boring is easier to resume later.

## What belongs in commits

Make commits by logical unit, not by whatever file happened to be open:

- one doc task per commit when possible
- one architecture change and its matching notes together if they belong together
- no drive-by edits to unrelated areas
- no source or UI changes if the task is docs-only

If a change reads like "while I was here," it probably wants its own commit or to be dropped.

## How to continue safely later

When you come back to this work:

1. Run `git status` first and check for other edits already in flight.
2. Read these two docs before making new assumptions.
3. If you need to inspect the feature, use `pnpm ui:dev` for the live UI and `pnpm test:ui` for the UI test path.
4. Stay inside `docs/**` unless the task says otherwise.
5. Keep commits small and grouped by one teaching change at a time.
6. If the branch, remote, or worktree looks surprising, stop and verify before editing.

The goal is to leave a trail that another calm human can follow without guesswork.
