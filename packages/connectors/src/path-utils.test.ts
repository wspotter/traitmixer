import { describe, expect, it } from "vitest";
import { resolveConfiguredPath } from "./path-utils.js";

describe("resolveConfiguredPath", () => {
  it("resolves project-relative paths against TRAITMIXER_APP_ROOT", () => {
    const originalRoot = process.env.TRAITMIXER_APP_ROOT;
    process.env.TRAITMIXER_APP_ROOT = "/tmp/traitmixer-root";

    expect(resolveConfiguredPath("./CLAUDE.md")).toBe("/tmp/traitmixer-root/CLAUDE.md");

    process.env.TRAITMIXER_APP_ROOT = originalRoot;
  });

  it("preserves home-relative paths", () => {
    const originalHome = process.env.HOME;
    process.env.HOME = "/home/tester";

    expect(resolveConfiguredPath("~/agent/system.md")).toBe("/home/tester/agent/system.md");

    process.env.HOME = originalHome;
  });
});
