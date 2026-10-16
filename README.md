# Coffee Connect

Coffee Connect uses Next.js in `apps/web`, Express in `apps/api`, and Prisma/MySQL in `packages/db`.
Run the commands below from this directory, which contains the workspace `package.json`, not its parent directory.
Use Node.js 22 or newer.


## 1. Register With Microsoft

This integration assumes Microsoft 365 work accounts with Exchange Online mailboxes in one organisation. Personal Outlook.com accounts and guest users are not supported by this implementation.

1. Open Microsoft Entra admin centre, then **App registrations > New registration**.
2. Name the application Coffee Connect and select **Accounts in this organisational directory only**.
3. Add a **Web** platform redirect URI of `http://localhost:3000/api/coffee/auth/microsoft/callback`. Use this proxied address, not a frontend page or the bare API callback URL.
4. Record the **Application (client) ID** and **Directory (tenant) ID**. The tenant must be its specific GUID, not `common` or `organisations`.
5. Under **Certificates & secrets**, create a development client secret. Use its **value**, not its ID. Put it directly into your local environment file; never send it through chat or commit it.
6. Under **API permissions**, add Microsoft Graph **delegated** `User.Read` and `Calendars.ReadWrite`. The sign-in request also includes `openid`, `profile`, and `offline_access`.
7. Ask IT for administrator consent if organisational policy requires it. Do not add application-wide calendar permissions for this delegated implementation.

`User.Read` verifies the signed-in account and mailbox. `Calendars.ReadWrite` supports availability checks and event creation/update/cancellation. `offline_access` enables token renewal. For an availability-only app, the narrower `Calendars.ReadBasic` would be enough, but it cannot create meetings.

Employees must each sign in once. Looking up a colleague's free/busy time still depends on Exchange sharing policy; connecting an account does not bypass it. Start with two test employee mailboxes in the same tenant.

## 2. Configure the Environment

Merge the settings from [.env.example](.env.example) into your existing root `.env`. Do not overwrite your existing database URL. The API and Prisma read root settings first, with `packages/db/.env` as a database fallback.

| Setting | Purpose |
| --- | --- |
| `DATABASE_URL` | Your existing MySQL connection |
| `MICROSOFT_TENANT_ID` | Organisation's directory GUID |
| `MICROSOFT_CLIENT_ID` | Registered application ID |
| `MICROSOFT_CLIENT_SECRET` | Server credential issued by Entra |
| `MICROSOFT_REDIRECT_URI` | Exact Web redirect URI registered above |
| `WEB_ORIGIN` | Browser origin, initially `http://localhost:3000` |
| `SESSION_SECRET` | Random value used to sign the session cookie; at least 32 characters |
| `TOKEN_ENCRYPTION_KEY` | Base64 encoding of exactly 32 random bytes for AES-256-GCM encryption |
| `PORT` | Express port, initially 4000 |

Generate two independent random values by running this command twice in your own terminal. Put one value in `SESSION_SECRET` and the other in `TOKEN_ENCRYPTION_KEY`:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

These are secrets. Keep them out of source control and logs. Retain the encryption key across restarts: replacing it prevents the server from reading existing token caches and sessions. Plan a proper key rotation before changing it.

The frontend proxy defaults to `http://127.0.0.1:4000`. To change it, configure `API_ORIGIN` in `apps/web/.env.local`, using [apps/web/.env.example](apps/web/.env.example) as the reference. `API_ORIGIN` is a server setting, not a `NEXT_PUBLIC_` variable.

Restart the API after changing root settings, and Next.js after changing its proxy setting. If changing browser ports, update `WEB_ORIGIN`, the redirect URI, and the Entra registration together. Do not mix `localhost` and `127.0.0.1` in browser URLs.

## 3. Database Setup

The Outlook migration adds `MicrosoftAccount`, `ApiSession`, and nullable Outlook fields on `Meeting`. Existing meeting date/time fields remain for compatibility; `startsAt` and `endsAt` are the authoritative UTC instants for Outlook meetings. Each employee's scheduling timezone is stored separately.

