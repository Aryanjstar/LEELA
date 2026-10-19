# Lila

**Any idea, at play.** A studio that turns a topic, notes, or a piece of code into a short film: a plan of named scenes, a voice with word timing, and a picture rendered by code.

The name is Leela (लीला). This repository is Lila.

## What is on the site

Five films, each with its own palette and one continuous voice. The voice says the words on the screen.

| Film | What it explains |
|---|---|
| Find 21 | A sorted list, and why checking the middle is enough |
| Why it stays up | A spinning top should fall, and the spin is why it does not |
| Ek lattu | A story: a top walks, and the moon never lands |
| Any idea | An idea stuck in your head, and the three ways out |
| One house | A wedding in ten chats, then one board and one link |

## Run it

Node 22, FFmpeg, and a MongoDB database.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Put keys only in `.env.local`. That file is gitignored. Never commit it.

## How a film is made

Read `style.md` before an edit. Speech comes from the voice adapter, with word times. HyperFrames draws the picture and renders the MP4. FFmpeg measures the file. The model never writes the HTML.

## Docs

`docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, and `docs/API.md` are the source of truth. `docs/PROJECT_STATUS.md` says what is built.
