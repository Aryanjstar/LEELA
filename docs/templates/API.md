# {{Product name}} — API design

**Product:**
**Version:** 1.0
**Status:**
**Date:**
**Audience:** Anyone writing a route handler, a schema, or a client call

The HTTP contract over the collections in the database design. It adds no pages, roles, or features.

| Artifact | Job |
|---|---|
| PRD.md | Requirements |
| ARCHITECTURE.md | Request path, auth, providers |
| DATABASE.md | Fields and indexes |
| This file | What goes in and what comes out |

## 1. Principles

Whether this is a first-party API or a public one. How the tenant is chosen. How a visitor proves identity if they have no account. The shape of a boring success and a boring error.

## 2. Conventions

| Topic | Rule |
|---|---|
| Base path | |
| Names | |
| Ids | |
| Instants and civil dates | |
| Money | Same unit as the database |
| Phones, places, media | |
| Null vs omitted vs empty string | |
| Unknown fields | |
| Status codes | |
| Idempotency | |
| Concurrency | Last write wins, or a version check. Pick one |

### Rules every handler follows

1. Pipeline: parse, authenticate, validate, service, map
2. Malformed ids are validation errors before a query
3. Maximum JSON body size
4. Duplicate-key errors mapped to stable reasons
5. Log fields, and the list of values that are never logged
6. Provider errors rewritten in our words

## 3. Authentication, CSRF, headers

| Caller | Proof | Routes |
|---|---|---|
| Operator | | |
| Visitor | | |
| Cron | | |

Cookie flags, session lookup, expiry, and what invalidates a session besides logout.

## 4. Errors

One JSON shape. A table of `code` → HTTP status. A table of stable `reason` values and where they are used. What must not leak (login, reset, cross-tenant ids, bad public tokens).

## 5. Lists, filters, sorting

Page-based lists and cursor lists. Defaults, maximum page size, and the rule that a cursor is bound to its filter.

## 6. Rate limits

| Scope | Key | Limit |
|---|---|---|
| | | |

Order of checks on token routes: the caller's budget first, then resolve the token, then the per-link budget, then any shared budget. Unknown tokens must not exhaust the shared budget.

## 7. Endpoints

### What ships in which slice

| Slice | Routes |
|---|---|
| 1 | |

For each route: method and path, who may call it, body or query, success status and one JSON example, errors by reason.

Group by area (auth, tenant, each PRD object, public token routes, uploads, internal jobs).

Include:

- Create, read, update, delete where the PRD has them
- Action routes only where the verb is honest (send, publish, accept)
- The aggregation read that saves the client a fan-out, if the dashboard needs one
- Upload permission and complete, if files exist
- Job status, if work is asynchronous

## 8. Permissions

| Area | Role A | Role B | Visitor | Public |
|---|---|---|---|---|
| | | | | |

## 9. Flows

Two or three end-to-end traces in route names, one per early slice.

## 10. Contract and versioning

How breaking changes ship when the client is first-party. Which URLs are long-lived because they are printed or forwarded.

## 11. Tests this contract expects

Extend the architecture test list with one test per reason that is easy to get wrong.

## 12. Decisions and open items

Decided items stay decided. Open items name the slice that needs them. Slice 1 has none.

## Done when

- [ ] Every operator page and visitor page has the routes it needs
- [ ] Every route names auth, errors, and one example
- [ ] Field names match the database, or the mapping is written in one place
- [ ] Money, dates, and token exposure match the database doc
- [ ] Slice 1 is implementable without the later routes
