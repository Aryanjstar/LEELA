# Research: tools, free tiers, licences (checked 2026-10-19)

Start here before researching again. Look only for **what is newer** than this page. Free tiers and model ids move every few weeks: re-check a row before the layer that depends on it, and update the date.

**Source key:** **O** = the provider's official page or repo, read on 2026-10-19. **3P** = third-party only. **?** = unknown or sources disagree.

## 1. Verdicts

| Layer | Pick | Fallback | Why |
|---|---|---|---|
| Renderer | **HyperFrames** (Apache-2.0, `@hyperframes/producer` as a Node library) | Remotion (paid licence for prompt-to-video apps) | Licence, HTML target, proven on this Mac |
| Preview | `@hyperframes/player` | — | Same HTML as the render |
| Planner LLM | **Groq `openai/gpt-oss-120b`**, `strict: true` | Gemini `gemini-3.8-flash` → Workers AI `gpt-oss-120b` → OpenRouter `:free` | Constrained JSON; Gemini free trains on input |
| English voice | **Kokoro-82M** local | Azure F0 | Free, Apache-2.0, native word timings |
| Indian English / Hindi voice | **Azure Speech F0** or **Sarvam Bulbul** (spike S2 decides) | Indic-Parler-TTS (Apache, self-host) | Kokoro Hindi graded C; ElevenLabs free is non-commercial |
| Word timing | Native (Kokoro en, Azure WordBoundary) | WhisperX forced alignment (has Hindi) → `hyperframes transcribe` | Script is known |
| Code tracing | **Pyodide** in a Web Worker | QuickJS / JS-Interpreter for JS | No server-side execution |
| Images | **Workers AI FLUX.1 schnell** | FLUX.2 klein 4B (multi-reference, Apache) | Free daily neurons, no training on content |
| Lip sync | **Rhubarb** (MIT) | — | CPU, any language (phonetic mode) |
| Music / SFX | Curated library: CC0, Incompetech (CC-BY credit), Stable Audio Open SFX | — | Freesound API and MusicGen are non-commercial |
| Illustrations / icons | Open Peeps, Humaaans, Kenney (CC0), IRA (MIT), Lucide/Tabler/Phosphor, Noto Emoji | Twemoji, game-icons (CC-BY, credit) | Safe for automated use |
| Database | **Atlas M0** (512 MB) | Neon (1 GB) | Already used |
| Storage | **Local disk**, then **R2** (10 GB, free egress) | Vercel Blob | Bytes out of MongoDB |
| Jobs | **MongoDB queue + worker** | Inngest Hobby (50K executions/month) | Worker must exist for Chrome + FFmpeg |
| Host | **Vercel Hobby** (personal), worker on the Mac / **Oracle A1** | Cloudflare Pages + Workers (commercial OK, needs OpenNext) | Hobby is non-commercial only |
| Publishing | **YouTube** first | Instagram Graph API | YouTube upload now costs 1 unit; Meta needs app access |

## 2. Planning LLMs

| Provider | Free limits | Commercial on free | Trains on input | Strict JSON | Src |
|---|---|---|---|---|---|
| Groq | Developer table: gpt-oss-120b / 20b, qwen3.8-27b at 30 RPM, 1K RPD, 8K TPM, 200K TPD. Free-plan numbers did not load (?) | Not stated (?) | No retention by default (docs) | **Yes**, `strict: true` constrained decoding on gpt-oss-* and qwen3.8-27b | O |
| Google Gemini | Free models incl. `gemini-3.8-flash`, `3.6-flash`, `3.5-flash-lite`, `2.5-*`, Gemma 4. RPM/RPD shown only in AI Studio; blogs say ~20 to ~1,500 RPD (?) | Allowed (no ban); EEA/UK/CH must use paid | **Yes**, and humans may review | Response schema (subset of JSON Schema; very large schemas rejected) | O |
| Cloudflare Workers AI | 10,000 neurons/day. gpt-oss-120b ≈ 31.8K neurons per M input tokens, 68.2K per M output | Yes (model licence) | **No** | JSON mode (strictness unverified) | O |
| OpenRouter `:free` | 20 RPM; 50 RPD (1,000 RPD after buying ≥ 10 credits once) | Upstream-dependent | Some upstreams train | Model-dependent | O |
| Mistral Experiment | ~1 req/s, ~1B tokens/month (?) | Prototyping | Yes by default (opt-out) | JSON mode | 3P |
| Cerebras | Trial: 5 RPM, 1M TPD on gpt-oss-120b, qwen-3.8-27b; permanence ? | ? | ? | ? | O/3P |
| GitHub Models | **Retired 2026-07-30** | — | — | — | O |

