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
| `JWT_SECRET` | Independent random secret of at least 32 bytes for password-login tokens |
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
```

Generate a third independent random value using the command above and set `JWT_SECRET` in the root `.env` to enable password login. A missing or short secret returns a controlled setup error; it no longer prevents the API from starting. Never commit the secret or paste it into chat.

After installing dependencies, generate database types and run the checks:

```bash
npm exec -w packages/db -- prisma generate --config prisma7.config.ts --no-hints
npm run build
npm run lint
npm test
```

`build` compiles both applications. `lint` checks the web application using the Strict Next.js rules; API compilation supplies its TypeScript check. `test` includes scheduling/security tests and the merged registration, password-login and JWT tests. Authentication tests use an in-memory account store and do not create employee records in your database.

Run the servers in separate terminals from this directory:

```bash
npm run dev:api
```

```bash
npm run dev:web -- --port 3000
```

Open `http://localhost:3000`. `/signup` now registers a real account and sends the user to `/login`; `/login` supports password authentication and Microsoft sign-in. Both account and calendar proxy routes use `API_ORIGIN` in `apps/web/.env.local`, defaulting to `http://127.0.0.1:4000`. The older `API_URL` setting remains a fallback for the account route only.

## Verified Status and Remaining Gaps

- The nullable `Employee.PasswordHash` column was missing after the login merge. Migration `20261016150000_employee_password_hash` has now been applied and recorded locally without changing existing employee records. Do not rerun its SQL on this database.
- The older migration-history/foreign-key drift described above remains unresolved. Do not reset or blindly deploy migrations to this existing database.
- Real Outlook sign-in, availability and invitations require the tenant configuration and two authorised test mailboxes. Browser demonstrations are not proof of real Microsoft access.
- Password registration checks the `@paconsulting.com` domain but does **not** verify ownership of that mailbox. Do not expose password registration publicly before adding ownership verification or restricting registration to a trusted provisioning process; Microsoft SSO is the preferred verified organisational identity path.
- The Personal/profile editor currently stores interests, office days and hours in browser storage. It does not update database interests used by the matching wheel or automatically update calendar preferences. Calendar preferences are managed separately on Meetups. This needs a separate persisted profile workflow before claiming end-to-end interest matching.
- The chat component is a local demonstration, not server-backed messaging. Notifications and background Outlook webhook delivery are not implemented.
- Review dependency audit findings and configure HTTPS, secret management, database TLS and retention before production deployment. Successful builds/tests alone do not certify production readiness.
