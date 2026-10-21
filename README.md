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

Generate independent random values in your own terminal. Use a new value for each secret; do not reuse one value across settings.

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Use generated values for `SESSION_SECRET` and `JWT_SECRET`. For `TOKEN_ENCRYPTION_KEY`, generate 32 random bytes and encode them as Base64:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

These are secrets. Keep them out of source control and logs. Retain the encryption key across restarts: replacing it prevents the server from reading existing token caches and sessions. Plan a proper key rotation before changing it. Password login returns a server configuration error until `JWT_SECRET` is set to an independent value of at least 32 bytes.

The frontend proxy defaults to `http://127.0.0.1:4000`. To change it, configure `API_ORIGIN` in `apps/web/.env.local`, using [apps/web/.env.example](apps/web/.env.example) as the reference. `API_ORIGIN` is a server setting, not a `NEXT_PUBLIC_` variable.

Restart the API after changing root settings, and Next.js after changing its proxy setting. If changing browser ports, update `WEB_ORIGIN`, the redirect URI, and the Entra registration together. Do not mix `localhost` and `127.0.0.1` in browser URLs.

## 3. Database Setup

The Outlook migration adds `MicrosoftAccount`, `ApiSession`, and nullable Outlook fields on `Meeting`. Existing meeting date/time fields remain for compatibility; `startsAt` and `endsAt` are the authoritative UTC instants for Outlook meetings. Each employee's scheduling timezone is stored separately.

Migration history has been rebased to a single canonical baseline:

- `packages/db/prisma/migrations/20261021140000_baseline` is the supported starting point for Prisma migration replay.
- `packages/db/prisma/migrations_legacy/` contains historical migrations kept for reference only; do not use that directory as your Prisma migrations source.

For existing local databases that were previously synced manually, ensure schema parity with:

```bash
npm exec -w packages/db -- prisma db push --config prisma7.config.ts
npm exec -w packages/db -- prisma migrate resolve --applied 20261021140000_baseline --config prisma7.config.ts
```

For new environments, use normal migration workflows against `prisma/migrations`.

## 4. Install, Check, and Run
Coffee Connect is a monorepo for an employee coffee-meetup platform, with a Next.js frontend, an Express API, and a MySQL database accessed through Prisma.

## Prerequisites

- Node.js and npm with workspace support. Use a Node.js release supported by the installed Next.js and Prisma versions.
- A running MySQL server and the `mysql` command-line client.
- A database user with permission to create the local development database and apply schema changes.

Run all commands below from the repository root unless stated otherwise.

## Installation

```bash
npm install
```

Keep the API on TypeScript 5.9.x. Its `ts-node-dev` runner requires compiler APIs that TypeScript 7 does not expose; upgrading causes the `Cannot read properties of undefined (reading 'fileExists')` startup error.

## Database Setup

Create a root `.env` file with your local database connection:

```dotenv
DATABASE_URL="mysql://root:YOUR_PASSWORD@127.0.0.1:3306/coffeeconnect"
```

Replace the example credentials with your own. URL-encode special characters in the username and password. Do not commit credentials.

The API loads `.env` from the repository root and then `packages/db/.env`, without overriding existing environment variables. Prisma's config loads `packages/db/.env`, so put the same connection there when running Prisma commands directly, or export `DATABASE_URL` in your shell.

With MySQL running, run:

```bash
npm run db:setup
```

The script creates the database, generates the Prisma client, and attempts migrations. If migrations fail, it falls back to `prisma db push` for local onboarding. It does not seed data. Use this script only for local development, not production migrations.

The script uses the following shell environment variables; it does not load them from `.env`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_NAME` | `coffeeconnect` | Database to create |
| `MYSQL_HOST` | `127.0.0.1` | MySQL host |
| `MYSQL_PORT` | `3306` | MySQL port |
| `MYSQL_ROOT_USER` | `root` | MySQL user |
| `MYSQL_ROOT_PASSWORD` | Unset | MySQL password |
| `DATABASE_URL` | Constructed from the values above | Prisma connection |

Ensure these settings match your `.env` connection. The connection exported inside the setup script does not persist for the API after the script exits.

Populate or synchronize the employee, interest, and category seed data with:

```bash
npm run db:seed
```

The profile editor loads categories from the public `GET /interest-categories` API endpoint. Set `NEXT_PUBLIC_API_URL` for the web app when the API is not available at `http://localhost:4000`.

### Prisma Configuration Troubleshooting

The Prisma config is named `prisma7.config.ts`, rather than the default `prisma.config.ts`. If the setup script cannot discover the config or reports a missing datasource URL, use the explicit config after the database has been created:

