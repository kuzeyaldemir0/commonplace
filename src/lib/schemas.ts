import { z } from "zod";

export const sourceSchema = z.object({
  filename: z.string().min(1),
  type: z.enum(["pdf", "markdown"])
});

export const courseSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  subtitle: z.string().min(1).optional(),
  sources: z.array(sourceSchema)
});

export const flashcardSchema = z.object({
  id: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
  sourceFilenames: z.array(z.string().min(1)).min(1)
});

export const cardsFileSchema = z.object({
  version: z.literal(1),
  cards: z.array(flashcardSchema)
});

const quizBase = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  explanation: z.string().min(1),
  sourceFilenames: z.array(z.string().min(1)).min(1)
});

export const multipleChoiceQuizSchema = quizBase
  .extend({
    type: z.literal("multiple-choice"),
    choices: z.array(z.string().min(1)).min(2),
    answer: z.string().min(1)
  })
  .refine((question) => question.choices.includes(question.answer), {
    message: "The answer must match one of the choices.",
    path: ["answer"]
  });

export const shortAnswerQuizSchema = quizBase.extend({
  type: z.literal("short-answer"),
  answer: z.string().min(1)
});

export const quizItemSchema = z.union([
  multipleChoiceQuizSchema,
  shortAnswerQuizSchema
]);

export const quizzesFileSchema = z.object({
  version: z.literal(1),
  quizzes: z.array(quizItemSchema)
});

export const progressSchema = z.object({
  version: z.literal(1),
  flashcardReviews: z.array(
    z.object({
      cardId: z.string().min(1),
      rating: z.enum(["again", "got-it"]),
      reviewedAt: z.string().datetime()
    })
  ),
  quizSessions: z.array(
    z.object({
      id: z.string().min(1),
      startedAt: z.string().datetime(),
      completedAt: z.string().datetime(),
      results: z.array(
        z.object({
          questionId: z.string().min(1),
          correct: z.boolean()
        })
      )
    })
  )
});

export type Course = z.infer<typeof courseSchema>;
export type Flashcard = z.infer<typeof flashcardSchema>;
export type QuizItem = z.infer<typeof quizItemSchema>;
export type Progress = z.infer<typeof progressSchema>;
