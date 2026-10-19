# Leela — database design

**Product:** Leela
**Version:** 1.0
**Status:** Draft for review
**Date:** 2026-10-19
**Audience:** Anyone writing a model, a repository, or a migration

Turns the PRD objects and the architecture into collections, fields, indexes, and integrity rules. It adds no pages, roles, or features.

| Artifact | Job |
|---|---|
| PRD.md | What each object is |
| ARCHITECTURE.md | Tenancy, the scene graph, jobs, storage, providers |
| This file | Collections, fields, indexes, integrity, retention |
| API.md | How the outside world reads and writes them |

## 1. Scope and targets

MongoDB Atlas (M0 free cluster, 512 MB) through **Mongoose 8**, as in The Wedding Home. Local development uses the same Atlas cluster with the database name `leela-dev`; production uses `leela`, and the app refuses `leela` outside production.

Design ceiling: 10 creators × 500 projects × 10 versions. Documents stay small because **bytes never live in MongoDB**: audio, images, timelines, traces, and MP4s live in object storage, and rows hold references. A plan (scene graph) is at most about 200 KB, so it is embedded.

Founding rules:

1. **The tenant is the creator.** Every creator-owned document has `ownerId`, and every creator-owned index starts with it. `ownerId` comes from the session.
2. Embed what is small, bounded, and read together (scenes in a plan, stages in a job, licence in an asset). Reference what grows (versions, messages, assets).
3. The database refuses what is cheap (unique, required, enum). Services refuse the rest (same-owner references, plan validity).
4. Immutable documents (storyboards, finished videos' specs) are never updated except for lifecycle fields named below.

## 2. Conventions

| Topic | Rule |
|---|---|
| Collection names | `snake_case`, plural: `projects`, `share_links` |
| Field names | `camelCase` |
| Ids | MongoDB `ObjectId` in the database; 24-hex strings in the API |
| Timestamps | `createdAt`, `updatedAt` (Mongoose `timestamps: true`), UTC `Date` |
| Instants | UTC `Date`. Display in the creator's timezone (default `Asia/Kolkata`) |
| Durations | Integer milliseconds (`durationMs`); frames are derived at compile time |
| Money | None in v1 |
| Enums | Lowercase snake strings, listed per field |
| Optional fields | **Absent**, not `null`, unless null means "explicitly cleared" (noted per field) |
| Emails | Trimmed, lowercased, ≤ 254 characters, unique |
| Tokens | 32 random bytes, base64url. Session, invite, and reset tokens are stored only as **HMAC-SHA256(token, `AUTH_TOKEN_PEPPER`)**. Share tokens are stored raw so the same link can be shown again; they are never logged |
| Hashes | Content hashes are SHA-256 lowercase hex of canonical JSON (sorted keys, no whitespace) or of file bytes |
| Unknown fields | Mongoose `strict: "throw"` on writes |

### Shared value shapes

```ts
type Licence = {
  id: "cc0" | "cc-by-4.0" | "cc-by-sa-4.0" | "ofl-1.1" | "apache-2.0" | "mit"
    | "provider-output" | "own-upload" | "unknown";
  commercialOk: boolean | null;   // null = not determined
  attribution?: string;           // exact credit text when required, ≤ 300
  sourceUrl?: string;             // where the licence or file came from
};

type Source = {
  provider: string;               // "kokoro-local", "workers-ai", "gemini", "upload", "library"
  model?: string;                 // exact model id
  prompt?: string;                // ≤ 2,000; generated assets only
  seed?: number;
  fingerprint?: string;           // cache key, see ARCHITECTURE §9
};

type StageState = { key: string; state: "pending" | "running" | "done" | "failed" | "skipped";
  startedAt?: Date; endedAt?: Date; note?: string };
```

### Per-tenant limits

| Thing | Limit |
|---|---|
| Projects per creator | 1,000 |
| Scenes per plan | 40 |
| Layers per scene | 16 |
| Messages per project | 2,000 (older ones stay readable, newest first) |
| Characters per creator | 100 |
| Uploads per creator | 2 GB total in layer 6 |
| Active content jobs per project | 1 |
| Active render jobs per creator | 2 |

### Text limits

| Field kind | Limit |
|---|---|
| Title, name | 120 |
| Topic | 2,000 |
| Notes | 20,000 |
| Narration line | 600 |
| Message | 4,000 |
| Code (Code Lab) | 20,000 |

## 3. Collections at a glance

```
users ─┬─ sessions
       ├─ password_resets
       ├─ projects ─┬─ drafts (1:1)
       │            ├─ storyboards (versions, immutable)
       │            ├─ videos (renders) ── share_links
       │            ├─ messages (Copilot)
       │            ├─ jobs
       │            └─ traces (Code Lab)
       ├─ assets (files + licence)
       ├─ characters (layer 6)
       ├─ connections, publishes (layer 8)
invites, usage, rate_limits (app-level)
```

| Collection | Tenant-owned | Grows with |
|---|---|---|
| `users` | self | creators |
| `sessions` | yes | sign-ins (TTL). Internal: only auth reads it |
| `password_resets` | yes | reset requests (TTL). Internal: only the reset flow reads it |
| `invites` | no (Owner) | invitations |
| `projects` | yes | projects |
| `drafts` | yes | 1 per project |
| `storyboards` | yes | approvals and accepted revisions |
| `videos` | yes | renders |
| `share_links` | yes | shares |
| `messages` | yes | Copilot turns |
| `jobs` | yes | background work |
| `traces` | yes | Code Lab runs |
| `assets` | yes | files |
| `characters` | yes | cast (layer 6) |
| `connections` | yes | social accounts (layer 8) |
| `publishes` | yes | posts (layer 8) |
| `usage` | app + per creator | provider-days |
| `workers` | no | worker processes |
| `rate_limits` | no | windows (TTL). Internal: only middleware reads it |

**Not collections:** voices, styles, components, and the system library live in the repository as versioned config and files (`src/catalog/`, `library/manifest.json`). They change with deploys, not with users.

### Which layer creates which collection

| Layer | First written here |
|---|---|
| 1 | `users`, `sessions`, `password_resets`, `invites`, `projects`, `drafts`, `rate_limits` |
| 2 | `storyboards`, `videos`, `jobs`, `assets`, `usage`, `workers` |
| 3 | `traces` |
| 4 | `messages` |
| 5 | `share_links` |
| 6 | `characters` |
| 8 | `connections`, `publishes` |

Layer 1 screens must not import later models. Counts for unbuilt layers are zeros in the service.

## 4. Embed or reference

| Data | Choice | Why |
|---|---|---|
| Scenes, layers, events in a plan | Embed in `drafts.plan` and `storyboards.plan` | Bounded (≤ 40 scenes), always read whole, hashed whole |
| Idea inputs | Embed in `drafts.idea` | One per project |
| Job stages | Embed in `jobs.stages` | ≤ 10, read with the job |
| Asset licence and source | Embed in `assets` | Read with the asset, never alone |
| Video renderSpec and QA | Embed in `videos` | Small, read with the video |
| Trace steps | **Reference**: JSON file in storage (`traces.stepsAssetId`) | Up to 2,000 steps, ~2 MB |
| Timeline (word timings, frames) | **Reference**: JSON file in storage (`videos.timelineAssetId`) | Large, only the worker and the caption editor read it |
| Copilot messages | **Reference**: own collection | Grows without a ceiling |
| Versions | **Reference**: own collections | Grow per project |
| User preferences and pronunciations | Embed in `users`, and a shorter list on `projects` | User list ≤ 200. Project list ≤ 40. Narration applies project entries first, then the user list |

## 5. Collections

### 5.1 `users`

| Field | Type | Req | Notes |
|---|---|---|---|
| `email` | string | ✓ | Unique, lowercased |
| `name` | string | ✓ | ≤ 120 |
| `passwordHash` | string | ✓ | bcrypt cost 12 |
| `passwordChangedAt` | Date | ✓ | Sessions older than this are invalid |
| `prefs` | object | ✓ | `{ defaultMode, defaultFormat, defaultTargetMs, defaultLanguage, defaultVoiceId, defaultStyleId, timezone, glass: "clear"\|"tinted"\|"solid", reducedMotion: bool, funCopy: bool, uiSound: bool }` |
| `pronunciations` | array | | `[{ written ≤ 60, spoken ≤ 120 }]`, ≤ 200 |

Indexes: `{ email: 1 }` unique.
Owner status is **not stored**: a user is Owner when `email === OWNER_EMAIL`. There is always exactly one, and it cannot be removed through the app.

### 5.2 `sessions`

| Field | Type | Req | Notes |
|---|---|---|---|
| `userId` | ObjectId | ✓ | |
| `tokenHash` | string | ✓ | HMAC-SHA256 |
| `expiresAt` | Date | ✓ | 30 days, sliding on use (at most once an hour) |
| `lastSeenAt` | Date | ✓ | |
| `userAgent` | string | | ≤ 200 |

Indexes: `{ tokenHash: 1 }` unique · `{ userId: 1 }` · `{ expiresAt: 1 }` TTL (expireAfterSeconds 0).

### 5.3 `password_resets`

`userId`, `tokenHash` (unique), `expiresAt` (1 hour, TTL), `usedAt`. Using one sets `users.passwordChangedAt` and deletes the user's sessions in one transaction.

### 5.4 `invites`

| Field | Type | Req | Notes |
|---|---|---|---|
| `email` | string | ✓ | Unique |
| `tokenHash` | string | ✓ | Unique |
| `invitedBy` | ObjectId | ✓ | The Owner |
| `expiresAt` | Date | ✓ | 14 days |
| `acceptedAt` | Date | | |
| `lastSentAt` | Date | | Set only after the mail provider accepts |

Accepting creates the user and sets `acceptedAt` in one transaction. Resending makes a new token (the old hash is replaced). A second invite to an email that already has a pending invite is `409 INVITE_PENDING`. An invite of an existing user is `409 EMAIL_TAKEN`.

### 5.5 `projects`

| Field | Type | Req | Notes |
|---|---|---|---|
| `ownerId` | ObjectId | ✓ | |
| `title` | string | ✓ | ≤ 120 |
| `mode` | enum | ✓ | `explainer`, `code_lab`, `story`, `audio`, `cartoon`, `montage` |
| `format` | enum | ✓ | `9x16`, `16x9`, `1x1` |
| `targetMs` | int | ✓ | One of 15000, 30000, 45000, 60000, 90000, 120000, 180000 |
| `language` | enum | ✓ | `en`, `hi`, `hinglish` |
| `voiceId` | string | ✓ | Catalog id, e.g. `kokoro:af_heart` |
| `styleId` | string | ✓ | Catalog id, e.g. `chalk-and-chai@1` |
| `castIds` | ObjectId[] | | Characters, layer 6, ≤ 8 |
| `keepPrivate` | bool | ✓ | Default false. When true, no provider that trains on free-tier input sees this project's notes or plan (ARCHITECTURE §9.3) |
| `pronunciations` | array | | `[{ written ≤ 60, spoken ≤ 120 }]`, ≤ 40. Applied before the user list |
| `latestStoryboardId` | ObjectId | | |
| `currentVideoId` | ObjectId | | The video shown by default; changes only after QA passes |
| `activeJobId` | ObjectId | | Mirror of the active content job, for the UI |
| `thumbAssetId` | ObjectId | | |
| `badge` | enum | ✓ | Derived summary for the grid, written by services, never by clients. `draft` Draft, `planning` Planning, `review` Ready to approve, `rendering` Rendering, `ready` Ready, `failed` Failed |

Indexes: `{ ownerId: 1, updatedAt: -1 }` · `{ ownerId: 1, mode: 1, updatedAt: -1 }` · `{ ownerId: 1, badge: 1, updatedAt: -1 }`.
Title search is a case-insensitive prefix/regex within `ownerId` (fine at ≤ 1,000 projects).

### 5.6 `drafts`

| Field | Type | Req | Notes |
|---|---|---|---|
| `ownerId` | ObjectId | ✓ | |
| `projectId` | ObjectId | ✓ | Unique |
| `revision` | int | ✓ | Starts at 1; +1 on every save. Compare-and-swap on `expectedRevision` |
| `idea` | object | ✓ | `{ topic, audience?, notes?, mustInclude: string[] ≤ 10 }` |
| `traceId` | ObjectId | | Code Lab: the trace this plan is bound to |
| `plan` | Plan | | The editable scene graph (ARCHITECTURE §6). Absent until planned. May be invalid while editing |
| `planValid` | bool | ✓ | Result of the last validation |
| `plannerModel` | string | | Set by `plan`/`revise` jobs |
| `messageSeq` | int | ✓ | Counter for `messages.seq` (layer 4), starts 0 |
| `issues` | array | | `[{ path, code, message }]` ≤ 100 |

Indexes: `{ projectId: 1 }` unique · `{ ownerId: 1, projectId: 1 }`.

### 5.7 `storyboards` (immutable)

| Field | Type | Req | Notes |
|---|---|---|---|
| `ownerId`, `projectId` | ObjectId | ✓ | |
| `version` | int | ✓ | 1, 2, 3 per project |
| `parentId` | ObjectId | | The storyboard this came from |
| `schemaVersion` | int | ✓ | Plan schema version |
| `plan` | Plan | ✓ | Valid plan |
| `planHash` | string | ✓ | SHA-256 of canonical plan |
| `storyHash` | string | ✓ | SHA-256 of the narration, spoken forms, order, and voice only (decides TTS reuse) |
| `traceId` | ObjectId | | Pinned trace for Code Lab |
| `origin` | enum | ✓ | `approve`, `revision`, `restore` |
| `plannerModel` | string | | Provider and model that last generated or revised the plan, e.g. `groq:openai/gpt-oss-120b` (copied from the draft) |
| `approvedAt` | Date | ✓ | |

Indexes: `{ projectId: 1, version: 1 }` unique · `{ ownerId: 1, projectId: 1, createdAt: -1 }` · `{ projectId: 1, planHash: 1 }` (approving an unchanged draft returns the existing storyboard).

### 5.8 `videos`

| Field | Type | Req | Notes |
|---|---|---|---|
| `ownerId`, `projectId`, `storyboardId` | ObjectId | ✓ | |
| `version` | int | ✓ | Per project |
| `format` | enum | ✓ | |
| `renderSpec` | object | ✓ | `{ styleId, voiceId, format, compilerVersion, rendererVersion, componentVersions: {id: ver}, captionOverrides: [{ sceneId, lineId, wordIndex, display }] }` |
| `renderSpecHash` | string | ✓ | |
| `state` | enum | ✓ | `building`, `ready`, `failed` |
| `jobId` | ObjectId | ✓ | |
| `mp4AssetId`, `srtAssetId`, `thumbAssetId`, `timelineAssetId`, `audioAssetId` | ObjectId | | Set when ready (`audioAssetId` for Audio mode) |
| `durationMs` | int | | Measured |
| `qa` | object | | `{ passed, checks: [{ key, ok, detail }], frameSheetAssetId }` |
| `commercialSafe` | bool | | All asset licences allow commercial use |
| `warnings` | string[] | | e.g. "Length 82 s vs target 60 s" |

Indexes: `{ projectId: 1, version: 1 }` unique · `{ ownerId: 1, projectId: 1, createdAt: -1 }` · `{ storyboardId: 1, renderSpecHash: 1 }` (identical render request reuses the ready video).

### 5.9 `share_links`

| Field | Type | Req | Notes |
|---|---|---|---|
| `ownerId`, `projectId`, `videoId` | ObjectId | ✓ | |
| `token` | string | ✓ | Raw, 43 chars; unique; never logged; returned only to its owner |
| `allowDownload` | bool | ✓ | Default false |
| `revokedAt` | Date | | |
| `views` | int | ✓ | Incremented at most once per viewer per hour (rate_limits key) |

Indexes: `{ token: 1 }` unique · `{ ownerId: 1, videoId: 1 }`.
One active link per video: a partial unique index `{ videoId: 1 }` where `revokedAt` does not exist.

### 5.10 `messages`

| Field | Type | Req | Notes |
|---|---|---|---|
| `ownerId`, `projectId` | ObjectId | ✓ | |
| `seq` | int | ✓ | Per project, from a counter on the draft (`$inc`) |
| `role` | enum | ✓ | `user`, `assistant`, `note` (system notes such as "Version 3 rendered") |
| `text` | string | ✓ | ≤ 4,000 |
| `sceneIds` | string[] | | Scenes the message is about |
| `jobId` | ObjectId | | The revise job this started |
| `candidate` | object | | Assistant only: `{ plan, summary, changedSceneIds, changeClass, sourceRevision, status: "proposed"\|"kept"\|"discarded" }`. `changeClass` is `visual`, `captions`, `narration`, `order`, `voice`, `format`, or `structure` |

Indexes: `{ projectId: 1, seq: 1 }` unique · `{ ownerId: 1, projectId: 1, seq: -1 }`.

### 5.11 `jobs`

| Field | Type | Req | Notes |
|---|---|---|---|
| `ownerId`, `projectId` | ObjectId | ✓ | |
| `type` | enum | ✓ | `brainstorm`, `plan`, `revise`, `scene_regen`, `render`, `image`, `cleanup`, `publish` |
| `state` | enum | ✓ | `queued`, `running`, `waiting_quota`, `succeeded`, `failed`, `cancelled` |
| `activeSlot` | bool | | `true` while queued/running/waiting for content jobs (`brainstorm`, `plan`, `revise`, `scene_regen`, `render`); unset when terminal |
| `input` | object | ✓ | Ids only: `{ storyboardId?, videoId?, draftRevision?, messageId?, sceneId? }`. Never content |
| `stages` | StageState[] | ✓ | e.g. render: `narrate`, `align`, `compile`, `render`, `qa`, `store` |
| `progress` | number | | 0–1, only when measured (render frames) |
| `idempotencyKey` | string | | From the client, ≤ 128 |
| `attempts` | int | ✓ | Starts 0 |
| `maxAttempts` | int | ✓ | Default 3 |
| `runAfter` | Date | ✓ | Backoff and quota waits |
| `lease` | object | | `{ workerId, until }`; 90 s, renewed every 30 s |
| `error` | object | | `{ code, message, retryable, stage }`; message is safe for the UI |
| `result` | object | | Ids: `{ storyboardId?, videoId?, messageId? }` |
| `cancelRequestedAt` | Date | | |
| `finishedAt` | Date | | |

Indexes:
- `{ state: 1, runAfter: 1 }`: workers claim `queued`/`waiting_quota` jobs where `runAfter ≤ now`, plus `running` jobs whose `lease.until < now`.
- `{ projectId: 1, activeSlot: 1 }` **unique, partial** `{ activeSlot: true }`: one active content pipeline per project.
- `{ ownerId: 1, idempotencyKey: 1 }` **unique, partial** where `idempotencyKey` exists.
- `{ ownerId: 1, projectId: 1, createdAt: -1 }`.
- `{ finishedAt: 1 }` TTL 90 days on terminal jobs (the business results live in storyboards and videos).

Claim is one `findOneAndUpdate` that sets `state: running`, `lease`, and `attempts + 1`. Completion writes check `lease.workerId` (a stale worker cannot finish a job that was re-claimed).

### 5.12 `traces` (layer 3)

| Field | Type | Req | Notes |
|---|---|---|---|
| `ownerId`, `projectId` | ObjectId | ✓ | |
| `language` | enum | ✓ | `python`, `javascript` |
| `code` | string | ✓ | ≤ 20,000 |
| `entry` | string | ✓ | Function name |
| `input` | object | ✓ | JSON args, ≤ 8 KB |
| `tracerVersion` | string | ✓ | e.g. `pyodide-0.29/leela-tracer@1` |
| `summary` | object | ✓ | `{ steps, calls, maxDepth, truncated, variables: [{ name, kind, shape }] , stdout ≤ 4 KB }` |
| `stepsAssetId` | ObjectId | ✓ | JSON file |
| `stepsHash` | string | ✓ | SHA-256 |

Indexes: `{ ownerId: 1, projectId: 1, createdAt: -1 }`.
The server validates the uploaded trace against the trace schema and caps (ARCHITECTURE §8); it never executes the code.

### 5.13 `assets`

| Field | Type | Req | Notes |
|---|---|---|---|
| `ownerId` | ObjectId | ✓ | |
| `projectId` | ObjectId | | Absent for creator-library assets (characters, uploads reused across projects) |
| `kind` | enum | ✓ | `narration`, `music`, `sfx`, `image`, `character_art`, `upload_image`, `upload_video`, `upload_audio`, `trace`, `timeline`, `captions`, `render`, `thumbnail`, `frame_sheet`, `composition` |
| `storageKey` | string | ✓ | Unique. `u/{ownerId}/{projectId or lib}/{kind}/{assetId}.{ext}` |
| `mime` | string | ✓ | Allowlisted per kind |
| `bytes` | int | ✓ | |
| `sha256` | string | ✓ | Computed by us, not the store's ETag |
| `width`, `height`, `durationMs` | int | | |
| `licence` | Licence | ✓ | |
| `source` | Source | ✓ | |
| `tags` | string[] | | ≤ 20 |
| `state` | enum | ✓ | `staging`, `ready`, `deleting` |

Indexes: `{ storageKey: 1 }` unique · `{ ownerId: 1, kind: 1, createdAt: -1 }` · `{ ownerId: 1, projectId: 1 }` · `{ ownerId: 1, "source.fingerprint": 1 }` (TTS and image cache lookup) · `{ ownerId: 1, tags: 1 }`.

Integrity: an asset is `ready` only after the bytes are stored and their SHA-256 verified. Cache reuse is **within one owner only**.

### 5.14 `characters` (layer 6)

`ownerId`, `name` (≤ 60), `description` (≤ 600, the look in words), `artStyle` (`flat`, `cartoon`, `storybook`, `clay`), `voiceId`, `stylePrompt` (fixed, ≤ 1,000), `seed` (int), `expressions` (`{ neutral, happy, sad, surprised, talking }` → assetIds), `referenceAssetIds` (≤ 6), `rig` (layer 9: `{ partsAssetId, mouthShapes: string[] }`).
Indexes: `{ ownerId: 1, name: 1 }` unique. A duplicate name for the same creator is `409 CHARACTER_NAME_TAKEN`.
Rule: the service refuses names and descriptions of known copyrighted characters and real public figures (a deny list in config), and says why.

### 5.15 `usage`

| Field | Type | Req | Notes |
|---|---|---|---|
| `provider` | string | ✓ | `gemini`, `groq`, `workers-ai`, `azure-speech`, `sarvam`, … |
| `unit` | string | ✓ | `requests`, `tokens`, `chars`, `neurons`, `images`, `seconds` |
| `period` | string | ✓ | `2026-10-19` (day) or `2026-10` (month), in the provider's reset timezone |
| `scope` | string | ✓ | `app` or a user id |
| `used` | number | ✓ | `$inc` after each call |
| `limit` | number | ✓ | Snapshot of the configured limit |

Indexes: `{ provider: 1, unit: 1, period: 1, scope: 1 }` unique · TTL on a `expiresAt` 120 days after the period.

### 5.16 `workers`

One small status document per worker process: `workerId` (unique), `lanes`, `version`, `host` (short name), `startedAt`, `heartbeatAt` (every 15 s), `currentJobIds`. The studio reads it to show "Worker offline since 14:02" when the newest `heartbeatAt` is older than 60 s. Internal; no API writes it. TTL on `heartbeatAt` after 7 days.

### 5.17 `rate_limits`

`key` (e.g. `signin:ip:{hmac}`, `plan:user:{id}`), `windowStart`, `count`, `expiresAt` (TTL). Unique `{ key: 1, windowStart: 1 }`. Raw IPs and emails are never stored; keys use an HMAC.

### 5.18 `connections` and `publishes` (layer 8)

Specified when layer 8 starts, following the frozen-intent pattern: a publish row freezes `videoId`, the `mp4AssetId` hash, `connectionId`, caption, and `scheduledAt` + `timezone`; states `scheduled`, `claimed`, `uploading`, `submitted`, `published`, `failed`, `unknown`, `cancelled`; tokens in `connections` encrypted with AES-256-GCM using `TOKEN_ENC_KEY`. Not needed before layer 8.

## 6. Access patterns

| Read | Query | Index |
|---|---|---|
| Studio grid | `projects {ownerId} sort updatedAt -1 limit 24` | `ownerId, updatedAt` |
| Grid filtered | `projects {ownerId, mode \| badge}` | `ownerId, mode \| badge, updatedAt` |
| Open a project | `projects {_id, ownerId}` + `drafts {projectId}` + `videos {_id: currentVideoId}` | `_id`, `projectId` |
| Version list | `videos {ownerId, projectId} sort createdAt -1` | `ownerId, projectId, createdAt` |
| Storyboard history | `storyboards {ownerId, projectId} sort createdAt -1` | same shape |
| Copilot | `messages {projectId} sort seq -1 limit 50` (owner checked on project) | `projectId, seq` |
| Job poll | `jobs {_id, ownerId}` | `_id` |
| Worker claim | `jobs {state ∈ queued,waiting_quota, runAfter ≤ now}` or expired lease | `state, runAfter` |
| TTS cache | `assets {ownerId, source.fingerprint, state: ready}` | `ownerId, source.fingerprint` |
| Share page | `share_links {token, revokedAt: absent}` → `videos {_id}` | `token` |
| Quotas | `usage {provider, unit, period, scope}` | unique index |
| Library assets | `assets {ownerId, kind} sort createdAt -1` | `ownerId, kind, createdAt` |
| Session | `sessions {tokenHash}` | `tokenHash` |

If a new query has no row here, add the row or the index in the same change.

## 7. Integrity the database will not enforce

- Every referenced id (`storyboardId`, `videoId`, `traceId`, `castIds`, asset ids inside a plan) must belong to the same `ownerId` (and project, where it is project-scoped). Services check this before writing.
- A plan may reference only catalog components and the owner's (or the system library's) assets.
- `projects.currentVideoId` points at a `ready` video of that project.

