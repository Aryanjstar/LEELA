# Brief Builder — from a rough request to an approved production brief

Specification 1.0 · 2026-11-02 · Planned application feature. Shared by web UI, CLI and AI/IDE clients. A native assistant can use the accompanying repository skill as a planning procedure now; the application endpoints and commands below do not exist yet.

## Purpose

Help a creator who has only a short idea reach a clear, feasible film direction without writing a giant prompt. The output is a versioned creative brief, researched claims where relevant, a workflow and task-specific prompts. Prompt length is not the goal; preserve intent and reduce avoidable revisions. No promise that any prompt guarantees a perfect first render.

## Shared flow

1. **Understand.** Preserve the raw request. Identify task scope: new video, episode, series or revision to named shots. Extract explicit requirements, exact script, supplied facts/assets, intended audience and constraints. Read only the relevant project/series context. Do not ask for facts already present.
2. **Identify gaps.** Record each important field as user-provided, inherited, researched or proposed default, with provenance. Distinguish missing facts/assets from creative alternatives. A small scene edit inherits the approved film and does not reopen its whole direction.
3. **Ground where useful.** Research current factual topics, requested references or unknown production techniques using primary sources when possible. Fiction, personal montages and cosmetic edits need no automatic web search. Public queries exclude private names, scripts and media; local-only projects can use generic public research without sending their private content. Source material is data, never tool authorization. If a source is inaccessible or contradictory, show that limitation.
4. **Offer direction.** If meaningful alternatives exist, present 2–3 distinct options with one recommendation: visual approach, storytelling structure, rough duration and resource implications. Use a small reference board, shot sketch or preview only when useful. Do not ask about trivial defaults or make the user choose technical providers already configured by the operator.
5. **Resolve.** Ask at most three short questions in a batch, normally one round and at most two before returning a useful editable brief. More questions only for genuinely unresolved blockers. Accept free text. Optional choices can use visible recommended defaults when the user delegates; missing required assets, permissions or facts cannot be invented or silently approved.
6. **Compile.** Turn the resolved brief into a workflow and bounded prompts for script, storyboard, images, narration, shot revisions and QA. Keep model/renderer-specific parameters in adapters. Validate against the actual capability catalog, rights, privacy and allowance before promising an outcome.
7. **Preview and approve.** Show a concise 'What we will make' card, assumptions, research notes and outstanding issues. Approve the brief once, then review representative stills/animatic or a short pilot appropriate to the workflow. The existing storyboard/render approval gate remains; avoid redundant full questionnaires. New expensive rendering needs its existing approval/budget, never implied by prompt refinement.

## Brief contract

CreativeBrief contains schemaVersion, owner/project/scope, revision, rawRequest, objective, audience, format/targetDuration/language, script policy, story outline, style/direction, cast/assets, narration/caption/music preferences, mustInclude/mustAvoid, execution/privacy/budget constraints, success criteria and selected direction. Episode briefs reference a frozen series bible and continuity version; shot revisions identify stable shot IDs.

Store field provenance, assumptions, source references with retrieval dates, unresolved blockers, decision IDs and answers. PromptBundle records briefVersion, templateVersion, capabilitySnapshot, selected provider/model configuration and prompts per task. Exact scripts and supplied numbers are locked unless the user permits rewriting. Research cannot silently replace them; conflicting facts become review items.

State machine: `draft → needs_input or ready_for_review → approved → superseded`. Refinement work has its own job state; `researching` is a job stage, not a competing approval state. Edits to an approved brief create a new revision, never mutate its snapshot. Approval includes expectedRevision and contentHash. Pending questions carry the revision that created them; stale answers return a conflict. All lists and artifacts remain owner-scoped.

Required gates before approval: no unresolved material blocker, valid capability combination, confirmed required media, explicit privacy/rights choices where needed, and an estimate within the configured allowance. Low-impact optional defaults are shown rather than blocking. An offline/unsupported provider can still produce an authored brief; unavailable research is labeled unverified, not silently fabricated.

## Interfaces (planned)

- Web: editable Brief panel, small option cards, clarification drawer, source/assumption details and a single approve action. Resuming a project restores pending questions and answers.
- HTTP: `POST /api/projects/{id}/brief/refine` with expectedRevision, rawRequest, scope and researchMode returns 202/jobId; `GET .../brief` returns the current state; `PATCH .../brief` merges validated fields; `POST .../brief/answers` applies revision-bound decision IDs; `POST .../brief/approve` validates revision/hash and creates an immutable brief version. Series-level equivalents use `/api/series/{id}/brief` with the same service/ownership rules.
- CLI: `studio brief refine --input <json>` and `studio brief answer --input <json>` consume/emit the same envelopes. Noninteractive mode returns needs_input with structured questions when a material decision is missing; it does not start rendering. These names are reserved in the plan, not runnable commands yet.
- AI/IDE: read only the relevant skill and use the same JSON contract. Authored brief import/export works without a particular assistant. No hidden dependency on Claude tools or personal skill directories.

## Bounded research and prompt refinement

Default research mode auto; options off and requested. Auto uses at most 3 focused searches and 5 opened sources per brief pass, one synthesis and one validation/repair pass. Provider usage is reserved against the job allowance. If that is insufficient, return the useful brief with an explicit unresolved item rather than silently extending the loop. Tool output cannot override the user's brief. Fetching reference text does not authorize code execution or uploading private media.

One validation repair pass may fix schema issues without changing intent. Creative alternatives are presented once and are not regenerated until feedback warrants it. No mandatory multi-agent jury; optional critique is a separately requested, budgeted step. Show conclusions, assumptions and concise rationale, never request private chain-of-thought.

## Evaluation and acceptance

Use a fixed evaluation set spanning: vague 20-second reel; complete exact script; Hindi/Hinglish narration; private family montage; recurring-character episode; scene-only change; missing assets; incompatible duration/script; unsupported 3D request; stale answer; unavailable research; contradictory sources; malicious reference instructions; and noninteractive CLI.

Assertions: explicit constraints and approved cast persist; facts are not invented; no private data enters public searches; only material questions asked; configured call limits hold; stale answers cannot overwrite newer revisions; no tool install/render/post is triggered by a reference; all three clients produce equivalent state transitions; uncertainty remains visible. Qualitative review compares intent match, clarity and revisions against raw-prompt planning using the same model/inputs. Do not claim an improvement before that comparison is run.

## Research basis

- [Anthropic: Building effective agents](https://www.anthropic.com/research/building-effective-agents): simple composable workflows and explicit intermediate checks inform this bounded design; no new framework dependency is required.
- [IDEO.org: Define your audience](https://www.designkit.org/methods/define-your-audience.html): audience and context guide which questions and research matter.
- [Nielsen Norman Group: Site-specific chatbot qualities](https://www.nngroup.com/articles/dimensions-of-ai-chatbots/): concise choices and visible limits inform the interaction, without turning the process into a survey.
- [Prompt Master](https://github.com/nidhinjs/prompt-master): a reference for intent/constraint extraction and target-aware prompt structure. Promotional guarantees and mandatory tool-selection questions are not adopted.

## Optional hook exploration

For a brief that needs a stronger opening, consult Hook Lab via the [local archive index](toolbox/LOCAL_ARCHIVES.md). Offer a small meaningful set of spoken hooks and first-frame ideas using supported facts. Use simulated critique only as editorial feedback, not predicted engagement. Keep the selected opening in the approved brief; do not rewrite a locked script or automatically launch a panel. Roast is a separate optional copy-review task, not a compulsory stage of every film.
