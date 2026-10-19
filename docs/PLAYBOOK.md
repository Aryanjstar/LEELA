# Zero → working SaaS playbook

> **Leela note (2026-10-19).** Copied from The Wedding Home, the first product that ran this method. Its examples stay as the worked example. Leela is the second run, and adds three things for AI-media products:
>
> 1. **Stage 2b: prove the engine before the app.** When the product's core is a generative pipeline, write spikes (`spikes/<name>/REPORT.md`, a pass/fail and a human 1–5 score) before scaffolding the app. NamasteVideo.ai and Reel Studio both found the hard problems in the engine, not the UI.
> 2. **Stage 3c: write the AI ↔ renderer contract.** The system design must define the schema the model fills (here the scene graph) and the rule that model output is data, never code.
> 3. **Stage 3c: the free-tier and licence pass.** Every provider gets a row in RESEARCH.md: free limits, commercial use, training on input, and the source with a date. Every asset source gets a licence verdict for automated use. "Free" and "sellable" are different columns.

A repeatable path. The Wedding Home is the first time we ran it. Copy this file into a new repo when the next idea starts. Fill every stage before you write a lot of code.

Do not skip the **write-it-down** step. Chat is not the archive. Keep the dated journey log (`docs/journey/`) in the repo folder but out of git unless you decide to publish it; the method (this file) is what gets shared.

Four files stay the source of truth once they exist: the PRD, the system design, the database design, and the API design. Code, Stitch, and any reference repo follow them. Change those four only when the human explicitly asks.

Each finished step is its own short commit, on a branch when the change is a new slice, then merged to `main` and pushed. The checklist is [templates/GIT.md](./templates/GIT.md).

---

## Stage 0 — Capture the mess

**Goal:** Get the raw idea out without cleaning it.

Ask:

- Who hurts, and on what day of their life?
- What are they using today (Excel, WhatsApp, paper)?
- What would “it worked” look like for one real person?

**Write:** `docs/journey/YYYY-MM-DD-spark.md`

**The Wedding Home example:** “An operating system for Indian marriages” — many functions, cash, invites, RSVP, website, live, photos, family roles. Spoken, overlapping, not a spec yet.

---

## Stage 1 — Study the real process, not the competitor homepage

**Goal:** Understand the ritual / workflow from 0 to 100.

Ask:

- What are the actual steps in the world (Haldi → Sangeet → pheras, or whatever domain)?
- Who operates vs who only visits?
- What must never require an account?
- What is culturally specific vs generic SaaS?

**Write:** short notes + links in the journey log. Do not paste other products’ READMEs into your spec.

**The Wedding Home example:** Multi-event guest lists, household (not person), WhatsApp not email, veg/Jain food, muhurat, two families. Market size was context, not the product.

---

## Stage 2 — Cut v1 without killing the vision

**Goal:** Full vision on a canvas/spec; **layers** for shipping.

Ask:

- If we only finish three jobs, which three make it usable?
- What is distinctive (for us: theme studio, per-function music/video)?
- What is a different company (marketplace, native livestream)?

**Write:** `docs/PRODUCT.md` from [templates/PRODUCT.md](./templates/PRODUCT.md) — in / later / never.

**The Wedding Home example:** Guests never log in. Reminders 1 month / 1 week / 1 day. Livestream = paste a URL. Themes grow forever on one token model.

---

## Stage 3 — Draw the pages before the database

**Goal:** Admin, manager, guest — every screen has a job.

Ask:

- Who may publish what the world sees?
- How do operators **preview** the guest experience?
- Public site vs secret invite link?

**Write:** page table in `docs/PRODUCT.md`.

**The Wedding Home example:** Admin publishes themes; Manager still Preview as guest. Public home + personal RSVP link. Countdown = wedding date (big) + next function (small).

---

## Stage 3b — Write the PRD before code

**Goal:** After the canvas looks good, expand the spec into requirements a builder can implement without inventing product.

Ask:

- What is the done-when for each slice?
- What objects exist (wedding, event, household, RSVP, …)?
- What must be true on every role and every guest link?

**Write:** `docs/PRD.md` from [templates/PRD.md](./templates/PRD.md) — journeys, objects, functional requirements, acceptance criteria. Point PRODUCT.md at it. Do not add pages.

**The Wedding Home example:** Canvas signed off 20 Sep 2026; PRD v1.0 the same day. Slice 1 done-when stayed one sentence: sign up, create wedding, add functions, see countdown.

---

## Stage 3c — System design before schema

If the repo from stage 6 already exists, write these docs in it. Naming can happen earlier. Slice code waits until stage 3f is done.

**Goal:** Decide how the app runs, before naming collections or routes.

Ask:

- One deployable or several? Who calls whom?
- Where do bytes, email, and third-party APIs go?
- What is the tenant, and how does a request learn it?
- What fails closed when a provider is down?

**Write:** `docs/ARCHITECTURE.md` from [templates/ARCHITECTURE.md](./templates/ARCHITECTURE.md).

**The Wedding Home example:** One Next.js app, Atlas, S3 in Mumbai, Resend, Places from the server only. Wedding is the tenant even though one user has one wedding.

---

## Stage 3d — Database design from the objects

**Goal:** Every PRD object is a collection or an explicit embed. Indexes match the screens.

Ask:

- What grows without a ceiling, and so must be its own collection?
- Which secrets are hashed, and which must be copied again later?
- What deletes, and what is only archived, and what else must move in the same transaction?

**Write:** `docs/DATABASE.md` from [templates/DATABASE.md](./templates/DATABASE.md). Derive it from the PRD and the architecture. Do not invent a field the PRD does not have.

**The Wedding Home example:** Households and RSVPs are separate. Diet is three integers on the RSVP: veg, non-veg, and Jain. Gallery bytes stay in S3.

---

## Stage 3e — API design from the database

**Goal:** Every screen can be built from the routes, and every route names its collection, auth, errors, and one example payload.

**Write:** `docs/API.md` from [templates/API.md](./templates/API.md).

---

## Stage 3f — Cross-check before any feature code

**Goal:** Do this once, on purpose, so implementation does not rediscover disagreements between the four docs.

Use the checklist in [templates/CROSS-CHECK.md](./templates/CROSS-CHECK.md). Fix the docs until every box is true. Record the pass in the journey log, including what you refused to copy from a reference product.

**The Wedding Home example:** 4 Oct 2026, compared with a Make My Marriage API and database reference. We kept households, diet headcounts, integer rupees, scheduled reminders, and hard-delete of events. We filled handler-level gaps: slice maps, upload races, gallery delete order, RSVP capacity races, bcrypt, and a public prefix for published theme media.

---

## Stage 4 — Cultural / domain texture pass

**Goal:** Fields that make it feel native, not translated from another country.

Walk the guest journey as a parent, an outstation cousin, an elder who only uses WhatsApp images.

**The Wedding Home example:** Muhurat, Jain food, two helplines, parking, what not to wear, aashirwad, e-card image, meet the families.

---

## Stage 5 — Name it

**Goal:** One name. Short. Say-it-aloud. Means something in the domain.

Give 5–20 options in **different kinds** (ritual word, object, colour, gathering, vow). Human picks. Then rename the folder and the chat.

**The Wedding Home example:** The place the family runs the wedding, and the site guests open. Tagline: operating system for Indian marriages.

---

## Stage 6 — Home for the work

**Goal:** One repo. Git. Journey log. Playbook. Product spec. Cursor rule to keep logging.

```text
~/Developer/<Name>/
  README.md
  docs/PLAYBOOK.md      ← this file
  docs/PRODUCT.md
  docs/templates/       ← empty shapes for the next idea; copy forward
  docs/journey/         ← dated log; gitignored by default (private), publish on purpose
  .cursor/rules/        ← read when that step needs them, not on every message
```

Copy `docs/templates/` into the new repo with the playbook. The journey format is `docs/templates/JOURNEY-LOG.md`. Entries go in `docs/journey/`, which stays untracked.

Move the agent into that folder **before** scaffolding app code.

---

## Stage 6b — Scaffold the shell

**Goal:** The app installs, typechecks, and serves a health check. No feature slice yet.

Follow [templates/SCAFFOLD.md](./templates/SCAFFOLD.md). Read the four design docs first. A reference repository is a picture of folders, not a source of objects or routes.

**The Wedding Home example:** 6 Oct 2026. Next.js, Zod, Mongoose 8, bcrypt cost 12, Node 22. Make My Marriage supplied the folder idea (`src/app`, `src/server`, `src/config`). We kept households, integer rupees, and S3. The home page says the shell is running.

---

## Stage 6c — Draw the screens in Stitch

**Goal:** One clickable picture of the page map, after the pages are decided and before those pages are built in code.

Follow [templates/STITCH.md](./templates/STITCH.md). Lock the palette before the first prompt, or a wedding brief becomes flowers, script type, and a pink button. One prompt per screen, in one project, homepage first. A stack of separate prompts does not become a flow. One Web prompt plus Play is how you click through.

Stitch output is not the PRD. If a screen drops a field, write that down and leave the four docs alone until the human asks for the change.

**The Wedding Home example:** 5–6 Oct 2026. Bone, charcoal, pewter, then wine as the accent. No floral stock and no invite-card pink. Twenty-two loose prompts did not connect. On 10 Oct 2026 the human locked the prototype's three diets: veg, non-veg, and Jain.

