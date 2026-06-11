/*
 * File:    frontend/src/lib/subjects.ts
 * Purpose: The fixed set of quiz subjects offered platform-wide. Quizzes are
 *          generated/created only against these subjects, so the value is shared
 *          across the teacher wizard, admin quiz screens, and any filter.
 * Owner:   Pranav
 */

export const QUIZ_SUBJECTS = ["Robotics", "Drone", "Space", "Rocket", "Coding"] as const;

export type QuizSubject = (typeof QUIZ_SUBJECTS)[number];