| When | Also do | Transaction? |
|---|---|---|
| Accept invite | Create user, mark invite accepted | Yes |
| Use reset token | Set password, set `passwordChangedAt`, delete sessions, mark used | Yes |
| Approve draft | Create storyboard, create video (`building`), create render job with `activeSlot`, set project pointers and badge | Yes |
| Job succeeds (render) | Video `ready`, project `currentVideoId`, badge `ready`, unset `activeSlot` | Yes |
| Job fails | Video `failed`, unset `activeSlot`, badge `failed` only if there is no current video | Yes |
| Keep a Copilot candidate | Draft plan = candidate (CAS on `sourceRevision`), message `kept` | Yes |
| Delete project | Delete project, draft, storyboards, videos, messages, traces, share links; cancel jobs; mark its assets `deleting`; enqueue a `cleanup` job that deletes bytes then rows | Yes for rows; bytes after commit |
| Delete one video | Revoke its share link, mark its assets `deleting`, cleanup job; refuse if it is the only ready video and a publish is scheduled (layer 8) | Yes |
| Storage delete fails | Asset stays `deleting`; the cleanup job retries with backoff | — |

Transactions need a replica set; Atlas M0 is one.

## 8. Security-relevant shape

| Item | Storage | Reason |
|---|---|---|
| Passwords | bcrypt cost 12 | Standard; same as The Wedding Home |
| Session, invite, reset tokens | HMAC-SHA256 with `AUTH_TOKEN_PEPPER` | A database leak does not yield usable tokens |
| Share tokens | Raw, unique, never logged, only returned to the owner | The creator copies the same link again |
| Social tokens (layer 8) | AES-256-GCM with a key from env, key version stored | Must be used by the worker |
| Rate-limit keys | HMAC of IP or email | No raw personal data |
| Provider API keys | Env only, never in the database | |
| Notes, scripts, code | Stored in plain text (they are the product) | Not written to logs |