Model-id lesson from NamasteVideo: his pinned Gemini 3.5/3.8 ids went stale in weeks. Ids live in config and are checked with `models.list` at worker start.

## 3. Voices (TTS)

| Engine | Free / licence | Commercial | Indian languages | Word timings | Src |
|---|---|---|---|---|---|
| **Kokoro-82M** | Apache-2.0 weights; local; HyperFrames `tts` ships 54 voices | Yes | Hindi: hf_alpha, hf_beta, hm_omega, hm_psi, all graded C. No en-IN | **English only** (`start_ts`/`end_ts` for `a`/`b`) | O |
| **Azure Speech F0** | 0.5M neural chars/month; HD voices not free | Yes | en-IN: Neerja, Aarti, Arjun, Prabhat, Kavya…; hi-IN: Swara, Madhur, Aarti, Arjun, Kavya… | **Yes** (`WordBoundary`) | O |
| **Sarvam Bulbul** | `v3` (stable), `v4-flash` (newest); signup credit ₹100 or ₹1,000 (official pages disagree); ₹20–30 per 10K chars after | **Yes**, incl. free credits | 11 languages incl. hi-IN, en-IN | None (WAV only) → align | O |
| ElevenLabs Free | 10K credits/month | **No** commercial use; titles must credit elevenlabs.io | Hindi | — | O |
| Gemini TTS | Free tier on 3.8 flash tts models; RPD ? | Gemini terms | Hindi; up to 2 speakers | No | O (trains on input) |
| Google Cloud TTS | Chirp 3 HD 1M chars/month free (search snippet) | Yes | ? | SSML marks on some voices | O partial |
| Indic-Parler-TTS (AI4Bharat) | Apache-2.0, ~0.9B, gated on HF | Yes | Hindi speakers Rohit, Divya, Aman, Rani; Indian English | No | O |
| edge-tts | Unofficial Microsoft endpoint | **Risky**; blocked at scale | Same as Azure | Yes | **Do not use in production** |
| Coqui XTTS-v2 | CPML, company closed | **No** | Hindi | — | O/3P |
| Piper | Now GPL-3.0 (`piper1-gpl`); per-voice licences | Varies | Hindi listed | No | O |

Hinglish (Roman-script code-mixing) support is not documented by any provider. Spike S2 tests Sarvam and Azure on it.

## 4. Alignment / STT

| Tool | Licence / limits | Word timings | Hindi | Src |
|---|---|---|---|---|
| WhisperX | BSD-2; CPU int8 works | wav2vec2 **forced alignment** | Yes (`theainerd/Wav2Vec2-large-xlsr-hindi`) | O |
| faster-whisper | MIT | `word_timestamps=True` | Yes | O |
| whisper.cpp | MIT | `-ml 1` | Multilingual models | O |
| Groq Whisper | Free tier, 25 MB/file | `timestamp_granularities[]=word` | Yes | O |
| `hyperframes transcribe` | Local; Parakeet on macOS, else whisper.cpp | `{words:[{text,start,end}]}` | Use `--language hi`; the default `small.en` translates to English | Local skill |

## 5. Images and video

| Option | Free | Commercial | Src |
|---|---|---|---|
| Workers AI FLUX.1 schnell | 4.8 neurons per 512² tile + 9.6 per step → ~57.6 per 1024² at 4 steps → **~170/day** (our arithmetic) | Apache-2.0 weights | O pricing |
| Workers AI FLUX.2 klein 4B | Pricier per tile; multi-reference editing for consistent characters | Apache-2.0 (klein **9B is non-commercial**) | O |
| Gemini image models | **None free** | — | O |
| Pollinations | Terms unreadable | ? | ? |
| Hugging Face Inference | No free monthly credits for free users | — | O |
| Wan 2.2 TI2V-5B (video) | Open weights; 24 GB VRAM, ~9 min per 5 s 720p on a 4090 | Apache-2.0 | O |
| LTX-2.x (video) | Open weights; free under $10M revenue | Community licence | O |
| Wan 2.5+ | API only, no weights | — | 3P |
| Free GPUs | Colab free bans web UIs/remote control (not a backend); Kaggle ~30 h/week (3P); Modal $30/month credit | — | O/3P |

**This Mac (M2, 8 GB, no NVIDIA GPU) cannot run video-generation models usefully.** AI clips are a later, paid or Modal-credit experiment.

## 6. Characters, lip sync, animation

