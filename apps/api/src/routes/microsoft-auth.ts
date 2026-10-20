import { Router, type RequestHandler } from "express";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { AppError } from "../lib/AppError";
import { microsoftConfigured, requiredEnv, webOrigin } from "../lib/config";
import { database } from "../lib/database";
import { encrypt } from "../lib/encryption";
import { requireAuth } from "../middleware/auth";
import { graphRequest, microsoftClient, microsoftScopes } from "../services/microsoft";

export const microsoftAuthRouter = Router();
microsoftAuthRouter.use((req, _res, next) => {
  if (req.path !== "/status" && !microsoftConfigured()) {
    next(new AppError(503, "Microsoft integration is not configured. Follow the Outlook setup guide in the README."));
    return;
  }
  next();
});

export const requireCsrf: RequestHandler = (req, _res, next) => {
  const expected = req.session?.csrfToken;
  const actual = req.header("x-csrf-token");
  if (req.header("origin") !== webOrigin() || !expected || !actual || !/^[a-f0-9]{64}$/.test(actual) || expected.length !== actual.length ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) {
    next(new AppError(403, "Invalid request origin or security token. Refresh the page and try again."));
    return;
  }
  next();
};

microsoftAuthRouter.get("/status", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!microsoftConfigured() || !req.user) {
    res.json({ configured: microsoftConfigured(), connected: false });
    return;
  }
  const account = await database().microsoftAccount.findUnique({ where: { employeeId: Number(req.user.id) },
    select: { mailbox: true, connected: true, timeZone: true, workStart: true, workEnd: true } });
  req.session.csrfToken ??= randomBytes(32).toString("hex");
  res.json({ configured: true, ...account, employeeId: Number(req.user.id), csrfToken: req.session.csrfToken });
});

microsoftAuthRouter.get("/connect", async (req, res) => {
  if (!microsoftConfigured()) throw new AppError(503, "Microsoft integration is not configured. Follow the Outlook setup guide in the README.");
  if (req.header("sec-fetch-site") === "cross-site") throw new AppError(403, "Start sign-in from Coffee Connect.");
  const verifier = randomBytes(32).toString("base64url");
  const state = randomBytes(32).toString("hex");
  const nonce = randomBytes(32).toString("hex");
  req.session.oauth = { state, nonce, verifier, createdAt: Date.now() };
  const url = await microsoftClient().getAuthCodeUrl({
    scopes: microsoftScopes, redirectUri: requiredEnv("MICROSOFT_REDIRECT_URI"), state, nonce,
    codeChallenge: createHash("sha256").update(verifier).digest("base64url"), codeChallengeMethod: "S256", prompt: "select_account",
  });
  await new Promise<void>((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
  res.redirect(url);
});

microsoftAuthRouter.get("/callback", async (req, res) => {
  const pending = req.session?.oauth;
  delete req.session?.oauth;
  await new Promise<void>((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
  if (!pending || typeof req.query.state !== "string" || req.query.state !== pending.state ||
      Date.now() - pending.createdAt > 10 * 60_000) throw new AppError(400, "Sign-in expired or could not be verified. Start again from Coffee Connect.");
  if (req.query.error) {
    res.redirect(`${webOrigin()}/meetups?outlook=denied`);
    return;
  }
  if (typeof req.query.code !== "string") throw new AppError(400, "Microsoft did not return an authorisation code.");
  const client = microsoftClient();
  const result = await client.acquireTokenByCode({ code: req.query.code, scopes: microsoftScopes,
    redirectUri: requiredEnv("MICROSOFT_REDIRECT_URI"), codeVerifier: pending.verifier });
  const claims = result.idTokenClaims as { tid?: string; oid?: string; nonce?: string };
  if (!result.account || claims.tid?.toLowerCase() !== requiredEnv("MICROSOFT_TENANT_ID").toLowerCase() ||
      !claims.oid || claims.nonce !== pending.nonce) throw new AppError(403, "Microsoft account verification failed.");
  const profile = await graphRequest<{ id: string; mail: string | null; userPrincipalName: string; givenName: string | null; surname: string | null; userType: string }>(
    result.accessToken, "/me?$select=id,mail,userPrincipalName,givenName,surname,userType");
  if (profile.id !== claims.oid || profile.userType !== "Member") throw new AppError(403, "Only members of your configured organisation can sign in.");
  const mailbox = (profile.mail || profile.userPrincipalName).toLowerCase();
  const employee = await database().$transaction(async (transaction) => {
    const linked = await transaction.microsoftAccount.findUnique({
      where: { tenantId_objectId: { tenantId: claims.tid!, objectId: claims.oid! } }, include: { employee: true },
    });
    let person = linked?.employee ?? await transaction.employee.findUnique({ where: { email: mailbox }, include: { microsoftAccount: true } });
    if (person && !person.isActive) throw new AppError(403, "Your Coffee Connect account is inactive.");
    if (!linked && person) {
      const existing = await transaction.microsoftAccount.findUnique({ where: { employeeId: person.employeeId } });
      if (existing) throw new AppError(409, "This employee is already linked to a different Microsoft identity. Contact an administrator.");
    }
    if (!person) person = await transaction.employee.create({ data: { email: mailbox, firstName: profile.givenName || "Employee", lastName: profile.surname || "" } });
    const data = { tenantId: claims.tid!, objectId: claims.oid!, homeAccountId: result.account!.homeAccountId,
      mailbox, encryptedCache: encrypt(client.getTokenCache().serialize()), connected: true };
    await transaction.microsoftAccount.upsert({ where: { employeeId: person.employeeId }, create: { employeeId: person.employeeId, ...data }, update: data });
    return person;
  });
  await new Promise<void>((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
  req.session.employeeId = employee.employeeId;
  req.session.csrfToken = randomBytes(32).toString("hex");
  await new Promise<void>((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
  res.redirect(`${webOrigin()}/meetups`);
});

microsoftAuthRouter.post("/logout", requireAuth, requireCsrf, async (req, res) => {
  await new Promise<void>((resolve, reject) => req.session.destroy((error) => error ? reject(error) : resolve()));
  res.clearCookie("cc.sid", { path: "/" }).sendStatus(204);
});

microsoftAuthRouter.post("/disconnect", requireAuth, requireCsrf, async (req, res) => {
  await database().microsoftAccount.update({ where: { employeeId: Number(req.user!.id) }, data: { connected: false, encryptedCache: "" } });
  await new Promise<void>((resolve, reject) => req.session.destroy((error) => error ? reject(error) : resolve()));
  res.clearCookie("cc.sid", { path: "/" }).sendStatus(204);
});