# Leela — system architecture

**Product:** Leela
**Version:** 1.0
**Status:** Draft for review. Provider picks are provisional until the layer 0 spikes pass (§23)
**Date:** 2026-10-19
**Audience:** Anyone implementing a layer

System design. It does not add pages, roles, or features. Requirements stay in the PRD.

| Artifact | Job |
|---|---|
| PRODUCT.md | Vision, page map, modes, layers |
| PRD.md | Requirements and acceptance |
| DATABASE.md | Collections, indexes, integrity |
| API.md | HTTP contract |
| DESIGN.md | Studio UI and video styles |
| RESEARCH.md | Tool and free-tier facts with sources and dates |
| This file | Processes, boundaries, the scene graph, providers, how a job moves |

## 1. Purpose

This file decides how Leela runs: the processes, the pipeline from idea to MP4, the scene graph contract between the AI and the renderer, the provider adapters and quota router, storage, and how failure is contained. Field names and routes live in DATABASE.md and API.md.

## 2. Goals

- **One person can run it.** One Next.js app, one worker process, one database, one object store. No queue service, no microservices.
- **₹0 until we choose to pay.** Every external call goes through an adapter with a free-tier config and a quota meter. Local models where the Mac can run them.
- **Deterministic renders.** Same storyboard + render spec + assets → same video. The renderer never calls a network or a model.
- **Failure stays inside one provider.** A dead LLM, voice, or image API pauses that stage; it never corrupts a version or loses the last good video.
- **The AI is a planner, not a programmer.** Models output data that names trusted components.

## 3. Principles

1. The server decides who the caller is. `ownerId` comes from the session; every query includes it.
2. Route handlers stay thin: parse → authenticate → validate → service → map. Rules live in services.
3. Validation at the boundary (Zod) and schema at the database (Mongoose) are different checks; we keep both.
4. **Model output is untrusted input.** It is validated, then compiled by trusted templates. It is never executed, injected as raw HTML, or used as a URL or path.
5. **Facts and times come from code.** Traces compute data-structure states; measured audio computes times; the creator supplies chart numbers.
6. **Immutable inputs for jobs.** A job reads a frozen storyboard and render spec, never the live draft.
7. **The last good video stays current** until a new one passes QA.
8. **Adapters, not SDK calls, in services.** Changing a provider is a config change plus, at most, one new adapter file.
9. **Local first.** Layers 0–4 run entirely on the M2 Mac. Hosting arrives in layer 5 without changing the pipeline.

## 4. Stack

| Concern | Choice | Why this, for this product |
|---|---|---|
| App | **Next.js 16** (App Router), React 19, TypeScript, Node 22 | Same stack as The Wedding Home; one deployable for pages and API |
| Validation | **Zod 4** | Same schemas validate HTTP bodies, plans, traces, and model output; JSON Schema for providers is generated from them |
| Database | **MongoDB Atlas M0** + **Mongoose 8** | Free, already set up for The Wedding Home, plans are documents |
| Jobs | **MongoDB job collection + a worker process** (`npm run worker`) | Free and vendor-free. Rendering needs Chrome + FFmpeg on a real machine anyway, so a long-running worker is required. Leases and a unique active slot give the guarantees (§10) |
| Renderer | **HyperFrames** (`@hyperframes/producer`, Apache-2.0), called as a library from the worker | Apache-2.0, no per-render or per-seat fee; HTML + GSAP is the easiest compile target; Lottie and Three.js adapters; already proven on this Mac (Reel Studio: ~1.6 s compute per video second in draft); local TTS and transcription built in; Lambda and Cloud Run paths for later |
| In-browser preview | **`@hyperframes/player`** web component | Preview and render use the same compiled HTML |
| Renderer fallback | Remotion 4 | Only if spike S1 fails. It is free for ≤ 3 people, but prompt-to-video apps fall under its paid "Automators" tier ($0.01/render, $100/month minimum) |
| Code tracing | **Pyodide** (Python, MPL-2.0) first; **QuickJS** (`quickjs-emscripten`, MIT) or JS-Interpreter (Apache-2.0) second; both in a browser Web Worker | The server never runs user code (§8). Aryan's DSA code is mostly Python |
| Planning LLM | **Groq `openai/gpt-oss-120b`** with `strict: true` structured output (primary) | Constrained decoding gives schema-valid JSON; Groq states no retention by default |
| LLM fallbacks | Gemini Flash (`gemini-3.8-flash`, response schema) → Cloudflare Workers AI (`gpt-oss-120b`) → OpenRouter `:free` | Gemini's free tier **trains on inputs**: fine for public teaching content, shown in Settings, never used for notes marked private |
| English voice | **Kokoro-82M** (Apache-2.0), local | Free, unlimited, commercial OK, native word timestamps for American and British English |
| Indian English and Hindi voice | **Azure Speech F0** (0.5 M chars/month, `en-IN` and `hi-IN` neural voices, `WordBoundary` timings) → **Sarvam Bulbul** (11 Indian languages, commercial OK on free credits, no timestamps) | Decided by spike S2. Kokoro's Hindi voices are graded C |
| Word alignment | Provider timings when present; otherwise forced alignment against the known script: **WhisperX** (wav2vec2, has a Hindi model, CPU) or `hyperframes transcribe` (Parakeet / whisper.cpp) | We know the script, so this is matching, not guessing |
| Lip sync (layer 9) | **Rhubarb Lip Sync** (MIT) | Mouth shapes from any audio; English recogniser plus a phonetic one for Hindi |
| Images (layer 6) | **Cloudflare Workers AI FLUX.1 schnell** (10,000 neurons/day free; our estimate ≈ 170 images/day at 1024²) → **FLUX.2 klein 4B** for multi-reference character consistency | Apache-2.0 weights, Cloudflare does not train on customer content |
| Music and SFX (layer 6) | A curated **system library** in the repo: CC0 and CC-BY tracks (Incompetech with credit), Stable Audio Open SFX (free under $1 M revenue) | The Freesound API and MusicGen weights are non-commercial; avoided |
| Illustrations and icons | **Open Peeps, Humaaans** (CC0), **Kenney** (CC0), **IRA Design** (MIT), **Lucide/Tabler/Phosphor** (ISC/MIT), **Noto Emoji** (OFL/Apache), Google Fonts (OFL) | Commercial-safe for automated use. **Not** unDraw, DrawKit, Blush, Storyset (terms restrict apps and automation) |
| File storage | Local disk (`.data/storage`) in layers 0–4; **Cloudflare R2** (10 GB, free egress) from layer 5; Vercel Blob as fallback | Bytes never in MongoDB |
| Email | **Resend** with the verified `aryanjaiswal.in` domain | Already working in The Wedding Home |
| Studio UI | Tailwind v4, shadcn/ui (Base UI), Motion, react-resizable-panels, cmdk, sonner, @dnd-kit/react, CodeMirror 6 | DESIGN.md §1.7 |
| Host (layer 5) | Web on **Vercel Hobby** while personal; worker on this Mac or an **Oracle Always Free A1** VM (2 OCPU / 12 GB ARM) in Docker | Vercel Hobby is non-commercial only: move to Vercel Pro or Cloudflare before charging anyone (§18) |
| Tests | Vitest (unit), Playwright (e2e journey), golden-frame checks with `hyperframes snapshot` | |

