# coffee-connect

Monorepo structure for a Coffee Connect platform using:

- `apps/web` → Next.js (React) frontend
- `apps/api` → Express API (TypeScript)
- `packages/db` → Prisma schema and client package

## Project structure

```text
coffee-connect/
├─ apps/
│  ├─ api/
│  │  ├─ src/
│  │  │  └─ index.ts
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  └─ web/
│     ├─ app/
│     │  └─ page.tsx
│     ├─ next.config.ts
│     ├─ package.json
│     ├─ tsconfig.json
│     └─ next-env.d.ts
├─ packages/
│  └─ db/
│     ├─ prisma/
│     │  └─ schema.prisma
│     ├─ index.ts
│     └─ package.json
├─ package.json
└─ .gitignore
```

## Notes

- This is **structure only** (no new dependencies installed).
- Existing Express setup was moved from root into `apps/api`.
- Run workspace installs later from repo root when ready:

```bash
npm install
```

## Account Registration and Login

The `/login` screen includes a Create account mode for name, company email,
and password. The API saves accounts through Prisma, stores bcrypt hashes
(cost 12), and issues one-hour JWTs after password verification. The web app
keeps tokens in HTTP-only cookies; passwords and hashes are never token claims.
Passwords must contain at least 12 characters and at most 72 UTF-8 bytes.
Only `@brightmedia.com` addresses are accepted. Names and emails are not proof
of identity: email ownership verification must be added before production use.
Accounts use the existing `Employee` table, with bcrypt hashes in a nullable
`PasswordHash` column. Registration cannot grant HR roles or claim an existing
employee email. Existing employees without a hash need a separate verified
password-setup flow; inactive employees cannot log in.

Before running locally:

1. Set `DATABASE_URL` to your MySQL connection URL in `apps/api/.env` and
	`packages/db/.env`. These files are gitignored; never commit credentials.
2. Generate a secret with `openssl rand -hex 32` and set it as `JWT_SECRET`
	in `apps/api/.env`. No secret is hardcoded or generated silently at startup.
3. Apply `packages/db/prisma/Migrations/Add_Employee_Password_up.sql` to your
	existing database using your MySQL client if `Employee.PasswordHash` is
	missing. It adds a nullable column without modifying existing employee rows.
	The corresponding down script drops that column and its stored hashes.
	These SQL scripts follow this repository's manual migration convention;
	do not run `prisma migrate dev` against the existing unbaselined database.
4. Run `npm run prisma:generate -w @coffee-connect/db` from the repository root.
5. Run `npm run dev:api` and `npm run dev:web` in separate terminals from the root.
	Open `http://localhost:3000/login`. When the API is hosted elsewhere, configure
	`API_URL` in `apps/web/.env.local` (server-only, default `http://localhost:4000`).

API routes: `POST /auth/register`, `POST /auth/login`, and protected `GET /me`.
Protected requests use `Authorization: Bearer <token>`; test identity headers
are no longer accepted. Registration does not log users in automatically.
The existing `/employees` creation endpoint remains a scaffold, not database persistence.

Run `npm test -w @coffee-connect/api` for isolated auth tests. These tests use
an in-memory employee store, not a live database. Verify the migration and
real registration against a disposable MySQL database before deployment.
Production also requires HTTPS, email verification, an appropriate shared rate
limiter, and explicit trusted proxy configuration for your deployment. Local
logout clears the cookie; an already copied JWT remains valid until expiration.