| Tool | Licence | Note |
|---|---|---|
| Rhubarb Lip Sync | MIT; output belongs to you | Mouth shapes A–F (+G/H/X) as JSON; `phonetic` recogniser for non-English |
| Rive | Runtime MIT; editor SaaS (Free: 3 files, export with splash ?) | No HyperFrames adapter; a custom seek adapter is needed for video |
| Lottie / dotLottie | MIT | HyperFrames has a Lottie adapter (`goToAndStop`) |
| Spine, Live2D | Proprietary, paid at scale | Skip |
| SadTalker (Apache), MuseTalk (MIT), EchoMimic (Apache), LivePortrait (MIT code, **non-commercial InsightFace models**), Hallo (MIT + restricted parts) | GPU-only, photoreal faces | "Persona" layer, later |

## 7. Code tracing

| Project | Licence | Use |
|---|---|---|
| Pyodide | MPL-2.0 | CPython in WASM in a Web Worker; kill by terminating the worker |
| quickjs-emscripten | MIT | Sandboxed JS with interrupt, memory, and stack limits |
| JS-Interpreter | Apache-2.0 | ES5 line stepping |
| algorithm-visualizer | MIT (stagnant) | Model for the tracer vocabulary (Array1DTracer, GraphTracer) |
| Online Python Tutor | Upstream gone; GPL-3.0 snapshots | **Idea only**, write our own (~300 lines) |
| VisuAlgo | Proprietary, forbids variants | Do not reuse |

## 8. Assets

| Source | Licence | Automated SaaS? |
|---|---|---|
| Open Peeps, Humaaans | CC0 | Good |
| Kenney.nl | CC0 | Good |
| IRA Design | MIT | Good |
| Lucide, Tabler, Phosphor | ISC / MIT | Good |
| Iconify | Per-set licences | Allowlist MIT/Apache/ISC/CC0 sets only |
| Noto Emoji | OFL / Apache | Good |
| Twemoji graphics, game-icons.net | CC-BY | OK with automatic credits |
| OpenMoji | CC BY-SA 4.0 | Careful (share-alike) |
| Google Fonts | OFL (mostly) | Good |
| LottieFiles free | Lottie Simple License | Hand-pick; no bulk collecting |
| Pexels | Free; API needs a visible Pexels link | OK with credit |
| Pixabay | Free; no standalone resale | OK (API terms unreadable today) |
| Unsplash | Free; API requires hotlinking and credit | Conflicts with baking into MP4: avoid |
| unDraw, DrawKit, Blush, Storyset | Terms restrict apps, automation, on-demand services | **Avoid** |
| Freesound API | **Non-commercial** | Avoid for selling |
| MusicGen | Weights CC-BY-NC | Avoid |
| Stable Audio Open 1.0 | Free under $1M revenue | SFX |
| Incompetech | CC with credit | Music with automatic credit |

Every library file gets a `manifest.json` row with licence and credit text; the Share step builds the credits line automatically.

## 9. Infrastructure

| Service | Free tier | Note | Src |
|---|---|---|---|
| Atlas M0 | 512 MB, ≤ 100 ops/s, no backups | | O |
| Neon | 1 GB/project, autosuspend 5 min | | O |
| Supabase | 500 MB DB, 1 GB files, pauses after 7 idle days | | O |
| Cloudflare R2 | 10 GB-month, 1M Class A, 10M Class B, free egress | Payment method on file likely required (?) | O |
| Vercel Hobby | 300 s functions, 4 active CPU-h, 100 GB transfer | **Personal, non-commercial only** | O |
| Cloudflare Workers / Pages | 100K req/day, 10 ms CPU; 500 builds/month | Commercial OK | O |
| Render / Railway / Fly | Spin-down, trial credit, no free tier respectively | Not for the worker | O |
| **Oracle Always Free A1** | **2 OCPU / 12 GB** ARM (not 4/24 any more), 200 GB disk, idle reclaim | Slow but free render worker; capacity errors common | O / 3P |
| GitHub Actions | 2,000 min/month private; unlimited public | Possible burst renderer | O |
| Inngest Hobby | 50K executions/month, 5 concurrent steps | Not needed (MongoDB queue) | O |
| Trigger.dev | $5/month usage | — | O |
| Resend | Already verified domain `aryanjaiswal.in` (Wedding Home) | | Our use |

## 10. Publishing

| Platform | Facts (O) |
|---|---|
| YouTube Data API | `videos.insert` now costs **1 unit** from a separate **100 calls/day** bucket (old "1,600 units" figure is outdated). Uploads from unverified projects are no longer forced private. Shorts = vertical ≤ 3 min |
| Instagram Graph API | Professional account; Instagram Login (`instagram_business_content_publish`) or Facebook Login + Page; Advanced or Standard Access needed; 100 API posts / 24 h (one section says 50); Reels 3 s–15 min, ≤ 300 MB, H.264/HEVC, 9:16 |
| Policy | YouTube's 2025-07-15 "inauthentic content" policy can demonetise mass-produced templated AI videos. Leela must keep real creative input (scripts, original characters, variety), and never be pitched as a "faceless channel farm" |

