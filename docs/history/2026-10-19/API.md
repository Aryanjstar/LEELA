# Leela — API design

**Product:** Leela
**Version:** 1.0
**Status:** Draft for review
**Date:** 2026-10-19
**Audience:** Anyone writing a route handler, a schema, or a client call

The HTTP contract over the collections in DATABASE.md. It adds no pages, roles, or features.

| Artifact | Job |
|---|---|
| PRD.md | Requirements |
| ARCHITECTURE.md | Request path, auth, worker, providers, scene graph |
| DATABASE.md | Fields and indexes |
| This file | What goes in and what comes out |

## 1. Principles

- **First-party API.** Only the Leela web app calls it. It is not a public developer API.
- **The tenant is the creator.** `ownerId` comes from the session cookie. Request bodies never carry it. Another creator's id answers `404 NOT_FOUND`, the same as a missing id.
- **Viewers** prove nothing but a share token, on `/api/public/*` routes only.
- **Long work is a job.** Routes that start AI or rendering work return `202` with a job id. The browser polls. No request stays open for provider calls.
- **The worker does not use HTTP.** It reads and writes MongoDB and storage directly (ARCHITECTURE §10). There are no internal callback routes in v1.
- A boring success is the resource as JSON. A boring error is one shape (§4).

## 2. Conventions

| Topic | Rule |
|---|---|
| Base path | `/api` (private), `/api/public` (share viewers), `/api/health` |
| Names | JSON `camelCase`, same as database fields. `_id` is exposed as `id` |
| Ids | 24-hex strings. Malformed ids → `400 VALIDATION` before any query |
| Instants | ISO 8601 UTC with milliseconds |
| Durations | Integer milliseconds (`targetMs`, `durationMs`) |
| Media | Never inline. Files are served by `/api/assets/{id}/file` (owner) or `/api/public/share/{token}/video` |
| Null vs omitted | Responses omit absent optional fields. In PATCH, omitted = unchanged; `null` = clear (only where noted) |
| Unknown fields | Rejected on every mutation (`400 VALIDATION`, `reason: UNKNOWN_FIELD`) |
| Status codes | 200 read/update, 201 create, 202 job accepted, 204 no body |
| Idempotency | Routes marked **K** require `Idempotency-Key` (16–128 chars). Same key + same body → the same response with `Idempotency-Replayed: true`. Same key + different body → `409 IDEMPOTENCY_KEY_REUSED` |
| Concurrency | Drafts use `expectedRevision` (compare-and-swap). Everything else is last-write-wins |
| Caching | Private routes: `Cache-Control: private, no-store` |
| Body size | 256 KB JSON. Exceptions: trace upload 3 MB, file upload (layer 6) via multipart, 50 MB |

### Rules every handler follows

1. Pipeline: parse → authenticate → validate (Zod) → service → map result to HTTP. Handlers stay thin (`src/server/http/route.ts`).
2. Malformed ids are validation errors before a query.
3. Duplicate-key errors map to stable reasons (`EMAIL_TAKEN`, `PROJECT_BUSY`, `IDEMPOTENCY_KEY_REUSED`).
4. Logs carry `requestId`, route, status, duration, `ownerId`, ids. **Never logged:** passwords, tokens (session, invite, reset, share), cookies, notes, narration, code, prompts, provider keys, signed URLs.
5. Provider errors are rewritten in our words with a stable `reason`; raw provider bodies are never returned.
6. Every response carries `X-Request-Id`.

## 3. Authentication, CSRF, headers

| Caller | Proof | Routes |
|---|---|---|
| Creator | Session cookie `leela_session` | `/api/*` except public and auth entry routes |
| Owner | Session cookie + email equals `OWNER_EMAIL` | `/api/invites/*`, `/api/usage?scope=app` |
| Viewer | Share token in the path | `/api/public/share/{token}*` |
| Worker | Not HTTP (database access with its own env) | — |
| Health | None | `/api/health` |

Cookie: `HttpOnly; Secure; SameSite=Lax; Path=/`, 32 random bytes, stored as HMAC-SHA256. Session lifetime 30 days, sliding (refreshed at most once an hour). A session is invalid when it expired, was deleted at sign-out, or is older than the user's `passwordChangedAt`.

CSRF: cookie-authenticated mutations require an `Origin` header equal to `APP_ORIGIN`. JSON content type is required.

## 4. Errors

