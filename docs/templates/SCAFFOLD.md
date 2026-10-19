# Scaffold the shell

Copy this into the next repo after the four design docs agree. Fill the blanks. The shell runs before any feature slice.

## Before you install

- [ ] PRD, system design, database design, and API design are cross-checked
- [ ] A reference repo, if any, is for folder shape only. List what you will refuse to copy
- [ ] Node version matches what Next and the linter accept. Write it in `.nvmrc`

## Install

- [ ] Next.js App Router, React, TypeScript
- [ ] Zod, at the HTTP boundary
- [ ] The database library and major version named in the database doc
- [ ] The password library named in the database doc
- [ ] A test runner, lint, and typecheck

Leave provider SDKs out until the slice that calls them.

## Write

- [ ] `src/app` for the shell page and `GET /api/health`
- [ ] `src/config` parses env by subsystem, so the shell boots before every secret exists
- [ ] The connection is cached, and the app refuses the production database name outside production
- [ ] Indexes are off at runtime. A script syncs them when models exist
- [ ] Shared HTTP errors match the API doc
- [ ] Password hashing and session-cookie rules match the database and API docs
- [ ] The home page describes the shell. It does not advertise features that are not built
- [ ] No empty feature modules for later slices

## Prove it locally

- [ ] `npm test`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Home page and `/api/health` both return 200

## The Wedding Home example

6 Oct 2026. Reference layout: Make My Marriage `dev`, folders only. Installed Next.js 16, Zod 4, Mongoose 8, bcryptjs cost 12. Refused Argon2, paise, Cloudflare R2, and that repo's routes. Node 22. Health check does not need MongoDB.
