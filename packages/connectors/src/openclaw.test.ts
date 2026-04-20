import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { OpenClawConnector } from "./openclaw.js";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("OpenClawConnector", () => {
  it("treats a workspace directory as SOUL.md", async () => {
    const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), "traitmixer-openclaw-"));
    tempDirs.push(workspaceDir);
    const connector = new OpenClawConnector(workspaceDir);

    const result = await connector.push("overlay");
    const soulPath = path.join(workspaceDir, "SOUL.md");

    expect(result.success).toBe(true);
    expect(result.message).toContain("SOUL.md");
    expect(fs.readFileSync(soulPath, "utf-8")).toContain("overlay");
  });

  it("preserves explicit bootstrap file targets", async () => {
    const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), "traitmixer-openclaw-file-"));
    tempDirs.push(workspaceDir);
    const claudePath = path.join(workspaceDir, "CLAUDE.md");
    const connector = new OpenClawConnector(claudePath);

    const result = await connector.push("overlay");

    expect(result.success).toBe(true);
    expect(result.message).toContain("CLAUDE.md");
    expect(fs.readFileSync(claudePath, "utf-8")).toContain("overlay");
  });

  it("adds an OpenClaw compatibility guard when risky wording is sanitized", async () => {
    const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), "traitmixer-openclaw-guard-"));
    tempDirs.push(workspaceDir);
    const connector = new OpenClawConnector(workspaceDir);

    await connector.push([
      "### Personality & Tone Mixer Settings",
      "- Flirting: 100% (Shamelessly Flirty/Sexy)",
      "- Content Rating: 100% (XXX (Unrestricted, NSFW, Explicit allowed))",
      "",
      "INSTRUCTION: Adopt the above personality traits strictly.",
    ].join("\n"));

    const soulPath = path.join(workspaceDir, "SOUL.md");
    const soul = fs.readFileSync(soulPath, "utf-8");

    expect(soul).toContain("Playful and warm");
    expect(soul).toContain("Mature (avoid explicit sexual content)");
    expect(soul).toContain("COMPATIBILITY NOTE:");
    expect(soul).toContain("playful and non-explicit");
    expect(soul).not.toContain("Shamelessly Flirty/Sexy");
    expect(soul).not.toContain("Explicit allowed");
  });

  it("writes raw overlay text when compatibility mode is disabled", async () => {
    const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), "traitmixer-openclaw-raw-"));
    tempDirs.push(workspaceDir);
    const connector = new OpenClawConnector(workspaceDir);

    await connector.push(
      [
        "### Personality & Tone Mixer Settings",
        "- Flirting: 100% (Shamelessly Flirty/Sexy)",
        "- Content Rating: 100% (XXX (Unrestricted, NSFW, Explicit allowed))",
      ].join("\n"),
      { compatibilityMode: false },
    );

    const soulPath = path.join(workspaceDir, "SOUL.md");
    const soul = fs.readFileSync(soulPath, "utf-8");

    expect(soul).toContain("Shamelessly Flirty/Sexy");
    expect(soul).toContain("Explicit allowed");
    expect(soul).not.toContain("COMPATIBILITY NOTE:");
  });
});