On the local database used during implementation, the Outlook migration **has already been applied**. Do not rerun its SQL.

**Existing migration warning:** `20261013160000_two_employee_matches` is still pending in Prisma history even though its employee-pair columns exist. The database is also missing older foreign keys. That SQL drops `Match_Participant`, so do not blindly run `prisma migrate deploy`, `migrate dev`, `db push`, a reset, or `db:setup` against this existing database. Reconcile the older schema/history with a backup and administrator review separately.

For this database, only the new additive migration was applied and recorded:

```bash
cd packages/db
node ../../node_modules/prisma/build/index.js db execute --file prisma/migrations/20261016120000_outlook_integration/migration.sql --config prisma7.config.ts
node ../../node_modules/prisma/build/index.js migrate resolve --applied 20261016120000_outlook_integration --config prisma7.config.ts
cd ../..
```

The first command executed only the new Outlook SQL. The second recorded that exact migration in Prisma's history, without falsely marking the partially applied older migration complete. These commands are an explanation of what was run, not instructions to repeat on this database. For another environment, inspect its migration state and back it up first.

## 4. Install, Check, and Run

```bash
npm install
npm exec -w packages/db -- prisma generate --config prisma7.config.ts
npm run build -w apps/api
npm test -w apps/api
npm run build -w apps/web
```

`npm install` installs workspace dependencies and updates the lockfile. `prisma generate` rebuilds the database TypeScript client, without changing database data. API build runs TypeScript compilation. Tests exercise scheduling, unreadable calendars, encryption, forged headers, CSRF, and Graph response handling. Web build checks the frontend and creates its production output.

Next.js and the icon package are scoped to the existing React 18 runtime via root dependency overrides. This prevents a hoisted React 19 dependency from mixing incompatible runtimes into the frontend.

Start these in two terminals:

```bash
npm run dev:api
```

```bash
npm run dev:web -- --port 3000
```

The API runs on `http://localhost:4000`; open `http://localhost:3000/meetups` in the browser. Until Microsoft settings are complete, the page shows **Outlook setup pending** and does not attempt sign-in.

## 5. What Each Code Area Does

| Code | Responsibility |
| --- | --- |
| [apps/api/src/routes/microsoft-auth.ts](apps/api/src/routes/microsoft-auth.ts) | Start sign-in, validate callback, link verified directory identity, issue session, disconnect/logout, and check CSRF |
| [apps/api/src/services/microsoft.ts](apps/api/src/services/microsoft.ts) | MSAL token acquisition/renewal and server-only Graph requests with timeout/error handling |
| [apps/api/src/lib/session.ts](apps/api/src/lib/session.ts) | Database-backed, HTTP-only signed session cookie |
| [apps/api/src/lib/encryption.ts](apps/api/src/lib/encryption.ts) | AES-GCM encryption with a fresh nonce and tamper detection |
| [apps/api/src/middleware/auth.ts](apps/api/src/middleware/auth.ts) | Load an active employee from the session; derive administrator role from the database |
| [apps/api/src/routes/calendar.ts](apps/api/src/routes/calendar.ts) | Match selection, preferences, authorised availability and meeting endpoints |
| [apps/api/src/services/calendar-slots.ts](apps/api/src/services/calendar-slots.ts) | Intersect both calendars with both employees' preferred weekday hours |
| [apps/api/src/services/outlook-calendar.ts](apps/api/src/services/outlook-calendar.ts) | Read free/busy, create one organiser event with an attendee, retry writes, reconcile Outlook changes |
| [apps/web/components/outlook-calendar.tsx](apps/web/components/outlook-calendar.tsx) | Connection, preferences, real wheel, available times and meeting controls |
| [apps/web/next.config.ts](apps/web/next.config.ts) | Same-origin API proxy, keeping credentials out of the frontend |
| [packages/db/prisma/schema.prisma](packages/db/prisma/schema.prisma) | Account links, sessions and durable booking state |

