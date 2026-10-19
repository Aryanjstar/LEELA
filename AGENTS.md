# Leela — agent instructions

Leela is an AI video studio: idea, notes, or code → validated scene graph → narrated, captioned MP4. Modes: Explainer, Code Lab (DSA with real execution traces), Story, Audio, Cartoon, Montage. Free-tier first, sellable later. Inspired by NamasteVideo.ai; built on what we learned making The Wedding Home (method) and Reel Studio (HyperFrames rendering).

## Read first (in this order)

1. `docs/PROJECT_STATUS.md`: where the build is right now. Read it before touching code.
2. `docs/PRODUCT.md`: vision, page map, modes, layer order.
3. The four **source-of-truth** docs: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/API.md`.
4. `docs/DESIGN.md` for any UI or video-style work. `docs/RESEARCH.md` before choosing or changing a provider, tool, or library.
5. `docs/reference/` for NamasteVideo (what we kept and refused), Reel Studio (HyperFrames traps and Aryan's taste), and motion craft (how the kinetic reels are made, and what we refused from that kit).
6. `docs/PLAYBOOK.md` is the method: idea → PRD → design docs → cross-check → slices.

If code, a screen, or a reference repo disagrees with the four source-of-truth docs, follow the docs and say so. Change those four only when the human explicitly asks.

## Hard rules

- **Model output is data, never code.** Plans name registered components (`src/catalog/components`). Never execute, `eval`, or inject model text as HTML, CSS, URLs, or file paths. All plan text is escaped by the compiler.
- **Facts and times come from code**: execution traces, measured audio, creator-supplied numbers. The AI writes words and picks components.
- **User code runs only in the browser** (Pyodide / QuickJS in a Web Worker). The server and worker only parse traces.
- **`ownerId` comes from the session**, never from a body. Another creator's id is `NOT_FOUND`. The worker derives ownership from the job document.
- **Approved storyboards are immutable**; jobs read frozen inputs. The last good video stays current until a new one passes QA.
- **Every provider call goes through an adapter and the quota router** (`src/server/providers`, `src/config/providers.ts`). No SDK calls in services. Voices never fall back silently to another voice.
- **Every asset carries a licence.** No file enters `library/` without a `manifest.json` row. Never use unDraw, DrawKit, Blush, Storyset, the Freesound API, MusicGen weights, edge-tts, or Coqui XTTS in the product.
- **No copyrighted characters or real-person likeness.** No voice cloning.
- Passwords bcrypt cost 12. Session, invite, and reset tokens stored as HMAC-SHA256. Share tokens stored raw and never logged. No secrets in logs, docs, or `NEXT_PUBLIC_*`.
- Do not add Redis, Inngest, websockets, GraphQL, microservices, or a new dependency without a reason written in ARCHITECTURE.md.

## Where code goes

- `src/app`: routes, layouts, thin handlers only (parse → auth → Zod → service → map).
- `src/modules/<feature>`: created when that layer starts. No empty modules or nav items ahead of their layer.
- `src/server`: db, http helpers, auth, storage, mail, provider adapters, quota router. `src/config`: env parsing by subsystem.
- `src/contracts`: Zod schemas (plan, trace, timeline, API bodies). `src/catalog`: components, styles, voices, modes.
- `src/compiler`: plan + timeline → HyperFrames project. Pure; shared by preview and worker.
- `worker/`: the job runner and its Python sidecars. `library/`: licensed system assets. `spikes/`: layer 0 experiments.

## How we work

- Build in `docs/PRODUCT.md` layer order. A layer is done when a person can finish its job in the UI.
- Each layer or distinct change on a branch. Before merging: unit tests, typecheck, lint, a cross-check against the four docs (`docs/templates/CROSS-CHECK.md`), and the browser journey (`npm run e2e`) as two creators at desktop and 390 px. A screen that renders is not a screen that saves.
- Update `docs/PROJECT_STATUS.md` in the same change when a layer or major feature lands: status, date, what shipped, how it was checked, what is still mock. It tracks progress; it does not override the four docs.
- After a decision or a shipped step, add a dated entry to `docs/journey/` (private, gitignored) using `docs/templates/JOURNEY-LOG.md`. If the step taught a repeatable method, update `docs/PLAYBOOK.md` or `docs/templates/`.
- Before a layer uses a provider, call it once from the server with the real key (`scripts/check-providers.ts`) and make its failure path calm.
- Render, then look: QA every render with the frame sheet before showing it.
- Commit and push only when the human asks.

## Working with Aryan

- He wants it **done, not discussed**. Ask only blocking questions, batched. Show renders, not plans.
- He dictates by voice: expect transcription noise ("Cloud" = Claude). Infer sensibly; flag only real ambiguity.
- Feedback comes as numbered punch lists. Apply every item, report item by item, and change nothing else.
- Video taste: no white or cream pill caption boxes, no em-dashes in on-screen text, no long paragraphs on screen. Likes handwritten accents, Devanagari headers, stickers, a strong ending.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
