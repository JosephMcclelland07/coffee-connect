import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readBusyPeriods } from "./outlook-calendar";
import { encrypt, decrypt } from "../lib/encryption";

test("normalises UTC availability without returning meeting titles", () => {
  const result = readBusyPeriods({ value: [{ scheduleId: "employee@example.com", scheduleItems: [
    { status: "busy", start: { dateTime: "2026-10-19T09:00:00.0000000", timeZone: "UTC" }, end: { dateTime: "2026-10-19T10:00:00.0000000", timeZone: "UTC" } },
  ] }] }, "EMPLOYEE@example.com");
  assert.equal(result[0].start, "2026-10-19T09:00:00.0000000Z");
  assert.deepEqual(Object.keys(result[0]), ["start", "end", "status"]);
});

test("fails closed when a mailbox is missing or Graph returns an error", () => {
  assert.throws(() => readBusyPeriods({ value: [] }, "missing@example.com"));
  assert.throws(() => readBusyPeriods({ value: [{ scheduleId: "blocked@example.com", error: { responseCode: "ErrorMailRecipientNotFound" } }] }, "blocked@example.com"));
  assert.deepEqual(readBusyPeriods({ value: [{ scheduleId: "free@example.com", scheduleItems: [] }] }, "free@example.com"), []);
});

test("encrypts credentials with authenticated encryption and rejects tampering", () => {
  process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  const encrypted = encrypt("sensitive-token-cache");
  assert.equal(decrypt(encrypted), "sensitive-token-cache");
  assert.notEqual(encrypted, encrypt("sensitive-token-cache"));
  const damaged = Buffer.from(encrypted, "base64");
  damaged[damaged.length - 1] ^= 1;
  assert.throws(() => decrypt(damaged.toString("base64")));
});