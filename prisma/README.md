# Prisma database workflow

Prisma owns future application migrations. Supabase still owns PostgreSQL hosting
and Auth. Node 20.19+, 22.12+, or 24+ is required; use Node 24 LTS.
Use npm and commit package-lock.json. Do not maintain a second yarn lockfile.

Copy .env.example to .env.local. DATABASE_URL is a server-only runtime connection;
DIRECT_URL is a direct/session migration connection. Existing process variables
win over .env.local, which wins over .env. Generation and validation are offline;
migration commands require DIRECT_URL. Never expose these URLs as NEXT_PUBLIC_.

npm install and npm run build generate the client only. They never run migrations.
See the adoption and integration instructions below before changing any database.
