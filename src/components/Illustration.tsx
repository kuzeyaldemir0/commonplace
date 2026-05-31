type Scene = "books" | "empty" | "progress" | "results";

const sceneAssets: Record<Scene, string> = {
  books: "/illustrations/study-materials.png",
  empty: "/illustrations/empty-notebook.png",
  progress: "/illustrations/progress-staircase.png",
  results: "/illustrations/quiz-completion.png"
};

export function Illustration({ scene, compact = false }: { scene: Scene; compact?: boolean }) {
  return (
    <div className={`illustration illustration-${scene} ${compact ? "illustration-compact" : ""}`} aria-hidden="true">
      <img className="illustration-image" src={sceneAssets[scene]} alt="" />
    </div>
  );
}
