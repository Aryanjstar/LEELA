# Leela — design

**Version:** 1.0 · **Date:** 2026-10-19 · **Status:** Draft for review

Two separate systems live here:

1. **Studio UI**: the web app the creator uses. Playful, glassy, fast.
2. **Video styles**: how the rendered videos look. Calm, readable, on-brand per style.

They never share tokens by accident. Changing the studio theme never recolours a video.

The research behind this file is in `docs/RESEARCH.md` §UI (2026-10-19).

---

## Part 1 — Studio UI

### 1.1 Direction: "Masala Aurora"

Dark-first. Aurora gradient light leaks behind frosted-glass chrome. Clay for objects you can touch (mode tiles, Lattu, stickers). Bento grids for overviews. Indian colour names, global polish.

**One base style plus one accent style.** Mixing every "morphism" at once looks messy. The rules:

| Style | Where | Never |
|---|---|---|
| **Aurora** (drifting pink, saffron, teal, indigo blobs, 35% opacity, 120 px blur) | Behind everything on landing, studio home, empty states, the "thinking" state | Behind the playing video |
| **Glass / frosted** (`backdrop-filter: blur(16px) saturate(160%)`, tint, 1 px inner highlight) | Chrome: top bar, left rail, Copilot dock, command palette, toasts, player control pill | Over a playing video (use a solid scrim). Glass inside glass. More than 3 glass layers in a view |
| **Liquid glass** (SVG displacement refraction) | Only the dock's expand/collapse pill and the ⌘K palette, and only on Chromium | Safari and Firefox (frosted fallback). Anything with body text |
| **Clay** (two inner shadows plus one soft outer shadow, 24 px radius) | Mode tiles, big primary buttons, Lattu, sticker chips, empty-state art | Inputs, tables, the editor canvas |
| **Bento** | Studio home, the New project mode picker, the landing feature section | Inside the project editor |
| **Skeuomorph accents** | Small and few: the clapper "Make video" button, a VU meter on voice preview, a film-strip edge on the storyboard | Whole screens |
| Neumorphism (soft UI) | Not used on controls: fails 3:1 control contrast | — |
| Neo-brutalism | Not in the app. Clashes with glass. Maybe a landing campaign later | Same screen as glass |

What "water morphism" means here: the aurora blobs drift like ink in water, and the Copilot dock opens with a liquid stretch (a spring on `scaleX` with a 2-frame overshoot). No animated blur radius.

> Interpretation note: the voice brief said "we can use search, and we can suit overflow" between morphism styles. We read it as **skeuomorphism** and **soft UI**. Both are covered above. If it meant Stack Overflow-style search, the command palette and Copilot cover search; tell us if not.

### 1.2 Tokens

| Token | Dark (default) | Day mode |
|---|---|---|
| `--ink` (base) | `#0D0A1F` | `#FFF8EF` |
| `--surface` | `#171330` | `#FFFFFF` |
| `--surface-2` | `#211B42` | `#FFF1E0` |
| `--fg` | `#F5F0FF` (17.4:1) | `#1B1530` (16.7:1) |
| `--muted` | `#B9B0D6` (9.5:1) | `#5E5577` |
| `--rani` (primary) | `#FF4F9A` | `#C2185B` |
| `--saffron` | `#FFB020` | `#B86E00` |
| `--peacock` | `#19C3B3` | `#0E7C72` |
| `--indigo` | `#7C6CFF` | `#4B3FD6` |
| `--danger` | `#FF6B6B` | `#C62828` |
| `--glass-bg` | `rgb(255 255 255 / .08)` | `rgb(255 255 255 / .55)` |
| `--glass-border` | `rgb(255 255 255 / .18)` | `rgb(27 21 48 / .10)` |
| Radius | card 20, tile 24, control 12, pill 999 | same |

Contrast ratios are against `--ink`. Text on glass sits on a 60–80% tint so it keeps 4.5:1 against the worst background. Status always pairs colour with an icon and a word.

**Type** (Google Fonts, self-hosted with `next/font`):

| Use | Font |
|---|---|
| Display, headlines, kinetic text | **Bricolage Grotesque** (variable width and optical size) |
| UI and body | **Plus Jakarta Sans** |
| Hindi UI | **Anek Devanagari** |
| Code Lab | **JetBrains Mono** |

Scale: 12 / 14 / 16 / 20 / 24 / 32 / 48 / 64. Body 16/24.

### 1.3 Motion rules