Versions are pinned in `package.json` at scaffold time. Model ids live in `src/config/providers.ts` and are checked with each provider's model-list call at worker start.

## 5. Context

```
                    ┌──────────────────────── Browser ─────────────────────────┐
                    │  Studio UI  ·  <hyperframes-player> preview (iframe)     │
                    │  Code Lab Web Worker: Pyodide / QuickJS  (user code runs │
                    │  ONLY here)                                              │
                    └───────────────┬──────────────────────────────────────────┘
                                    │ HTTPS, cookie
                    ┌───────────────▼──────────────────┐
                    │  Next.js app (web)               │──── Resend (mail)        [server-only]
                    │  pages · /api route handlers     │
                    │  services · preview compiler     │
                    └──────┬─────────────────┬─────────┘
                           │                 │
                 ┌─────────▼───────┐   ┌─────▼───────────────┐
                 │ MongoDB Atlas   │   │ Object storage       │
                 │ (jobs = queue)  │   │ local disk → R2      │
                 └─────────▲───────┘   └─────▲───────────────┘
                           │ claim / lease   │ put / get
                 ┌─────────┴─────────────────┴─────────┐
                 │  Worker process (Node 22)            │──── LLM: Groq / Gemini / Workers AI / OpenRouter
                 │  job handlers · provider router      │──── Voice: Azure / Sarvam            [server-only]
                 │  Kokoro + aligner (local Python)     │──── Images: Workers AI FLUX
                 │  compiler · HyperFrames producer     │
                 │  (Chrome headless + FFmpeg)          │
                 └──────────────────────────────────────┘
```

Every provider call is server-only (worker, or web for mail). The browser never holds a provider key. The worker makes only outbound connections, so it can run on a home Mac behind NAT.

## 6. The scene graph contract

The plan is the one contract between the AI, the creator's edits, the preview, and the renderer. Zod schemas in `src/contracts/plan.ts`; JSON Schema for providers is generated from them per mode (only that mode's components).

### 6.1 Plan