## 9. Retention

| Data | Kept | How removed |
|---|---|---|
| Projects and everything under them | Until the creator deletes them | Delete project (transaction + cleanup job) |
| Sessions | 30 days sliding | TTL |
| Reset tokens | 1 hour | TTL |
| Terminal jobs | 90 days | TTL on `finishedAt` |
| Usage rows | ~4 months | TTL |
| Rate-limit windows | Window length | TTL |
| A creator's whole account | Until removed | Operator procedure: delete each project through the service (so storage is cleaned), then characters and assets, then sessions and the user. Write a script (`scripts/remove-creator.ts`) before the first non-owner creator joins |

## 10. Size check

At the design ceiling (5,000 projects, 50,000 videos): drafts and storyboards ~50 KB average → about 3 GB if every project had 10 storyboards. **That exceeds M0's 512 MB**, so the real ceiling on M0 is about 800 projects with 10 versions each. That is plenty for one creator for a year. Watch `dbStats` on the Settings → Providers page; move to M10 (paid) or prune old storyboards (keep the ones referenced by a video) when it reaches 70%.

Bytes: a 60 s 1080p MP4 is ~5–15 MB, narration ~1 MB, images ~0.5 MB each. 500 videos ≈ 5–8 GB → object storage, not MongoDB (ARCHITECTURE §12).