The authentication flow uses **state** to tie the callback to the initiating browser, **PKCE** to bind the authorisation code to the initiating server session, and a **nonce** to check the returned identity. The session ID is regenerated after sign-in. Employee accounts are provisioned from Microsoft's verified profile; existing email records can be linked once, but a linked Microsoft identity cannot be silently replaced by another one. Only active tenant members are admitted.

Availability calls `POST /me/calendar/getSchedule` on Graph. The API returns only shared slots, not other meetings' subjects or descriptions. Weekends and non-free intervals, including tentative, out-of-office, unknown and working-elsewhere statuses, are excluded. Missing mailboxes are an error, never assumed free. Hours are **Coffee Connect preferences**, initially Monday-Friday 09:00-17:00 Europe/London, not an automatic import of Outlook working hours.

Booking calls `POST /me/events`, with the colleague as an attendee. This creates one meeting and sends an invitation, not two unrelated events. Invitation sent does not mean accepted. Preferences and booking times are revalidated server-side; users cannot book or read availability for matches they do not belong to.

Before Graph writes, the database saves the operation. A unique active-match field prevents duplicate active bookings for one match, and a stable Graph `transactionId` protects create retries. An interrupted booking can be retried; the API checks for an already-created event and rechecks availability before a new write. It never reports a failed operation as a confirmed invitation. An unconfirmed failed create can be cancelled after a two-minute settling period.

`Check Outlook` reads the organiser event and reconciles changed times, location, or cancellation. This is manual synchronisation, not background webhook delivery. Rescheduling and cancellation must be performed by the organiser. Direct attendee acceptance/decline status is not synchronised into Coffee Connect yet.

## Testing With Microsoft

1. Complete the environment settings and restart both servers.
2. Sign in as test employee A, then employee B in another browser/private session.
3. Set both employees' preferred hours and timezone, then spin the wheel to save a match.
4. Create a busy Outlook appointment for one employee and verify that Coffee Connect does not suggest overlapping slots.
5. Choose a shared slot and confirm; check the organiser calendar and attendee invitation.
6. Reschedule and cancel from Coffee Connect, checking the resulting Outlook updates.
7. Change a meeting directly in Outlook and use `Check Outlook` as its organiser.
8. Disconnect an account and verify that further calendar operations require reconnection.

No real Microsoft sign-in or invitation can be verified without your tenant registration, consent and test accounts. Local automated tests do not contact Microsoft or send invitations.

## Limits and Deployment

- UI searches seven days at a time; the API permits up to 14 days within the next 90 days. Coffee duration is 30 minutes, with 15-minute candidate start intervals.
- Availability is rechecked before booking, but external calendars cannot be locked atomically. Someone can still create a conflicting appointment concurrently.
- The wheel uses persisted database interests. The existing Personal-page interest editor remains browser-local; it is not a server-side interest-management implementation. New employees without saved database interests are matched by secure random tie-breaking.
- Disconnect deletes Coffee Connect's stored Microsoft token cache; it does not cancel existing invitations or revoke the tenant's Microsoft consent. Revoke consent through Microsoft/IT separately when required.
- Periodically delete expired `ApiSession` rows using your database maintenance tooling. Cookie expiry alone does not remove rows.
- For production, use HTTPS, `NODE_ENV=production`, a managed secret store, a reviewed credential/certificate strategy, encrypted database transport, and an appropriate retention policy. The database adapter currently follows the project's local MySQL setup; configure and verify TLS before using a remote production database.
- Keep the Express API behind a trusted private reverse proxy; review `trust proxy` for your deployment. Register the HTTPS production callback and update origins together.
- Background scheduling/application permissions, automatic webhook subscriptions and automatic attendee-response tracking are not implemented. They require additional IT approval and operational infrastructure.
- Dependency auditing reports advisories in the existing database/tooling dependency tree. Review these before production; no forced breaking upgrades were applied.

Microsoft references: [getSchedule](https://learn.microsoft.com/en-us/graph/api/calendar-getschedule?view=graph-rest-1.0), [create event](https://learn.microsoft.com/en-us/graph/api/user-post-events?view=graph-rest-1.0).
