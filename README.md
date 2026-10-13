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
