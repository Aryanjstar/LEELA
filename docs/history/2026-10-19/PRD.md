# Leela — Product Requirements Document

**Product:** Leela
**Version:** 1.0
**Status:** Draft for review. Layers 0 to 2 are ready to build once the human signs off.
**Date:** 2026-10-19
**Audience:** Anyone implementing or reviewing a layer

This PRD expands the locked plan in `PRODUCT.md`. It does not invent pages or roles.

| Artifact | Job |
|---|---|
| PRODUCT.md | Vision, page map, modes, layers, out of scope |
| This file | Requirements, objects, journeys, acceptance criteria |
| ARCHITECTURE.md | How it runs: pipeline, providers, worker, scene graph contract |
| DATABASE.md | Collections, indexes, integrity |
| API.md | HTTP contract |
| DESIGN.md | Visual direction, screens, components, motion |
| RESEARCH.md | Tools and free tiers, verified, with dates |

Build in the layer order below. Do not add navigation that is not in the page map.

## 1. Summary

Leela is a web studio where one creator turns an idea, notes, or code into a finished short video: narration, word-timed captions, motion, scenery, characters, and music. The creator picks a mode (Explainer, Code Lab, Story, Audio, Cartoon, Montage), reviews an AI storyboard as scene cards with live previews, approves it, and a worker renders an MP4. Revisions happen in a chat dock. Every version is kept. A viewer can watch one shared video by link without an account.

## 2. Problem

A creator who wants to teach DSA, explain a science idea, or tell a story on Reels and YouTube today does this: writes a script in ChatGPT, records or generates a voice, hunts stock clips and icons, and fights CapCut (banned in India) or Canva for hours. Animated DSA (a recursion tree growing as the narrator speaks) is beyond most creators. AI video apps make pretty but random clips that do not explain anything, cost money per second, and watermark free output.

NamasteVideo.ai proved the core loop (topic → approved storyboard → narrated motion graphics) but stops at 8 diagram types, one English voice, and no people, places, stories, or code tracing.

## 3. Goals and non-goals

### v1 goals (layers 0–5)

1. A creator makes a usable 30–90 s Explainer or Code Lab video in under 10 minutes of hands-on time.
2. Motion explains: a step appears when it is spoken, and a pointer moves when the code moves it.
3. Code Lab animations come from a real execution trace, never from the AI's description of what the code does.
4. Narration, captions, and animation share one timeline built from real speech timing.
5. Plain-language revisions change only what was asked, and the previous good video survives.
6. Everything runs on free tiers or on this Mac. Each provider is swappable by config, and each asset has a licence record.
7. The UI is playful, fast, and readable.

### v2 goals (layers 6–9)

Story mode with scenery, characters, and AI stills. Audio mode. All formats. Hindi and Hinglish. Publishing to YouTube Shorts and Instagram Reels. Cartoon characters with lip sync. Photo-and-song montages.

### Explicit non-goals

- Cinematic text-to-video as the main engine. Generated clips may come later inside a scene ("AI clips"), never as the whole video.
- Copyrighted characters or brands (Pokémon, Motu Patlu, Disney, anime IP), and real people's likeness or voice.
- Voice cloning.
- A frame-level timeline editor. We offer a scene strip, inline text, and chat.
- Teams, shared projects, comments, client approval.
- Billing, credits, public signup (layer 10).
- Executing user code on the server.
- Open-web research and citations. The AI uses the creator's notes and its own knowledge, and says so.
- Screenshotting a website the creator does not own. A Launch film (layer 10) uses uploads.
- Guaranteed factual correctness. The creator reviews the storyboard; we make that review easy.

## 4. Users and roles

### Operators

- **Creator.** Signs in. Owns a private studio: projects, characters, uploads, preferences.
- **Owner.** A creator whose email matches `OWNER_EMAIL`. Can invite emails and see app-wide provider quotas. Exactly one, set by config.

### Visitors

- **Viewer.** Opens `/v/{token}` and watches one video. No account, no other data.

### Constraint

One studio per account in this version. A creator cannot see another creator's anything.

