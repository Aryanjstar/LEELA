# SceneSpindle — design specification

Version 2.0 · 2026-11-02. Editorial film-studio direction replaces the previous glass-led proposal.

## Brand and interface

SceneSpindle — AI Video Production Studio. Graphite backgrounds, warm white type and saffron accents. Spacious editorial typography, a filmstrip motif, subtle texture, real rendered thumbnails and restrained motion. The historical spinning-top character can remain inside existing films; it is not a required subject or mascot for every project.

Landing: concise statement, real showreel with accessible poster/play controls, demonstrated workflows, three-step process, honest status and invite sign-in. No invented usage statistics or unavailable features represented as live controls. Generate original artwork only when it improves the page; label illustrative material distinctly from actual product output.

Dashboard: projects and series, search/filter, recent renders and visible usage state. Project workspace: brief, scene strip, focused editor/preview, revision dock, render queue, export panel. Libraries: assets, voices, characters and styles with provenance and compatibility. Settings: account, invites, execution targets, providers and budgets. Mobile prioritizes review and essential edits without horizontal overflow.

Keyboard focus, labeled inputs, contrast, accessible dialogs, reduced motion, loading/error/empty states and undoable edits are required. Preview timing, estimated duration, proxy quality, waiting quota and failed stages are explicit. Preserve unsaved edits on conflicts. Never mark a save successful before persistence.

## Video craft

Video styles are versioned presets independent of UI colors: editorial, illustrated/storybook, kinetic, paper collage, blueprint, low-poly/clay and other styles only as implemented. The 50-style lists are vocabulary, not 50 working renderers. Each preset names supported formats, fonts, motion vocabulary, caption policy and reviewed sample.

Captions: phrase-oriented default, 3–6 words when natural; punchy preset 2–3 words; at most two lines and measured width. Preserve word timing, punctuation and Devanagari graphemes. Wrap or split long phrases at safe boundaries; flag unrenderable text. Active-word highlight is optional. No white/cream pill boxes, long paragraphs over footage or on-screen em dashes by default. Supplied exact scripts are not rewritten for a hook without approval.

Hooks: clear topic/common ground, optional contrast, then a payoff supported by the content. Test a 3–5 word visual headline and an opening visual with a readable subject. Avoid deceptive claims, forced cliffhangers and the assumption that every film needs the same structure.

Motion: meaning before decoration; sample a short pilot before scaling a treatment to an episode. Reusable actions include reveal, highlight, draw, morph, push/pan, type emphasis and beat cut. Heavy HUD overlays are an opt-in style, never universal chrome. Check scene boundaries at cut−1frame/cut/cut+1frame.

Sound: measured beat/downbeat anchors, separate music/voice/SFX tracks, ducking and -14 LUFS target with true peak ≤-1 dBTP for the initial delivery profile. Quiet/emotional work can override treatment deliberately. Music references are discovery aids, not redistribution licenses.

Optional subject cutouts support foreground/midground/background text layers; edge quality and temporal consistency must be inspected. Optional editable export clearly distinguishes editable cuts/audio from baked procedural motion.

## Brief Builder interaction

Add a compact 'What we will make' panel before the storyboard. Show meaningful alternatives as 2–3 cards with recommendation and tradeoffs, followed by concise questions only where needed. Separate creator requirements from proposed defaults and researched facts. Expose sources/assumptions on demand, keep the raw request available, and preserve answers across refreshes. Scene-only edits inherit context. Use representative stills/animatics to resolve visual uncertainty before full rendering; no mandatory long questionnaire or false 'perfect prompt' score.
