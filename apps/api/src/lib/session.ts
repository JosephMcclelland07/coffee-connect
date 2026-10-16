import session, { type SessionData } from "express-session";
import { database } from "./database";
import { encrypt, decrypt } from "./encryption";
import { requiredEnv } from "./config";

declare module "express-session" {
  interface SessionData {
    employeeId?: number;
    csrfToken?: string;
    oauth?: { state: string; nonce: string; verifier: string; createdAt: number };
  }
}

class DatabaseSessionStore extends session.Store {
  get(id: string, callback: (error: unknown, data?: SessionData | null) => void): void {
    database().apiSession.findUnique({ where: { id } }).then((record) => {
      callback(null, record && record.expiresAt > new Date() ? JSON.parse(decrypt(record.encryptedData)) : null);
    }).catch(callback);
  }

  set(id: string, data: SessionData, callback?: (error?: unknown) => void): void {
    const record = {
      encryptedData: encrypt(JSON.stringify(data)),
      expiresAt: data.cookie.expires ? new Date(data.cookie.expires) : new Date(Date.now() + 8 * 60 * 60_000),
    };
    database().apiSession.upsert({ where: { id }, create: { id, ...record }, update: record })
      .then(() => callback?.()).catch((error) => callback?.(error));
  }

  destroy(id: string, callback?: (error?: unknown) => void): void {
    database().apiSession.deleteMany({ where: { id } }).then(() => callback?.()).catch((error) => callback?.(error));
  }
}

export function sessionMiddleware() {
  const secret = requiredEnv("SESSION_SECRET");
  if (secret.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return session({
    name: "cc.sid", secret, store: new DatabaseSessionStore(), resave: false, saveUninitialized: false,
    cookie: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 8 * 60 * 60_000, path: "/" },
  });
}