## 5. Rules that do not bend

1. **AI output is data, never code.** The planner fills a schema that names registered components. Nothing from a model is executed, injected as HTML, or used as a URL or file path.
2. **Approved means frozen.** Approving a storyboard stores an immutable version with a content hash. Renders read that version only.
3. **Trusted code computes facts.** Data-structure states, chart values the creator supplied, and all times come from code, traces, and measured audio. The AI writes words and picks components.
4. **The last good video stays.** A new render replaces nothing until it passes QA.
5. **Owner from the session.** `ownerId` comes from the session, never from a request body. Another creator's id answers `NOT_FOUND`.
6. **Licence trail.** Every asset row records its source, licence, attribution text, and whether commercial use is allowed. An asset with an unknown licence can be used in a draft but blocks the "commercial-safe" badge on export.
7. **Quotas are honest.** When a free provider runs out, the job waits or falls back to a configured alternative and the UI says which one. No silent quality swap: a different voice is never substituted without telling the creator.
8. **Free tiers stay where the provider allows.** No scraping of unofficial endpoints for production. No provider whose terms forbid our use.
9. **Code Lab runs code in the creator's browser**, in a Web Worker sandbox with a step and time limit. The server only receives the trace.

## 6. Surfaces and page map

Same pages as PRODUCT.md.

| Page | Who | Job |
|---|---|---|
| `/` Landing | Public | Show real Leela videos and invite sign-in |
| `/sign-in`, `/join/{token}`, `/reset/{token}` | Public | Invite-only account, sign-in, password reset |
| `/studio` Studio home | Creator | Find and start projects; see quota meters |
| `/studio/new` New project | Creator | Choose mode, format, length, language, voice, style |
| `/studio/p/{id}` Project | Creator | Idea → Storyboard → Video → Share, with the Copilot dock |
| `/studio/library` Library | Creator | Characters, Voices, Assets, Styles |
| `/studio/settings` Settings | Creator (Owner sees more) | Account, providers and quotas, connections, preferences, invites (Owner) |
| `/v/{token}` Share page | Viewer | Watch one shared video |

## 7. Core objects

Design docs must use these names.

| Object | Is | Is not |
|---|---|---|
| **Creator** (`user`) | An account with email, name, password hash, preferences | A team or workspace |
| **Invite** | An allowlisted email with a one-time join token | A public signup |
| **Project** | One video idea and all its versions. Has a mode, format, target length, language, voice, and style | A single render |
| **Draft** | The editable working copy of a project: idea inputs plus the current editable plan. One per project | A version |
| **Plan** (scene graph) | The structured document: meta, cast, music, ordered scenes. JSON validated against the schema version | Code or HTML |
| **Scene** | One beat of the video: narration lines, a background, layers, events, camera, transition | A separate collection; it lives inside a plan |
| **Layer** | One component instance in a scene: `component` id + validated `props` + enter/exit | Free-form HTML |
| **Component** | A registered, versioned, trusted renderer with a props schema (e.g. `ds.array@1`, `diagram.cycle@1`, `scene.office@1`) | Something the AI can invent |
| **Event** | "Do this action to that layer when this phrase is spoken (occurrence n), plus an offset" | A timestamp the AI picks |
| **Storyboard** | An immutable, hashed snapshot of a plan, made when the creator approves or a revision is accepted | The draft |
| **Message** | One turn in the project's Copilot conversation | Global chat |
| **Job** | One unit of background work: `brainstorm`, `plan`, `revise`, `scene_regen`, `render`, `image`, `cleanup`, `publish` | The business state itself. A trace upload and a voice sample are requests, not jobs |
| **Video** | One render of one storyboard with one render spec: MP4, captions, thumbnail, QA, timing | A project |
| **Asset** | Any stored file (image, audio, music, SFX, character art, upload, trace JSON, render) with hash and licence | A row without a licence |
| **Character** | A cast member: name, look, art or puppet rig, default voice, reference images | A real person or copyrighted character |
| **Voice** | A configured preset: provider, voice id, language, accent, label, sample | A clone |
| **Style** | A visual theme for videos: palette, fonts, caption look, motion temperament, illustration style | The studio UI theme |
| **Trace** | A Code Lab execution record: language, code, input, ordered steps with stack frames, variables, and line numbers | Something the server executes |
| **Share link** | A random token on a video that lets a viewer watch it | Access to the project |
| **Usage** | A per-provider, per-day counter of units used against a configured free limit | Billing |
| **Connection** (layer 8) | An authorised YouTube or Instagram account, tokens encrypted | Shared between creators |
| **Publish** (layer 8) | A frozen intent to post one video with one caption to one connection, now or at a time | A retry loop |

