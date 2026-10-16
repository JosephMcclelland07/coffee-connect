import { strict as assert } from "node:assert";
import { test } from "node:test";
import express, { type Request, type Response } from "express";
import { authContextMiddleware, requireAuth } from "../middleware/auth";
import { requireCsrf } from "../routes/microsoft-auth";
import { graphRequest, GraphError } from "./microsoft";

test("forged user and admin headers do not authenticate requests", async () => {
  const app = express();
  app.use(authContextMiddleware);
  app.get("/protected", requireAuth, (_req, res) => res.json({ ok: true }));
  app.use((error: { statusCode?: number }, _req: Request, res: Response, _next: unknown) => res.sendStatus(error.statusCode || 500));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(`http://127.0.0.1:${address.port}/protected`, { headers: { "x-user-id": "1", "x-user-role": "hr_admin" } });
    assert.equal(response.status, 401);
  } finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
});

test("CSRF protection requires both the correct origin and token", () => {
  const original = process.env.WEB_ORIGIN;
  process.env.WEB_ORIGIN = "http://localhost:3000";
  try {
    const token = "a".repeat(64);
    for (const [origin, supplied, valid] of [["http://localhost:3000", token, true], ["https://attacker.example", token, false],
      ["http://localhost:3000", "wrong", false], ["http://localhost:3000", "é".repeat(64), false]] as const) {
      const req = { session: { csrfToken: token }, header: (name: string) => name === "origin" ? origin : supplied } as unknown as Request;
      let result: unknown;
      requireCsrf(req, {} as Response, (error?: unknown) => { result = error; });
      assert.equal(result === undefined, valid);
    }
  } finally { if (original === undefined) delete process.env.WEB_ORIGIN; else process.env.WEB_ORIGIN = original; }
});

test("Graph handles empty cancellation responses and does not expose upstream errors", async (context) => {
  const mocked = context.mock.method(globalThis, "fetch", async () => new Response(null, { status: 202 }));
  assert.equal(await graphRequest("test-token", "/me/events/test/cancel", "POST", {}), undefined);
  mocked.mock.mockImplementation(async () => new Response("private calendar details", { status: 403 }));
  await assert.rejects(graphRequest("test-token", "/me/events"), (error: unknown) => error instanceof GraphError &&
    error.graphStatus === 403 && !error.message.includes("private calendar details"));
});