
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase.js";

export enum StreakStatus {
  UNINITIATED = 'UNINITIATED',
  COMPLETED_TODAY = 'COMPLETED_TODAY',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
  BROKEN = 'BROKEN',
}

/**
 * Evaluates the user's streak status based on their last lesson date.
 * @param lastLessonDate ISO string or null
 * @returns StreakStatus
 */
export const evaluateStreakStatus = (lastLessonDate: string | null): StreakStatus => {
  if (!lastLessonDate) return StreakStatus.UNINITIATED;

  const today = new Date();
  const lastDate = new Date(lastLessonDate);

  // Reset hours to compare dates only
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const lastDateOnly = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

  const diffTime = todayDateOnly.getTime() - lastDateOnly.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return StreakStatus.COMPLETED_TODAY;
  if (diffDays === 1) return StreakStatus.ACTION_REQUIRED;
  return StreakStatus.BROKEN;
};

/**
 * Updates the user's streak in Firestore after completing a lesson.
 * @param user UserData
 */
export const markLessonComplete = async (user: any) => {
  const status = evaluateStreakStatus(user.lastLessonDate);
  let newStreak = user.currentStreak;

  if (status === StreakStatus.UNINITIATED || status === StreakStatus.BROKEN) {
    newStreak = 1;
  } else if (status === StreakStatus.ACTION_REQUIRED) {
    newStreak = user.currentStreak + 1;
  } else if (status === StreakStatus.COMPLETED_TODAY) {
    // Already completed today, don't increment streak again but update date just in case
    newStreak = user.currentStreak;
  }

  const today = new Date().toISOString();
  const userRef = doc(db, "users", user.uid);

  await updateDoc(userRef, {
    currentStreak: newStreak,
    lastLessonDate: today
  });

  return newStreak;
};
