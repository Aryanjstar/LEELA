# {{Product name}} — system architecture

**Product:**
**Version:** 1.0
**Status:**
**Date:**
**Audience:** Anyone implementing a slice

System design. It does not add pages, roles, or features. Requirements stay in the PRD.

| Artifact | Job |
|---|---|
| PRODUCT.md | Vision and page map |
| PRD.md | Requirements and acceptance |
| DATABASE.md | Collections, indexes, integrity |
| API.md | HTTP contract |
| This file | Processes, boundaries, vendors, how a request moves |

## 1. Purpose

What this document decides, and what it leaves to the database and API docs.

## 2. Goals

What "good" means for v1: one team, one deploy, failure that stays inside one provider.

## 3. Principles

Short rules. Examples that belong in almost every product of this shape:

- The server decides who the caller is and which tenant they mean
- Route handlers stay thin. Rules live in services
- Validation at the boundary and schema at the database are different checks

## 4. Stack

| Concern | Choice | Why this, for this product |
|---|---|---|
| App | | |
| Database | | |
| File storage | | |
| Email | | |
| Other providers | | |
| Host | | |

## 5. Context

A diagram of the browser, the app, the database, storage, and each provider. Mark which calls are server-only.

## 6. Surfaces

URL shapes for the operator app, the public pages, and the secret links. What each surface is allowed to show.

## 7. Modules and the request path

```text
HTTP
  → parse
  → authenticate
  → validate
  → service
  → repository or provider
  → response
```

Name the modules. Say that a slice creates its module when the slice starts.

## 8. Authentication

How a session is created, stored, expired, and destroyed. What the cookie contains. What it must not contain (role, tenant id).

Password reset behaviour, including the message when the account does not exist.

## 9. Membership and roles

How a user is attached to a tenant. The transaction that creates the tenant and its first owner together.

## 10. Tenancy and authorization

The chain from cookie to tenant id. The query shape that includes the tenant on every read and write. How a foreign id is answered so existence does not leak.

## 11. Domain flows that cross documents

One subsection per flow the PRD cannot express as a single row: invitations, public tokens, money, jobs. Link the PRD requirement.

## 12. Files

Where bytes live. The upload steps. What is checked before a row is published. What is private, and what is public-read, and why.

## 13. Jobs and email

What is sent inside the request. What becomes a row and a cron. Claim, retry, and the schedule the PRD requires.

## 14. Data rules (summary)

Point at DATABASE.md for names and fields. State the few rules this document owns: what is embedded, what is never embedded, where transactions are required.

## 15. API, validation, errors, logs (summary)

Point at API.md. List the stable error codes and the log fields. List what logs must never contain.

## 16. Security

Session, CSRF, isolation, token entropy, upload checks, rate-limit order, secrets that stay on the server.

## 17. Performance and freshness

What v1 uses (indexes, pagination, direct uploads). What v1 refuses (a second datastore, websockets) until something measured requires it.

## 18. Deployment

Environments, env vars by name, how the database is reached from the host.

## 19. Scaling path

Now. When the first real limit hurts. What we still will not do.

## 20. Failure

| Dependency | Behaviour |
|---|---|
| Database down | |
| Email down | |
| Storage down | |
| Other provider down | |

## 21. Tests this design expects

A short list of cross-document tests. The API doc will extend it.

## 22. Decisions

| # | Decision | Why |
|---|---|---|
| | | |

## 23. Out of v1

## 24. Later documents

What is intentionally not in this file yet (module folders, frontend, deploy runbook).

## Done when

- [ ] Every provider in the stack has a failure row
- [ ] The tenant is named, and the request chain that discovers it is written
- [ ] Secrets that are hashed vs secrets that must be shown again are distinguished
- [ ] No page or role appears here that is absent from the PRD
