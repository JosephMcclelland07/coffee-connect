const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

process.env.DATABASE_URL = "mysql://test:test@localhost:3306/test";
process.env.JWT_SECRET = "test-only-secret-not-for-deployment-123456789";

const { createAuthRouter } = require("../dist/routes/auth");
const { createAuthContextMiddleware, requireAuth } = require("../dist/middleware/auth");
const { errorHandlerMiddleware } = require("../dist/middleware/errorHandler");

test("registration, password verification, and JWT protection", async (suite) => {
  const accounts = new Map();
  const authEvents = [];
  const store = { employee: {
    async create({ data }) {
      if (accounts.has(data.email)) throw Object.assign(new Error("Duplicate"), { code: "P2002" });
      const account = { employeeId: accounts.size + 1, isActive: true, failedLoginCount: 0, lastLoginAt: null, lastFailedLoginAt: null, ...data };
      accounts.set(data.email, account);
      return { employeeId: account.employeeId, firstName: account.firstName, lastName: account.lastName, email: account.email };
    },
    async findUnique({ where }) {
      return where.email ? accounts.get(where.email) ?? null : [...accounts.values()].find(account => account.employeeId === where.employeeId) ?? null;
    },
    async update({ where, data }) {
      const account = [...accounts.values()].find((entry) => entry.employeeId === where.employeeId);
      if (!account) throw new Error("Account not found");
      if (data.failedLoginCount && typeof data.failedLoginCount.increment === "number") {
        account.failedLoginCount += data.failedLoginCount.increment;
      }
      if (Object.prototype.hasOwnProperty.call(data, "lastFailedLoginAt")) {
        account.lastFailedLoginAt = data.lastFailedLoginAt;
      }
      if (Object.prototype.hasOwnProperty.call(data, "lastLoginAt")) {
        account.lastLoginAt = data.lastLoginAt;
      }
      if (Object.prototype.hasOwnProperty.call(data, "failedLoginCount") && typeof data.failedLoginCount === "number") {
        account.failedLoginCount = data.failedLoginCount;
      }
      return account;
    },
  }, authEvent: {
    async create({ data }) {
      authEvents.push(data);
      return { authEventId: authEvents.length, ...data };
    },
  } };
  const app = express();
  app.use(express.json());
  app.use(createAuthContextMiddleware(store));
  app.use("/auth", createAuthRouter(store));
  app.use("/ineligible", createAuthRouter(store));
  app.get("/protected", requireAuth, (req, res) => res.json(req.user));
  app.use(errorHandlerMiddleware);
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  suite.after(() => new Promise(resolve => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const credentials = { name: "Test Person", email: "person@paconsulting.com", password: "a-test-password-123" };
  let token;

  async function post(path, body, prefix = "auth") {
    const response = await fetch(`${base}/${prefix}/${path}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  }

  await suite.test("rejects other domains, empty names and unsafe password lengths", async () => {
    for (const update of [{ email: "person@elsewhere.com" }, { name: " " }, { password: "short" }, { password: "x".repeat(73) }, { password: "é".repeat(37) }]) {
      assert.equal((await post("register", { ...credentials, ...update })).status, 400);
    }
    assert.equal(accounts.size, 0);
  });
  await suite.test("stores a bcrypt hash and normalizes email without exposing the hash", async () => {
    const result = await post("register", { ...credentials, email: " Person@PACONSULTING.COM " });
    assert.equal(result.status, 201);
    const saved = accounts.get(credentials.email);
    assert.notEqual(saved.passwordHash, credentials.password);
    assert.equal(await bcrypt.compare(credentials.password, saved.passwordHash), true);
    assert.equal(result.body.account.passwordHash, undefined);
  });
  await suite.test("rejects duplicate email", async () => {
    assert.equal((await post("register", credentials)).status, 409);
  });
  await suite.test("rejects incorrect passwords with a generic response", async () => {
    const result = await post("login", { ...credentials, password: "wrong-password-123" });
    assert.equal(result.status, 401);
    assert.equal(result.body.error, "Invalid email or password.");
  });
  await suite.test("issues a one-hour employee JWT after login", async () => {
    const result = await post("login", credentials);
    assert.equal(result.status, 200);
    token = result.body.token;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    assert.equal(payload.role, "employee");
    assert.equal(payload.exp - payload.iat, 3600);
    assert.equal(payload.password, undefined);
  });
  await suite.test("unknown accounts receive the same credential error", async () => {
    const result = await post("login", { ...credentials, email: "unknown@paconsulting.com" });
    assert.equal(result.status, 401);
    assert.equal(result.body.error, "Invalid email or password.");
  });
  await suite.test("limits repeated authentication attempts", async () => {
    assert.equal((await post("login", credentials)).status, 429);
  });
  await suite.test("rejects inactive employees and employees without passwords", async () => {
    const saved = accounts.get(credentials.email);
    accounts.set("inactive@paconsulting.com", { ...saved, isActive: false });
    accounts.set("legacy@paconsulting.com", { ...saved, passwordHash: null });
    for (const email of ["inactive@paconsulting.com", "legacy@paconsulting.com"]) {
      const result = await post("login", { ...credentials, email }, "ineligible");
      assert.equal(result.status, 401);
      assert.equal(result.body.error, "Invalid email or password.");
    }
    const result = await post("register", { ...credentials, email: "legacy@paconsulting.com" }, "ineligible");
    assert.equal(result.status, 409);
    assert.equal(accounts.get("legacy@paconsulting.com").passwordHash, null);
  });
  await suite.test("rejects missing, forged and expired tokens and spoofed identity headers", async () => {
    const expired = jwt.sign({ role: "employee" }, process.env.JWT_SECRET, {
      subject: "1", issuer: "coffee-connect-api", audience: "coffee-connect-web", expiresIn: -1,
    });
    for (const headers of [{}, { "x-user-id": "1", "x-user-role": "hr_admin" }, { Authorization: "Bearer fake" }, { Authorization: `Bearer ${expired}` }]) {
      assert.equal((await fetch(`${base}/protected`, { headers })).status, 401);
    }
    assert.equal((await fetch(`${base}/protected`, { headers: { Authorization: `Bearer ${token}` } })).status, 200);
  });
});