# Coffee Connect

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

### Prisma Configuration Troubleshooting

The Prisma config is named `prisma7.config.ts`, rather than the default `prisma.config.ts`. If the setup script cannot discover the config or reports a missing datasource URL, use the explicit config after the database has been created:

```bash
npm exec -w packages/db -- prisma generate --config prisma7.config.ts
npm exec -w packages/db -- prisma db push --config prisma7.config.ts
```

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
