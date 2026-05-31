# Illustration Prompt Pack

Generate each asset as an original transparent-background PNG or SVG. Use the same visual style throughout:

> A charming editorial spot illustration for a desktop learning app. Warm off-white paper texture, hand-drawn black ink outlines, limited muted pastel palette with powder blue, pale moss green, soft coral, and faded mustard. Slightly imperfect print-registration feel, simple geometric forms, no gradients, no text, no logos, no UI screenshots, transparent background, isolated composition, generous whitespace. Friendly and studious rather than childish. Wide 4:3 composition.

## 1. Study Materials

Add:

> An open notebook resting on two stacked books, a loose flashcard, a pencil, and two small sparkle marks. Calm balanced composition.

Use on the library dashboard and course overview. The current exported asset lives at `public/illustrations/study-materials.png`.

## 2. Progress Staircase

Add:

> A short staircase made from three thick books leading upward to a modest trophy cup, with one loose paper note near the base.

Use on the course overview activity panel. The current exported asset lives at `public/illustrations/progress-staircase.png`.

## 3. Quiz Completion

Add:

> A small trophy cup in the center with two floating answer cards nearby: one with a simple check mark and one with a simple cross mark. A few restrained confetti lines.

Use on quiz setup and results. The current exported asset lives at `public/illustrations/quiz-completion.png`.

## 4. Empty Notebook

Add:

> An open blank notebook with one small bookmark ribbon and a pencil placed diagonally beside it. One subtle sparkle above the page.

Use when the library has no courses. The current exported asset lives at `public/illustrations/empty-notebook.png`.

## Integration Notes

- Keep each exported asset under `public/illustrations/`.
- Preserve transparent backgrounds.
- Replace the corresponding CSS placeholder in `src/components/Illustration.tsx`.
- Do not create course-specific artwork. The same small set should work across the library.
