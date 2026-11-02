# Leela — product spec

**Name:** Leela (लीला, "play"). Working name, picked 2026-10-19. Domain and trademark not checked. Options and reasoning: `docs/journey/2026-10-19-names.md`.
**Tagline:** Any idea, at play.
**Mascot:** Lattu, a spinning top (an Indian toy). It spins while the studio works.

This file is the locked vision. The PRD is what we implement against. Later design does not add pages to it.

## What Leela is

A web studio that turns an idea, some notes, or a piece of code into a finished short video, with narration, captions, motion, and music. It covers DSA walkthroughs, calm science explainers, illustrated stories, and cartoon reels. One creator does it alone, in minutes, with no editor skills.

It is inspired by NamasteVideo.ai (Akshay Saini's internal pilot). It keeps that product's discipline: the AI plans, the creator approves, trusted code renders, and every version is kept. It goes past that product in four ways:

1. **Modes, not one template.** Explainer, Code Lab, Story, Cartoon, and Audio share one pipeline and one scene graph.
2. **Code Lab.** Paste code and see it run. The call stack, the recursion tree, the array, and the pointers move in time with the narration, driven by a real execution trace and not by the AI's guess.
3. **Scenes with people and places.** Scenery, characters, laptops, and props come from an open-licensed library and from AI stills, with camera moves, so a story has a world and not only diagrams.
4. **Free-first, sellable later.** Every provider sits behind an adapter with a quota meter. Going from free to paid is a config change. Every asset records its licence.

## Who this is for

People who operate the product (they sign in):

- **Creator.** Aryan first. Later, invited creators, each with a private studio.

People who only visit (no account):

- **Viewer.** Anyone with a share link to one rendered video.

## Surfaces

1. **Studio** (signed in). One private studio per creator. v1 has no teams.
2. **Share page** (public by link). `/v/{token}` plays one video the creator chose to share. Viewers see nothing else.
3. **Landing** (public). What Leela makes, with real example videos.

v1 accounts are invite-only. An email on the allowlist can create an account. Public signup is a later layer.

## Shared data

Nothing is shared between creators. The system library (scenery, props, icons, music, voices, styles) is read-only and the same for everyone. A creator's characters, uploads, and projects are private.

## Who can do what

| | Creator | Viewer | Owner (operator) |
|---|---|---|---|
| Create, edit, render, and delete own projects | ✓ | | ✓ |
| Manage own characters, uploads, and voices | ✓ | | ✓ |
| Share or unshare a video link | ✓ | | ✓ |
| Watch a shared video | ✓ | ✓ | ✓ |
| Invite an email, see provider quotas for the whole app | | | ✓ |

The owner is a creator with one extra flag. There is always exactly one owner, set from the environment, so the studio can never lose its owner.

## Modes

A mode is a starting preset over the same scene graph: which components the planner may use, its default length and format, and the shape of the Idea step.

| Mode | Makes | Visual engine | Layer |
|---|---|---|---|
| **Explainer** | Concept and science videos (orbits, the water cycle, how the internet works) | Diagram and motion components, icons, scenery presets | 2 |
| **Code Lab** | DSA and code walkthroughs (binary search, recursion, BFS, DP) | Data-structure visualisers fed by an execution trace | 3 |
| **Story** | Illustrated narrated stories, fables, "a day in the life" | Scenery, characters, AI stills, camera moves, music | 6 |
| **Audio** | Narration, story audio, a podcast-style talk, with an optional audiogram video | Voices, music, waveform and caption visuals | 7 |
| **Cartoon** | Reels with original recurring characters who talk to each other | Rigged 2D puppets with lip sync, dialogue between voices | 9 |
| **Montage** | Birthday, travel, and festival reels from your own photos and a song | Beat-synced cuts (the Reel Studio engine) | 9 |
| AI clips | Short generated cinematic shots inside a scene | Image-to-video model on a GPU | Later |
| Persona | A talking presenter or avatar | Talking-head model or a paid avatar API | Later |
| Launch | A product film from screenshots, a logo, and one real number the creator supplies. The UI is never redrawn from imagination | The same scene graph: assemble, cursor, morph. Cuts follow the music when there is no narration | Later |

## Creator pages

These names are the page map. Later docs do not add navigation items.

| Page | Path | Job |
|---|---|---|
| Sign in / Create account | `/sign-in`, `/join/{token}`, `/reset/{token}` | Invite-only account, password reset |
| Studio home | `/studio` | Your projects as a bento grid, a "What shall we make?" bar, mode chips, and quota meters |
| New project | `/studio/new` | Pick a mode, format, length, language, voice, and style, then start |
| Project | `/studio/p/{id}` | One workspace with four steps: **Idea → Storyboard → Video → Share** |
| Library | `/studio/library` | Tabs: Characters, Voices, Assets (images, music, sound), Styles |
| Settings | `/studio/settings` | Account, providers and quotas, connections (YouTube, Instagram), preferences |

Inside **Project**, step by step:

- **Idea.** A topic, notes, and audience. Code Lab adds a code editor and an input box, then runs the trace. Story adds a cast picker. A brainstorm button suggests 3 to 5 angles.
- **Storyboard.** A filmstrip of scene cards. Each card shows the narration, the scene's live preview, the estimated time, and its components. Edit text inline, reorder by dragging, and approve.
- **Video.** Render progress (Lattu spins, with the real stage beneath it), then the player with a scene timeline strip, caption fixes, and version history.
- **Share.** Download MP4, SRT, and a thumbnail, copy the share link, a suggested post caption (the client builds it from the title plus the AI-disclosure line), and (in a later layer) post to YouTube Shorts or Instagram.

On every project page:

- The **Copilot dock**, a right panel that collapses to an edge button like Cursor's. Chat revisions live here ("make scene 3 slower", "explain it for a 12-year-old", "add a dog").
- The **Command palette** (⌘K): jump to a project, scene, asset, voice, or action.

## Viewer pages

- `/v/{token}`: the video, its title, and a "Made with Leela" link. No comments and no account.

## Public pages

- `/`: the landing page, with real rendered examples and no invented numbers.

## Layers (build in this order)

A layer is done when a person can finish that job in the UI.

0. **Engine spikes.** Prove the render pipeline before the app (see the PRD, §8.1).
1. **Shell and studio.** Invite-only sign-in, the studio home, create/rename/delete project, and the settings skeleton.
2. **Explainer end to end.** Idea → AI storyboard → approve → narration with word timing → render → watch → download.
3. **Code Lab.** Code editor, sandboxed trace, data-structure visualisers, and trace-synced narration.
4. **Revise and version.** Copilot chat revisions, scene-level regenerate, caption fixes, version history, restore.
5. **Share and deploy.** Share links, a hosted web app with a render worker, and quota meters.
6. **Story and Library.** Scenery, characters (cast), AI stills with camera moves, music and SFX, Hindi and Hinglish voices.
7. **Audio mode and formats.** Audio-only output, audiograms, and 16:9 and 1:1 everywhere.
8. **Publish.** YouTube Shorts and Instagram Reels, post now and schedule.
9. **Cartoon and Montage.** Puppet characters with lip sync, dialogue, and photo-and-song montage.
10. **Later.** AI clips, Persona, Launch, public signup, teams, billing. A storytelling series is not a new page: it is several projects that share characters, a voice, and a style from the Library.

## Domain fields (on existing pages, not new menus)

| Field | Where | Why it exists in this domain |
|---|---|---|
| Format (9:16, 16:9, 1:1) | New project, Video | Reels and Shorts are vertical, YouTube is wide, and posts are square |
| Target length (15 s to 3 min) | New project, Storyboard | Hooks are short and lessons are long. Real narration sets the true length |
| Language (English, Hindi, Hinglish) | New project | Indian creators speak in all three |
| Pronunciation hints ("SQL" → "sequel", "Dijkstra" → "dike-stra") | Storyboard, Copilot | TTS mangles names and acronyms |
| Spoken form vs shown form (`O(n log n)` read as "O of n log n") | Storyboard card | Code and maths read differently from how they look |
| Safe zones per platform | Video preview overlay | Instagram and YouTube UI cover the top and bottom |
| Licence and attribution per asset | Library, Share | Selling later needs a clean licence trail |
| AI-generated disclosure | Share | Platform rules and honesty |
| Trace input (array, target, n) | Code Lab Idea | The same code with a different input is a different video |

## Not this version

- Cinematic text-to-video as the main engine (it comes later as "AI clips", inside scenes only)
- Copyrighted characters (Pokémon, Motu Patlu, Disney) or real people's faces and voices
- Voice cloning
- A full timeline editor with frame-by-frame editing (we have a scene strip and chat, not Premiere)
- Teams, comments, client approvals
- Billing, credits, public signup (all later)
- Arbitrary server-side code execution (Code Lab traces run sandboxed in the browser)
- Open-web research or citations the AI did not actually read
- Sending the renderer out to screenshot someone else's website. A Launch film uses files the creator uploaded and has the right to use
- A series object. Recurring characters already live in the Library, so episode 12 is another project with the same cast

## First slice (next build)

Layer 0, the engine spike: a 45-second "How binary search works" Explainer, planned by an LLM into a validated scene graph, narrated by Kokoro with word timing, compiled to HyperFrames, and rendered to a 9:16 MP4 on this Mac.
