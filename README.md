# commonplace

A local desktop learning engine that turns your study materials into flashcards and quizzes. Courses are authored by AI agents from PDFs and notes; everything lives in plain JSON files on your machine that you can inspect, edit, and version-control.

The name comes from the [commonplace book](https://en.wikipedia.org/wiki/Commonplace_book) — a personal knowledge collection practice dating back centuries.

## Quick Start

```sh
npm install
npm run dev
```

Open `http://localhost:5173`.

## Adding a Course

**1. Scaffold a new course**

```sh
npm run cli -- scaffold <course-id> "<Course Title>"
```

**2. Drop your source files** (PDFs, notes) into `courses/<course-id>/sources/`.

**3. Register each source** in `courses/<course-id>/course.json` under the `sources` array.

**4. Generate content with an agent** — run the prompt command to get the authoring prompt for your AI agent of choice:

```sh
npm run cli -- prompt <course-id>
```

Paste the output into Claude, GPT-4o, or any capable model. The agent will produce `cards.json` and `quizzes.json` ready to paste into `courses/<course-id>/content/`.

**5. Validate**

```sh
npm run cli -- validate
```

The app hot-reloads valid edits automatically while running.

## CLI Reference

| Command | Description |
|---|---|
| `npm run cli -- scaffold <id> "<title>"` | Create a new course skeleton |
| `npm run cli -- add-source <id> "<file>"` | Register a source file |
| `npm run cli -- prompt <id>` | Print the authoring prompt for an agent |
| `npm run cli -- render-pdf <id> "<file>"` | Render PDF pages to `.tmp/` for scanned docs |
| `npm run cli -- validate [id]` | Validate all courses (or one) |

## Project Layout

```
courses/<course-id>/
  course.json          # course metadata and source registry
  sources/             # your original PDFs / notes (gitignored)
  content/
    cards.json         # flashcards
    quizzes.json       # quiz questions
  progress.json        # local study progress (gitignored)

src/                   # React frontend
server/                # Express API + CLI
public/illustrations/  # UI artwork
```

## Content Format

Courses are validated against Zod schemas defined in `src/lib/schemas.ts`. Agents follow the authoring guide in `AGENTS.md`.

## Tech Stack

- **Frontend**: React 19, Vite, KaTeX (math rendering)
- **Backend**: Express 5, TypeScript, tsx
- **Validation**: Zod
- **Tests**: Vitest
