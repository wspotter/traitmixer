import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import * as http from "node:http";

describe("TraitMixer Server", () => {
  let port: number;
  let server: http.Server;

  beforeAll(async () => {
    delete process.env.TRAITMIXER_ALLOWED_ORIGINS;
    vi.resetModules();
    const module = await import("./server.js");
    server = module.server;

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

  beforeEach(() => {
    delete process.env.TRAITMIXER_ALLOWED_ORIGINS;
  });

  afterEach(() => {
    delete process.env.TRAITMIXER_ALLOWED_ORIGINS;
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
    expect(data).toHaveProperty("allowedOrigins");
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
        compatibilityMode: false,
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

  it("rejects invalid compatibility mode flags", async () => {
    const res = await fetch(`http://localhost:${port}/api/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overlay: "test-overlay",
        compatibilityMode: "yes please",
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/compatibilityMode/);
  });

  it("rejects disallowed browser origins when an allowlist is configured", async () => {
    process.env.TRAITMIXER_ALLOWED_ORIGINS = "https://allowed.example";

    const res = await fetch(`http://localhost:${port}/api/health`, {
      headers: { Origin: "https://blocked.example" },
    });

    expect(res.status).toBe(403);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
    const data = await res.json();
    expect(data.error).toMatch(/Origin not allowed/);
  });

  it("echoes an allowed origin when the request origin is in the allowlist", async () => {
    process.env.TRAITMIXER_ALLOWED_ORIGINS = "https://allowed.example";

    const res = await fetch(`http://localhost:${port}/api/health`, {
      headers: { Origin: "https://allowed.example" },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("https://allowed.example");
  });
});