## 8. Build layers

| Order | Layer | Done when |
|---|---|---|
| 0 | Engine spikes | S1–S4 each have a REPORT.md with a pass/fail and a sample of what that spike produces (§8.1) |
| 1 | Shell and studio | An invited creator signs up, signs in, creates, renames, and deletes a project, and another creator cannot see it |
| 2 | Explainer end to end | A creator types "How do planets orbit the sun?", approves an AI storyboard, and downloads a narrated, captioned 9:16 MP4 |
| 3 | Code Lab | A creator pastes a recursive Python `fib`, sets `n=4`, and gets a video where the recursion tree and call stack grow in time with the narration |
| 4 | Revise and version | "Make scene 2 slower and the labels bigger" produces a new version without new TTS, and the old version can be restored |
| 5 | Share and deploy | The studio runs at a public URL, a render finishes with the laptop closed, and a viewer watches a shared link on a phone |
| 6 | Story and Library | A creator makes a 60 s illustrated story with two consistent characters, scenery, music, and Hindi narration |
| 7 | Audio and formats | A creator exports the same project as 9:16, 16:9, and 1:1, and an audio-only MP3 with an audiogram MP4 |
| 8 | Publish | A creator posts a video to YouTube Shorts now and schedules one to Instagram, and the post links back |
| 9 | Cartoon and Montage | Two original characters hold a 30 s dialogue with lip sync; a folder of photos plus a song becomes a beat-cut reel |
| 10 | Later | AI clips, a talking persona, a Launch film from the creator's own screenshots, public signup, teams, and billing. Not scheduled |

### 8.1 Layer 0 spikes

Each spike writes `spikes/<name>/REPORT.md` with: what was tried, timings on the M2 8 GB, a sample output, a 1–5 quality score by the human, pass or fail, and the decision it locks.

| Spike | Question | Pass |
|---|---|---|
| S1 Render | Can a scene-graph JSON compile to a HyperFrames composition and render a 45 s 1080×1920 MP4 with word-highlight captions? | Renders in under 3 min. Lint has 0 errors. Captions within ±150 ms of speech |
| S2 Voice + timing | Kokoro (local) English voices plus local ASR alignment; one Indian-accent and one Hindi provider on their free tier | At least one voice the human rates ≥ 4/5 for English and one for Hindi. Word timings for 100% of words |
| S3 Code trace | Pyodide in a Web Worker traces `binary_search` and `fib(4)` into steps; visualisers render them | Trace JSON validates; the recursion tree matches the real call order |
| S4 Planner | A free LLM fills the plan schema for 5 topics with ≤ 1 repair | 5/5 valid; human rates 4/5 topics as usable storyboards |

Layer 0 is done when those four reports exist. S1's sample is an MP4. S2's is audio with word timings. S3's is a trace JSON. S4's is five plans. None of the other spikes has to render video.

Layers 6 and 9 add their own spikes before they start:

| Spike | Question | Pass |
|---|---|---|
| S5 Story stills | Free image generation makes 4 scenes with one recurring character and one style; Ken Burns + parallax look good | Human can tell it is the same character in 3 of 4. Runs with layer 6, not with layer 0 |
| S6 Puppet lip sync | A rigged original character mouths a line from its audio | The mouth shapes track the line. Layer 9 |
| S7 Montage port | The Reel Studio beat-cut path renders one photo-and-song reel inside this pipeline | Beat grid matches the song. Layer 9 |

## 9. User journeys

### J1 — Aryan makes a DSA reel before class

