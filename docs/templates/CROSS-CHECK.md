# Cross-check before code

Run this after the PRD, system design, database design, and API design exist, and before the first feature slice. Fix the docs until the boxes are true. Write the pass in the journey log, including what a reference product did that this product refused.

## Objects

- [ ] Every PRD object is a collection or a named embed in the database doc
- [ ] Every collection is read or written by a route, or marked internal (sessions, jobs, rate limits)
- [ ] No API field name means a different thing from the database field. Where the JSON name differs, one table says so

## Access

- [ ] Every private query includes the tenant id from the session, not from the body
- [ ] An id from another tenant is the same response as a missing id
- [ ] Malformed ids fail validation before a query
- [ ] The role matrix in the API matches the PRD permissions matrix

## Secrets

- [ ] Session, reset, and one-time invite tokens are stored as hashes
- [ ] Links an operator must copy again are stored so the same URL can be shown, and those fields are absent from ordinary responses and from logs
- [ ] The two docs agree. A reference that hashes a link in one chapter and stores it raw in another is not copied until this product picks one

## Writes

- [ ] Create-tenant and accept-invite are transactions, if both exist
- [ ] The last-owner rule is one conditional write, not count-then-delete
- [ ] Delete behaviour matches in both docs: what is removed, what is archived, and what happens when storage or email fails
- [ ] A duplicate unique index maps to a named API error
- [ ] Concurrent edits are specified (last write wins, or a version conflict). One choice

## Lists and public routes

- [ ] Admin lists name page size and a maximum. The unbounded collection uses a cursor
- [ ] A cursor cannot be reused against a different filter
- [ ] Public payloads list the fields they return, and the fields they must not return
- [ ] Every unauthenticated write has a rate limit, and unknown tokens do not spend the shared budget

## Slices

- [ ] Each route and each collection names the slice that introduces it
- [ ] Slice 1 renders without importing later modules. Counts for later slices are zeros
- [ ] Open items are decided, or named with a later slice. Slice 1 has no open item

## Before merging a slice

- [ ] The browser journey covers the slice: every add, edit, and delete, as each role, on a phone width, with nothing thrown in the console
- [ ] Mail the slice sends was received at a real inbox (plus-addresses of one account)
- [ ] Every external provider the slice calls was tried from the server with the real key, and its failure path shows a calm message
- [ ] After deploy, the journey passes against production with a fresh tag

## Reference products

- [ ] Differences from a reference are listed as kept, adopted, or refused
- [ ] Nothing refused by the PRD was copied because the reference had it (extra nav, a different money unit, a different guest model)

## Worked example

The Wedding Home, 4 Oct 2026, against a Make My Marriage API and database reference:

- Kept: households, per-function RSVP, diet headcounts, integer rupees, scheduled reminders, hard-delete of events, S3, Admin-only website
- Adopted: slice-to-route map, atomic upload complete, gallery delete that keeps the row when storage fails, RSVP capacity re-check, opaque cursors, bcrypt cost 12, public-read prefix for published theme media, operator erasure steps
- Refused: one RSVP on the guest row, paise, archived events as the only delete, generic theme names, hashing gallery tokens while also requiring the raw URL
