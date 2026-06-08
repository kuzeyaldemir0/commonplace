import type { Course, Flashcard, Progress, QuizItem } from "./schemas";

export type CourseSummary = Course & {
  cardCount: number;
  quizCount: number;
  archivedCardCount: number;
  archivedQuizCount: number;
  reviewCount: number;
  sessionCount: number;
};

export type CourseBundle = {
  course: Course;
  cards: Flashcard[];
  quizzes: QuizItem[];
  progress: Progress;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init
  });
  if (!response.ok) {
    const payload = (await response.json()) as { error?: string };
    throw new Error(payload.error ?? "The local server could not complete the request.");
  }
  return response.json() as Promise<T>;
}

export const api = {
  listCourses: () => request<CourseSummary[]>("/api/courses"),
  loadCourse: (courseId: string) => request<CourseBundle>(`/api/courses/${courseId}`),
  recordFlashcard: (courseId: string, cardId: string, rating: "again" | "got-it") =>
    request<Progress>(`/api/courses/${courseId}/progress/flashcards`, {
      method: "POST",
      body: JSON.stringify({ cardId, rating })
    }),
  recordQuiz: (courseId: string, session: Progress["quizSessions"][number]) =>
    request<Progress>(`/api/courses/${courseId}/progress/quizzes`, {
      method: "POST",
      body: JSON.stringify(session)
    }),
  setArchive: (courseId: string, type: "flashcard" | "quiz", itemId: string, archived: boolean) =>
    request<Progress>(`/api/courses/${courseId}/progress/archive`, {
      method: "POST",
      body: JSON.stringify({ type, itemId, archived })
    }),
  restoreArchive: (courseId: string, type?: "flashcard" | "quiz") =>
    request<Progress>(`/api/courses/${courseId}/progress/archive/restore`, {
      method: "POST",
      body: JSON.stringify({ type })
    })
};