He opens the studio, clicks **Code Lab**, pastes his recursive `fib(n)` in Python, sets `n = 4`, and presses **Trace**. The trace runs in his browser and shows 9 calls. He types the audience ("college students, first DSA course") and presses **Plan storyboard**. Seven scene cards appear: a hook, the code, the first call, the tree growing, repeated work highlighted in orange, the memo fix, and a takeaway. He edits one line of narration inline, tells the Copilot "say Fibonacci, not fib", and approves. Lattu spins through Narrating → Timing → Rendering → Checking. Two minutes later he watches it, asks "slow down the tree part", gets version 2 in 90 seconds without new narration, and downloads it.

### J2 — A calm science explainer

"How do planets orbit the sun, for 12-year-olds." The planner picks `scene.space`, `diagram.orbit`, and labels. The planets move on smooth elliptical paths. "Gravity pulls" appears as the narrator says it. Captions highlight word by word. He changes the voice to a female Indian English voice; the video re-narrates and re-times, and the old version stays in history.

### J3 — A Hindi story with a cast

In Library → Characters, he creates "Chotu" (a curious boy, cartoon style) and "Dadi" (grandmother). In Story mode he writes "Dadi tells Chotu why the moon changes shape." The planner writes Hindi narration and dialogue, places both characters in a village scenery at night, and uses AI stills for two wide shots in the same style. Music: a calm flute bed at −20 dB under the voice. He exports 9:16 for Reels and 16:9 for YouTube.

### J4 — A viewer on a phone

Aryan copies the share link into WhatsApp. His friend opens `/v/…` on a phone, the video plays inline with sound after a tap, and the page shows nothing else about Aryan's studio.

### J5 — Free quota runs out mid-week

The image provider's daily free limit is used up. The Story job pauses at "Waiting for image quota (resets 05:30 IST)", and the studio home meter shows it in red. Aryan can switch that scene to a library scenery instead, or wait. Nothing fails silently.

### J6 — Interrupted render

He closes the laptop during a render (layer 5, hosted worker). When he comes back the project shows the finished video, or a failed stage with **Retry stage**, which reuses the narration already made.

## 10. Functional requirements

### Layer 1 — Shell and studio

**FR-1.1 Invite-only accounts.** The Owner invites an email from Settings. The invitee opens `/join/{token}`, sets a name and password (10–128 characters, not on the common-password list), and lands in an empty studio. Sign-in, sign-out, and password reset by email.
**AC:** An uninvited email cannot create an account. A wrong password and an unknown email get the same message. A reset link works once, ends every session, and the person signs in again.

**FR-1.2 Studio home.** A bento grid of the creator's projects with title, mode chip, format, length, last update, thumbnail, and a state badge (Draft, Planning, Ready to approve, Rendering, Ready, Failed). Hovering a card with a video plays a muted preview. Filters: All, Drafts, Ready, Failed, and by mode. Search by title. A "What shall we make?" bar takes a sentence and a mode chip and creates the project in one step.
**AC:** An empty studio shows two example prompts: one Explainer, one Code Lab. Another creator's projects never appear.

**FR-1.3 Project CRUD.** Create (from New project or the bar), rename inline, duplicate, delete with confirmation. Delete removes the project's drafts, storyboards, videos, messages, traces, and share links, cancels its jobs, and enqueues a cleanup job for the files.
**AC:** After delete, the project's share link returns the viewer's "video not available" page. The row delete is not rolled back if storage is slow: files leave through the cleanup job, which retries, and an asset stays `deleting` until the bytes are gone.

**FR-1.4 Settings skeleton.** Account (name, password), preferences (default mode, format, voice, language, UI sound on/off, reduced motion), and an Owner-only Invites panel.

**FR-1.5 Command palette.** ⌘K / Ctrl+K opens a palette: projects by title, "New Explainer", "New Code Lab", Library tabs, Settings, Sign out.

### Layer 2 — Explainer end to end

