# SceneSpindle — database design

Version 2.0 · 2026-11-02 · MongoDB metadata; media in storage. This is the target contract, not a claim that migrations have run.

## Compatibility and common fields

Retain existing physical collection names (`sharelinks`, etc.) and database names. Document explicit mappings rather than allowing Mongoose pluralization to create duplicate collections. Documents use ObjectId _id, UTC dates, ownerId on private objects, timestamps and schemaVersion where applicable. JSON exposes id and ISO dates, omitting credentials, leases, storage paths and token hashes.

| Collection/object | Core data and invariants | Access/lifecycle |
|---|---|---|
| users | unique normalized email; bcrypt passwordHash; passwordChangedAt; preferences | Own account; owner role from configured identity |
| sessions | userId, tokenHash, expiresAt, lastSeenAt | Internal; HMAC-SHA256 tokens; TTL plus application expiry checks |
| invites / resets | email/userId, tokenHash, expiresAt, usedAt | Owner invites; public token redemption; single-use transaction |
| projects | mode, format, language, targetMs, settings, optional seriesId/episodeNumber, currentVideoId, version counters, deletedAt | Owner-scoped; soft delete and 7-day recovery |
| drafts | unique projectId; ownerId; revision; idea; plan; planValid; issues; planHash; traceId | Compare-and-swap revision; omitted PATCH fields retained |
| storyboards | projectId, version, schemaVersion, plan, planHash, frozen cast/assets/series versions, approvedAt | Immutable after approval |
| videos | projectId, storyboardId, version, jobId, renderSpec, state, artifact refs, QA, warnings, rightsStatus | building/preview/ready/failed; ready requires verified MP4 |
| messages | projectId, seq, role, text; candidate {plan, sourceRevision, status, changedSceneIds} | Candidate proposed/kept/discarded; atomic keep with draft |
| jobs | type, ownerId, projectId, frozen input, activeSlot, state, runAfter, attempts, leaseToken/expiry, stages, checkpoints, result | Internal claim/heartbeat; owner status/cancel endpoints |
| assets | ownerId or system provenance; kind, storageKey, hash, mime, size, metadata, license, rightsStatus, retention | No embedded media bytes; ready/quarantined/deleting states |
| characters / characterVersions | stable identity plus immutable art/rig/voice/costume/expression references | Own library; each render freezes exact version |
| series / seriesVersions | title, bible, cast versions, location/prop refs, continuity rules | Creator-owned; immutable bible snapshots |
| episode continuity | project seriesId, episodeNumber, priorEpisodeId, approved summary, seriesVersionId | Embedded project metadata; one episode order per active series |
| traces | input metadata, tracer version, validated summary, stepsAssetId | Server parses but never executes code |
| sharelinks | videoId/projectId/ownerId, token, allowDownload, revokedAt | Public bearer token never logged; only artifact payload public |
| connections / publishes | encrypted OAuth tokens; frozen destination/artifact/caption/schedule; remote ID | Own connections; publish reconciliation before retries |
| agents | ownerId, tokenHash, scopes, capabilities, expiry, revokedAt, heartbeat | Paired worker; no DB/provider credentials |
| usage / reservations | provider, unit, period, estimated/actual units, monetary currency, jobId, status | Atomic budget reservations, settlement and release |
| rateLimits / idempotency | hashed identity, window/expiry; request hash and result reference | Internal TTL; TTL is cleanup, not authorization |

## Required integrity

- Unique (projectId, version) for storyboards/videos; increment monotonic project counters transactionally. Never countDocuments()+1.
- Unique active project content-job slot using a partial index on activeSlot:true. Terminal jobs unset the slot. Existing duplicates must be repaired before creating the index.
- Draft is unique by projectId. Update filter includes ownerId and expected revision; $inc revision in the same operation.
- Candidate keep checks sourceRevision and proposed state inside one transaction with the draft update. Roll back both on conflict. Candidate discard atomically filters proposed state.
- Unique (projectId, seq) messages; allocate seq atomically. Unique (seriesId, episodeNumber) for active episode projects. Immutable entity versions use unique (entityId, version).
- Project deletion revokes shares and blocks new claims immediately. Active workers check cancellation before output publication; reference-aware cleanup runs after retention.
- Budget reservations and settlement use idempotent job/operation keys. Expired workers cannot settle twice. Failed/unused allocations are released.
- License includes source URL or creator provenance, SPDX/custom identifier, attribution, commercial-use status and evidence reference. Unknown is a real state. Upload ownership is a claim, not proof of rights.

## Queries and indexes

Private lists filter ownerId and deletedAt; paginate by (updatedAt, _id), max 50. Job claim index covers state/runAfter/lease expiry and execution profile. Asset lookup covers ownerId/hash and kind. Token lookups are unique; reject expiry/revocation before serving. Audit and usage events retain only operational metadata.

## Migration sequence

1. Back up existing metadata and inventory physical collections/storage paths.
2. Add optional fields and indexes safely; preserve existing v1 plans and media references.
3. Label HTML-only videos preview; do not invent artifacts or backfill ready without QA.
4. Convert large trace/media fields to object-storage references through a resumable migration.
5. Introduce immutable entity versions and freeze old assets before series/3D features enable.
6. Validate isolation, counts, references and rollback before removing legacy fields.

No production migration or user-data deletion is part of documentation/branding changes. Integration tests use a dedicated `scenespindle_test_*` database and remove only their own temporary data.

## Briefing objects (planned)

`briefs`: one mutable document per owner + scopeType(project|series) + scopeId, with revision, rawRequest, structured fields, fieldProvenance, decisions, assumptions, sourceRefs, blockers and state. Unique scope index; compare-and-swap updates. `briefVersions`: immutable snapshot with unique (briefId, version), hash, approvedAt, creator and inherited series version. `promptBundles`: immutable briefVersionId + template/capability versions + per-task prompts and provider configuration; no credentials. Source references embed URL/title/retrieval date and evidence summary; large approved reference artifacts use private asset refs.

Questions/answers include decisionId and baseRevision; stale responses conflict. Jobs gain type `brief_refine`, owner/scope refs and bounded research stages. Approvals, version allocation and superseding the prior snapshot are transactional. Storyboards/render specs reference the exact approved brief version. Series briefs inherit series ownership; deletion/retention applies to briefs, bundles and source artifacts alongside project/series data. No migration has run.
