# {{Product name}} — database design

**Product:**
**Version:** 1.0
**Status:**
**Date:**
**Audience:** Anyone writing a model, a repository, or a migration

Turns the architecture and the PRD objects into collections, fields, indexes, and integrity rules. It adds no pages, roles, or features.

| Artifact | Job |
|---|---|
| PRD.md | What each object is |
| ARCHITECTURE.md | Tenancy, transactions, uploads, jobs |
| This file | Collections, fields, indexes, integrity, retention |
| API.md | How the outside world reads and writes them |

## 1. Scope and targets

Engine, region, ODM, design ceiling (documents per tenant, not a fantasy scale). One sentence on why the schema stays simple at that size.

Founding rules:

1. The tenant field, and that every tenant index starts with it
2. Embed what is small, bounded, and read together. Reference what grows
3. The database refuses what is cheap (unique, required, enum). The service refuses the rest

## 2. Conventions

| Topic | Rule |
|---|---|
| Collection names | |
| Field names | |
| Ids | |
| Timestamps | |
| Dates with no time | |
| Instants | |
| Money | Integer minor units, and the unit name |
| Enums | |
| Optional fields | Absent or null, pick one and use it everywhere |
| Emails and phones | |
| Tokens | Length, encoding, hashed or stored |
| Unknown fields | |

### Shared value shapes

Name each reused object (place, money, media reference) once.

### Per-tenant limits

| Thing | Limit |
|---|---|
| | |

### Text limits

| Field kind | Limit |
|---|---|

## 3. Collections at a glance

A diagram and a table: collection, tenant-owned or not, what it grows with.

### Which slice creates which collection

| Slice | First written here |
|---|---|
| 1 | |

Later slices must not be imported for the first slice's screens to render. Counts for unbuilt slices are zeros in the service.

## 4. Embed or reference

| Data | Choice | Why |
|---|---|---|
| | | |

## 5. Collections

For each collection:

- One field table: name, type, required, notes and limits
- Indexes, marked unique or TTL where they are
- The one integrity rule that is special to this collection

Cover at least: accounts, sessions, password reset, the tenant, membership, the growing domain objects, file metadata, jobs, rate-limit counters if they live in the database.

## 6. Access patterns

| Read | Query | Index |
|---|---|---|
| | | |

If a new query has no row here, add the row or the index in the same change.

## 7. Integrity the database will not enforce

Foreign keys, same-tenant checks, and the table of "when X is deleted, also do Y, in one transaction or not".

List the operations that use a transaction. Keep the list short.

## 8. Security-relevant shape

| Item | Storage | Reason |
|---|---|---|
| Passwords | | |
| Session and reset tokens | | |
| Shareable links that must be copied again | | |
| Rate-limit keys | | |

## 9. Retention

| Data | Kept | How removed |
|---|---|---|
| | | |

If the product has no in-app delete of a whole tenant, write the operator procedure for a removal request here, before real personal data is stored.

## 10. Size check

Documents and rough size at the design ceiling. Where the bytes actually live (database vs object storage).

## 11. Working with the schema

Models as source, indexes as code, additive changes, seed data that refuses to run on production, backups before real personal data, connection reuse.

## 12. Decisions and open items

| # | Decision | Why |
|---|---|---|
| | | |

Open items are either decided or named with the slice that must resolve them. An open item with no slice is a block on starting.

## Done when

- [ ] Every PRD object is a collection or a named embed
- [ ] Every screen in the access-pattern table has an index
- [ ] Token storage matches the architecture (hashed vs retrievable)
- [ ] Delete behaviour names the other rows that move
- [ ] Slice 1's collections are listed, and later collections are not required for it
