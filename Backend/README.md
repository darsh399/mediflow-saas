Backend (dev / prod) setup
==========================

Setup and run instructions for development and production environments.

Prerequisites
- Node.js (16+)
- MongoDB (local) or Atlas URI

Environment files
- Copy `.env.example` to `.env` for local defaults, or use `.env.development` / `.env.production`.

Development

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create a local `.env` (or use `.env.development`) and set `MONGO_URI`, `JWT_SECRET`.

3. Start dev server (uses `nodemon`):

```bash
npm run dev
```

Production

1. Set environment variables on the host (or use `.env.production`).

2. Start with Node directly:

```bash
NODE_ENV=production MONGO_URI="your-prod-uri" npm run start:prod
```

On Windows PowerShell, set env and run:

```powershell
$env:NODE_ENV = 'production'
$env:MONGO_URI = 'your-prod-uri'
npm run start:prod
```

Using PM2 (recommended for process management):

```bash
cd backend
npm install -g pm2
pm2 start ecosystem.config.js --env production
```

Seeding super-admin (development only)

```bash
npm run seed-superadmin
```

Notes
- Backend reads `VISIT_RADIUS_METERS` (default 15) from environment.
- Do not commit production secrets. Use secure secret management in production.
Backend scaffold

This folder contains the scaffolded backend `src/` structure with placeholder files.

Files created as placeholders only — no business logic was added.

Follow the project's existing conventions and add implementations where needed.
