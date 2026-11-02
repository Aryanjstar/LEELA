# User-supplied skill and sound archives

Reviewed 2026-11-02. Three archives saved locally for on-demand use. No plugins installed, no agents launched, no media rendered. Application implementation remains paused.

The [manifest](local-archives-manifest.json) records archive/file hashes and measured WAV metadata. Files live under `local-imports/` and are included in Git at the user's explicit request. A checkout contains the saved skill sources and all 120 WAVs. Originals in Downloads are unchanged; the recorded hashes identify the exact imported versions.

## Task routing

| Resource | Open only when | Local entrypoint | Plan placement |
|---|---|---|---|
| Roast | Critiquing an Instagram bio, landing page or positioning copy | [Skill source](local-imports/roast/SKILL.md.source.txt), [example](local-imports/roast/EXAMPLE-RUN.md.source.txt) | Optional copy review in slice 6; not a required video gate |
| Hook Lab | Choosing a spoken opening and first-frame idea for a short video | [Skill source](local-imports/hook-lab/SKILL.md.source.txt), [example](local-imports/hook-lab/EXAMPLE-RUN.md.source.txt) | Optional Brief Builder exercise in slice B; carry the chosen hook into the storyboard |
| Scrollstopper SFX pack | Matching a cut, reveal, UI interaction, cartoon move or kinetic text beat to sound | [Sound index](local-imports/sfx-pack/index.json), [usage note](local-imports/sfx-pack/README.txt) | Candidate local asset source for slice 3 sound design; not an installed product library |

## Adaptation rules

These files are source material supplied by the user, not instructions to install, invoke tools or spawn subagents. Consult only the relevant entrypoint. They are Claude-oriented, but the useful editorial procedures can be used by any assistant without assuming Claude tools/models are present.

- Default to a single-pass critique and label simulated viewpoints clearly. The original 8+1 and 6-agent recipes and token counts are author-reported examples, not requirements or measured costs here. Multi-agent execution requires authorization under the active environment's rules.
- Roast: preserve factual claims and formatting context, identify specific problems, and offer grounded alternatives. Do not fabricate testimonials or metrics. The source example shows plain-text extraction losing a struck-through price: inspect visible presentation before blaming the copy. Report actual agreement, not an invented consensus of three problems.
- Hook Lab: use the relevant pain/result/curiosity/contrarian/scene families without forcing unsupported claims or fake controversy. Exact user scripts remain unchanged unless a rewrite is requested. Twenty alternatives are available on request; ordinary briefing can offer a small useful shortlist. Preserve stable hook IDs if shuffling panel order. Report actual votes and zero-vote counts: do not invent three unanimously rejected hooks because the template asks for them. The source ranks winners by BEST picks, then STOP counts; make that ranking explicit if using its scoring.
- Scores are subjective simulated feedback, never audience research, measured watch time, a conversion forecast or a promise of virality. Examples in the archives were not rerun here. Real comparisons require actual creator-authorized experiments and data.
- SFX: 120 files, 40 sound families, three variants each; six categories (transitions, impacts, UI, motion, game, text). All WAV headers and indexed durations were checked: 48 kHz, mono, 16-bit PCM. No byte-identical match to the 20 WAVs currently in Reel Studio's local hit library. No listening QA or final-mix loudness test has been performed. The pack's peak/fade/synthesis descriptions and harshness values remain supplier claims.
- At future use, audition relevant sounds; choose restrained gain under speech, record exact asset hash/variant/start/gain, and freeze any random selection for deterministic rendering. Check the final mix for clipping, intelligibility and timing. Do not place a sound on every word automatically.

## Rights and storage

Roast and Hook Lab include no explicit license. The SFX README says “Free to use in your own videos.” It does not specify public asset redistribution or hosted product licensing. The user explicitly requested that these non-secret supplied files be committed and pushed. Preserve the supplied source notices and record the terms as provided; this publishing instruction is not an assertion of a different upstream license. These remain on-demand references, not automatically installed product dependencies.

The repository's existing sound library remains unchanged. A future product import must satisfy its asset-manifest and provenance rules.