**FR-2.1 New project.** Choose mode, format (9:16 default), target length (15, 30, 45, 60, 90, 120, or 180 s; default 60), language (English in layer 2), voice (with ▶ sample), and style (3 at launch). Last choices are remembered.
**AC:** Choices are saved on the project and shown in its header.

**FR-2.2 Idea step.** Topic (required, ≤ 2,000 characters), audience (optional), notes (optional, ≤ 20,000 characters), and "must include" bullets (optional). **Brainstorm** returns 3–5 angles (title, hook, takeaway); clicking one fills the topic. Notes are content, never instructions: "ignore previous rules" inside notes has no effect.
**AC:** "science" alone gets a narrowing question or angles, not a sprawling plan. The draft autosaves within 1 s of typing stopping, with Saving / Saved / Not saved shown.

**FR-2.3 Plan storyboard.** **Plan storyboard** starts a `plan` job. The planner receives the mode's component catalog (ids, prop schemas, one-line purpose each), the style, the target length, and the idea. It returns a plan. The server validates schema, component ids, props, unique ids, and that every event's phrase is found in its line. One automatic repair attempt on failure, then the job fails with the validation messages in plain words.
**AC:** For the 5 S4 topics, ≥ 4 plans validate with no repair. A plan never references a component outside the mode's catalog.

**FR-2.4 Storyboard step.** A horizontal filmstrip (vertical list on phones) of scene cards. Each card: number, purpose, narration lines (editable inline), spoken-form toggles, a **live preview** of the scene (the compiled scene played in the browser with estimated timing, labelled "preview timing"), estimated seconds, and a component list. Drag to reorder. Add, duplicate, or delete a scene. Total estimated length vs target is shown as a bar.
**AC:** Editing text marks the draft unsaved, then saved. Reordering keeps each scene's id. The preview plays the same components the render will use.

**FR-2.5 Approve and render.** **Approve & make video** flushes the draft, freezes it into a Storyboard with a SHA-256 hash, and starts a `render` job with an idempotency key. Double clicks start one job.
**AC:** Editing the draft while rendering does not change the running job.

**FR-2.6 Narration.** Per scene, synthesize speech for its lines with the project's voice, applying pronunciation substitutions first. Get word timings from the provider if it returns them, else align with local ASR against the known text. Cache by fingerprint (provider, model, voice, settings, spoken text). Validate: non-empty, decodable, duration within 0.5×–2× of the estimate, timings monotonic and inside the clip.
**AC:** Every word of the narration has a start and end time. A failed scene shows which line failed.

**FR-2.7 Timeline compile.** Place scenes back to back from measured audio plus a small designed hold (0–600 ms; final scene up to 1.2 s). Resolve each event's phrase to a time. Build word-level caption pages (≤ 2 lines, ≤ 42 characters per line on 9:16). Total length may differ from the target; if it is outside ±25% the job finishes with a warning, not a failure.
**AC:** Events fire within 1 frame of their phrase's first word start plus offset.

