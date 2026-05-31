import path from "node:path";
import { existsSync, readdirSync, watch, type FSWatcher } from "node:fs";
import express from "express";
import { broadcastCourseChange, createApp } from "./app";
import { coursesRoot, projectRoot } from "./store";

const port = Number(process.env.PORT ?? 4310);
const app = createApp();
const distDir = path.join(projectRoot, "dist");

if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*splat", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
}

const watchedPaths = new Set<string>();
const watchers: FSWatcher[] = [];

function watchPath(watchTarget: string, onChange: (filename?: string) => void) {
  if (!existsSync(watchTarget) || watchedPaths.has(watchTarget)) return;
  const watcher = watch(watchTarget, (_event, filename) => onChange(filename?.toString()));
  watcher.on("error", (error) => console.warn(`File watcher warning for ${watchTarget}: ${error.message}`));
  watchers.push(watcher);
  watchedPaths.add(watchTarget);
}

function refreshCourseWatchers() {
  if (!existsSync(coursesRoot)) return;
  readdirSync(coursesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .forEach((entry) => {
      const dir = path.join(coursesRoot, entry.name);
      watchPath(dir, (filename) => {
        refreshCourseWatchers();
        if (filename === "course.json") broadcastCourseChange(entry.name);
      });
      watchPath(path.join(dir, "content"), (filename) => {
        if (filename?.endsWith(".json")) broadcastCourseChange(entry.name);
      });
    });
}

watchPath(coursesRoot, refreshCourseWatchers);
refreshCourseWatchers();

app.listen(port, () => {
  console.log(`Commonplace server listening on http://localhost:${port}`);
});
