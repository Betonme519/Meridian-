export interface GradedCourse {
  credits: number;
  gradePoint: number;
}

export function calculateGPA(courses: GradedCourse[]): number {
  if (!courses.length) return 0;
  const totalCredits = courses.reduce((s, c) => s + c.credits, 0);
  if (totalCredits === 0) return 0;
  const weighted = courses.reduce((s, c) => s + c.credits * c.gradePoint, 0);
  return weighted / totalCredits;
}
