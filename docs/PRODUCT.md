# SceneSpindle — product specification

Version 2.0 · 2026-11-02 · Approved direction; implementation status is in PROJECT_STATUS.md.

**AI Video Production Studio.** SceneSpindle combines the existing web application with reusable Reel Studio tools. One creator supplies a brief, script, code, media or music; the studio prepares a storyboard, measures timing, renders, and supports precise revisions. No particular AI assistant, editor or provider account is required for authored-plan workflows.

## Audience and access

The hosted product is invite-only. Creators own isolated projects and libraries. The owner manages invitations, configured providers and spend allowances, without implicit access to another creator's content. Viewers can access only an explicitly shared artifact. A contributor can run the repository locally without joining the hosted studio.

## Supported product scope (target, not current capability)

| Workflow | Outcome |
|---|---|
| Explainer | Narrated concepts and diagrams with phrase-synchronized events |
| Code Lab | Python/JavaScript explanations driven by bounded browser execution traces |
| Story | Illustrated narratives, reference-guided characters, camera moves and sound |
| Audio | Narration, singing covers, audio mixing and optional audiograms |
| Cartoon | Original or licensed recurring cast, 2D puppets or 3D rigs, dialogue and lip sync |
| Montage | Beat-driven personal/event/travel reels, HDR handling and reframing |
| Talking head | Speech editing, captions, punch-ins and optional subject cutouts |
| Kinetic type | Meaning-driven typography synchronized to supplied speech |
| Launch / motion | Real product media, procedural motion and 3D scenes |

Durations: 15–180 second short films and 5–10 minute episodes. Formats: 9:16, 16:9, 1:1, 1080-class output at 30 fps initially. Languages: English, Hindi and Hinglish. These are capability-gated until demonstrated; unsupported combinations must not be selectable as working features.

## Surfaces

Public: landing, sign-in, invite redemption, password reset and `/v/{token}`. Private: dashboard, new project, project workspace, series library/detail, asset/character/voice/style library, render queue and settings. Project flow: Brief → Storyboard → Preview/approval → Render → Review/export/share. A conversational revision panel and command palette work across the flow.

Series have a versioned bible, cast and settings, episode order and continuity notes. A project may belong to one series episode or stand alone. Updating a series never silently changes an existing approved episode.

## Creative principles

Use real input, a clear opening idea, motivated motion, readable typography, measured speech/beat timing and deliberate sound. Hooks are optional creative patterns, never fabricated facts or a virality guarantee. Caption cards preserve phrases and punctuation; style-specific word limits are targets constrained by readability, not arbitrary cuts through words.

Studio UI: editorial film studio, graphite surfaces, saffron accents, restrained motion and real rendered examples. Video styles are independent of the studio theme. A style name in a reference list is inspiration until a tested preset exists.

## Execution and privacy

Choose local-only, paired remote PC, hosted Azure, or self-hosted execution per project. Personal media stays local by default; provider transmission requires an explicit project-level choice that names the destination. Cloud rendering is optional. No provider credentials or database credentials are sent to paired agents.

## Boundaries

No public signup, customer billing, teams, voice cloning, celebrity avatars or full general-purpose timeline editor in this release. Cinematic 3D rendering is included; unconstrained text-to-video model clips remain an optional future adapter. No mandatory Adobe, Resolve Studio, Claude, Cursor or ChatGPT subscription.

Optional additions approved 2026-11-02: editable timeline interchange and subject matting/depth typography. Keep these out of the minimum installation. See IMPLEMENTATION_PLAN.md for order and acceptance evidence.

## Brief before production

All clients share a [Brief Builder](BRIEFING_WORKFLOW.md): rough request → scoped context/research → useful choices → approved creative brief → storyboard/preview → render. It supports new videos, episodes, series and targeted shot edits. The creator can delegate optional choices; explicit requirements and exact scripts remain authoritative. The [toolbox](toolbox/README.md) is an on-demand reference library, not additional navigation or a default dependency stack.