```json
{ "error": { "code": "CONFLICT", "reason": "REVISION_CONFLICT",
  "message": "This draft changed in another tab.", "fields": {}, "requestId": "req_…",
  "details": { "currentRevision": 14 } } }
```

| `code` | HTTP |
|---|---|
| `VALIDATION` | 400 (shape) or 422 (well-formed but not allowed now) |
| `UNAUTHENTICATED` | 401 |
| `FORBIDDEN` | 403 (Owner-only routes for a non-owner; the route's existence is not secret) |
| `NOT_FOUND` | 404 |
| `CONFLICT` | 409 |
| `PAYLOAD_TOO_LARGE` | 413 |
| `RATE_LIMITED` | 429 with `Retry-After` |
| `UNAVAILABLE` | 503 (database or storage down) |

| `reason` | Where |
|---|---|
| `UNKNOWN_FIELD`, `INVALID_ID` | any mutation |
| `INVALID_CREDENTIALS` | sign-in (same for unknown email and wrong password) |
| `WEAK_PASSWORD` | join, reset, change password |
| `INVITE_INVALID` | join (expired, used, or unknown: one message) |
| `RESET_INVALID` | reset |
| `EMAIL_TAKEN` | invite of an existing user |
| `INVITE_PENDING` | a second invite to an email that already has a pending invite |
| `CHARACTER_NAME_TAKEN` | a character whose name this creator already uses |
| `MODE_UNAVAILABLE` | creating a project in a mode whose catalog entry has `available: false` |
| `REVISION_CONFLICT` | draft PATCH, keep candidate, restore |
| `PROJECT_BUSY` | starting a content job while one is active (`details.activeJobId`) |
| `IDEMPOTENCY_KEY_REUSED` | **K** routes |
| `PLAN_INVALID` | approve with an invalid draft plan (`fields` lists issues) |
| `PLAN_STALE` | approve when `planHash` does not match the saved draft |
| `TRACE_INVALID` | trace upload fails schema or caps |
| `NOT_SHAREABLE` | share a video that is not `ready` |
| `CANDIDATE_CLOSED` | keep/discard a candidate that is no longer `proposed` |
| `JOB_NOT_RETRYABLE` | retry a job that succeeded or failed for a non-retryable reason |

What must not leak: sign-in and reset never reveal whether an email exists. Another creator's ids are `404`. Unknown, revoked, and deleted share tokens all give the same `404`.

## 5. Lists, filters, sorting

- Project list: cursor-based, `limit` 1–48 (default 24), sort `updatedAt desc, id desc`. The cursor is an opaque, HMAC-signed `{updatedAt, id, filterHash}`; using it with a different filter gives `400 VALIDATION, reason: CURSOR_MISMATCH`.
- Every other cursor (assets, videos, storyboards, invites) carries the same `filterHash`. A mismatch is `CURSOR_MISMATCH`.
- Messages: `before={seq}`, `limit` ≤ 50, newest first.
- Versions, storyboards, assets: cursor on `createdAt desc, id desc`, `limit` ≤ 50.
- Lists return `{ "items": [...], "nextCursor": "…" | absent }`.

## 6. Rate limits

| Scope | Key | Limit |
|---|---|---|
| Sign-in | HMAC(ip) and HMAC(email) | 10 / 15 min each |
| Reset request, join | HMAC(ip) | 5 / hour |
| Reset (`POST /api/auth/reset`) | HMAC(ip) | 5 / hour, counted before the token is looked up |
| Content jobs (brainstorm, plan, revise, regen) | user | 20 / 10 min |
| Render jobs | user | 10 / hour, and 2 active |
| Trace upload | user | 30 / hour |
| Share page | HMAC(ip) | 120 / min; checked before the token lookup, so unknown tokens cannot exhaust a shared budget |

Provider quotas are not HTTP rate limits: jobs wait (`waiting_quota`) instead of failing (ARCHITECTURE §9.3).

## 7. Endpoints

### What ships in which layer

| Layer | Routes |
|---|---|
| 1 | health, auth/*, account/*, invites/*, catalog, projects (CRUD, duplicate), draft GET/PATCH |
| 2 | brainstorm, plan, approve, jobs/*, videos (read, list, make-current, delete), assets/{id}/file, preview, voices/{id}/sample, usage |
| 3 | traces/* |
| 4 | messages/*, scenes/{id}/regenerate, storyboards/*, captions |
| 5 | share/*, public/share/* |
| 6 | library/*, characters/*, assets upload |
| 7 | videos/{id}/variants |
| 8 | connections/*, publishes/* |

Shapes below are TypeScript-ish. `Project`, `Draft`, `Job`, `Video`, etc. mirror DATABASE.md with `id` instead of `_id` and without server-only fields (`lease`, `idempotencyKey`, token hashes). Four names are derived, not copied:

| Stored | Returned as |
|---|---|
| `projects.thumbAssetId` | `thumbUrl` on a project card |
| video asset ids | `files.mp4Url`, `files.srtUrl`, `files.thumbUrl` |
| `share_links.token` | `url` (`https://…/v/{token}`), and only to the owner |
| `projects.activeJobId` | `activeJob` (the job object, or absent) |

### 7.1 Health

`GET /api/health` → `200 { "ok": true, "db": "up"|"down", "version": "0.1.0", "worker": { "online": true, "lastHeartbeatAt": "…" } }`. `worker` is absent until a worker has ever heartbeated; `online` is false when the newest `heartbeatAt` is older than 60 s. Does not need the database to answer `ok` (then `db` is `"down"` and `worker` is absent).

### 7.2 Auth and account

| Route | Body | Success | Errors |
|---|---|---|---|
| `POST /api/auth/sign-in` | `{ email, password }` | `200 { user }` + cookie | `INVALID_CREDENTIALS`, `RATE_LIMITED` |
| `POST /api/auth/sign-out` | `{}` | `204`, cookie cleared | — |
| `GET /api/auth/session` | — | `200 { user: { id, email, name, isOwner, prefs } }` | `401` |
| `GET /api/auth/invite/{token}` | — | `200 { email }` | `404 INVITE_INVALID` |
| `POST /api/auth/join` | `{ token, name, password }` | `201 { user }` + cookie | `INVITE_INVALID`, `WEAK_PASSWORD` |
| `POST /api/auth/reset-request` | `{ email }` | `204` always | `RATE_LIMITED` |
| `POST /api/auth/reset` | `{ token, password }` | `204`, all sessions ended, no new cookie | `RESET_INVALID`, `WEAK_PASSWORD`, `RATE_LIMITED` |
| `PATCH /api/account` | `{ name?, prefs?, pronunciations? }` | `200 { user }` | `VALIDATION` |
| `POST /api/account/password` | `{ current, next }` | `204`, other sessions ended | `INVALID_CREDENTIALS`, `WEAK_PASSWORD` |

### 7.3 Invites (Owner)

| Route | Body | Success |
|---|---|---|
| `GET /api/invites` | `?limit=&cursor=` | `200 { items, nextCursor? }`. `limit` default 50, max 100 |
| `POST /api/invites` | `{ email }` | `201 { invite, mailed: bool }` (`mailed: false` keeps the invite and says the mail did not go out) |
| `POST /api/invites/{id}/resend` | `{}` | `200 { invite, mailed }` |
| `DELETE /api/invites/{id}` | — | `204` |

Errors: `403 FORBIDDEN` for non-owners; `409 EMAIL_TAKEN` when the email is already a user; `409 INVITE_PENDING` when a pending invite for that email already exists. Each item is `{ id, email, expiresAt, acceptedAt?, lastSentAt? }`.

### 7.4 Catalog

`GET /api/catalog` → `200`

```json
{
  "modes": [{ "id": "explainer", "label": "Explainer", "available": true }, { "id": "cartoon", "available": false }],
  "formats": ["9x16", "16x9", "1x1"],
  "targets": [15000, 30000, 45000, 60000, 90000, 120000, 180000],
  "languages": [{ "id": "en", "label": "English", "available": true }],
  "voices": [{ "id": "kokoro:af_heart", "label": "Heart", "language": "en", "accent": "American",
               "gender": "female", "provider": "kokoro-local", "free": true, "sampleUrl": "/api/voices/kokoro:af_heart/sample" }],
  "styles": [{ "id": "chalk-and-chai@1", "label": "Chalk & Chai", "modes": ["explainer"], "previewUrl": "/library/styles/chalk-and-chai.mp4" }]
}
```

Only voices that are configured, reachable, and passed the spike are listed. `GET /api/voices/{id}/sample` → `audio/mpeg`, cached.

### 7.5 Projects

| Route | Body / query | Success |
|---|---|---|
| `GET /api/projects` | `?filter=all\|draft\|ready\|failed&mode=&q=&limit=&cursor=` | `200 { items: ProjectCard[], nextCursor? }` |
| `POST /api/projects` **K** | `{ mode, title?, format?, targetMs?, language?, voiceId?, styleId?, keepPrivate?, pronunciations?, topic? }` (defaults from prefs; `topic` seeds the draft idea for the "What shall we make?" bar) | `201 { project, draft }` |
| `GET /api/projects/{id}` | — | `200 { project, draft, currentVideo?, activeJob? }` |
| `PATCH /api/projects/{id}` | `{ title?, format?, targetMs?, language?, voiceId?, styleId?, castIds?, keepPrivate?, pronunciations? }` | `200 { project }` |
| `POST /api/projects/{id}/duplicate` **K** | `{}` | `201 { project }` (copies draft only) |
| `DELETE /api/projects/{id}` | — | `204` (cleanup continues in the background) |

`ProjectCard = { id, title, mode, format, targetMs, badge, updatedAt, thumbUrl?, previewUrl?, durationMs? }`. Creating a project whose mode has `available: false` returns `422 MODE_UNAVAILABLE`.

### 7.6 Draft

`GET /api/projects/{id}/draft` → `200 Draft` (`{ projectId, revision, idea, plan?, planValid, issues, traceId?, planHash? }`).

`PATCH /api/projects/{id}/draft` → body `{ expectedRevision, idea?, plan?, traceId? }`.
`200 { revision, planValid, issues, planHash? }`. An invalid plan is **saved** (so typing is never lost) with `planValid: false` and issues listed.
Errors: `409 REVISION_CONFLICT` with `details.currentRevision`.

### 7.7 Planning and approval

| Route | Body | Success | Errors |
|---|---|---|---|
| `POST /api/projects/{id}/brainstorm` **K** | `{ draftRevision }` | `202 { jobId }` → result `{ angles: [{ title, hook, takeaway }] }` in the job | `PROJECT_BUSY` |
| `POST /api/projects/{id}/plan` **K** | `{ draftRevision }` | `202 { jobId }`; on success the draft plan is set (revision +1) | `PROJECT_BUSY`, `VALIDATION` (empty topic; Code Lab without a trace) |
| `POST /api/projects/{id}/approve` **K** | `{ draftRevision, planHash }` | `202 { jobId, storyboardId, videoId }` | `PLAN_INVALID`, `PLAN_STALE`, `REVISION_CONFLICT`, `PROJECT_BUSY` |
| `GET /api/projects/{id}/preview` | `?sceneId=` (optional) | `200 text/html`: the compiled composition with estimated timing, for `<hyperframes-player>` in a sandboxed iframe | `422 PLAN_INVALID` |

The preview response has `Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob:; font-src 'self'; frame-ancestors 'self'` and is served with `X-Content-Type-Options: nosniff`. The iframe uses `sandbox="allow-scripts"`.

### 7.8 Jobs

| Route | Success |
|---|---|
| `GET /api/jobs/{id}` | `200 { id, type, state, stages, progress?, error?, result?, runAfter?, waitingFor?: { provider, resetsAt } }` |
| `POST /api/jobs/{id}/cancel` | `202 { state }` (stops before the next stage; a running provider call may finish) |
| `POST /api/jobs/{id}/retry` | `202 { jobId }`: a new attempt from the failed stage, reusing finished artifacts. `409 JOB_NOT_RETRYABLE` |

Poll every 2 s while the tab is visible, 10 s when hidden; stop at a terminal state.

### 7.9 Videos and files

| Route | Body | Success |
|---|---|---|
| `GET /api/projects/{id}/videos` | `?cursor=` | `200 { items: Video[] }` |
| `GET /api/videos/{id}` | — | `200 Video` with `files: { mp4Url, srtUrl, thumbUrl }`, `qa`, `warnings`, `commercialSafe` and `blockingAssets` |
| `POST /api/videos/{id}/make-current` | `{}` | `200 { project }` |
| `PATCH /api/videos/{id}/captions` **K** (layer 4) | `{ overrides: [{ sceneId, lineId, wordIndex, display }] }` | `202 { jobId, videoId }` (new version, no new narration) |
| `POST /api/videos/{id}/variants` **K** (layer 7) | `{ format }` | `202 { jobId, videoId }` |
| `DELETE /api/videos/{id}` | — | `204` |
| `GET /api/assets/{id}/file` | `?download=1` | Bytes with `Content-Type`, `Accept-Ranges`, `206` for ranges, `Content-Disposition: attachment` when downloading |

### 7.10 Code Lab traces (layer 3)

| Route | Body | Success | Errors |
|---|---|---|---|
| `POST /api/projects/{id}/traces` | `{ language, code, entry, input, tracerVersion, summary, steps }` (≤ 3 MB) | `201 { trace }`; the draft's `traceId` is set | `TRACE_INVALID`, `PAYLOAD_TOO_LARGE` |
| `GET /api/traces/{id}` | — | `200 { id, language, entry, input, summary, tracerVersion }` |
| `GET /api/traces/{id}/steps` | — | `200 application/json` (the stored steps file) |

The server validates `steps` against the trace schema, step and size caps, and recomputes `summary`. It does not run the code.

### 7.11 Copilot and versions (layer 4)

| Route | Body | Success | Errors |
|---|---|---|---|
| `GET /api/projects/{id}/messages` | `?before=&limit=` | `200 { items: Message[] }` | |
| `POST /api/projects/{id}/messages` **K** | `{ text, sceneIds? }` | `202 { message, jobId }`; the assistant message with a `candidate` appears when the job succeeds | `PROJECT_BUSY` |
| `POST /api/messages/{id}/keep` | `{ expectedRevision }` | `200 { draft }` | `CANDIDATE_CLOSED`, `REVISION_CONFLICT` |
| `POST /api/messages/{id}/discard` | `{}` | `200 { message }` | `CANDIDATE_CLOSED` |
| `POST /api/projects/{id}/scenes/{sceneId}/regenerate` **K** | `{ draftRevision, instruction? }` | `202 { jobId }` (returns a candidate like a message) | `PROJECT_BUSY` |
| `GET /api/projects/{id}/storyboards` | `?cursor=` | `200 { items: [{ id, version, origin, approvedAt, sceneCount, estMs }] }` | |
| `GET /api/storyboards/{id}` | — | `200 Storyboard` | |
| `POST /api/storyboards/{id}/restore` | `{ expectedRevision }` | `200 { draft }` | `REVISION_CONFLICT` |

`Message.candidate = { summary, changedSceneIds, changeClass: "visual"|"captions"|"narration"|"order"|"voice"|"format"|"structure", status }`. The candidate plan itself is fetched with `GET /api/messages/{id}/candidate` to keep message lists small.

### 7.12 Share (layer 5)

| Route | Body | Success |
|---|---|---|
| `POST /api/videos/{id}/share` | `{ allowDownload? }` | `201 { url: "https://…/v/{token}", allowDownload }`; an existing active link is returned, not replaced (`200`) |
| `PATCH /api/videos/{id}/share` | `{ allowDownload }` | `200` |
| `DELETE /api/videos/{id}/share` | — | `204` (revoked) |
| `GET /api/public/share/{token}` | — | `200 { title, format, durationMs, posterUrl, videoUrl, allowDownload }` |
| `GET /api/public/share/{token}/video` | `?download=1` | Bytes with ranges |

Public payload never includes project id, owner, email, narration, or other versions. `NOT_SHAREABLE` when the video is not ready.

### 7.13 Library and characters (layer 6)

| Route | Notes |
|---|---|
| `GET /api/library/assets?kind=&q=&source=system\|mine&cursor=` | System manifest items and own assets, each with `licence` |
| `POST /api/assets` (multipart) | Upload image/audio/video; mime sniffed server-side; `201 Asset` with `licence: own-upload` |
| `DELETE /api/assets/{id}` | Refused with `409 ASSET_IN_USE` (listing project titles) if a draft plan or a character references it |
| `GET/POST /api/characters`, `GET/PATCH/DELETE /api/characters/{id}` | CRUD; deny-listed names → `422 PROTECTED_CHARACTER`; a duplicate name for this creator → `409 CHARACTER_NAME_TAKEN` |
| `POST /api/characters/{id}/art` **K** | `{ expressions: ["neutral", …] }` → `202 { jobId }` (image job) |

### 7.14 Usage

`GET /api/usage` → `200 { providers: [{ id, label, unit, period, used, limit, resetsAt, seesContent, trainsOnFreeTier }] }`. `?scope=app` for the Owner.

### 7.15 Publish (layer 8)

Outline only, finalised when layer 8 starts: `GET /api/connections`, `POST /api/connections/{provider}/start` (OAuth redirect with hashed one-time state), `GET /api/connections/{provider}/callback`, `DELETE /api/connections/{id}`, `POST /api/publishes` **K** `{ videoId, connectionId, title, caption, scheduledAt?, timezone? }`, `GET /api/publishes?projectId=`, `PATCH /api/publishes/{id}` (before claim), `POST /api/publishes/{id}/cancel`.

## 8. Permissions

| Area | Creator (own) | Creator (other's) | Owner extra | Viewer | Public |
|---|---|---|---|---|---|
| Auth entry routes | ✓ | | | ✓ | ✓ |
| Projects, drafts, jobs, videos, messages, traces, assets, characters | ✓ | 404 | — | | |
| Invites | 403 | | ✓ | | |
| Usage (own) / (app) | ✓ / 403 | | ✓ | | |
| Public share | ✓ | ✓ | ✓ | ✓ | ✓ |
| Health | ✓ | ✓ | ✓ | ✓ | ✓ |

## 9. Flows

**Layer 1: first project**
`GET /api/auth/invite/{t}` → `POST /api/auth/join` → `GET /api/catalog` → `POST /api/projects` → `PATCH /api/projects/{id}/draft` (autosave) → `GET /api/projects`.

**Layer 2: idea to MP4**
`PATCH …/draft {idea}` → `POST …/plan` → poll `GET /api/jobs/{id}` → `GET …/draft` (plan) → `GET …/preview` (scene previews) → `PATCH …/draft {plan}` (inline edits) → `POST …/approve {draftRevision, planHash}` → poll job (stages narrate → align → compile → render → qa → store) → `GET /api/videos/{id}` → `GET /api/assets/{mp4}/file?download=1`.

**Layer 3: Code Lab**
Browser traces in a Worker → `POST …/traces` → `POST …/plan` (planner sees `summary`, returns bindings) → approve → render (worker reads `stepsAssetId`).

**Layer 4: revise**
`POST …/messages {text:"slow down the tree", sceneIds:["s4"]}` → poll job → `GET /api/messages/{id}/candidate` → `POST /api/messages/{id}/keep {expectedRevision}` → `POST …/approve` → new video, same narration (fingerprint hit).

## 10. Contract and versioning

The client ships with the server, so breaking changes ship together; no `/v1` prefix. Long-lived URLs: `/v/{token}` (forwarded on WhatsApp) and `/join/{token}`, `/reset/{token}` (in emails). The plan `schemaVersion` is versioned independently (ARCHITECTURE §6).

## 11. Tests this contract expects

- Another creator's project, draft, job, video, asset file, trace, and message ids → 404, for every route family.
- Approve with a stale `planHash` → `PLAN_STALE`; double approve with one key → one job.
- Draft PATCH from two tabs → second gets `REVISION_CONFLICT` and keeps its text client-side.
- Starting a plan while a render is active → `PROJECT_BUSY` with `activeJobId`.
- Revoked share token and unknown token → identical 404 body.
- Sign-in with an unknown email and with a wrong password → identical body and similar timing.
- Trace upload with 2,001 steps or a body over 3 MB → `TRACE_INVALID` or `PAYLOAD_TOO_LARGE`. A binding that names a variable the trace does not have is rejected later, by `validatePlan`, not by this upload.
- Unknown field in any PATCH → 400 `UNKNOWN_FIELD`.
- Preview HTML carries the CSP header; scene text with `<script>` renders as text.

## 12. Decisions and open items

| # | Decision |
|---|---|
| A1 | Polling, not SSE or WebSockets, for job progress (simple; works on any host) |
| A2 | `/api/assets/{id}/file` and the share video route check access, then stream (local storage) or `302` to a 10-minute signed R2 URL (hosted), so video bytes do not pass through the web host (ARCHITECTURE §12) |
| A3 | No public API, no API keys for users |
| A4 | Preview is server-compiled HTML in a sandboxed iframe, so preview and render use the same compiler |

Open: publish details (layer 8). Layer 1 has none.

## Done when

- [x] Every operator page and visitor page has the routes it needs
- [x] Every route names auth, errors, and one example
- [x] Field names match the database, or the mapping is written in one place (`_id` → `id`; the four derived names in §7; server-only fields omitted)
- [x] Dates and token exposure match the database doc
- [x] Layer 1 is implementable without the later routes
