import { describe, expect, it } from "vitest";
import { injectManagedOverlay, removeManagedOverlay } from "./overlay-block.js";

describe("overlay block helpers", () => {
  it("injects a managed overlay block into plain content", () => {
    const result = injectManagedOverlay("hello", "overlay");

    expect(result).toContain("<!-- traitmixer:start -->");
    expect(result).toContain("overlay");
    expect(result).toContain("<!-- traitmixer:end -->");
  });

  it("removes a valid managed overlay block", () => {
    const existing = [
      "alpha",
      "",
      "<!-- traitmixer:start -->",
      "overlay",
      "<!-- traitmixer:end -->",
      "",
      "omega",
    ].join("\n");

    const result = removeManagedOverlay(existing);

    expect(result.changed).toBe(true);
    expect(result.content).toBe("alpha\n\nomega\n");
  });

  it("does not mangle content when markers are reversed or incomplete", () => {
    const existing = [
      "alpha",
      "<!-- traitmixer:end -->",
      "noise",
      "<!-- traitmixer:start -->",
      "overlay",
    ].join("\n");

    const result = removeManagedOverlay(existing);

    expect(result.changed).toBe(false);
    expect(result.content).toBe(existing);
  });
});
