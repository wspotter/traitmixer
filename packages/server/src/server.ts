import * as http from "node:http";
import { createAllConnectors } from "traitmixer-connectors";
import type { Connector, PushResult } from "traitmixer-connectors";

const PORT = parseInt(process.env.TRAITMIXER_SERVER_PORT ?? "4400", 10);
const connectors = createAllConnectors();
const connectorMap = new Map<string, Connector>(connectors.map((c) => [c.id, c]));

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

function json(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, corsHeaders());
  res.end(JSON.stringify(body));
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  // GET /api/targets — list all connectors and their status
  if (req.method === "GET" && req.url === "/api/targets") {
    json(res, 200, {
      targets: connectors.map((c) => c.info()),
    });
    return;
  }

  // POST /api/push — push overlay to one or more targets
  if (req.method === "POST" && req.url === "/api/push") {
    try {
      const body = JSON.parse(await readBody(req)) as {
        overlay: string;
        targets?: string[];
      };
      if (!body.overlay || typeof body.overlay !== "string") {
        json(res, 400, { error: "Missing 'overlay' string in request body" });
        return;
      }

      const targetIds = body.targets ?? connectors.filter((c) => c.isConfigured()).map((c) => c.id);
      const results: PushResult[] = [];

      for (const id of targetIds) {
        const connector = connectorMap.get(id);
        if (!connector) {
          results.push({ success: false, target: id, message: `Unknown target: ${id}` });
          continue;
        }
        results.push(await connector.push(body.overlay));
      }

      const allOk = results.every((r) => r.success);
      json(res, allOk ? 200 : 207, { results });
    } catch (err) {
      json(res, 400, { error: `Invalid request: ${(err as Error).message}` });
    }
    return;
  }

  // GET /api/health
  if (req.method === "GET" && req.url === "/api/health") {
    json(res, 200, { status: "ok", targets: connectors.length });
    return;
  }

  json(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`TraitMixer server listening on http://localhost:${PORT}`);
  console.log("Configured targets:");
  for (const c of connectors) {
    const status = c.isConfigured() ? "✓ ready" : "✗ not configured";
    console.log(`  ${c.label}: ${status}`);
  }
});