```ts
type Plan = {
  schemaVersion: 1;
  mode: "explainer" | "code_lab" | "story" | "audio" | "cartoon" | "montage";
  title: string;                 // ≤ 120
  logline: string;               // ≤ 280, the one-sentence takeaway
  audience?: string;             // ≤ 200
  language: "en" | "hi" | "hinglish";
  format: "9x16" | "16x9" | "1x1";
  targetMs: number;
  styleId: string;               // catalog, e.g. "neon-lab@1"
  voiceId: string;               // narrator voice, catalog
  cast?: { id: string; characterId: string; voiceId?: string }[];   // story, cartoon
  music?: { ref: AssetRef; gainDb: number /* -30..-12 */; duck: boolean };
  traceId?: string;              // code_lab
  scenes: Scene[];               // 1..40
  warnings?: string[];           // planner's honest notes ("simplified: assumes sorted input")
};

type Scene = {
  id: string;                    // "s1".."s40", stable across edits and reorders
  purpose: "hook" | "setup" | "explain" | "example" | "step" | "compare"
         | "recap" | "cta" | "story_beat" | "dialogue";
  lines: Line[];                 // 1..8
  background: { kind: "style" } | { kind: "color"; token: string }
            | { kind: "scenery"; ref: AssetRef } | { kind: "image"; ref: AssetRef };
  layers: Layer[];               // 0..16
  events: Event[];               // 0..40
  camera?: { move: "none" | "push_in" | "pull_out" | "pan_left" | "pan_right"
                 | "ken_burns" | "parallax"; target?: string; strength: "subtle" | "medium" };
  transition?: "cut" | "fade" | "slide" | "wipe" | "zoom";   // into the next scene
  holdMs?: number;               // 0..600; only the final scene may use up to 1200 (PRD FR-2.7)
  traceRange?: { from: number; to: number };                 // code_lab: trace steps shown
  sfx?: { ref: AssetRef; cue: Cue }[];                       // ≤ 4
};

type Line = {
  id: string;                    // "l1".. unique in the scene
  speaker?: string;              // "narrator" (default) or a cast id
  text: string;                  // ≤ 600, shown in captions
  spoken?: string;               // ≤ 800, what the voice says if different ("O of n log n")
  tone?: "neutral" | "calm" | "cheerful" | "excited" | "serious" | "whisper";
};

type Layer = {
  id: string;                    // unique in the scene
  component: string;             // "ds.array@1": must exist in the mode's catalog
  props: unknown;                // validated by that component's schema
  slot?: "full" | "center" | "top" | "bottom" | "left" | "right"
       | "top_left" | "top_right" | "bottom_left" | "bottom_right";
  enter?: { anim: string; cue?: Cue };   // registry animations: "fade", "pop", "draw", "slide_up", …
  exit?: { anim: string; cue?: Cue };
};

type Event = {
  id: string;
  target: string;                // a layer id in this scene
  action: string;                // declared by the target component: "reveal", "highlight", "step", "grow", …
  args?: unknown;                // validated by the action's schema
  cue: Cue;
  offsetMs?: number;             // -500..1500
};

type Cue =
  | { lineId: string; phrase: string; occurrence?: number }  // fires at the first word of the phrase
  | { lineId: string; at: "start" | "end" };

type AssetRef = `lib:${string}` | `asset:${string}`;          // system library id or owner asset id. Never a URL
```

**Validation** (`validatePlan`) runs on every draft save, on every model output, and at approval:

1. Zod shape and limits.
2. Every `component` exists in the catalog for `plan.mode`, and its `props` pass that component's schema.
3. Every event's `action` is declared by its target's component, with valid `args`.
4. Every cue's `lineId` exists in the scene; its `phrase` occurs (case- and punctuation-insensitive, token-matched) at least `occurrence` times in the line's `spoken ?? text`.
5. Every `AssetRef` resolves: `lib:` in the library manifest, `asset:` owned by this creator and `ready`.
6. Ids are unique in their scope; scene ids are unique in the plan.
7. Code Lab: every `traceRange` and every trace binding (component props of the form `{ trace: { var, frame? } }`) names a real variable and an in-range step of `traceId`.
8. Text fits: each component declares max characters per text prop for each format; over-long text is an issue, not a silent crop.

Invalid plans are saved as drafts with `issues`; only valid plans can be approved.

### 6.2 Component registry

`src/catalog/components/<id>/` holds one trusted component:

```ts
type ComponentDef<P> = {
  id: string; version: number;
  modes: Mode[]; formats: Format[];
  purpose: string;                       // one line the planner reads
  props: z.ZodType<P>;                   // also exported to JSON Schema for the planner
  actions: Record<string, z.ZodType>;    // "step": { to: number } …
  textLimits: Record<string, Record<Format, number>>;
  html(props: P, ctx: RenderCtx): string;          // escaped markup from a template
  timeline(props: P, events: ResolvedEvent[], ctx: RenderCtx): TweenSpec[]; // data, turned into GSAP by the compiler
  minDurationMs?(props: P): number;
};
```

The planner prompt contains, for its mode only: id, purpose, a compact props schema, actions, and one example. Adding a component never changes old storyboards: they keep `@version`.

**Launch catalog** (layers 2–3, plus the later rows marked below; more are added as data, not as new pages):

