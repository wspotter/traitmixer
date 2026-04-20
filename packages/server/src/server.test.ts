import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { server } from "./server.js";
import * as http from "node:http";

describe("TraitMixer Server", () => {
  let port: number;

  beforeAll(async () => {
    return new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        if (address && typeof address !== "string") {
          port = address.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    return new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("returns health status via GET /api/health", async () => {
    const res = await fetch(`http://localhost:${port}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(typeof data.targets).toBe("number");
  });

  it("lists target connectors via GET /api/targets", async () => {
    const res = await fetch(`http://localhost:${port}/api/targets`);
    expect(res.status).toBe(200);
    const data = await res.json() as { targets: any[] };
    expect(Array.isArray(data.targets)).toBe(true);
    expect(data.targets.length).toBeGreaterThan(0);
    expect(data.targets[0]).toHaveProperty("id");
    expect(data.targets[0]).toHaveProperty("label");
    expect(data.targets[0]).toHaveProperty("configured");
  });

  it("rejects non-POST to /api/push", async () => {
    const res = await fetch(`http://localhost:${port}/api/push`);
    // Not found route logic applies if non-POST
    expect(res.status).toBe(404);
  });

  it("rejects missing overlay payload to POST /api/push", async () => {
    const res = await fetch(`http://localhost:${port}/api/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targets: ["claude-code"] }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Missing or invalid 'overlay'/);
  });

  it("executes valid push and uninstall combinations", async () => {
    const res = await fetch(`http://localhost:${port}/api/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        overlay: "test-overlay", 
        targets: ["agent-zero"], 
        uninstall: ["claude-code"] 
      }),
    });
    // Can be 200 or 207 depending on if those are configured locally, but API responds correctly
    expect([200, 207]).toContain(res.status);
    const data = await res.json() as { results: any[] };
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThanOrEqual(2);
  });
});
