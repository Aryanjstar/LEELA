# SceneSpindle — product requirements

Version 2.0 · 2026-11-02 · Source of truth for target behavior. The 2026-10-19 specification is preserved in history/2026-10-19/.

## Requirements and acceptance

| ID | Requirement | Acceptance |
|---|---|---|
| SS-01 | Portable, assistant-independent setup | A fresh checkout runs documented commands; doctor reports missing prerequisites without exposing secrets; authored JSON validates without an AI key |
| SS-02 | Invite-only authentication | Two invited creators can join/sign in/reset/revoke sessions; an uninvited user cannot register; every private resource enforces owner isolation |
| SS-03 | Safe project editing | Partial updates preserve omitted fields; two saves at one revision yield one winner and one conflict; a stale candidate cannot overwrite a newer draft |
| SS-04 | Durable production | Approval freezes inputs; duplicate submission creates one job; worker crash/cancel/retry preserves completed artifacts and the previous good export |
| SS-05 | Actual exports | A ready video has an accessible, verified MP4, captions and thumbnail; HTML alone is a preview; synthetic timing cannot masquerade as aligned speech |
| SS-06 | Reference parity | Water-cycle, comparison/flow, orbit and binary-search examples produce appropriate diagrams; edits reuse compatible narration; render failure resumes without new provider charges |
| SS-07 | Language, voice and format | Enabled English/Hindi/Hinglish voices and all enabled aspect ratios complete a render; chosen narrator never silently changes |
| SS-08 | Caption craft | Word times derive from audio; 2–3 word punchy and 3–6 word phrase presets respect punctuation, width, safe zones and script shaping; SRT/VTT and captions-free exports work |
| SS-09 | Audio and editing | Montage, singing cover, talking head and kinetic workflows preserve originals; music follows measured beats; audio-only edits reuse picture; voice remains intelligible |
| SS-10 | Illustrated stories | Supplied script is preserved; 8–15 beats where appropriate; 4–6 representative preview stills before approval; reference-guided character appearance persists |
| SS-11 | Series and episodes | Versioned bible/cast/locations; episode order and continuity notes; a second episode reuses the approved cast; later asset changes do not alter old renders |
| SS-12 | 2D and 3D production | HyperFrames 2D, deterministic Three.js and Blender cinematic paths each yield reviewed output; proxies are labeled; simulations are baked before final rendering |
| SS-13 | Local/remote execution | A paired machine processes only scoped jobs; expired/revoked agents cannot claim; local-only media never goes to a hosted provider |
| SS-14 | Honest usage | Reserve estimated cost before work; bounded retries; exhausted allowance pauses jobs; only owner can increase creator allowances; no external paid fallback |
| SS-15 | Library and rights | Every asset has provenance and rights status; licensed franchise assets can be recorded; unknown permissions are visible and never labeled commercially cleared |
| SS-16 | Publishing | Frozen artifact/destination/caption; OAuth revocation, schedule/timezone and ambiguous submission recovery tested; no blind duplicate posting |
| SS-17 | Accessible studio | Desktop and 390 px workflows, keyboard navigation, focus states, reduced motion and readable error/loading/empty states |
| SS-18 | Optional editable export | Portable project package and OTIO timeline preserve clip timing, tracks, references and available audio; unsupported procedural effects are explicitly baked |
| SS-19 | Optional subject cutouts | Alpha masks can place text behind a subject; mask/edge quality is reviewed; model/license/hardware prerequisites remain optional |

## Workflows and quality gates

Brief → storyboard → approved assets → timed animatic → immutable render snapshot → shots → assembly/mix → QA → review/export. A short factual explainer does not require every story-specific gate. Creator review can stop after stills/animatic to avoid expensive rendering.

Code Lab runs user code only in an isolated browser Worker with a 5 second wall-clock and 2,000-step cap. Trusted code derives visual states; model output never invents execution results. Web/worker services never execute submitted code.

Every renderer uses frozen fonts, asset hashes, component versions, frame rate and timing. Numerical determinism is scoped to the pinned renderer/platform; do not promise byte-identical GPU output across hardware.

Narration/caption target: ±150 ms on reviewed representative samples. Events land within one output frame of resolved cues. Validate media streams, duration, dimensions, font loading, text bounds, safe zones, HDR handling, clipping and audible mix. Contact sheets require visual inspection; generating a sheet is not proof of QA.

## Ownership and lifecycle

ownerId always comes from authenticated context. Malformed, missing and another creator's private IDs return the same not-found behavior. Deletion immediately hides the project and revokes shares, cancels active work, and schedules reference-aware cleanup. Keep deleted data for 7 days for recovery; operator erasure is a separate explicit action. Immutable snapshots keep referenced assets until retention ends.

## Costs and defaults

Only configured Azure-funded services and documented available free credits are enabled. Remaining Azure credit balance and expiry are unverified as of 2026-11-02; do not assume $10,000. Activate hosted paid execution only after a verified allowance is recorded. Initial monthly application allowance is min($500, 10% of remaining verified credits); default per-job ceilings are $25 owner/$5 invitee, with owner-approved overrides. One heavy hosted job, two transient retries, timeouts and scale-to-zero. These controls do not govern unrelated Azure resources or remove billing latency.

## Delivery definition

The requirements matrix in IMPLEMENTATION_PLAN.md is the release checklist. A feature is end-to-end complete only after a creator can use its whole flow and the resulting artifact is reviewed. Existing test success, a generated preview, a recipe, or a marketing card is insufficient. No promise of monetization or factual correctness; factual claims and publishing metadata remain reviewable.

## Addendum — brief building and on-demand references (2026-11-02)

SS-20: Every video/scene/series entry point supports the shared [Brief Builder](BRIEFING_WORKFLOW.md). Preserve raw intent, retrieve scoped context, research relevant gaps, present meaningful choices, save revision-bound answers, and approve a versioned brief before production. Acceptance covers sparse prompts, exact scripts, series continuity, scene-only changes, unavailable research and UI/CLI/IDE parity.

SS-21: Keep the supplied [toolbox](toolbox/README.md) available on demand. Save pinned provenance and selected local instructions without auto-installing or loading unrelated skills. No trading, resume, WhatsApp or general productivity capability is added to the product simply because its reference is stored.

Approval/readiness, question limits, source handling, inference provenance and evaluation cases are defined in BRIEFING_WORKFLOW.md. Prompt quality is evaluated, not asserted from length or an upstream score. Implementation is ready to resume in the new account; see HANDOFF.txt.

## Addendum — Reel Studio parity (2026-11-03)

SS-22: The [Reel Studio parity checklist](REEL_STUDIO_PARITY.md) is a release gate for the unified studio. All tracked Reel Studio video workflows and editing utilities must be represented by a working, inspected SceneSpindle flow or an explicit documented exception. Include source ingest, inspiration analysis, beat cuts, cover vocals/lyrics, talking head, kinetic type, from-scratch motion, contact-sheet QA, versioned narrow revisions, styles/effects and SFX. Optional static creator utilities cover LinkedIn/X banners and factual headline/About/bio copy; they do not need to block the first video slice but do block a claim of **full Reel Studio parity**. Features available only as Reel Studio recipes remain unproven until a real end-to-end artifact exists. Source code is in a separate repository until ported; no current parity is implied by this requirement.
