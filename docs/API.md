# SceneSpindle — API design

Version 2.0 · 2026-11-02. Routes below describe the target API; IMPLEMENTATION_PLAN.md identifies delivered slices.

## Shared contract

Same-origin cookie authentication for browser mutations. Validate Origin against APP_ORIGIN and optional explicit APP_ALLOWED_ORIGINS; never trust Host or X-Forwarded-Host as an allowlist. Tokens: secure HttpOnly SameSite=Lax sessions; invite/reset tokens are single-use hashes. Explicit paired-agent bearer endpoints use separate scope/expiry checks.

Error envelope: `{error:{code,reason,message,fields,requestId,details?}}`. Statuses: 400 malformed/unknown fields, 401 unauthenticated, 403 owner-only action, 404 missing or foreign private object, 409 state/revision/idempotency conflict, 413 size, 422 unsupported/invalid plan, 429 rate limit, 503 unavailable. Never expose provider payloads or credentials.

JSON ids are strings and dates ISO UTC. Private ownerId comes only from the session/token. List responses `{items,nextCursor?}` use opaque signed filter-bound cursors; default 24, maximum 50. Mutation bodies reject unknown keys. JSON Content-Type is required. Idempotent operations accept an Idempotency-Key scoped to user/operation and request hash.

## Routes

| Area | Interface | Result |
|---|---|---|
| Account | existing sign-in/out/session; join, reset-request/reset; PATCH account; password change | Generic credential errors; reset revokes sessions |
| Invites | owner-only GET/POST invites, resend, revoke | Email-bound one-time token; delivery failure is visible |
| Projects | existing GET/POST projects; GET/PATCH/DELETE projects/{id}; duplicate | Owner-scoped; soft-delete cleanup; settings capability checks |
| Draft | GET/PATCH projects/{id}/draft | PATCH `{expectedRevision,idea?,plan?}`; returns revision, planValid, issues, planHash |
| Planning | POST projects/{id}/brainstorm, plan, scenes/{sceneId}/regenerate | 202 `{jobId}`; frozen source revision |
| Approval | POST projects/{id}/approve `{draftRevision,planHash,executionTarget,renderProfile}` | 202 `{jobId,storyboardId,videoId}`; atomic idempotent enqueue |
| Jobs | GET jobs/{id}; POST cancel/retry | Real state/stages/checkpoints; no fake progress |
| Candidates | POST messages/{id}/keep `{expectedRevision}`; POST discard | keep requires sourceRevision == expectedRevision == current revision; atomic commit |
| Versions | GET project storyboards/videos; restore; make-current | Restore creates new draft; only QA-passed artifact can become current |
| Uploads | POST uploads; complete upload; GET assets/{id}/file | Size/type/hash validation; resumable signed upload; private streamed/signed download |
| Catalog | GET catalog, voices/{id}/sample, capabilities | Only implemented/configured combinations enabled; unsupported options explain why |
| Series | GET/POST series; GET/PATCH series/{id}; POST series/{id}/versions; episode association | Revision checks; frozen bible/cast versions |
| Library | assets, characters and character versions | Provenance, rights and capability metadata |
| Traces | POST project traces; GET trace metadata/steps | Strict size/step limits; never server execution |
| Agents | owner/creator pairing; agent heartbeat, scoped claim, checkpoint, result | Expiring revocable scope; lease fencing and hash verification |
| Export | POST videos/{id}/exports `{kind}` | mp4, srt, vtt, audio, project-package; optional otio with baked-effect manifest |
| Usage | GET usage; owner allowances/reservation views | Estimated/reserved/actual; unknown is not zero |
| Shares | POST/PATCH/DELETE videos/{id}/share; GET public/share/{token}, video | Verified artifact only; allowDownload honored; revoke/delete → same 404 |
| Publish | connections OAuth; POST publishes; schedule/cancel/status | Frozen target and artifact; ambiguous timeout → checking, never duplicate blindly |

## Foundation mutation details

Draft body: expectedRevision is a positive integer. idea fields: topic ≤2000, audience ≤200, notes ≤20000, mustInclude ≤12 strings of ≤160 characters. Missing fields preserve prior values; empty strings/arrays explicitly clear fields. plan may be null to clear. Invalid plan drafts remain saveable with actual issues and no valid planHash. A conflict returns currentRevision without overwriting either client's text.

Candidate keep must reject missing/legacy sourceRevision as stale. Validate candidate plan before committing. Candidate status and draft update occur in a transaction. Discard cannot override an already-kept candidate.

## Rendering, packages and capabilities

ExecutionTarget: local-only, paired-agent or azure. RenderProfile: 2d, realtime-3d or cinematic-3d. The server resolves agent capabilities and configured budget before enqueueing. ProductionPlan v2 is distinct from the existing v1 explainer contract. Until implemented, schema/capability output exposes v1 limitations.

An export package includes versioned scene/timeline JSON, relative media references, hashes, fonts/licenses and renderer metadata; secrets and personal absolute paths are excluded. Optional OTIO exports use baked media for effects not supported by interchange. Mask assets carry their source clip/hash and transform; stale masks cannot silently apply to a different clip.

## Security and verification

Rate limits: sign-in 10/15min per hashed IP/email; reset/join 5/hour per hashed IP; planning 20/10min per creator; render 10/hour plus active-job limits. Keep these distinct from provider quotas. Public share reads have their own limiter before token lookup.

Test foreign IDs for every family, stale revisions, duplicate approvals, origin spoofing, revoked shares, invalid upload types, worker replay, expired agents, quota exhaustion and ambiguous publishing. Public payloads omit owner/project IDs, script, private assets and other versions.

## Briefing endpoints (planned)

See BRIEFING_WORKFLOW.md for the shared contract. Add GET/PATCH `/api/projects/{id}/brief`, POST `.../brief/refine`, `.../brief/answers`, and `.../brief/approve`; expose equivalent series-scope routes. Refine returns 202/jobId; get/patch/answers return state, revision, structured brief, assumptions, questions and blockers. Approval returns briefVersionId/hash after expectedRevision/contentHash checks. Refine accepts an idempotency key and creates a `brief_refine` job; no render is started implicitly.

Bodies use the same strict schemas across UI/CLI/AI clients. Missing answers return `needs_input`; stale revision → 409 REVISION_CONFLICT; unresolved material blocker → 422 BRIEF_INCOMPLETE; unsupported combination → 422 CAPABILITY_UNAVAILABLE. Evidence/source details are private to the owner. Public share payloads never include raw prompts, research or decisions.