---

## Stage 7 — Build in slices (usable after each)

For The Wedding Home the slices are in PRODUCT.md. For any product:

1. Identity + empty home (auth, the “one workspace”)
2. Core objects of the domain
3. The outsider / guest / public surface
4. The loop that makes people come back (reminders, notifications)
5. Money or ops if needed
6. The distinctive layer (here: themes)
7. Deploy, measure, harden

A slice is done when a human can finish that job in the UI. Start that slice on a branch, cross-check it, merge to `main`, and push. Record what you learned. If the next product would do the same thing, add it to this playbook or to `docs/templates/` before you call the slice done.

Keep `docs/PROJECT_STATUS.md` in that same change. A new session reads it first. Say whether a milestone is mock UI or working end to end, and leave the earlier milestones in place. It is the progress log, not a second PRD.

### Stage 7b — Prove each slice in a real browser, as every role

Unit tests do not show that a screen saves. In this project the earlier screens looked finished and crashed after every save, because a form read `event.currentTarget` after an `await`. What catches that:

1. Drive the app in Chrome with Playwright (`tests/e2e/journey.spec.ts`, `npm run e2e`): every page, every add, edit, and delete, as an Admin, a Manager, a second family, and a guest on a 390 px phone. Assert that the data is really there afterwards, that a Manager gets 403 on Admin routes, that another wedding gets 404, and that nothing throws in the browser.
2. Send real mail to plus-addresses of one inbox (`you+role-tag@gmail.com`) so invitations and reminders are seen, not assumed.
3. Screenshot every page at desktop and phone width and look at them. Alignment, overflow, and empty states are only visible this way.
4. Measure what you cannot see or hear. The music engine was checked by playing every piece through an analyser for loudness, peaks, and errors.
5. Read form data before the first `await`; wait for the lists a form defaults from before allowing a save; make switches optimistic so a quick second tap sends the right value. All three were found by the journey, not by review.

---

## Stage 8 — Deploy and keep the log

Ship a public URL early even if only slice 1 works. After every deploy, one journey entry: URL, what works, what does not.

Run the same browser journey against production (`E2E_BASE_URL=… npm run e2e`) with a fresh tag. Production is slower and has the real file store, and it found two bugs the dev machine hid. Keep demo passwords out of the repo; pass them in with `E2E_PASSWORD`.

**Providers.** Before building on a paid API, check the key works from the server. Prefer a free, keyless provider behind one adapter when it covers the job (here OpenStreetMap's Nominatim and Photon for venues and vendors, Google Maps only as links and a keyless embed). Public free services fail and throttle: hedge, rate-limit yourself, and make the feature say calmly that it is unavailable. When a decision moves a vendor or a store (here Vercel Blob instead of S3), write it into the architecture, database, and API docs in the same change, with the reason and the planned way back.

---

## Anti-patterns (we already made some; do not repeat)

- Treating a fake deadline or fake scale as the product.
- Selling features on a homepage that do not exist in the app.
- Copying another codebase instead of using it as **inspiration**.
- Adding nav items instead of fields on existing pages.
- Leaving decisions only in chat.
- Copying a reference product's schema or routes when its objects are different from the PRD.
- Starting feature code while the PRD, system design, database, and API still disagree.
- Letting Stitch, or a reference repo, silently change a locked field.
- Scaffolding empty modules for slices you have not started.
- Leaving a finished step uncommitted.
- Believing a screen saves because it renders. Use it in a browser.
- Building on a paid key nobody has tested, and finding out in production.
- Shipping a decision (a new store, a new map provider, sound on by default) without updating the source-of-truth docs.

---

## Checklist for a brand-new idea

- [ ] Spark written down
- [ ] Real-world process studied
- [ ] v1 vs later listed
- [ ] Page map (roles)
- [ ] PRD with acceptance criteria (after canvas sign-off)
- [ ] System design, database design, API design, from `docs/templates/`
- [ ] Cross-check (`docs/templates/CROSS-CHECK.md`) done, and the pass written in the journey log
- [ ] Domain texture pass
- [ ] Name chosen
- [ ] Repo + journey log started
- [ ] `AGENTS.md` names the four source-of-truth files. `CLAUDE.md` points at it
- [ ] `docs/PROJECT_STATUS.md` exists and is updated when a major feature lands
- [ ] Shell scaffolded and proven locally ([templates/SCAFFOLD.md](./templates/SCAFFOLD.md))
- [ ] Screens drawn in Stitch from the page map ([templates/STITCH.md](./templates/STITCH.md))
- [ ] First slice defined in one sentence
- [ ] First deploy planned
- [ ] Browser journey (`tests/e2e`) covering every role, run locally and against production
- [ ] Every external provider's key checked from the server before the slice that needs it
