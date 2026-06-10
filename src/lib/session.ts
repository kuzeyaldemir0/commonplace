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
  answers?: Array<{
    questionId: string;
    selected?: string;
    shortAnswer?: string;
    revealed: boolean;
    correct?: boolean;
  }>;
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
  appendFlashcards(courseId: string, cardIds: string[]) {
    const saved = load<SavedFlashcards>(`cp:fc:${courseId}`);
    if (!saved) return;
    const additions = cardIds.filter((id) => !saved.cardIds.includes(id));
    if (additions.length === 0) return;
    this.saveFlashcards({ ...saved, cardIds: [...saved.cardIds, ...additions] });
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
  appendQuiz(courseId: string, questionIds: string[]) {
    const saved = load<SavedQuiz>(`cp:qz:${courseId}`);
    if (!saved) return;
    const additions = questionIds.filter((id) => !saved.questionIds.includes(id));
    if (additions.length === 0) return;
    this.saveQuiz({ ...saved, questionIds: [...saved.questionIds, ...additions] });
  },
};
