import * as http from "node:http";
import * as path from "node:path";
import { createAllConnectors } from "traitmixer-connectors";
import type { Connector, PushResult } from "traitmixer-connectors";
import { fileURLToPath } from "node:url";

const PORT = parseInt(process.env.TRAITMIXER_SERVER_PORT ?? "4400", 10);
process.env.TRAITMIXER_APP_ROOT ??= path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const connectors = createAllConnectors();
const connectorMap = new Map<string, Connector>(connectors.map((c) => [c.id, c]));

function allowedOrigins(): string[] | "*" {
  const configured = process.env.TRAITMIXER_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configured && configured.length > 0 ? configured : "*";
}

function corsHeaders(origin?: string): Record<string, string> {
  const allowOrigin = allowedOrigins();
  const resolvedOrigin =
    allowOrigin === "*"
      ? "*"
      : origin && allowOrigin.includes(origin)
        ? origin
        : allowOrigin[0];

  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  headers["Access-Control-Allow-Origin"] = resolvedOrigin;
  if (resolvedOrigin !== "*") {
    headers.Vary = "Origin";
  }

  return headers;
}

function json(res: http.ServerResponse, status: number, body: unknown, origin?: string) {
  res.writeHead(status, corsHeaders(origin));
  res.end(JSON.stringify(body));
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

export const server = http.createServer(async (req, res) => {
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : undefined;

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(origin));
    res.end();
    return;
  }

  // GET /api/targets — list all connectors and their status
  if (req.method === "GET" && req.url === "/api/targets") {
    json(res, 200, {
      targets: connectors.map((c) => c.info()),
    }, origin);
    return;
  }

  // POST /api/push — push overlay to one or more targets
  if (req.method === "POST" && req.url === "/api/push") {
    try {
      const body = JSON.parse(await readBody(req)) as {
        overlay: string;
        targets?: string[];
        uninstall?: string[];
      };
      if (typeof body.overlay !== "string") {
        json(res, 400, { error: "Missing or invalid 'overlay' string in request body" }, origin);
        return;
      }

      const targetIds = body.targets ?? connectors.filter((c) => c.isConfigured()).map((c) => c.id);
      const uninstallIds = body.uninstall ?? [];
      const results: PushResult[] = [];

      for (const id of targetIds) {
        const connector = connectorMap.get(id);
        if (!connector) {
          results.push({ success: false, target: id, message: `Unknown push target: ${id}` });
          continue;
        }
        results.push(await connector.push(body.overlay));
      }

      for (const id of uninstallIds) {
        const connector = connectorMap.get(id);
        if (!connector) {
          results.push({ success: false, target: id, message: `Unknown uninstall target: ${id}` });
          continue;
        }
        results.push(await connector.uninstall());
      }

      const allOk = results.length === 0 || results.every((r) => r.success);
      json(res, allOk ? 200 : 207, { results }, origin);
    } catch (err) {
      json(res, 400, { error: `Invalid request: ${(err as Error).message}` }, origin);
    }
    return;
  }

  // GET /api/health
  if (req.method === "GET" && req.url === "/api/health") {
    json(
      res,
      200,
      {
        status: "ok",
        targets: connectors.length,
        allowedOrigins: allowedOrigins(),
      },
      origin,
    );
    return;
  }

  json(res, 404, { error: "Not found" }, origin);
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, () => {
    console.log(`TraitMixer server listening on http://localhost:${PORT}`);
    console.log("Configured targets:");
    for (const c of connectors) {
      const status = c.isConfigured() ? "✓ ready" : "✗ not configured";
      console.log(`  ${c.label}: ${status}`);
    }
  });
}
