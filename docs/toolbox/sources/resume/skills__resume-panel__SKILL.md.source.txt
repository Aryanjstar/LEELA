---
name: resume-panel
description: Put a resume in front of a hiring panel of seven independent reviewers who each try to reject it (screening software, hiring manager, future boss, CEO, a competing candidate, a recruiter, a future teammate), then rewrite it with every issue fixed. Each reviewer runs as its own subagent and never sees the others' verdicts. Use when someone wants a resume or CV reviewed, roasted, stress-tested or improved for a specific job.
---

# Resume panel

Seven reviewers read the same resume alone, each from a different seat, and each tries to find a reason to say no. Because none of them can see the others, they can't just agree with each other. Where several land on the same problem independently, that problem is real.

## 1. Inputs

- **Resume:** a file path (PDF, DOCX, MD, TXT) or pasted text. Read all of it.
- **Target job:** a job ad, a link, or at least a title and seniority. If there is none, ask once. If they still don't give one, use the job title the resume itself aims at and say so.

Create a folder `resume-panel/` next to the resume (or in the working directory) for the outputs.

## 2. The panel

Launch all seven reviewers **in one message, in parallel**, as separate subagents (Task tool). Give each one only three things: its seat brief below, the full resume text, and the job. Never pass one reviewer's output to another.

| # | Seat | Reads the resume as |
|---|---|---|
| 1 | Screening software | The applicant tracking system that decides if a human sees it: parses the layout, matches the job's keywords, flags missing must-haves, dates and titles it can't read. |
| 2 | Hiring manager | The person who owns the role, with 200 applicants and 6 seconds per resume: is the fit obvious from the top third? |
| 3 | Your future boss | The person you'd report to: can you do the work on day 30 without hand-holding? Looks for scope, ownership and results. |
| 4 | The CEO | Cares only about business impact: revenue, users, cost, speed. Ignores tasks, hunts for outcomes. |
| 5 | A competing candidate | Is going for the same job with a stronger version of this resume: names exactly where they would beat it. |
| 6 | A recruiter | Screens for the client: gaps, job-hopping, unclear titles, vague claims they can't sell. |
| 7 | A future teammate | Will work next to you: tools, collaboration, how you work with others, red flags in tone. |

Prompt each reviewer with:

> You are reviewing a resume as **{seat}** for this job: {job}. Your job is to find reasons to reject it. You have not seen any other reviewer's opinion. Return, in under 150 words:
> **Verdict:** REJECT or ADVANCE.
> **Why:** the three biggest problems, each quoting the exact resume line it is about.
> **Fix:** one concrete fix per problem.
> Be blunt. Don't invent facts about the candidate.

Save each answer as `resume-panel/0{n}-{seat}.md`.

If you can't launch subagents (for example in the Claude app), review from each seat yourself, one at a time, and write each verdict before you read the resume as the next seat. Say at the end that the seats weren't fully independent.

## 3. The verdict

When all seven are back, write `resume-panel/verdict.md`:

1. A table: seat, verdict, the single biggest reason.
2. **Flagged by several:** problems that two or more reviewers raised independently, ranked by how many raised them. These go first.
3. **Flagged once:** the rest, briefly.

## 4. The rewrite

Write `resume-panel/resume-rewritten.md`: the full resume with every flagged problem fixed.

- Keep it truthful. Never invent employers, dates, titles, degrees, tools or numbers.
- Where a fix needs a number the resume doesn't have, leave a placeholder like `[add: % or $ impact]` and list the placeholders at the end, so the person can fill them in.
- Mirror the job's own wording for skills the person really has.
- Plain one-column layout that screening software can parse: standard headings, no tables or text boxes, dates in one format.

Finish with a short summary in the chat: the panel score (how many ADVANCE out of 7), the top three fixes, and the placeholders to fill.
