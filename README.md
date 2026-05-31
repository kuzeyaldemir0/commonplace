# commonplace

A local learning engine that turns study materials into flashcards and quizzes. Courses are agent-authored from PDFs and notes; everything lives in plain JSON files you can inspect and edit.

Named after the [commonplace book](https://en.wikipedia.org/wiki/Commonplace_book) — a personal knowledge collection practice dating back centuries.

> **This repo is designed to be used with AI coding tools** (Claude Code, Codex, Cursor, etc.) that can read the full codebase. It is not intended for pasting into chat interfaces.

## Quick Start

```sh
npm install
npm run dev
```

Open `http://localhost:5173`.

## Adding a Course

```sh
# 1. Scaffold
npm run cli -- scaffold <course-id> "<Course Title>"

# 2. Drop source files into courses/<course-id>/sources/

# 3. Get the authoring prompt for your agent
npm run cli -- prompt <course-id>

# 4. Validate
npm run cli -- validate
```

## CLI Reference

| Command | Description |
|---|---|
| `scaffold <id> "<title>"` | Create a new course skeleton |
| `add-source <id> "<file>"` | Register a source file |
| `prompt <id>` | Print the agent authoring prompt |
| `render-pdf <id> "<file>"` | Render PDF pages to `.tmp/` for scanned docs |
| `validate [id]` | Validate all courses (or one) |

All commands run via `npm run cli -- <command>`.

## Layout

```
courses/<course-id>/
  course.json          # metadata and source registry
  sources/             # original PDFs / notes (gitignored)
  content/
    cards.json
    quizzes.json
  progress.json        # local study progress (gitignored)
src/                   # React frontend
server/                # Express API + CLI
```

## Stack

React 19 · Express 5 · TypeScript · Vite · KaTeX · Zod · Vitest
