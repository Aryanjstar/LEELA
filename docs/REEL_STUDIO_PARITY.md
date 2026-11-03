# Reel Studio → SceneSpindle parity checklist

Reviewed 2026-11-03 against the separate [Reel Studio repository](https://github.com/Aryanjstar/reel-studio), its AGENTS.md, docs/PROJECT_STATUS.md, docs/REEL-TYPES.md, and tracked tools/templates. This is **target scope**, not a claim that the tools have already been copied into SceneSpindle or that every Reel Studio recipe has shipped a final. The separate repo remains the source for porting. Its uncommitted personal media and later local projects are outside this GitHub snapshot.

| Reel Studio capability | Current Reel Studio evidence | SceneSpindle acceptance target | Planned slice |
|---|---|---|---|
| Personal, travel, festival, event and inspiration montage | Two accepted montage finals; `make-reel`, `inspo.py`, `templates/montage` | Ingest copies originals; shot selection and reference-cut analysis produce a beat-timed, visually inspected MP4; no dependence on a specific assistant | 3 |
| Singing cover | Accepted Tose Naina final; `cover-reel`, cover prep/audio/timing templates | Preserve live vocal; align lyrics; mix/grade, inspect and export a reproducible cover, with revisions | 3 |
| Talking head and podcast clip | Skill and recipe; no accepted final recorded in the cited status | Spoken audio retained; silence/jump-cut decisions, captions, punch-ins, optional subject effects; inspected export | 3 |
| Kinetic type | Skill and recipe; no accepted final recorded | Words move with meaning and measured speech timing; readable/safe text; inspected export | 3 |
| From-scratch launch, showreel, explainer and 3D motion | Skill and recipe; no accepted final recorded | Storyboard, asset/scene approval, 2D/3D render and media QA; use the right renderer | 3–4 |
| Lyric video and product/site promo | Recipe routing in REEL-TYPES; not independently proven | Route lyric video through song/timing workflow; promo through motion or talking-head with screen B-roll | 3 |
| Ingest, scene detection, contact sheets, face-aware framing and HDR handling | `tools/ingest.py`, `scenes.py`, `sheets.py`, `qa.py` | The creator can preview source clips, choose exact cuts, preserve originals and catch visual defects on final MP4 | 3, 6 |
| Song analysis and sound mix | `song.py`, cover audio helpers, SFX library and docs/SFX.md | Downbeat/half-bar cut options, per-track gain, speech ducking, deterministic SFX cues and audible QA | 3 |
| Editing styles, named effects, fonts and stickers | docs/STYLES.md, docs/EFFECTS.md, montage/cover templates | Registered, tested presets/components; a listed name is not shown as available until its example renders | 3–4, 6 |
| Revisions, version history, narrow edits and final handoff | Per-project README/version discipline; AGENTS.md rules | Preserve previous final; change only requested shots/audio; frozen inputs and reproducible versions | 0b, 1, 3 |
| LinkedIn/X banners and static brand graphics | Accepted Ember banners; `banner.py`, templates/banner, docs/BANNERS.md | Optional static-asset workflow with preview, safe-area check, editable text/style and PNG export | 6a |
| Headline, About and bio copy | Accepted copy in docs/PERSONAL-BRAND.md | Optional creator copy tool with factual review and platform length checks; no invented credentials or metrics | 6a |
| Captions, posting checklist and growth references | docs/CAPTIONS.md, docs/GROWTH.md; some advice may age | Reviewable captions/metadata and platform-safe export checklist; verify current rules when used; publishing integration remains SS-16 | 6 |

**Parity gate:** each row needs a real user journey, test or inspected example, recorded in PROJECT_STATUS.md. A saved skill/recipe, imported script, successful unit test or generated HTML preview alone does not pass. Keep video editing separate from optional static creator utilities in the UI so the core flow stays focused. Existing working Reel Studio behavior can be adapted; a direct copy is not automatically portable or complete. Record any deliberate difference in this matrix before claiming full parity.