- Springs: stiffness 300, damping 30. Panels 220 ms. Hover lifts 2 px. Press scales to 0.97.
- The aurora drifts on a 30 s loop and pauses when the tab is hidden.
- `prefers-reduced-motion`: no drift, no confetti, no squash; fades only. Motion's `<MotionConfig reducedMotion="user">`.
- **Glass setting** in Settings → Preferences: Clear / Tinted / Solid. Solid turns all glass into `--surface`. It is also set automatically when `prefers-reduced-transparency: reduce` or `navigator.deviceMemory ≤ 4`.
- Animate `transform` and `opacity` only. Never animate `backdrop-filter`.

### 1.4 Lattu, the mascot

A clay spinning top (लट्टू) with two dot eyes and a string tail. Built as an SVG with Motion in layer 1, and moved to a Rive state machine when it earns it.

| Moment | Lattu |
|---|---|
| Idle (studio home) | Wobbles slowly, blinks |
| Planning | Spins, with a thought bubble of scene cards |
| Narrating | Spins with a tiny headset |
| Rendering | Spins fast; the string unwinds as real progress moves |
| Done | Topples over happily; a 1.2 s confetti burst (first render of a project only) |
| Failed | Wobbles to a stop and looks sheepish |
| Quota waiting | Sleeps, with a "zzz" showing the reset time |

Lattu never appears inside the editor canvas or over the video. Under the mascot there is always the real stage name ("Narrating scene 3 of 7"). The jokey line is optional: Settings → "Fun copy" on by default, one switch to turn it off.

Fun copy pool (rotate every 4 s): "Teaching pixels to dance…", "Convincing the narrator to do one more take…", "Adding extra masala to scene 3…", "Untangling the recursion tree…", "Asking the planets to hold still…".

**UI sound** is off by default. A speaker toggle in the top bar turns on a small set (pop, whoosh, clap) at 30% volume.

