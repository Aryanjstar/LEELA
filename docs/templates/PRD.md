# {{Product name}} — Product Requirements Document

**Product:**
**Version:** 1.0
**Status:** Ready to build, or draft
**Date:**
**Audience:** Anyone implementing or reviewing a slice

This PRD expands the locked plan. It does not invent pages or roles.

| Artifact | Job |
|---|---|
| PRODUCT.md | Vision, page map, layers, out of scope |
| ARCHITECTURE.md | How it runs |
| This file | Requirements, objects, journeys, acceptance criteria |

Build in the slice order below. Do not add navigation that is not in the page map.

## 1. Summary

One paragraph: who operates, who visits, what they share.

## 2. Problem

The day in the person's life this replaces. What they use today.

## 3. Goals and non-goals

### v1 goals

-

### Explicit non-goals

Copy from PRODUCT.md. Add anything discovered while writing journeys.

## 4. Users and roles

### Operators

### Visitors

### Constraint

How many workspaces one account may belong to, in this version.

## 5. Rules that do not bend

-

## 6. Surfaces and page map

Same pages as PRODUCT.md. Per page: who sees it, and the job of the page in one line.

## 7. Core objects

A table. Name, what it is in product words, what it is not. Design docs must use these names.

| Object | Is | Is not |
|---|---|---|
| | | |

## 8. Build slices

| Order | Slice | Done when |
|---|---|---|
| 1 | | One sentence a person can demonstrate |

## 9. User journeys

Three to six journeys. Each is a path through existing pages, named by the person (the parent, the cousin), not by a screen.

### J1 —

## 10. Functional requirements

Group by slice. Each requirement has a stable id and an acceptance check.

**FR-1.1 Name**
What the product does.
**AC:** The observable result, including the failure a person should see.

## 11. Domain requirements

Fields and behaviours that make it native. Point at the page they sit on. Do not create a new menu for them.

## 12. Non-functional

| Area | Requirement |
|---|---|
| Devices | |
| Locale, time, money | |
| Auth | |
| Isolation | |
| Privacy | |
| Scale posture | |

## 13. Permissions matrix

| Action | Role A | Role B | Visitor |
|---|---|---|---|
| | | | |

## 14. Edge cases

Calm behaviour on existing pages. Invalid link, double submit, last owner, missing optional contact, delete of something other records point at.

## 15. Success criteria

**Product-level (v1 complete):**
**Slice 1:**
**Later metrics (not in the UI):**

## 16. Decisions already locked

A list implementers must not reopen. End with: no open product questions, or name the one question still blocking the PRD.

## Done when

- [ ] Every page in PRODUCT.md appears here, and no new page appears
- [ ] Every slice has a one-sentence done-when and at least one FR with an AC
- [ ] Every object in §7 is used by a journey or an FR
- [ ] Non-goals are explicit
- [ ] Permissions match the "who can do what" table in PRODUCT.md
