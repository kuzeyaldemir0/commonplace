import { promises as fs } from "node:fs";
import path from "node:path";
import {
  cardsFileSchema,
  courseSchema,
  progressSchema,
  quizzesFileSchema,
  type Course,
  type Flashcard,
  type Progress,
  type QuizItem
} from "../src/lib/schemas";

export const projectRoot = path.resolve(process.cwd());
export const coursesRoot = path.join(projectRoot, "courses");

const courseIdPattern = /^[a-z0-9-]+$/;

function courseDir(courseId: string) {
  if (!courseIdPattern.test(courseId)) {
    throw new Error("Invalid course ID.");
  }
  return path.join(coursesRoot, courseId);
}

async function readJson(filePath: string) {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as unknown;
}

async function writeJson(filePath: string, value: unknown) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export type CourseBundle = {
  course: Course;
  cards: Flashcard[];
  quizzes: QuizItem[];
  progress: Progress;
};

export async function loadCourse(courseId: string): Promise<CourseBundle> {
  const dir = courseDir(courseId);
  const [course, cards, quizzes, progress] = await Promise.all([
    readJson(path.join(dir, "course.json")).then((value) => courseSchema.parse(value)),
    readJson(path.join(dir, "content", "cards.json")).then((value) => cardsFileSchema.parse(value)),
    readJson(path.join(dir, "content", "quizzes.json")).then((value) => quizzesFileSchema.parse(value)),
    readJson(path.join(dir, "progress.json")).then((value) => progressSchema.parse(value))
  ]);

  return {
    course,
    cards: cards.cards,
    quizzes: quizzes.quizzes,
    progress
  };
}

export async function listCourses() {
  await fs.mkdir(coursesRoot, { recursive: true });
  const entries = await fs.readdir(coursesRoot, { withFileTypes: true });
  const courses = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const bundle = await loadCourse(entry.name);
        return {
          ...bundle.course,
          cardCount: bundle.cards.length,
          quizCount: bundle.quizzes.length,
          reviewCount: bundle.progress.flashcardReviews.length,
          sessionCount: bundle.progress.quizSessions.length
        };
      })
  );
  return courses.sort((a, b) => a.title.localeCompare(b.title));
}

export async function recordFlashcardReview(
  courseId: string,
  cardId: string,
  rating: "again" | "got-it"
) {
  const bundle = await loadCourse(courseId);
  if (!bundle.cards.some((card) => card.id === cardId)) {
    throw new Error("Unknown flashcard.");
  }
  bundle.progress.flashcardReviews.push({
    cardId,
    rating,
    reviewedAt: new Date().toISOString()
  });
  await writeJson(path.join(courseDir(courseId), "progress.json"), bundle.progress);
  return bundle.progress;
}

export async function recordQuizSession(
  courseId: string,
  session: Progress["quizSessions"][number]
) {
  const bundle = await loadCourse(courseId);
  const questionIds = new Set(bundle.quizzes.map((quiz) => quiz.id));
  if (session.results.some((result) => !questionIds.has(result.questionId))) {
    throw new Error("Quiz result contains an unknown question.");
  }
  bundle.progress.quizSessions.push(session);
  await writeJson(path.join(courseDir(courseId), "progress.json"), bundle.progress);
  return bundle.progress;
}

export async function validateCourses(courseId?: string) {
  if (courseId) {
    await loadCourse(courseId);
    return [courseId];
  }
  const entries = await fs.readdir(coursesRoot, { withFileTypes: true });
  const ids = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  await Promise.all(ids.map((id) => loadCourse(id)));
  return ids;
}
