"use server";

import { getAuthenticatedUserId } from "@/app/actions/auth";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getUserProfile } from "./profile";

export type QuizDataPoint = {
  date: string; // YYYY-MM-DD in user's timezone
  score: number; // 0–100 wellbeing score (higher = less burnout indicators)
  responseCount: number; // number of answered questions
};

export type QuizStatsResult = {
  points: QuizDataPoint[];
  latestScore: number | null;
};

const TOTAL_QUESTIONS = 22;

function computeWellbeingScore(responses: Record<string, number>): number | null {
  const values = Object.values(responses).filter(
    (v) => typeof v === "number" && v >= 0 && v <= 3
  );
  if (values.length === 0) return null;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  // avg is 0–3 where 0=Strongly Agree (most burnout), 3=Strongly Disagree (least burnout)
  return Math.round((avg / 3) * 100);
}

export async function getQuizStats(): Promise<QuizStatsResult> {
  const uid = await getAuthenticatedUserId();

  try {
    const db = getAdminFirestore();
    const profile = await getUserProfile();
    const timezone = profile.timezone || "UTC";

    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("quizzes")
      .orderBy("completedAt", "asc")
      .get();

    const points: QuizDataPoint[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.completedAt || !data.responses) continue;

      const completedAt = data.completedAt.toDate();
      const dateStr = completedAt.toLocaleDateString("en-CA", { timeZone: timezone });

      const score = computeWellbeingScore(data.responses as Record<string, number>);
      if (score === null) continue;

      const responseCount = Object.keys(data.responses).length;

      points.push({ date: dateStr, score, responseCount });
    }

    // If multiple quizzes on the same day, keep the last one
    const byDate = new Map<string, QuizDataPoint>();
    for (const p of points) {
      byDate.set(p.date, p);
    }

    const deduped = Array.from(byDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const latestScore = deduped.length > 0 ? deduped[deduped.length - 1].score : null;

    return { points: deduped, latestScore };
  } catch (error) {
    console.error("Error fetching quiz stats:", error);
    return { points: [], latestScore: null };
  }
}
