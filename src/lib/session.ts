type SavedFlashcards = {
  courseId: string;
  cardIds: string[];
  index: number;
};

type SavedQuiz = {
  courseId: string;
  questionIds: string[];
  index: number;
  results: Array<{ questionId: string; correct: boolean }>;
  startedAt: string;
};

function load<T>(storageKey: string): T | null {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export const session = {
  saveFlashcards(data: SavedFlashcards) {
    localStorage.setItem(`cp:fc:${data.courseId}`, JSON.stringify(data));
  },
  loadFlashcards(courseId: string) {
    return load<SavedFlashcards>(`cp:fc:${courseId}`);
  },
  clearFlashcards(courseId: string) {
    localStorage.removeItem(`cp:fc:${courseId}`);
  },
  saveQuiz(data: SavedQuiz) {
    localStorage.setItem(`cp:qz:${data.courseId}`, JSON.stringify(data));
  },
  loadQuiz(courseId: string) {
    return load<SavedQuiz>(`cp:qz:${courseId}`);
  },
  clearQuiz(courseId: string) {
    localStorage.removeItem(`cp:qz:${courseId}`);
  },
};
