import { describe, expect, it } from "vitest";
import { listCourses, loadCourse } from "../server/store";

describe("seeded CE 326 course", () => {
  it("loads validated learning content", async () => {
    const bundle = await loadCourse("ce-326");
    expect(bundle.course.title).toBe("CE 326");
    expect(bundle.cards.length).toBeGreaterThan(10);
    expect(bundle.quizzes.length).toBeGreaterThan(8);
  });

  it("appears in course summaries", async () => {
    const courses = await listCourses();
    expect(courses.some((course) => course.id === "ce-326")).toBe(true);
  });
});
