import { describe, expect, it } from "vitest";
import {
  cardsFileSchema,
  courseSchema,
  progressSchema,
  quizzesFileSchema
} from "../src/lib/schemas";

describe("study artifact schemas", () => {
  it("accepts a valid course", () => {
    expect(courseSchema.parse({
      id: "networks-101",
      title: "Networks 101",
      sources: [{ filename: "notes.pdf", type: "pdf" }]
    }).id).toBe("networks-101");
  });

  it("rejects malformed course IDs", () => {
    expect(() => courseSchema.parse({ id: "../notes", title: "Bad", sources: [] })).toThrow();
  });

  it("accepts Markdown flashcards", () => {
    expect(cardsFileSchema.parse({
      version: 1,
      cards: [{ id: "card-1", front: "**ARP**?", back: "`Address Resolution Protocol`", sourceFilenames: ["notes.pdf"] }]
    }).cards).toHaveLength(1);
  });

  it("requires a multiple-choice answer to match a choice", () => {
    expect(() => quizzesFileSchema.parse({
      version: 1,
      quizzes: [{ id: "quiz-1", type: "multiple-choice", prompt: "Pick one", choices: ["A", "B"], answer: "C", explanation: "No", sourceFilenames: ["notes.pdf"] }]
    })).toThrow();
  });

  it("accepts flashcard and quiz progress", () => {
    expect(progressSchema.parse({
      version: 1,
      flashcardReviews: [{ cardId: "card-1", rating: "got-it", reviewedAt: "2026-05-31T10:00:00.000Z" }],
      quizSessions: [{ id: "session-1", startedAt: "2026-05-31T10:00:00.000Z", completedAt: "2026-05-31T10:05:00.000Z", results: [{ questionId: "quiz-1", correct: true }] }]
    }).quizSessions).toHaveLength(1);
  });
});
