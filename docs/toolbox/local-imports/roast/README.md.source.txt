# /roast

A Claude Code skill. Eight Claudes read your Instagram bio or landing page as eight different visitors (a scroller, a buyer, a hater, a competitor, a newcomer, a peer, a sponsor, an almost-follower). Each scores clarity, trust and want out of 10. Then one more Claude rewrites it in three versions, without inventing facts.

## Install
1. Unzip this file. You get a folder called `roast`.
2. Copy that folder to `~/.claude/skills/` so the file sits at `~/.claude/skills/roast/SKILL.md`.
3. Open Claude Code and type `/roast`, then paste your bio or a page URL.

## Good to know
- The visitors are simulated by Claude. It is a fast filter, not real audience data.
- A full run uses a lot of your Claude usage (about 70k tokens per helper in our test). Say "lite" and it plays all eight in one pass instead, and tells you it did.
- EXAMPLE-RUN.md is a real test log, including what it got wrong.
