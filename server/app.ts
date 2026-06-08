import express from "express";
import { z } from "zod";
import { listCourses, loadCourse, recordFlashcardReview, recordQuizSession, restoreArchivedItems, setArchivedItem } from "./store";

const flashcardReviewBody = z.object({
  cardId: z.string().min(1),
  rating: z.enum(["again", "got-it"])
});

const quizSessionBody = z.object({
  id: z.string().min(1),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  results: z.array(z.object({ questionId: z.string().min(1), correct: z.boolean() }))
});

const archiveItemBody = z.object({
  type: z.enum(["flashcard", "quiz"]),
  itemId: z.string().min(1),
  archived: z.boolean()
});

const restoreArchiveBody = z.object({
  type: z.enum(["flashcard", "quiz"]).optional()
});

export const clients = new Set<express.Response>();

export function broadcastCourseChange(courseId: string) {
  const payload = `event: course-changed\ndata: ${JSON.stringify({ courseId })}\n\n`;
  clients.forEach((client) => client.write(payload));
}

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/api/courses", async (_req, res, next) => {
    try {
      res.json(await listCourses());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/courses/:courseId", async (req, res, next) => {
    try {
      res.json(await loadCourse(req.params.courseId));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/courses/:courseId/progress/flashcards", async (req, res, next) => {
    try {
      const body = flashcardReviewBody.parse(req.body);
      res.json(await recordFlashcardReview(req.params.courseId, body.cardId, body.rating));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/courses/:courseId/progress/quizzes", async (req, res, next) => {
    try {
      const body = quizSessionBody.parse(req.body);
      res.json(await recordQuizSession(req.params.courseId, body));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/courses/:courseId/progress/archive", async (req, res, next) => {
    try {
      const body = archiveItemBody.parse(req.body);
      res.json(await setArchivedItem(req.params.courseId, body.type, body.itemId, body.archived));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/courses/:courseId/progress/archive/restore", async (req, res, next) => {
    try {
      const body = restoreArchiveBody.parse(req.body);
      res.json(await restoreArchivedItems(req.params.courseId, body.type));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    res.write("event: connected\ndata: {}\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    res.status(400).json({ error: message });
  });

  return app;
}