### 1.5 Layout shell (studio)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ◉ Leela   Project title ✎   Idea › Storyboard › Video › Share   ⌘K  🔈  ◐ AJ │  ← glass top bar
├──┬─────────────────────────────────────────────────────────────┬───────────┤
│▣ │                                                             │ Copilot   │
│✦ │                    Work area (step content)                 │ ───────── │
│▤ │                                                             │ chat …    │
│♪ │                                                             │ diff card │
│⚙ │                                                             │ [Apply]   │
│  │                                                             │ @scene 3  │
├──┴─────────────────────────────────────────────────────────────┴───────────┤
│ ▶ ▮▮▮▮▮▮▮▮ scene strip / timeline (⌘J)                                      │
└────────────────────────────────────────────────────────────────────────────┘
```

| Region | Size | Toggle | Notes |
|---|---|---|---|
| Left rail | 56 px icons; 240 px expanded | ⌘B | Studio, New, Library, Settings. Hover the 4 px edge to peek when collapsed (Arc-style) |
| Copilot dock | 320–560 px, resizable | ⌘. (and ⌘I) | Collapses to a 40 px liquid-glass pill on the edge. Width and open state remembered per user |
| Scene strip | 72 px; 160 px expanded | ⌘J | Click a scene to jump. Drag to reorder in Storyboard |
| Command palette | Modal | ⌘K | Projects, scenes, assets, voices, actions |

Built with `react-resizable-panels` v4 (`Group`, `Panel`, `Separator`, `usePanelRef().collapse()`), so each side collapses independently. Users disliked Figma's all-or-nothing hide.

Phone (≤ 768 px): the rail becomes a bottom tab bar, the Copilot becomes a bottom sheet, and the scene strip becomes a vertical list. The Share page and video review must work at 390 px.

### 1.6 Screens

#### Landing `/`

- Hero: kinetic headline "Any idea, at play." with Lattu spinning in, over aurora. One button: **Start creating** (sign in). A 9:16 phone frame plays a real Leela video (muted, captioned, with a pause control and a static poster under reduced motion).
- A bento of the modes, each tile looping a real 4 s clip on hover.
- "How it works" in four clay steps: Idea → Storyboard → Video → Share.
- A Code Lab strip: code on the left, the recursion tree growing on the right, as a looping clip.
- No invented numbers, no testimonials, no features that are not built (the Wedding Home rule).

#### Studio home `/studio`

```
┌ What shall we make? ______________________________ [Explainer▾] [Go ✦] ┐
│  chips: "Explain recursion with chai"  "Planets for kids"  "Binary search" │
└──────────────────────────────────────────────────────────────────────────┘
┌──────────────┬───────┬───────┐  ┌ Quotas ───────────┐
│ big card:    │ card  │ card  │  │ LLM      ▮▮▮▯ 62% │
│ last edited  ├───────┼───────┤  │ Voice    local ∞  │
│ (hover plays)│ card  │ card  │  │ Images   ▮▯▯▯ 10% │
└──────────────┴───────┴───────┘  └───────────────────┘
Filters: All · Drafts · Ready · Failed · Explainer · Code Lab · …     Search
```

Cards: thumbnail, title, mode chip (colour per mode), format icon, length, "edited 2h ago", state badge. Empty state: Lattu holding an empty film reel and three clay prompt chips.

#### New project `/studio/new`

Bento of clay mode tiles (Explainer, Code Lab, Story, Audio, Cartoon, Montage; later ones show "soon" and are not clickable). Then a single row: format (9:16 / 16:9 / 1:1 as mini frames), length slider (15 s to 3 min, snapping to 15, 30, 45, 60, 90, 120, 180), language, voice (▶ sample), and style (three swatch cards that play a 3 s loop). **Create** makes the project and opens Idea.

#### Project → Idea

Two columns. Left: topic (big text area), audience, notes (collapsible), must-include bullets, **Brainstorm** (angles appear as clay cards; click to use). Right: a summary card of the choices and **Plan storyboard ✦**.

Code Lab Idea: a CodeMirror 6 editor (Python / JavaScript tabs), a function picker, input fields generated from the signature, **Trace ▶**, and a trace preview with step controls (⏮ ◀ ▶ ⏭, a step slider), the call stack, and variables. The examples drawer has the built-in algorithms.

Story Idea (layer 6): adds the cast picker (character avatars) and the scenery picker.

#### Project → Storyboard

- A horizontal filmstrip of scene cards (a vertical "Script" view toggle shows only the narration, for reading through).
- Each card: number, purpose chip, the live scene preview (9:16 mini player, loops on hover), narration lines as editable text, a 🗣 spoken-form toggle per line, estimated seconds, and component chips.
- Drag to reorder (`@dnd-kit/react`). ⋯ menu: duplicate, delete, regenerate this scene, ask Copilot about this scene.
- Top: total length bar against the target. **Approve & make video** is a clay clapper button that "claps" on press.
- When the Copilot proposes a change, changed cards glow with a rani outline, and a diff card in the dock shows before/after per scene with **Keep** and **Discard**.

#### Project → Video

- While running: Lattu plus the stage list (✓ Narrating, ● Timing, ○ Building, ○ Rendering 42%, ○ Checking), each with an honest estimate. Scene thumbnails fill in as they finish. Leaving is safe; a toast and a browser notification fire on finish.
- When ready: the player (`<video>` for the MP4), a safe-zone overlay toggle (Reels / Shorts / none), a captions toggle, the scene strip under the player, versions as chips (v1, v2 ✓ current), download MP4 / SRT / thumbnail, and caption fix mode (click a caption word to correct its display).

#### Project → Share

The video, **Copy share link** (with an on/off switch), **Download** options, a suggested caption with an AI disclosure line, hashtags, a "commercial-safe" badge or the list of assets that block it, and (layer 8) Post to YouTube / Instagram with post now or schedule.

#### Library `/studio/library`

Tabs: **Characters** (cards with expressions on hover; New character), **Voices** (a list with ▶ samples, language, accent, provider, a "free / local" badge; a sample sentence box to try any voice), **Assets** (masonry grid, filters by kind, licence badge on every tile), **Styles** (video style cards with loops).

#### Settings `/studio/settings`

Sections: Account; Preferences (defaults, glass Clear/Tinted/Solid, motion, fun copy, UI sound, pronunciation list); Providers & quotas (each provider, limit, used today, resets at, "sees your content" and "trains on free tier" flags); Connections (layer 8); Invites (Owner).

#### Share page `/v/{token}`

Ink background, a soft aurora at the edges, the video centred at the right aspect, the title, "Made with Leela ✦". Nothing else. Works at 390 px.

### 1.7 Libraries for the studio

| Need | Package | Licence | Note |
|---|---|---|---|
| Framework | Next.js 16, React 19, TypeScript | MIT | As in The Wedding Home |
| Styling | Tailwind CSS v4 with the tokens above | MIT | `@custom-variant reduced-transparency` |
| Primitives | shadcn/ui (Base UI default) | MIT | Copy-in components |
| Animation | `motion` (`motion/react`) | MIT | Motion+ is not needed |
| Panels | `react-resizable-panels` v4 | MIT | |
| Palette | `cmdk` via shadcn Command | MIT | |
| Toasts | `sonner` | MIT | |
| Drag | `@dnd-kit/react` | MIT | Pre-1.0; scene reorder only |
| Code editor | CodeMirror 6 | MIT | Lighter than Monaco |
| Video preview | `@hyperframes/player` web component | Apache-2.0 (repo) | Confirm the licence field before shipping |
| Confetti | `canvas-confetti` | ISC | `disableForReducedMotion: true` |
| Mascot | SVG + Motion; later `@rive-app/react-canvas` | MIT runtime | |
| Avoid | `tldraw` (licence key required in production), `vaul` (unmaintained) | — | |

---

## Part 2 — Video styles

A **Style** is data: palette, fonts, caption look, motion temperament, background treatment, and illustration style. Components read the style; the planner never picks colours.

### 2.1 Rules every style obeys

- One idea per scene. Progressive disclosure: elements arrive as they are spoken, and a move lands on the word it illustrates.
- A scene change sits in the pause before the next line, not on top of a word. When the piece is cut to music and there is no narration, the cut sits on a measured beat instead.
- Motion explains (direction, cause, sequence, emphasis). No random bouncing.
- Motion has weight. A move is a spring: it arrives, UI may overshoot a hair, type does not, then it settles. The spring is a function of time, so any frame can be drawn without replaying the frames before it. When a value changes target more than once, each change adds a spring. The previous one is not restarted.
- Calm styles (Chalk & Chai, Storybook) keep moves in the 400–900 ms range. Energetic styles (Broadcast, and Launch when it exists) put something new on screen every 2–4 seconds. No style flashes faster than 3 times a second.
- Banned unless the chosen style explicitly asks for that one thing: a centered title sitting on a gradient as the whole scene, every element fading in together, corner brackets and frame borders, glow on ordinary UI, a generic particle burst. Neon Lab's pointer glow and Broadcast's corner frame are asked for. A gradient title card is not.
- Captions: word-highlight, two lines maximum, ≤ 42 characters per line on 9:16, inside the safe zone. **No white or cream pill boxes behind captions.** Use text with a soft shadow or a thick outline. (Aryan disliked pill captions on the birthday reel.)
- No em-dashes in on-screen text.
- Text never sits on a face or a key diagram element; the compiler reserves a caption band per format.
- Fonts and libraries are local files at render time.

### 2.2 Launch styles

| Style | For | Look |
|---|---|---|
| **Chalk & Chai** | Explainer | Warm paper `#FBF4E8`, ink `#2A2238`, accents teal `#0E9C8F` and saffron `#F29F05`. Rounded vector icons, hand-drawn underlines, a handwritten accent font (Caveat / Kalam for Devanagari). Calm |
| **Neon Lab** | Code Lab | Night `#0B1020`, code panel `#121A33`, highlights cyan `#3DE3F5`, pink `#FF5FA2`, lime `#B8F35B`. JetBrains Mono, glowing pointers, crisp grid |
| **Storybook** | Story, Cartoon | Soft painted backgrounds, a warm vignette and film grain, a rounded display font (Baloo 2, which covers Devanagari), sticker-style speech labels |

Layer 6 adds **Desi Pop** (truck-art colours, Devanagari glow headers, stickers), the style closest to what Aryan liked in the birthday reel, and **Broadcast** (a black field, one hot accent, word-locked type, an optional corner HUD). Broadcast is specified in `docs/reference/MOTION_CRAFT.md`. It is not a launch style, and it does not copy another creator's palette.

### 2.3 Format layouts

| Format | Size | Caption band | Safe area for key content |
|---|---|---|---|
| 9:16 Reels/Shorts | 1080×1920 | y 1380–1580, x 100–960 | x 100–960, y 250–1360 (top 250 px: handle and audio bar; bottom ~340 px: caption and buttons; right ~120 px: action buttons; proven on the birthday reel) |
| 16:9 YouTube | 1920×1080 | y 860–1000 | x 96–1824, y 80–840 |
| 1:1 Post | 1080×1080 | y 900–1020 | x 60–1020, y 60–880 |

Values are compiler defaults; check them on real phones in layer 2 and adjust once.