| Group | Components |
|---|---|
| Text | `text.title`, `text.kicker`, `text.bullets`, `text.callout`, `text.quote`, `text.handwritten`, `text.stat` (creator-supplied numbers only), `text.slam` (one giant word, lands on its cue), `text.kinetic` (each word on its spoken frame) |
| Diagrams | `diagram.flow`, `diagram.cycle`, `diagram.compare`, `diagram.timeline`, `diagram.labeled`, `diagram.tree`, `diagram.network` (nodes, links, moving packets), `diagram.orbit` (bodies on elliptical paths, speed from Kepler's second law), `diagram.chart` (bar, line, pie from supplied data), `diagram.venn` |
| Objects | `obj.icon` (library icons), `obj.illustration` (library art: people, laptop, desk, school, planets…), `obj.device` (phone, laptop, server frames with content), `obj.emoji` (Noto), `obj.math` (KaTeX) |
| Scenery | `scene.backdrop` (layered library scenery with parallax: classroom, office with laptop, space, village night, city street, kitchen, park) |
| Code Lab | `code.window` (lines, current-line highlight, typing), `code.terminal`, `ds.array` (with pointers), `ds.variables`, `ds.call-stack`, `ds.recursion-tree`, `ds.linked-list`, `ds.stack`, `ds.queue`, `ds.hashmap`, `ds.grid` (matrix and DP table), `ds.graph` (BFS/DFS frontier and visited) |
| Story (layer 6) | `char.figure` (character art, expression, pose, position, speaking glow), `media.image` (AI still or upload with camera move), `text.speech-bubble`, `fx.particles` (rain, stars, petals, confetti; seeded) |
| Cartoon (layer 9) | `char.puppet` (rigged SVG with mouth shapes) |
| Hits and chrome | `fx.hit` (a seeded whoosh, blip, stamp, or glitch on a cue; layer 2), `hud.chrome` (corner brackets, chapter, handle; layer 6, off unless the style asks) |

Captions are **not** a layer: the compiler always adds them from the style.

HyperFrames registry blocks (≈ 210 blocks, ≈ 238 components) are used **inside our component templates** when one fits (transitions, chart primitives, code windows, effects). Each one we vendor is pinned, licence-checked, and wrapped as a `ComponentDef`. The planner never names a registry block directly.

### 6.3 Styles, voices, catalog

`src/catalog/styles/<id>.ts`: palette tokens, fonts (local files), caption look (word highlight colour, outline, position band per format), motion temperament (durations, easing), background treatment, illustration filter. Launch: `chalk-and-chai@1`, `neon-lab@1`, `storybook@1` (DESIGN.md §2.2).

`src/catalog/voices.ts`: `{ id: "kokoro:af_heart", provider, providerVoice, language, accent, gender, label, rate, timings: "native"|"align", enabled }`. Only enabled voices that passed spike S2 appear in `/api/catalog`.

## 7. Modules and the request path

```text
HTTP → parse → authenticate (session → ownerId) → validate (Zod) → service → repository / storage / enqueue job → response
```

```text
src/
  app/                    routes, layouts, thin handlers only
    (marketing)/          landing
    (auth)/               sign-in, join, reset
    studio/               studio home, new, p/[id], library, settings
    v/[token]/            share page
    api/                  route handlers (API.md)
  components/             UI (ui/ primitives, studio/, storyboard/, player/, lattu/)
  contracts/              Zod: plan, trace, timeline, job payloads, API bodies
  catalog/                components/, styles/, voices.ts, modes.ts (what each mode may use)
  modules/                one folder per layer's feature, created when the layer starts
    auth/ projects/ drafts/ planning/ render/ codelab/ copilot/ share/ library/ publish/
  server/                 db (models, connection), http (route helper, errors), auth (sessions, bcrypt),
                          storage (adapters), mail, providers (llm, tts, align, image), quota
  compiler/               plan + timeline → HyperFrames project (shared by preview and worker)
  config/                 env parsing by subsystem, providers.ts (models, limits, order)
worker/
  index.ts                claim loop, lanes, heartbeat
  handlers/               plan, revise, scene_regen, brainstorm, render, image, cleanup, publish
  sidecars/               python: kokoro_tts.py, align.py (WhisperX), rhubarb wrapper
library/                  system assets + manifest.json (with licences)
spikes/                   layer 0 experiments and REPORT.md files
```

Rules: `src/app` holds routes and thin handlers. A module folder is created when its layer starts; no empty modules ahead of time. The compiler is pure (no I/O except reading asset files through a resolver) so preview and render share it.

## 8. Code Lab tracing

### 8.1 Where code runs

Only in the creator's browser, in a dedicated Web Worker:

- **Python:** Pyodide loaded from our own static path; tracer module `leela_tracer.py` uses `sys.settrace` (or `sys.monitoring` if the Pyodide CPython supports it; spike S3 checks) to record `call`, `line`, `return`, `exception`.
- **JavaScript (after Python):** QuickJS (`quickjs-emscripten`) with an interrupt handler, memory and stack limits, and source instrumentation for line events; or JS-Interpreter for strict line stepping.
- **Limits:** 2,000 steps (tracer stops cleanly), 5 s wall clock (**the page terminates the Worker**, so no SharedArrayBuffer or COOP/COEP headers are needed), recursion depth 200, list values captured up to 64 items, dicts up to 32 keys, strings up to 200 characters, total trace ≤ 3 MB. No network (`fetch` and `pyodide.http` removed in the worker), no file system beyond the in-memory FS.
- C++ and Java are out of v1. If they come, they run server-side in Piston inside gVisor, never on the web or worker host directly.

### 8.2 Trace format

```ts
type Trace = {
  version: 1; language: "python" | "javascript"; entry: string; input: unknown;
  steps: {
    i: number; line: number; event: "call" | "line" | "return" | "exception";
    frames: { id: number; fn: string; parentId?: number; locals: Record<string, Value> }[];
    ret?: Value; stdout?: string;
  }[];
  truncated: boolean;
};
type Value = { t: "int"|"float"|"str"|"bool"|"none" ; v: unknown }
           | { t: "list"|"tuple"; items: Value[]; more?: number }
           | { t: "dict"; entries: [Value, Value][]; more?: number }
           | { t: "node"; id: string; fields: Record<string, Value> }   // linked structures by id
           | { t: "ref"; id: string } | { t: "other"; repr: string };
```

The server validates it (schema, caps, monotonic `i`, frames consistent with calls and returns) and stores it as an asset. It recomputes the summary the planner sees: variables with kind and shape, call count, max depth, and which variables change.

### 8.3 From trace to video

1. The planner receives the summary, the code, and the Code Lab catalog. It returns scenes with `traceRange`s and layers bound to trace variables (`ds.array { trace: { var: "arr" }, pointers: [{ var: "lo" }, { var: "mid" }, { var: "hi" }] }`, `ds.recursion-tree { trace: { fn: "fib" } }`).
2. The compiler derives every visual state from the trace at each step. The model never writes a value.
3. Steps inside a scene are cued: each `step` event cues a phrase; un-cued steps spread evenly between the scene's cued points.
4. `code.window` highlights `steps[i].line` in time with the same steps.

## 9. Providers, caching, quotas

### 9.1 Adapters

```ts
interface LlmProvider   { generateJson(req: { system: string; messages: Msg[]; schema: JSONSchema; maxTokens: number }): Promise<{ json: unknown; usage: Usage; model: string }> }
interface TtsProvider   { synthesize(req: { text: string; voice: string; lang: string; rate?: number }): Promise<{ audio: Buffer; mime: string; words?: WordTiming[]; usage: Usage }> }
interface Aligner       { align(req: { audio: Buffer; text: string; lang: string }): Promise<WordTiming[]> }
interface ImageProvider { generate(req: { prompt: string; w: number; h: number; seed: number; refs?: Buffer[] }): Promise<{ png: Buffer; usage: Usage; model: string }> }
interface Storage       { put(key, bytes, mime); get(key); stream(key, range?); delete(key); signedGetUrl(key, ttlS) }
interface Mailer        { send(msg) }
```

Each adapter maps provider errors to `{ kind: "rate_limited" | "quota" | "auth" | "invalid" | "unavailable" | "policy", retryAfterMs? }`. Raw provider bodies are never stored or shown.

Higgsfield Seedance (`bytedance/seedance-2.5/text-to-video`) is an optional server-side example in `scripts/higgsfield/index.ts`, added 2026-10-20 because a cinematic clip was requested beside the studio. The studio pipeline does not call it. Leela still plans, narrates, and previews with the adapters above when `HF_CREDENTIALS` is absent. The key stays in `.env.local` and is never sent to the browser.

### 9.2 Fingerprints and reuse

| Artifact | Fingerprint (SHA-256 of canonical JSON) | Reuse scope |
|---|---|---|
| Line audio + word timings | provider, model, voice, rate, tone, spoken text after pronunciation substitution, language, aligner version | Same owner |
| Image | provider, model, prompt, seed, size, reference hashes | Same owner |
| Compiled scene | component versions, props, resolved timings, style version, format, compiler version | Within one render |
| Video | `storyboardId` + `renderSpecHash` | Same project |

Narration is synthesized **per line**, so editing one line re-voices one line. If spike S2 finds line joins sound choppy, we switch to per-scene synthesis (recorded as a decision).

### 9.3 Quota router

`src/config/providers.ts` lists, per capability, an ordered list of `{ provider, model, limits: { rpm?, rpd?, tpd?, charsPerMonth?, neuronsPerDay? }, resetTz, privacy: { seesContent, trainsOnFree }, commercialOk, enabled }`.

For each call the router:

1. Skips providers that are disabled, out of quota (from `usage`), or circuit-open (3 consecutive `unavailable` → open for 10 minutes).
2. Calls the first eligible one; records `usage` with `$inc`.
3. On `rate_limited`, retries the same provider after `retryAfterMs` (≤ 2 times), then moves on.
4. If none is eligible, the job goes to `waiting_quota` with `runAfter` = the earliest reset, and the UI shows which provider and when (PRD J5).

**Voices never fall back silently.** A project's voice is bound to one provider voice. If it is out of quota, the job waits; the creator can switch voice explicitly (which invalidates narration per the PRD table). LLM fallback is allowed and recorded on the storyboard (`plannerModel`) and in the Copilot ("planned with gpt-oss-120b on Groq").

Private notes: a project flagged "keep private" never uses a provider with `trainsOnFree: true`.

## 10. Jobs and the worker

- Web routes **enqueue** jobs (insert into `jobs`). The worker **claims** them with one `findOneAndUpdate` (state `queued`/`waiting_quota` with `runAfter ≤ now`, or `running` with an expired lease) that sets `state: running`, `lease: { workerId, until: now + 90 s }`, `attempts + 1`.
- A heartbeat renews the lease every 30 s. Every write that finishes a stage or the job includes `lease.workerId` in its filter, so a stale worker cannot overwrite a job that was re-claimed.
- **Lanes:** `cpu` (render, local TTS, alignment; concurrency 1 on the M2 8 GB) and `net` (LLM, remote TTS, images, mail; concurrency 3).
- **Stages are checkpoints.** Each stage writes its artifacts (assets) and marks itself done before the next starts. A retry skips done stages whose artifacts still verify (hash).
- Cancellation sets `cancelRequestedAt`; the handler checks it between stages and before committing results.
- After `maxAttempts` (3) with backoff (30 s, 2 min, 10 min) the job fails with a readable error and **Retry** available if `retryable`.
- One active content job per project is enforced by the unique partial index on `{ projectId, activeSlot }` (DATABASE §5.11).
- The worker never accepts HTTP. It needs `MONGODB_URI`, storage credentials, and provider keys; the web app needs only the keys it uses (mail, storage).

## 11. Pipeline stages

### 11.1 Brainstorm and plan

`plan` job: load draft idea (+ trace summary for Code Lab) → build the prompt from the mode's catalog, the style's constraints, the target length (≈ 2.4 words per second of target as the planner's narration budget), and safety rules (no protected characters, no invented data) → `LlmProvider.generateJson` with the generated JSON Schema → `validatePlan` → on failure, one repair call with the issues → save to the draft (`revision + 1`) with `plannerModel` noted, or fail with the issues. The 2.6 words/s figure in §13 is only the preview clock, used until real timings exist.

### 11.2 Revise (layer 4)

`revise` job: input = message text, scene ids, source draft revision. The model receives the current plan (or only the targeted scenes plus a summary of the rest) and returns a full candidate plan plus a summary. The server validates it, computes a **structural diff**, and classifies the change with code, not with the model's claim:

- `spoken`, `speaker`, or `tone` changed, or a new line was added → `narration`
- only `text` changed → `captions`
- scene order changed, words unchanged → `order`
- `voiceId` changed → `voice`
- `format` changed → `format`
- a scene or a component was added or removed and no spoken words changed → `structure`
- props, camera, style, or background changed → `visual`

If several apply, keep the class that redoes the most audio, in this order: `voice`, `narration`, `order`, `format`, `structure`, `captions`, `visual`. Store it on `candidate.changeClass`. The candidate is stored on the assistant message; Keep applies it with a revision check.

### 11.3 Render

`approve` (web, one transaction) freezes the storyboard, creates a `video` (`building`), and enqueues `render` with `activeSlot`. The `render` job stages:

| Stage | Does | Output |
|---|---|---|
| `narrate` | For each line: apply pronunciations (project list first, then the creator's list; a project entry wins on the same written form) → fingerprint → cache hit or `TtsProvider.synthesize` → loudness check, duration sanity | Line audio assets |
| `align` | Provider word timings, or `Aligner.align` against the spoken text; map spoken tokens back to shown tokens | Word timings per line |
| `compile` | Timeline: scenes back to back (lines + style gap + `holdMs`, at least the components' `minDurationMs`); resolve cues to times; caption pages; music bed with ducking under narration; then emit the HyperFrames project (§13) | `timeline.json`, project folder |
| `render` | `hyperframes check` (0 errors) → `@hyperframes/producer` `executeRenderJob` with progress → MP4 | MP4 |
| `qa` | ffprobe (streams, size, fps, duration ±1 frame of timeline), loudness (−14 LUFS ±1), a frame sheet every 2 s, caption boxes inside the safe zone, no blank frames | QA report, frame sheet |
| `store` | Upload MP4, SRT, thumbnail, timeline; one transaction: video `ready`, project `currentVideoId`, release `activeSlot` | Ready video |

Timing rules: frames = `round(ms × fps / 1000)`; each scene starts on the frame where the previous ended (no drift). A cut sits in the pause before the next line: 180 ms before that line's first word, clamped so it does not cover the previous word. Events fire at their cue word's start + offset, clamped inside the scene. Captions: pages of ≤ 2 lines and ≤ 42 characters per line on 9:16, word highlight from word timings, never crossing a scene boundary. The voice bus sits about 8 dB above the sound-effect bus. Music, when present, ducks under the voice. The master is −14 LUFS with true peak under −1 dBTP. Why these numbers: `docs/reference/MOTION_CRAFT.md`.

## 12. Files and storage

- Keys: `u/{ownerId}/{projectId|lib}/{kind}/{assetId}.{ext}`. Generated by code; never from user input.
- Upload flow (worker): write bytes → compute SHA-256 → `put` → insert or update the asset row as `ready`. A crash in between leaves an orphan key that the cleanup job removes after 24 h.
- **Owner reads** go through `GET /api/assets/{id}/file`: the handler checks ownership, then streams (local disk) or **redirects with a 10-minute signed R2 URL** (hosted, so video bytes do not pass through Vercel). The same rule serves the share page after checking the token. Revoking a share stops new plays at once; a URL already handed out works for at most 10 minutes. We accept that window instead of building a media gateway.
- Uploads (layer 6): multipart to the web route ≤ 4 MB on Vercel; larger files use a signed PUT to R2, then a `complete` call that verifies size, MIME sniff, and hash before the row becomes `ready`.
- The render workspace (`.data/work/{jobId}`) is local to the worker and deleted after `store` (kept on failure for 24 h for debugging).
- System library files ship in the repo under `library/` with `manifest.json` recording id, kind, tags, licence, attribution, and source URL. A CI check fails if any file lacks a manifest entry or a licence.

## 13. Compiler and renderer

`src/compiler/` turns `(plan, timeline, style, format, assetResolver)` into a HyperFrames project:

```
project/
  index.html            root composition: tracks for background, layers, captions, narration, music, sfx
  scenes/s1.html …      one sub-composition per scene
  assets/               resolved local copies (fonts, gsap, images, audio)
  hyperframes.json
```

- All text from the plan goes through one `escapeHtml` and is placed as text content; attributes are built from enums and numbers only. No plan string becomes a tag, attribute name, URL, CSS, or script.
- Animation is one paused GSAP timeline per composition, built from `TweenSpec` data (`{ target, from, to, at, duration, ease }`) emitted by trusted component code; seek-safe and deterministic. The default ease is a closed-form spring (stiff for buttons and pointers, soft for big type). A value with several targets is the sum of one spring per change, each starting at its own time, so frame t does not depend on frame t−1. Lottie and Three.js only through HyperFrames adapters.
- Random effects (particles) use a seeded PRNG keyed by scene id.
- Fonts, GSAP, and libraries are local files: no network at render time (Reel Studio lesson).
- Known HyperFrames traps from Reel Studio (`docs/reference/REEL_STUDIO_LEARNINGS.md`) are encoded as compiler rules and lint checks: no `letterSpacing` tweens, `tl.set` + `tl.to` instead of `fromTo` with immediate render on flashes, gradient text on each letter span, timed media without a timed ancestor.
- **Preview**: the web app runs the same compiler with estimated timing (≈ 2.6 words/s until a version has real timings; the planner's script budget stays 2.4 words/s, §11.1) and serves the HTML to `<hyperframes-player>` in a sandboxed iframe (API §7.7). Preview never calls a provider. A frame at time t in the preview is the frame the MP4 will contain once the timings are real.

## 14. Authentication, owner, tenancy

- Our own small auth, as in The Wedding Home: bcrypt cost 12; session token 32 random bytes in an `HttpOnly; Secure; SameSite=Lax` cookie; stored as HMAC-SHA256 with `AUTH_TOKEN_PEPPER`; 30-day sliding expiry; invalid when older than `passwordChangedAt`.
- **Invite-only**: `POST /api/auth/join` needs a valid invite token for that email. The Owner is the user whose email equals `OWNER_EMAIL`; the Owner's own account is created by `scripts/create-owner.ts`.
- Reset: the response is the same whether or not the email exists; the link lasts 1 hour, works once, and signs out every session.
- Tenancy chain: cookie → session → `userId` = `ownerId` → every repository method requires it (`findProject({ ownerId, id })`). A foreign id returns `NOT_FOUND`. The worker derives ownership from the job document, never from payload fields.

## 15. Security

- **CSRF:** `Origin` must equal `APP_ORIGIN` on cookie-authenticated mutations; JSON only.
- **Prompt injection:** notes, code, and trace values are passed to the model as quoted data in a separate message; the system prompt states they are content. The output is still validated: an injected instruction can at worst produce a valid but odd plan, which the creator reviews.
- **Rendered content:** escaping rule in §13; the preview iframe has `sandbox="allow-scripts"` and a strict CSP; the preview route is same-origin but cookieless content (no secrets in it).
- **Code execution:** only in the browser worker (§8). The server parses traces as data.
- **Protected IP and likeness:** a deny list (`src/config/protected.ts`) of franchise characters and public figures is checked on character names and descriptions and in the planner instructions; the Copilot explains and offers an original character.
- **Uploads (layer 6):** MIME sniffing, size caps, images re-encoded with sharp (strips metadata), video probed with ffprobe.
- **Secrets:** env only, parsed by subsystem in `src/config`; no `NEXT_PUBLIC_` secrets. The worker's env is separate from the web's.
- **Rate limits:** API.md §6, stored in `rate_limits`, keyed by HMAC.
- **Logs:** ids, stage, durations, provider, model, error kind. Never notes, narration, code, prompts, tokens, or signed URLs.

## 16. Performance and freshness

- v1 uses: indexes from DATABASE §6, cursor lists, cached TTS/images, per-line narration reuse, polling every 2 s.
- Render budget on the M2 8 GB: ≤ 4 min for 60 s at 1080×1920 (Reel Studio measured ~2 min draft for 67 s). `hyperframes benchmark` on our templates is part of spike S1.
- Avoid in templates: animated blur and big `box-shadow` on full frames, WebGL by default (slow headless). Prefer transforms and opacity.
- v1 refuses: Redis, websockets, a second datastore, a queue service, until a measured need.

## 17. Deployment

| Phase | Web | Worker | Storage | Database |
|---|---|---|---|---|
| Local (layers 0–4) | `npm run dev` on the Mac | `npm run worker` on the Mac | `.data/storage` | Atlas `leela-dev` |
| Hosted personal (layer 5) | Vercel Hobby (`leela-…vercel.app`) | The Mac when on, or Oracle A1 VM (Docker image with Node 22, Chrome headless shell, FFmpeg, Python venv) | Cloudflare R2 bucket `leela` | Atlas `leela` |
| Selling (layer 10) | Vercel Pro or Cloudflare (OpenNext) | HyperFrames Lambda or Cloud Run for bursts, plus one VM | R2 | Atlas M10 |

Environment variables by name (values never in the repo):
`APP_ORIGIN`, `MONGODB_URI`, `MONGODB_DB`, `AUTH_TOKEN_PEPPER`, `OWNER_EMAIL`, `RESEND_API_KEY`, `MAIL_FROM`, `STORAGE_DRIVER` (`local`|`r2`), `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `CF_ACCOUNT_ID`, `CF_AI_TOKEN`, `OPENROUTER_API_KEY`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, `SARVAM_API_KEY`, `WORKER_ID`, `WORKER_LANES`, `PYTHON_SIDECAR` (path to the venv python), `TOKEN_ENC_KEY` (layer 8), `YOUTUBE_CLIENT_ID`/`SECRET`, `META_APP_ID`/`SECRET` (layer 8).

Before a layer uses a provider, its key is tried from the server with a tiny real call (`scripts/check-providers.ts`), and the failure path shows a calm message (Wedding Home rule).

## 18. Scaling path

- **Now:** one creator, one worker, local renders.
- **First limits we expect:** render time when making many videos (add a second worker: the lease design already allows it), Atlas 512 MB (prune unreferenced storyboards or pay for M10), the LLM free daily cap (router fallbacks).
- **When selling:** paid voices (Azure S0 or ElevenLabs paid for commercial use), HyperFrames Lambda for burst rendering, Vercel Pro, a real email domain, billing. Each is a config change or one adapter.
- **Still will not do:** microservices, Kubernetes, our own GPU cluster.

## 19. Failure

| Dependency | Behaviour |
|---|---|
| MongoDB down | Pages show a calm error; the worker backs off and retries; no partial writes (transactions) |
| Storage down | Render stages fail retryably at `store`; the last good video stays current; reads show "media temporarily unavailable" |
| LLM provider down or out of quota | Router tries the next; if none, `waiting_quota` with the reset time |
| Voice provider down or out of quota | Job waits; no silent voice swap; creator may pick another voice |
| Aligner fails on a word | Interpolate inside that line only and flag the scene; a whole line unaligned fails the stage |
| Image provider out of quota | Job waits, or the creator swaps the scene to library scenery |
| Renderer crash | Lease expires, job resumes at `render` with cached narration and timeline |
| Mail down | Invite and reset rows are kept, `mailed: false` is shown, resend later |
| Worker offline (Mac asleep) | Jobs stay `queued`; the studio says "Worker offline since 14:02" (last heartbeat in a `workers` status doc) |
| Browser closed during a job | Nothing changes; the job continues; the UI reattaches by job id |

## 20. Tests this design expects

- Unit: plan validation (each rule in §6.1), cue resolution with repeated phrases, spoken-to-shown token mapping, caption paging, timeline frame math (no drift over 40 scenes), revision classifier, invalidation table, quota router (exhaustion, circuit, reset), fingerprints, trace validation and caps, escaping (a narration of `<img onerror>` renders as text).
- Integration: job claim with two workers (only one wins), lease expiry takeover, stale-worker write rejected, idempotent approve, one active job per project, cancellation between stages.
- Golden renders: three fixture plans (water cycle, binary search, orbit) render; `hyperframes snapshot` frames compared at fixed times.
- E2E (Playwright, `npm run e2e`): the layer's journey in Chrome, as two creators (isolation), at desktop and 390 px; no console errors.
- Provider checks: `scripts/check-providers.ts` with real keys before a layer ships.

## 21. Decisions

| # | Decision | Why |
|---|---|---|
| 1 | Scene graph + component registry; model output is data | Safety, determinism, and arbitrary topics without arbitrary code |
| 2 | HyperFrames over Remotion | Apache-2.0 vs a paid automation licence; HTML target; proven on this Mac |
| 3 | MongoDB job queue + worker over Inngest / Vercel Sandbox | Free, one vendor fewer, rendering needs a real machine anyway |
| 4 | Code runs only in the browser | No server-side code execution risk |
| 5 | Groq structured output first, Gemini second | Strict JSON and no retention by default; Gemini free trains on inputs |
| 6 | Kokoro local for English | Free, commercial, native timings |
| 7 | Azure F0 / Sarvam for Indian voices, decided by spike | Kokoro Hindi is weak; ElevenLabs free is non-commercial |
| 8 | Per-line narration and fingerprints | Edits re-voice only what changed |
| 9 | Our own auth (Wedding Home pattern) over Better Auth | Known, small, already proven by us |
| 10 | Signed short-lived URLs instead of a media gateway | Simpler; a 10-minute revocation window is acceptable for v1 |
| 11 | Local first, hosted in layer 5 | Spend effort on the engine before infrastructure |
| 12 | System library with licences in the repo | Licence trail for selling later |

## 22. Out of v1

Server-side code execution (C++/Java), AI video clips, talking avatars, voice cloning, teams, billing, public signup, a media gateway, Redis, websockets.

## 23. Layer 0 spike gates

Spikes live in `spikes/` and must not import app code they will later depend on; what passes is promoted into `src/compiler` or `worker/` in layer 2.

| Spike | Locks |
|---|---|
| S1 Render | HyperFrames via `@hyperframes/producer` from Node; render speed; caption approach. Failing → Remotion fallback (and licence budget) |
| S2 Voice + timing | Enabled voices for en, en-IN, hi; per-line vs per-scene synthesis; the aligner |
| S3 Code trace | Pyodide tracer design; trace caps; the first three `ds.*` components |
| S4 Planner | Provider order, prompt shape, schema size limits (Gemini rejects very large schemas; we generate per mode) |
| S5 Story stills | Image provider and the character consistency method. Not a layer 0 gate; runs when layer 6 starts |
| S6 Puppet lip sync | Mouth shapes from a line's audio. Layer 9 |
| S7 Montage port | Beat grid from the Reel Studio path. Layer 9 |

## 24. Later documents

Module internals, the planner prompt text, component visual specs, the Docker image for the worker, and the layer 8 publish design are written when their layer starts.

## Done when

- [x] Every provider in the stack has a failure row
- [x] The tenant is named, and the request chain that discovers it is written
- [x] Secrets that are hashed vs secrets that must be shown again are distinguished (DATABASE §8)
- [x] No page or role appears here that is absent from the PRD
