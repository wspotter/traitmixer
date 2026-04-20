import { describe, expect, it } from "vitest";
import { resolveConfiguredPath } from "./path-utils.js";

function restoreEnvVar(key: "TRAITMIXER_APP_ROOT" | "INIT_CWD" | "HOME", value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

describe("resolveConfiguredPath", () => {
  it("resolves project-relative paths against TRAITMIXER_APP_ROOT", () => {
    const originalRoot = process.env.TRAITMIXER_APP_ROOT;
    process.env.TRAITMIXER_APP_ROOT = "/tmp/traitmixer-root";

    expect(resolveConfiguredPath("./CLAUDE.md")).toBe("/tmp/traitmixer-root/CLAUDE.md");

    restoreEnvVar("TRAITMIXER_APP_ROOT", originalRoot);
  });

  it("preserves home-relative paths", () => {
    const originalHome = process.env.HOME;
    process.env.HOME = "/home/tester";

    expect(resolveConfiguredPath("~/agent/system.md")).toBe("/home/tester/agent/system.md");

    restoreEnvVar("HOME", originalHome);
  });

  it("falls back to INIT_CWD before process.cwd for relative paths", () => {
    const originalRoot = process.env.TRAITMIXER_APP_ROOT;
    const originalInitCwd = process.env.INIT_CWD;
    delete process.env.TRAITMIXER_APP_ROOT;
    process.env.INIT_CWD = "/tmp/init-cwd";

    expect(resolveConfiguredPath("./SOUL.md")).toBe("/tmp/init-cwd/SOUL.md");

    restoreEnvVar("TRAITMIXER_APP_ROOT", originalRoot);
    restoreEnvVar("INIT_CWD", originalInitCwd);
  });
});
