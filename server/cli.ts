import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { promises as fs } from "node:fs";
import path from "node:path";
import { coursesRoot, validateCourses } from "./store";

const execFileAsync = promisify(execFile);
const [, , command, ...args] = process.argv;

function assertCourseId(courseId: string | undefined) {
  if (!courseId || !/^[a-z0-9-]+$/.test(courseId)) {
    throw new Error("Provide a lowercase course ID using letters, numbers, and hyphens.");
  }
  return courseId;
}

async function scaffold(courseIdArg?: string, titleArg?: string) {
  const courseId = assertCourseId(courseIdArg);
  const title = titleArg?.trim();
  if (!title) throw new Error("Provide a course title.");
  const dir = path.join(coursesRoot, courseId);
  await fs.mkdir(path.join(dir, "sources"), { recursive: true });
  await fs.mkdir(path.join(dir, "content"), { recursive: true });
  await fs.writeFile(path.join(dir, "course.json"), `${JSON.stringify({ id: courseId, title, sources: [] }, null, 2)}\n`);
  await fs.writeFile(path.join(dir, "content", "cards.json"), '{\n  "version": 1,\n  "cards": []\n}\n');
  await fs.writeFile(path.join(dir, "content", "quizzes.json"), '{\n  "version": 1,\n  "quizzes": []\n}\n');
  await fs.writeFile(path.join(dir, "progress.json"), '{\n  "version": 1,\n  "flashcardReviews": [],\n  "quizSessions": []\n}\n');
  console.log(`Created courses/${courseId}`);
}

async function addSource(courseIdArg?: string, sourcePathArg?: string) {
  const courseId = assertCourseId(courseIdArg);
  if (!sourcePathArg) throw new Error("Provide a PDF or Markdown source path.");
  const sourcePath = path.resolve(sourcePathArg);
  const filename = path.basename(sourcePath);
  const ext = path.extname(filename).toLowerCase();
  if (![".pdf", ".md", ".markdown"].includes(ext)) {
    throw new Error("Source files must be PDF or Markdown.");
  }
  const dir = path.join(coursesRoot, courseId);
  const coursePath = path.join(dir, "course.json");
  const course = JSON.parse(await fs.readFile(coursePath, "utf8")) as {
    sources: Array<{ filename: string; type: "pdf" | "markdown" }>;
  };
  await fs.copyFile(sourcePath, path.join(dir, "sources", filename));
  if (!course.sources.some((source) => source.filename === filename)) {
    course.sources.push({ filename, type: ext === ".pdf" ? "pdf" : "markdown" });
    await fs.writeFile(coursePath, `${JSON.stringify(course, null, 2)}\n`);
  }
  console.log(`Added ${filename} to ${courseId}`);
}

async function renderPdf(courseIdArg?: string, filenameArg?: string) {
  const courseId = assertCourseId(courseIdArg);
  if (!filenameArg) throw new Error("Provide the registered PDF filename.");
  const pdfPath = path.join(coursesRoot, courseId, "sources", filenameArg);
  const outDir = path.join(process.cwd(), ".tmp", "pdf-renders", courseId, path.parse(filenameArg).name);
  await fs.mkdir(outDir, { recursive: true });
  await execFileAsync("pdftoppm", ["-jpeg", "-r", "150", pdfPath, path.join(outDir, "page")]);
  console.log(`Rendered temporary previews in ${path.relative(process.cwd(), outDir)}`);
}


function printPrompt(courseIdArg?: string) {
  const courseId = assertCourseId(courseIdArg);
  console.log(`Read AGENTS.md, then refresh the study content for course "${courseId}".
Inspect every registered source in courses/${courseId}/sources. For scanned PDFs, use:
  npm run cli -- render-pdf ${courseId} "<filename>"
Update both content/cards.json and content/quizzes.json. Preserve useful existing items, add sourceFilenames to every item, and run:
  npm run cli -- validate ${courseId}`);
}

async function main() {
  switch (command) {
    case "scaffold":
      await scaffold(args[0], args.slice(1).join(" "));
      break;
    case "add-source":
      await addSource(args[0], args[1]);
      break;
    case "render-pdf":
      await renderPdf(args[0], args.slice(1).join(" "));
      break;
    case "prompt":
      printPrompt(args[0]);
      break;
    case "validate": {
      const ids = await validateCourses(args[0]);
      console.log(`Validated ${ids.length} course${ids.length === 1 ? "" : "s"}: ${ids.join(", ")}`);
      break;
    }
    default:
      console.log(`Commonplace CLI

Commands:
  scaffold <course-id> <title>
  add-source <course-id> <path>
  render-pdf <course-id> <registered filename>
  prompt <course-id>
  validate [course-id]`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
