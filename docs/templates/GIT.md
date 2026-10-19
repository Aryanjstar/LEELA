# Git

Every finished step is committed and pushed. Chat is not the archive.

## A step

- [ ] One short commit message, about why
- [ ] No secrets, no `.env.local`
- [ ] Push after the commit lands on `main`

## A new slice or a distinct change

- [ ] New branch from current `main`
- [ ] Build only that change
- [ ] Cross-check: tests, typecheck, lint, and a pass against the PRD, system design, database, and API
- [ ] Journey entry written. Playbook or templates updated when the step is reusable
- [ ] Merge into `main` and push `main`

Do not force-push `main`. Do not rewrite a commit that is already on the remote.

## The Wedding Home example

The first feature branch is `scaffold`: the design gap pass and the app shell. Cross-check locally, merge to `main`, push.