**FR-2.8 Render.** The worker compiles the timeline into a HyperFrames composition from trusted templates, lints it (0 errors), renders 1080×1920 (or the format's size) at 30 fps, H.264 + AAC, loudness-normalised to −14 LUFS, and runs QA: duration, streams, dimensions, a frame sheet, and caption bounds inside the safe zone.
**AC:** Ready only after QA passes. Failure keeps the previous video as current.

**FR-2.9 Video step.** Stages shown while running: Narrating, Timing, Building scenes, Rendering (real percent from the renderer if available), Checking. When ready: player, scene strip under it (click to jump), captions toggle, safe-zone overlay toggle, download MP4 and SRT, version list.
**AC:** Leaving and returning to the page resumes the progress view from the server, not a new job.

### Layer 3 — Code Lab

**FR-3.1 Code input.** A code editor (Python and JavaScript in layer 3), a function picker, input fields, and **Trace**. Built-in examples: binary search, bubble sort, two pointers, recursion (`fib`, factorial), BFS on a small graph, linked-list reverse, a 1-D DP.
**AC:** Each built-in example traces and renders.

**FR-3.2 Sandboxed trace.** Python runs in Pyodide and JavaScript in a sandboxed interpreter, both inside a Web Worker with no network, a 5 s wall clock, and a 2,000-step cap. The trace records per step: line, event (call, line, return, exception), call stack frames with locals (primitives, lists up to 64 items, dicts up to 32 keys, linked nodes by id), and stdout.
**AC:** An infinite loop stops at the cap with a clear message. `import os` or a network call fails inside the sandbox and is shown, not hidden.

**FR-3.3 Bindings.** The planner sees a summary of the trace (variables, their types and shapes, call count, max depth), not the raw steps. It returns bindings: which variable is shown by which visualiser (`ds.array` for `arr` with pointers `lo`, `hi`, `mid`; `ds.recursion-tree` for calls of `fib`; `ds.call-stack`), and which trace steps each scene covers. The server validates that bindings name real variables and step ranges.
**AC:** The video's visual state at any frame equals the trace state at the bound step. Nothing visual is invented by the model.

**FR-3.4 Step cues.** Each trace step shown in a scene is cued to a narration phrase or spread evenly between two phrases. Code lines highlight in the code window in step with the visual.

### Layer 4 — Revise and version

**FR-4.1 Copilot dock.** A right panel on the Project page. Collapses to a 40 px edge tab; ⌘. toggles it; its width and open state are remembered. Messages are stored per project. The creator can attach a scene ("@scene 3") to scope a request.

**FR-4.2 Revisions.** A request becomes a `revise` job that returns a candidate plan plus a one-line summary and the changed scene ids. The server diffs the candidate against the source and classifies the change as one of `visual`, `captions`, `narration`, `order`, `voice`, `format`, `structure`. Changed `spoken`, `speaker`, or `tone` is `narration`. Changed `text` only is `captions`. The candidate appears as a diff on the storyboard (changed cards glow). **Keep** applies it to the draft; **Discard** drops it.
**AC:** "Make scene 3's labels bigger" changes only scene 3's props, and the next render reuses all narration.

**FR-4.3 Invalidation.**

| Change | Reuse | Redo |
|---|---|---|
| Visual props, style, camera | All narration and timings | Compile and render |
| Caption display text | Narration and timings | Captions and render |
| Narration of one scene | Other scenes' audio | That scene's audio and timing, global re-time, render |
| Scene order | All scene audio | Global re-time and render |
| Voice | Text | All audio and timing, render |
| Format | All audio and timing | Layout and render |
| Structure (a scene or a component added or removed, with no new spoken words) | Audio for scenes whose words did not change | Compile and render. New spoken words are `narration` instead |

**FR-4.4 Versions.** Every render is a version with its storyboard, time, length, and thumbnail. **Restore** makes a new draft from that version's storyboard. Nothing is deleted except by deleting the project, or a single version by the creator.

**FR-4.5 Scene regenerate.** "Regenerate this scene" re-plans one scene with the rest as context.

### Layer 5 — Share and deploy

**FR-5.1 Share link.** **Share** on a ready video creates a random 32-byte token link. **Stop sharing** revokes it. The viewer page shows the title, the player, and "Made with Leela". Optional: allow download.
**AC:** A revoked or unknown token shows the same "not available" page.

**FR-5.2 Hosted studio.** The web app runs at a public URL. A render worker (separate process) claims jobs from the database, so renders continue with no browser open.

**FR-5.3 Quotas.** Settings → Providers lists each provider, its daily or monthly free limit, today's use, and when it resets. The studio home shows meters for the ones near their limit. The Owner sees app-wide numbers.

### Layer 6 — Story and Library

**FR-6.1 Library → Characters.** Create a character: name, description, style (flat, cartoon, storybook, clay), reference images (generated or uploaded), default voice, and expressions (neutral, happy, sad, surprised, talking). Generated art uses a fixed style prompt and seed per character for consistency.
**FR-6.2 Library → Assets.** System library (scenery, props, icons, music, SFX) and the creator's uploads and generations, with search, tags, licence badge, and "use in project".
**FR-6.3 Story mode.** The planner may use scenery, characters, props, AI stills, camera moves (Ken Burns, parallax, pan, push-in), dialogue lines with a speaker, and a music bed with ducking.
**FR-6.4 Hindi and Hinglish.** Narration and captions in Hindi (Devanagari) and Hinglish (Roman script), with voices that pass spike S2.
**AC (layer):** J3 can be completed.

### Layer 7 — Audio and formats

**FR-7.1 Audio mode.** Output MP3 or WAV of narration plus music, with chapter marks, and an optional audiogram MP4 (waveform, title, captions).
**FR-7.2 Formats.** Every project can render 9:16, 16:9, and 1:1. Layout components adapt by format; the safe-zone overlay shows each platform's zones.

### Layer 8 — Publish

**FR-8.1 Connections.** Connect YouTube (OAuth, `youtube.upload`) and Instagram (Instagram Login, professional accounts) in Settings. Tokens are encrypted at rest.
**FR-8.2 Post now and schedule.** From Share: pick a connection, edit title, caption, and hashtags, then post now or pick a date, time, and timezone (default Asia/Kolkata). The frozen intent stores the exact video, caption, and destination. A timeout after submission marks "checking" and never reposts blindly.

### Layer 9 — Cartoon and Montage

**FR-9.1 Puppets.** Characters can have a rig: SVG parts with named mouth shapes. Lip sync comes from audio analysis of each line. Dialogue scenes alternate speakers with different voices.
**FR-9.2 Montage.** Upload photos and clips plus a song; the Reel Studio engine (beat grid, face-aware crops, HDR tone-map) produces a beat-cut reel with text moments.

## 11. Domain requirements

| Requirement | Page |
|---|---|
| Spoken form vs shown form for code, maths, acronyms, rupees (`₹1.5L` read "one point five lakh rupees") | Storyboard card |
| Pronunciation list per project and per creator ("Dijkstra", "Kadane", "Bengaluru") | Copilot, Settings → Preferences |
| Indian examples when they help (chai, cricket, UPI, trains) and never forced | Planner prompt |
| Instagram and YouTube safe zones (Reels: keep text out of the top ~250 px and bottom ~340 px at 1080×1920) | Video preview overlay, compiler |
| Hinglish captions in Roman script; Hindi captions in Devanagari with a font that renders conjuncts | Captions, styles |
| AI disclosure line in the suggested post caption. The client builds that caption from the title plus this line; it is not a stored field | Share |
| "Commercial-safe" badge only when every asset licence allows commercial use | Share |

## 12. Non-functional

| Area | Requirement |
|---|---|
| Devices | Studio: desktop first (≥ 1280 px), usable on a tablet; Share page and review on a 390 px phone with no horizontal overflow |
| Locale, time | Times shown in the creator's timezone (default Asia/Kolkata); stored UTC |
| Auth | Session cookie (HttpOnly, Secure, SameSite=Lax), token stored as an HMAC-SHA256 hash, bcrypt cost 12 for passwords |
| Isolation | Every query includes `ownerId` from the session |
| Privacy | Notes and scripts are sent to the LLM provider. Settings shows which providers see content, and whether the free tier trains on it. A project marked **Keep private** (New project and project header) never uses a provider that trains on free-tier input |
| Performance | Studio pages interactive < 2 s on broadband. A 60 s Explainer render ≤ 4 min on the M2 8 GB worker |
| Determinism | The same storyboard, render spec, and assets give the same video. No network or randomness at render time; fonts and libraries are local |
| Accessibility | WCAG AA text contrast, including on glass panels; keyboard reachable; `prefers-reduced-motion` and `prefers-reduced-transparency` respected; UI sounds off by default |
| Scale posture | One to ten creators, hundreds of videos. One worker. No queue service until a measured need |

## 13. Permissions matrix

| Action | Creator (own) | Creator (other's) | Owner | Viewer |
|---|---|---|---|---|
| Read, edit, render, delete a project | ✓ | 404 | own only | — |
| Create and use characters and uploads | ✓ | 404 | own only | — |
| Use the system library | ✓ | ✓ | ✓ | — |
| Share and unshare a video | ✓ | 404 | own only | — |
| Watch a shared video | ✓ | ✓ | ✓ | ✓ |
| Invite emails, see app-wide quotas | — | — | ✓ | — |

## 14. Edge cases

| Situation | Behaviour |
|---|---|
| Planner returns invalid JSON or an unknown component | One repair attempt with the errors, then a failed job with readable reasons; the draft is untouched |
| Phrase in an event not found in its line | Validation error naming the scene and phrase; repair or ask |
| Topic too broad ("science") | Brainstorm angles or one narrowing question |
| Notes contain instructions | Treated as text; system rules win |
| TTS mispronounces a word | Copilot "pronounce X as Y" adds a substitution and re-narrates that scene only |
| TTS returns empty or truncated audio | Retry once; then fail that scene with **Retry** |
| ASR cannot align a word | Interpolate between neighbours only inside one line, and flag the scene; never invent a whole line's timing |
| Video longer than target ±25% | Ready with a warning and a "Make it shorter" suggestion |
| Free quota exhausted | Job waits with the reset time, or uses the configured fallback and says so |
| Render worker crashes | Lease expires, job retries from the last finished stage; after 3 attempts it fails with Retry |
| Double click on Approve | Same job returned (idempotency key) |
| Edit during render | Saved to the draft; the render keeps its frozen input |
| Two tabs edit one draft | `expectedRevision` conflict; the second tab shows Reload or Keep mine |
| Code Lab infinite loop or huge data | Step cap and size caps; truncated structures are marked "…" |
| Code uses unsupported features (threads, files) | Sandbox error shown; suggest a simpler snippet |
| A request for Pokémon, Motu Patlu, a celebrity | Copilot declines that part and offers an original character |
| A shared video's project is deleted | Share page shows "not available" |
| Asset licence unknown | Usable; export shows "not commercial-safe" with the asset named |

## 15. Success criteria

**Product-level (layers 0–5 complete):**
- 10 videos Aryan would post: 4 Explainer, 4 Code Lab, 2 of his choice. Each needed ≤ 2 revision rounds.
- Median hands-on time ≤ 10 minutes per video.
- ≥ 95% of approved storyboards render without manual fixes.
- Zero cross-creator data access in the e2e suite.
- ₹0 spent on providers.

**Layer 0:** Four spike reports (S1–S4) with decisions recorded in ARCHITECTURE.md.

**Layer 1:** The e2e journey signs up two invited creators and proves isolation.

**Later metrics (not in the UI):** videos per week, revision rounds per video, render time p50/p95, quota exhaustion events.

## 16. Decisions already locked

1. Name **Leela** (working), mascot **Lattu**. Rename is cheap until layer 5.
2. Modes and layer order as in PRODUCT.md. Explainer and Code Lab first.
3. Scene graph + component registry; AI output is data only.
4. HyperFrames as the renderer, compiled from trusted templates; Remotion is the fallback if spike S1 fails (ARCHITECTURE §4).
5. Code traces run in the browser sandbox only.
6. Invite-only accounts with our own auth, MongoDB Atlas, a MongoDB-backed job queue, and a separate render worker process.
7. Download and share links before social publishing.
8. No copyrighted characters, no real-person likeness, no voice cloning.
9. UI direction from DESIGN.md: playful, one base surface style plus glass for floating panels only.

**Open product questions** (none block layer 0 or layer 1; listed in `docs/journey/2026-10-19-questions.md`):
- Q1: Keep the name Leela? (blocks layer 5 deploy domain only)
- Q2: Is Hindi narration needed in layer 2 or can it wait for layer 6? (default: layer 6)
- Q3: YouTube or Instagram first in layer 8? (default: YouTube, because its API needs no app review for your own channel)
- Q4: Will anyone besides you use it in the next 3 months? (default: no; invite-only stays)

## Done when

- [x] Every page in PRODUCT.md appears here, and no new page appears
- [x] Every layer has a one-sentence done-when and at least one FR with an AC
- [x] Every object in §7 is used by a journey or an FR
- [x] Non-goals are explicit
- [x] Permissions match the "who can do what" table in PRODUCT.md
