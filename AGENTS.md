# Commonplace Authoring Guide

Commonplace is a local learning app. The source files in each course are the source of truth. Generated study content is editable JSON validated by Zod.

## Refresh A Course

1. Read `courses/<course-id>/course.json`.
2. Inspect every registered file under `courses/<course-id>/sources/` using your built-in document and PDF tools.
   - Inspect every relevant PDF page at readable resolution. A contact sheet is useful for orientation but is not sufficient for final authoring.
3. Update both `content/cards.json` and `content/quizzes.json`.
4. Preserve existing useful items and stable IDs when revising content.
5. Add every originating source filename to `sourceFilenames`.
6. Validate before finishing:

   ```sh
   npm run cli -- validate <course-id>
   ```

## Review Learner Answers

Learners can write their own answer to a flashcard before flipping it. Each answer is saved to `courses/<course-id>/progress.json` under `flashcardAnswers`, an array of `{ cardId, answer, updatedAt }` entries (one per card, holding the latest answer). When asked to give feedback on a learner's answers:

1. Read `courses/<course-id>/progress.json` and take the `flashcardAnswers` array. This file is **read-only** for feedback — never modify it.
2. For each entry, look up the matching card in `content/cards.json` by `cardId`. Use the card's `front` as the question and `back` as the reference answer.
3. Compare the learner's `answer` against the card's `back`. Judge whether the idea is correct, not whether the wording matches — credit a right concept phrased differently, and flag genuine misconceptions, gaps, or reversed relationships.
4. Write feedback that names what they got right, what is missing or wrong, and a short corrected explanation grounded in the card and its source material. Keep it specific to their wording.
5. Skip cards with no entry in `flashcardAnswers` — the learner did not write an answer for those.
6. Do not change `cards.json`, `quizzes.json`, or `progress.json` during a feedback task. Deliver feedback as your response unless the user asks for it written elsewhere.

## Content Rules

- Write concise prompts that test one idea at a time.
- Make every flashcard and quiz question self-contained. A learner should be able to answer with the source files closed.
- When an item depends on a diagram, table, code sample, or worked example, include the relevant facts inline. Do not ask learners to consult "the PDF", "the figure above", or other external context during a study session.
- Default to broad coverage: aim for at least 30 flashcards and 25 quiz questions for a substantial source, then add more when the material supports distinct concepts. Do not pad counts with superficial rewordings.
- Cover the source material faithfully, but do not overfit to its exact wording or worked examples. The goal is durable learning, not memorization of one document.
- Add controlled variations when a source supports them. A good variation tests the same main idea or skill with a nearby input, scenario, direction, value, or question form.
- Keep variations close to the source's scope and difficulty. Do not introduce a new subtopic, prerequisite, edge case, or external fact merely to increase the item count.
- Prefer meaningful transfer over paraphrasing. Change something the learner must reason about; do not create several items whose answers can be recalled from the same wording.
- Use a balanced mix of direct recall, conceptual understanding, comparison, and small application questions when the source material supports those forms.
- For flashcards, favor atomic concepts and useful contrasts. For quizzes, favor plausible alternatives and short scenarios that reveal whether the learner can apply the same idea independently.
- Use Markdown inside text fields for code, lists, emphasis, and math.
- Mix multiple-choice and short-answer quiz items.
- Make multiple-choice distractors plausible but unambiguous.
- Explain why the answer is correct.
- Never edit `progress.json` while authoring content.
