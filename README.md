# coffee-connect

# Setup script
npm run db:setup


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

- The Express API is in `apps/api`, with Prisma database access provided by `packages/db`'s generated client.
- Run workspace installs from the repository root when ready:

```bash
npm install
```

## API requests

The API's database-backed employee request examples are in [`apps/api/requests.http`](./apps/api/requests.http). Start MySQL and apply the database setup with `npm run db:setup`, then run `npm run dev:api` and execute the requests from that file in an HTTP client such as the VS Code REST Client extension. The API reads `DATABASE_URL` from the root `.env`, `packages/db/.env`, or the process environment.