```bash
npm exec -w packages/db -- prisma generate --config prisma7.config.ts
npm exec -w packages/db -- prisma db push --config prisma7.config.ts
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
`db push` synchronizes the local schema without creating a migration. For migration-based development, use:

```bash
npm exec -w packages/db -- prisma migrate dev --config prisma7.config.ts
```

## Local Development

Start the API and frontend in separate terminals:

```bash
npm run dev:api
```

```bash
npm run dev:web -- --port 3000
```

Open `http://localhost:3000`. `/signup` now registers a real account and sends the user to `/login`; `/login` supports password authentication and Microsoft sign-in. Both account and calendar proxy routes use `API_ORIGIN` in `apps/web/.env.local`, defaulting to `http://127.0.0.1:4000`. The older `API_URL` setting remains a fallback for the account route only.

## Verified Status and Remaining Gaps

- The nullable `Employee.PasswordHash` column was missing after the login merge. Migration `20261016150000_employee_password_hash` has now been applied and recorded locally without changing existing employee records. Do not rerun its SQL on this database.
- Prisma migrations are now baselined at `20261021140000_baseline`; legacy migrations are archived under `packages/db/prisma/migrations_legacy` for historical context only.
- Real Outlook sign-in, availability and invitations require the tenant configuration and two authorised test mailboxes. Browser demonstrations are not proof of real Microsoft access.
- Password registration checks the `@paconsulting.com` domain but does **not** verify ownership of that mailbox. Do not expose password registration publicly before adding ownership verification or restricting registration to a trusted provisioning process; Microsoft SSO is the preferred verified organisational identity path.
- The Personal/profile editor now persists selected interests and office location to the database for the signed-in employee. Office days and available hours remain browser-local profile preferences; calendar preferences are still managed separately on Meetups.
- The chat component is a local demonstration, not server-backed messaging. Notifications and background Outlook webhook delivery are not implemented.
- Review dependency audit findings and configure HTTPS, secret management, database TLS and retention before production deployment. Successful builds/tests alone do not certify production readiness.
npm run dev:web
```

- Frontend: http://localhost:3000
- API: http://localhost:4000
- `npm run dev` starts only the frontend.
- Set `PORT` to change the API port and `CORS_ORIGIN` to restrict allowed browser origins. CORS defaults to `*` for local development.

Verify the API is running:

```bash
curl http://localhost:4000/health
```

Expected response:

```json
{"ok":true,"service":"api"}
```

This checks API availability, not database connectivity.

## API Requests

Use [apps/api/requests.http](apps/api/requests.http) with an HTTP client such as the VS Code REST Client extension to exercise database-backed endpoints.

The request examples include `x-user-id` and `x-user-role` headers for the API's development authentication context. HR-admin endpoints require the `hr_admin` role. These headers are not a production authentication mechanism.

## Build And Checks

```bash
npm run build -w apps/api
npm run build -w apps/web
npm test
```

The API test script is currently a placeholder, not an automated test suite. After building, start either application with `npm run start -w apps/api` or `npm run start -w apps/web`.

## Project Structure

```text
coffee-connect/
|-- apps/
|   |-- api/
|   |   |-- src/
|   |   |   |-- index.ts              # Express app and API routes
|   |   |   |-- lib/                  # Prisma client and application errors
|   |   |   |-- middleware/           # Auth, validation, logging, and errors
|   |   |   `-- types/                # Auth and Express type declarations
|   |   |-- requests.http             # Example API requests
|   |   |-- package.json
|   |   `-- tsconfig.json
|   `-- web/
|       |-- app/                      # Next.js App Router pages and layouts
|       |   |-- login/
|       |   |-- meetups/
|       |   |-- personal/
|       |   |-- profile/setup/
|       |   `-- signup/
|       |-- components/               # Profiles, signup, chat, and spin wheel
|       |-- lib/                      # Profile-flow helpers
|       |-- public/                   # Static assets
|       |-- next.config.ts
|       |-- package.json
|       `-- tsconfig.json
|-- packages/
|   `-- db/
|       |-- index.ts                  # Shared Prisma client exports
|       |-- Migrations/               # SQL schema and seed scripts
|       |-- prisma/
|       |   |-- migrations/           # Prisma migration history
|       |   |-- schema.prisma         # Database models
|       |   `-- seed.mjs              # Prisma seed script
|       |-- prisma7.config.ts         # Prisma CLI configuration
|       `-- package.json
|-- scripts/
|   `-- db-setup.sh                   # Local database setup
|-- package.json                      # Workspace definitions and root scripts
|-- package-lock.json
`-- README.md
```

| Path | Purpose |
| --- | --- |
| [apps/web](apps/web) | Next.js frontend, pages, and shared components |
| [apps/api](apps/api) | Express API, middleware, and request examples |
| [packages/db](packages/db) | Prisma schema, client package, migrations, and seed files |
| [scripts/db-setup.sh](scripts/db-setup.sh) | Local MySQL and Prisma setup script |

Install dependencies from the repository root to keep npm workspace resolution consistent.