## 11. Peers worth learning from

| Product | Licence | Borrow |
|---|---|---|
| NamasteVideo.ai | Closed (repo has no licence) | Approval gate, versions, phrase cues. See `reference/NAMASTE_VIDEO.md` |
| OpenMontage (69.7K★) | **AGPL-3.0**: do not copy code | Cost estimate before generating, automatic QA gate, "make me something like this video" |
| MoneyPrinterTurbo (133K★) | MIT | Batch variants, subtitle presets; it uses edge-tts (we will not) |
| ShortGPT | MIT | Its JSON "editing markup language" resembles our scene graph |
| Vyond | Closed | Character creator with poses and actions: the model for Cartoon mode |
| Higgsfield | Closed | Camera-move presets as looping cards; character "ID" locking |
| InVideo "Magic Box", Descript "Underlord" | Closed | Chat edits that @-mention scenes; Copilot diff cards |
| Pika | Closed | Playful effect names |
| HyperFrames | Apache-2.0 | The renderer. See ARCHITECTURE §4 |
| pdoom-video (mexicat) | MIT | Deterministic frames and word-locked cuts. Not our renderer. See `reference/MOTION_CRAFT.md` |
| OneTake | PolyForm Noncommercial | A continuous camera move as a preset. Do not copy the code |
| Collage B-roll | MIT | A possible Story look (paper, halftone) after layer 6 |
| Claude Animation Base | MIT | Puppet-motion reference for Cartoon. Not the mascot |
| Lemo Opuscar | MIT | Code-drawn film looks to mine for styles. Do not vendor |

## 12. UI research summary

Full notes: DESIGN.md. Key facts: Apple Liquid Glass (2025) refraction only renders in Chromium on the web (`backdrop-filter: url(#svg)`), so use frosted glass everywhere and refraction only as a Chromium enhancement. `prefers-reduced-transparency` has no Safari support, so ship an in-app Glass: Clear / Tinted / Solid setting. shadcn/ui made Base UI the default in July 2026. `react-resizable-panels` v4 renamed its API (`Group`, `Panel`, `Separator`). `tldraw` needs a paid licence key in production; `vaul` is unmaintained. CapCut remains blocked in India (3P).

## 13. What the three AI reports got right and wrong

Aryan pasted reports from ChatGPT, Claude (claude.ai, cut off at the limit), and Gemini (the brief he gave it).

- **ChatGPT: sound outline, dated tools.** Correctly described NamasteVideo's flow and the Remotion + structured-plan approach, and suggested provider adapters. But it recommended GPT-3.5, Stable Diffusion self-hosting, Coqui TTS (non-commercial), Mozilla TTS (dead), MuseNet/Jukebox, and "Remotion free under MIT" (wrong: Remotion is source-available with a paid company licence). It said "Stable Diffusion under CC licence" (wrong). No free-tier numbers, no licence trail, no word-timing problem, no Code Lab idea.
- **Claude: best of the three.** It found that the repo is mostly docs plus a CLI, that free ≠ commercial (ElevenLabs, Vercel Hobby, Gemini training), the IP risk in Pokémon/Motu Patlu, the word-timing gap with free TTS, the need for a quota manager, the Code Lab trace idea, the dockable Copilot, and one-base-one-accent for morphisms. Corrections from today's check: Gemini "Pro paid-only since April" is consistent but its RPD is unpublished; Oracle is now 2 OCPU / 12 GB; GitHub Models is retired; Cloudflare FLUX is ~170 images/day at 1024² by our arithmetic; it picked Remotion (the Automators licence makes that costly for us) and did not know HyperFrames is already on this Mac.
- **Gemini prompt:** this was Aryan's brief, not a report. Its asks are all in PRODUCT.md: people, laptops, scenery (Story, scenery library), DSA step-by-step with "which function is called when" (Code Lab call stack and recursion tree), viral formats (Story, Cartoon, Montage), AI persona (later), free resources first (adapters + quotas), playful UI with glass/water morphism and a Cursor-like side panel (DESIGN.md).
- **Gaps none of them covered:** HyperFrames as an Apache-2.0 renderer already proven on this Mac; the `@hyperframes/player` preview; Kokoro's English-only timestamps; Azure F0's free Indian voices with word boundaries; Sarvam's commercial-OK free credits; asset licences that ban automation (unDraw, Storyset, DrawKit, Blush); the YouTube "inauthentic content" policy; YouTube's new 1-unit upload cost; that the Mac has 8 GB and no GPU.
