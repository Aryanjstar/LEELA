# Design templates

Copy this folder into the next repo together with `docs/PLAYBOOK.md`. Fill the templates in playbook order. Delete the instruction lines as you replace them with the real product.

| File | Becomes | Ready when |
|---|---|---|
| [PRODUCT.md](./PRODUCT.md) | `docs/PRODUCT.md` | Vision, page map, and slices fit on a few screens |
| [PRD.md](./PRD.md) | `docs/PRD.md` | A builder can implement a slice without inventing product |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | `docs/ARCHITECTURE.md` | A request has one path, and each provider has a failure behaviour |
| [DATABASE.md](./DATABASE.md) | `docs/DATABASE.md` | Every object is a collection or an embed, with indexes and delete rules |
| [API.md](./API.md) | `docs/API.md` | Every route has auth, errors, and one example |
| [CROSS-CHECK.md](./CROSS-CHECK.md) | Run once, keep the file | Every box is true, and the pass is in the journey log |
| [JOURNEY-LOG.md](./JOURNEY-LOG.md) | Entries in `docs/journey/` | Each meaningful step has date, decision, and next |
| [SCAFFOLD.md](./SCAFFOLD.md) | The app shell | Health check passes before any feature slice |
| [STITCH.md](./STITCH.md) | Screen prompts | One clickable flow, and it does not edit the PRD |
| [GIT.md](./GIT.md) | Branch, merge, push | Each finished step is on `main` |
| [AGENTS.md](./AGENTS.md) | `AGENTS.md` and `CLAUDE.md` | The four design docs are named as the source of truth |

The filled Wedding Home documents in the parent folder are a worked example, not a second template. When a reference product disagrees with the PRD, the PRD wins. Record what you refused to copy.
