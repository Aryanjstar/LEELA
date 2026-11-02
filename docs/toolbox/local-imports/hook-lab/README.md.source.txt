# /hook-lab

A Claude Code skill. Claude writes 20 hooks for your video idea (five formulas, four each). Six simulated scrollers each mark every hook STOP or SWIPE and pick a favorite. You get the winner, the reasons, and an improved version.

## Install
1. Unzip this file. You get a folder called `hook-lab`.
2. Copy that folder to `~/.claude/skills/` so the file sits at `~/.claude/skills/hook-lab/SKILL.md`.
3. Open Claude Code and type `/hook-lab`, then describe your video idea and who it is for.

## Good to know
- The scrollers are simulated by Claude. It is a fast filter, not real audience data. Post two and let real views decide.
- A full run uses a lot of your Claude usage (about 70k tokens per helper in our test). Say "lite" and it plays the panel in one pass instead, and tells you it did.
- EXAMPLE-RUN.md is a real test log, including what it got wrong.
