import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleAlert,
  FileQuestion,
  Layers3,
  RotateCcw,
  X
} from "lucide-react";
import { Illustration } from "./components/Illustration";
import { MarkdownContent } from "./components/MarkdownContent";
import { api, type CourseBundle, type CourseSummary } from "./lib/api";
import { haptics } from "./lib/haptics";
import type { Flashcard, QuizItem } from "./lib/schemas";

type View = "courses" | "course" | "cards" | "quiz-setup" | "quiz" | "results";
type QuizResult = { questionId: string; correct: boolean };

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function plural(count: number, singular: string) {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

export function App() {
  const [view, setView] = useState<View>("courses");
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [courseId, setCourseId] = useState<string>();
  const [bundle, setBundle] = useState<CourseBundle>();
  const [error, setError] = useState<string>();
  const [reloadNotice, setReloadNotice] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<QuizItem[]>();
  const [quizResults, setQuizResults] = useState<QuizResult[]>();

  const loadCourses = useCallback(async () => {
    try {
      setCourses(await api.listCourses());
      setError(undefined);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load courses.");
    }
  }, []);

  const loadCourse = useCallback(async (id: string, showNotice = false) => {
    try {
      setBundle(await api.loadCourse(id));
      setError(undefined);
      if (showNotice) {
        setReloadNotice(true);
        window.setTimeout(() => setReloadNotice(false), 2200);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load the course.");
    }
  }, []);

  useEffect(() => {
    void loadCourses();
    const events = new EventSource("/api/events");
    events.addEventListener("course-changed", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as { courseId: string };
      void loadCourses();
      if (data.courseId === courseId) void loadCourse(data.courseId, true);
    });
    return () => events.close();
  }, [courseId, loadCourse, loadCourses]);

  function openCourse(id: string) {
    haptics.tap();
    setCourseId(id);
    void loadCourse(id);
    setView("course");
  }

  function backToCourses() {
    setView("courses");
    setCourseId(undefined);
    setBundle(undefined);
  }

  return (
    <main className="app-shell">
      <div className="paper-grain" />
      <header className="site-header">
        <button className="brand" onClick={backToCourses} aria-label="Commonplace home">
          <span>Commonplace</span>
        </button>
        <div className="header-note">Local learning library</div>
      </header>
      {error && (
        <div className="error-banner" role="alert">
          <CircleAlert size={18} />
          <div><strong>Content needs attention.</strong><span>{error}</span></div>
        </div>
      )}
      {reloadNotice && <div className="reload-toast" role="status" aria-live="polite">Course content refreshed</div>}
      {view === "courses" && <CoursesHome courses={courses} onOpen={openCourse} />}
      {bundle && view === "course" && (
        <CourseHome
          bundle={bundle}
          onBack={backToCourses}
          onCards={() => {
            haptics.tap();
            setView("cards");
          }}
          onQuiz={() => {
            haptics.tap();
            setView("quiz-setup");
          }}
        />
      )}
      {bundle && view === "cards" && <FlashcardSession bundle={bundle} onBack={() => setView("course")} onProgress={(progress) => setBundle({ ...bundle, progress })} />}
      {bundle && view === "quiz-setup" && <QuizSetup bundle={bundle} onBack={() => setView("course")} onStart={(questions) => { setActiveQuiz(questions); setView("quiz"); }} />}
      {bundle && view === "quiz" && activeQuiz && <QuizSession bundle={bundle} questions={activeQuiz} onBack={() => setView("quiz-setup")} onFinish={(results) => { setQuizResults(results); setView("results"); }} />}
      {bundle && view === "results" && quizResults && <Results bundle={bundle} results={quizResults} onBack={() => setView("course")} onRetry={() => setView("quiz-setup")} />}
    </main>
  );
}

function CoursesHome({ courses, onOpen }: { courses: CourseSummary[]; onOpen: (courseId: string) => void }) {
  const totalReviews = courses.reduce((sum, course) => sum + course.reviewCount, 0);
  return (
    <section className="page dashboard-page">
      <div className="hero-grid">
        <div>
          <p className="eyebrow">Your study collection</p>
          <h1>Make a little progress,<br />one course at a time.</h1>
          <p className="hero-copy">Your source material, carefully shaped into flashcards and quizzes you can refine whenever you learn something new.</p>
        </div>
        <Illustration scene="books" />
      </div>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Library</p>
          <h2>Your courses</h2>
        </div>
        <span className="quiet-pill">{plural(totalReviews, "review")} completed</span>
      </div>
      {courses.length === 0 ? (
        <div className="empty-panel"><Illustration scene="empty" compact /><h3>Your library is waiting.</h3><p>Use the CLI to scaffold the first course.</p></div>
      ) : (
        <div className="course-grid">
          {courses.map((course, index) => (
            <button className={`course-card accent-${index % 3}`} key={course.id} onClick={() => onOpen(course.id)}>
              <span className="course-index">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <p className="eyebrow">{course.subtitle ?? "Course notes"}</p>
                <h3>{course.title}</h3>
              </div>
              <div className="course-card-bottom">
                <span>{plural(course.cardCount, "card")}</span>
                <span>{plural(course.quizCount, "question")}</span>
                <ChevronRight size={19} />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function CourseHome({ bundle, onBack, onCards, onQuiz }: { bundle: CourseBundle; onBack: () => void; onCards: () => void; onQuiz: () => void }) {
  const latest = bundle.progress.quizSessions.at(-1);
  const score = latest ? latest.results.filter((item) => item.correct).length : 0;
  return (
    <section className="page course-page">
      <BackButton onClick={onBack}>All courses</BackButton>
      <div className="course-heading">
        <div>
          <p className="eyebrow">{bundle.course.subtitle}</p>
          <h1>{bundle.course.title}</h1>
          <p className="hero-copy">Choose a short review or test yourself with a randomized quiz.</p>
        </div>
        <Illustration scene="books" compact />
      </div>
      <div className="study-actions">
        <button className="study-action action-blue" disabled={bundle.cards.length === 0} onClick={onCards}>
          <span className="action-icon"><Layers3 /></span>
          <span><small>Review</small><strong>Flashcards</strong><em>{plural(bundle.cards.length, "card")}</em></span>
          <ArrowRight />
        </button>
        <button className="study-action action-green" disabled={bundle.quizzes.length === 0} onClick={onQuiz}>
          <span className="action-icon"><FileQuestion /></span>
          <span><small>Practice</small><strong>Quiz yourself</strong><em>{plural(bundle.quizzes.length, "question")}</em></span>
          <ArrowRight />
        </button>
      </div>
      <div className="course-detail-grid">
        <div className="paper-panel">
          <div className="activity-panel-content">
            <div>
              <p className="eyebrow">Recent activity</p>
              <h3>{bundle.progress.flashcardReviews.length === 0 ? "A fresh beginning" : plural(bundle.progress.flashcardReviews.length, "card review")}</h3>
              <p>Every answer you record stays with this course in its local progress file.</p>
            </div>
            <Illustration scene="progress" compact />
          </div>
        </div>
        <div className="paper-panel">
          <p className="eyebrow">Latest quiz</p>
          <h3>{latest ? `${score}/${latest.results.length} correct` : "No attempts yet"}</h3>
          <p>{latest ? "Keep revisiting the questions that need another pass." : "Your first result will appear here after a quiz."}</p>
        </div>
      </div>
    </section>
  );
}

function FlashcardSession({ bundle, onBack, onProgress }: { bundle: CourseBundle; onBack: () => void; onProgress: (progress: CourseBundle["progress"]) => void }) {
  const [cards] = useState(() => shuffle(bundle.cards));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const card = cards[index];

  async function rate(rating: "again" | "got-it") {
    if (saving) return;

    setSaving(true);
    rating === "got-it" ? haptics.success() : haptics.error();

    try {
      onProgress(await api.recordFlashcard(bundle.course.id, card.id, rating));
      setRevealed(false);
      setIndex((current) => current + 1);
    } finally {
      setSaving(false);
    }
  }

  if (!card) return <Completion title="Review complete" copy="You reached the end of this flashcard session." onBack={onBack} />;
  return (
    <section className="page study-page">
      <StudyTopBar title="Flashcards" index={index} total={cards.length} onBack={onBack} />
      <div className="study-stage">
        <div className={`flashcard ${revealed ? "revealed" : ""}`}>
          <div className="flashcard-content" key={`${card.id}-${revealed ? "answer" : "prompt"}`}>
            <p className="eyebrow">{revealed ? "Answer" : "Prompt"}</p>
            <MarkdownContent>{revealed ? card.back : card.front}</MarkdownContent>
          </div>
          {!revealed && <button className="primary-button" onClick={() => { haptics.tap(); setRevealed(true); }}>Reveal answer</button>}
        </div>
        {revealed && (
          <div className="review-controls">
            <button className="choice-button choice-coral" disabled={saving} onClick={() => void rate("again")}><RotateCcw size={18} />Again</button>
            <button className="choice-button choice-green" disabled={saving} onClick={() => void rate("got-it")}><Check size={18} />Got it</button>
          </div>
        )}
      </div>
    </section>
  );
}

function QuizSetup({ bundle, onBack, onStart }: { bundle: CourseBundle; onBack: () => void; onStart: (questions: QuizItem[]) => void }) {
  const [count, setCount] = useState(bundle.quizzes.length);
  return (
    <section className="page compact-page">
      <BackButton onClick={onBack}>Course home</BackButton>
      <div className="setup-card">
        <Illustration scene="results" compact />
        <p className="eyebrow">Practice session</p>
        <h1>How much do you want to review?</h1>
        <p>The questions are shuffled each time. Short answers let you grade yourself after revealing the expected response.</p>
        <label className="range-label">
          <span>Questions</span><strong>{count}</strong>
          <input type="range" min="1" max={bundle.quizzes.length} value={count} onChange={(event) => setCount(Number(event.target.value))} />
        </label>
        <button className="primary-button" onClick={() => { haptics.tap(); onStart(shuffle(bundle.quizzes).slice(0, count)); }}>Start quiz <ArrowRight size={18} /></button>
      </div>
    </section>
  );
}

function QuizSession({ bundle, questions, onBack, onFinish }: { bundle: CourseBundle; questions: QuizItem[]; onBack: () => void; onFinish: (results: QuizResult[]) => void }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string>();
  const [shortAnswer, setShortAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [startedAt] = useState(() => new Date().toISOString());
  const [saving, setSaving] = useState(false);
  const question = questions[index];

  async function advance(correct: boolean) {
    if (saving) return;

    setSaving(true);
    const nextResults = [...results, { questionId: question.id, correct }];
    try {
      if (index === questions.length - 1) {
        await api.recordQuiz(bundle.course.id, { id: crypto.randomUUID(), startedAt, completedAt: new Date().toISOString(), results: nextResults });
        onFinish(nextResults);
        return;
      }
      setResults(nextResults);
      setIndex((current) => current + 1);
      setSelected(undefined);
      setShortAnswer("");
      setRevealed(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page study-page">
      <StudyTopBar title="Quiz" index={index} total={questions.length} onBack={onBack} />
      <div className="quiz-card">
        <div className="quiz-content" key={question.id}>
          <p className="eyebrow">{question.type === "multiple-choice" ? "Choose one answer" : "Write your answer"}</p>
          <MarkdownContent>{question.prompt}</MarkdownContent>
          {question.type === "multiple-choice" ? (
            <div className="answer-list">
              {question.choices.map((choice) => {
                const isAnswer = choice === question.answer;
                const status = revealed ? (isAnswer ? "correct" : selected === choice ? "wrong" : "") : selected === choice ? "selected" : "";
                return <button className={`answer-option ${status}`} key={choice} onClick={() => { if (!revealed) { haptics.selection(); setSelected(choice); } }}>{choice}{revealed && isAnswer && <Check size={18} />}{revealed && selected === choice && !isAnswer && <X size={18} />}</button>;
              })}
            </div>
          ) : (
            <textarea className="short-answer" placeholder="Type what you remember..." value={shortAnswer} disabled={revealed} onChange={(event) => setShortAnswer(event.target.value)} />
          )}
        </div>
        {revealed && (
          <div className="answer-explanation">
            {question.type === "multiple-choice" && (
              <div className={`feedback-label ${selected === question.answer ? "feedback-success" : "feedback-error"}`} role="status" aria-live="polite">
                {selected === question.answer ? <Check size={17} /> : <X size={17} />}
                {selected === question.answer ? "Correct" : "Not quite"}
              </div>
            )}
            {question.type === "short-answer" && <><span className="eyebrow">Expected answer</span><strong>{question.answer}</strong></>}
            <MarkdownContent>{question.explanation}</MarkdownContent>
          </div>
        )}
        {!revealed && <button className="primary-button" disabled={question.type === "multiple-choice" ? !selected : !shortAnswer.trim()} onClick={() => { if (question.type === "multiple-choice") { selected === question.answer ? haptics.success() : haptics.error(); } else { haptics.tap(); } setRevealed(true); }}>Check answer</button>}
        {revealed && question.type === "multiple-choice" && <button className="primary-button" disabled={saving} onClick={() => void advance(selected === question.answer)}>Next question <ArrowRight size={18} /></button>}
        {revealed && question.type === "short-answer" && <div className="self-grade"><span>Did you get it right?</span><button className="choice-button choice-coral" disabled={saving} onClick={() => { haptics.error(); void advance(false); }}><X size={17} />Not yet</button><button className="choice-button choice-green" disabled={saving} onClick={() => { haptics.success(); void advance(true); }}><Check size={17} />Yes</button></div>}
      </div>
    </section>
  );
}

function Results({ bundle, results, onBack, onRetry }: { bundle: CourseBundle; results: QuizResult[]; onBack: () => void; onRetry: () => void }) {
  const correct = results.filter((item) => item.correct).length;
  return (
    <section className="page compact-page">
      <div className="results-card">
        <Illustration scene="results" compact />
        <p className="eyebrow">Session complete</p>
        <h1>Here is how it went.</h1>
        <div className="score-box"><strong>{correct}/{results.length}</strong><span>questions correct</span></div>
        <div className="result-list">
          {results.map((result, index) => {
            const question = bundle.quizzes.find((quiz) => quiz.id === result.questionId);
            return <div className="result-row" key={result.questionId} style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>{result.correct ? <Check size={17} /> : <X size={17} />}<span>{question?.prompt}</span></div>;
          })}
        </div>
        <div className="button-row"><button className="secondary-button" onClick={onBack}>Course home</button><button className="primary-button" onClick={onRetry}>Try another quiz</button></div>
      </div>
    </section>
  );
}

function Completion({ title, copy, onBack }: { title: string; copy: string; onBack: () => void }) {
  return <section className="page compact-page"><div className="setup-card"><Illustration scene="results" compact /><p className="eyebrow">Nice work</p><h1>{title}</h1><p>{copy}</p><button className="primary-button" onClick={onBack}>Course home</button></div></section>;
}

function BackButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return <button className="back-button" onClick={onClick}><ArrowLeft size={17} />{children}</button>;
}

function StudyTopBar({ title, index, total, onBack }: { title: string; index: number; total: number; onBack: () => void }) {
  return <div className="study-topbar"><BackButton onClick={onBack}>Exit {title.toLowerCase()}</BackButton><div className="progress-wrap"><div className="progress-meta"><span>{title}</span><span>{index + 1}/{total}</span></div><div className="progress-track"><span style={{ width: `${((index + 1) / total) * 100}%` }} /></div></div></div>;
}