## 11. Working with the schema

- Mongoose models in `src/server/db/models/*.ts` are the source; indexes are declared on the schema with `autoIndex: false` at runtime and synced by `scripts/db-indexes.ts`.
- Changes are additive. A new required field gets a default or a backfill script first.
- The plan has its own `schemaVersion`. Old storyboards keep theirs; the compiler supports every version that still has a video.
- Seed script (`scripts/seed-dev.ts`) refuses to run when the database name is `leela`.
- One cached connection per process (Next.js and the worker).
- Before real personal data from a second creator: Atlas backups are not on M0, so export with `mongodump` weekly (a cron on the worker machine).

## 12. Decisions and open items

| # | Decision | Why |
|---|---|---|
| D1 | MongoDB Atlas M0 + Mongoose 8 | Free, already used in The Wedding Home, plan JSON fits documents |
| D2 | Bytes in object storage only | M0 is 512 MB |
| D3 | Job queue in MongoDB, not Redis/Inngest | Free, one fewer vendor, leases and a unique active slot give the guarantees we need at this size |
| D4 | Voices, styles, components, library = repo config | They version with the renderer code |
| D5 | Hard delete with a cleanup job, no recycle bin | Simple; the PRD has no restore of deleted projects |
| D6 | Share tokens raw, auth tokens hashed | Same split as The Wedding Home |
| D7 | Owner from env, not a role field | There is always exactly one Owner |

Open items: `connections`/`publishes` field detail (layer 8). Layer 1 has none.

## Done when

- [x] Every PRD object is a collection or a named embed (voices, styles, components are config; scenes, layers, events are embeds)
- [x] Every screen in the access-pattern table has an index
- [x] Token storage matches the architecture (hashed vs retrievable)
- [x] Delete behaviour names the other rows that move
- [x] Layer 1's collections are listed, and later collections are not required for it
