"use server";

import { getAuthenticatedUserId } from "@/app/actions/auth";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getUserProfile } from "./profile";

// Questions 0–6:  Emotional Exhaustion (negative statements — Agree = more burnout)
// Questions 7–13: Depersonalization       (negative statements — Agree = more burnout)
// Questions 14–21: Personal Accomplishment (positive statements — Agree = less burnout)
const EE_INDICES = [0, 1, 2, 3, 4, 5, 6];
const DP_INDICES = [7, 8, 9, 10, 11, 12, 13];
const PA_INDICES = [14, 15, 16, 17, 18, 19, 20, 21];

export type QuizDataPoint = {
  date: string; // YYYY-MM-DD in user's timezone
  score: number; // 0–100 overall burnout index (higher = more burnout)
  cumulativeScore: number; // running average of score up to this point
  eeScore: number; // 0–100 emotional exhaustion burnout (higher = worse)
  dpScore: number; // 0–100 depersonalization burnout (higher = worse)
  paScore: number; // 0–100 reduced personal accomplishment burnout (higher = worse)
};

export type QuizStatsResult = {
  points: QuizDataPoint[];
  latestScore: number | null;
};

function sectionScore(
  responses: Record<string, number>,
  indices: number[],
  invert: boolean
): number {
  const values = indices
    .map((i) => responses[String(i)])
    .filter((v) => typeof v === "number" && v >= 0 && v <= 3) as number[];
  if (values.length === 0) return 0;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  // For EE/DP (negative statements): Strongly Agree (avg→0) = max burnout → invert=true → ((3-avg)/3)*100
  // For PA (positive statements):    Strongly Disagree (avg→3) = max burnout → invert=false → (avg/3)*100
  return Math.round(invert ? ((3 - avg) / 3) * 100 : (avg / 3) * 100);
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

    const raw: Omit<QuizDataPoint, "cumulativeScore">[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.completedAt || !data.responses) continue;

      const responses = data.responses as Record<string, number>;
      const completedAt = data.completedAt.toDate();
      const date = completedAt.toLocaleDateString("en-CA", { timeZone: timezone });

      const eeScore = sectionScore(responses, EE_INDICES, true);
      const dpScore = sectionScore(responses, DP_INDICES, true);
      const paScore = sectionScore(responses, PA_INDICES, false);

      // Overall = mean of the three correctly-normalized section scores,
      // ensuring PA inversion is accounted for (avoids the raw-average bug).
      if (eeScore === 0 && dpScore === 0 && paScore === 0) continue;
      const score = Math.round((eeScore + dpScore + paScore) / 3);

      raw.push({ date, score, eeScore, dpScore, paScore });
    }

    // Deduplicate by date — keep last quiz per day
    const byDate = new Map<string, Omit<QuizDataPoint, "cumulativeScore">>();
    for (const p of raw) byDate.set(p.date, p);
    const deduped = Array.from(byDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Compute cumulative as running average of score
    let runningSum = 0;
    const points: QuizDataPoint[] = deduped.map((p, i) => {
      runningSum += p.score;
      return { ...p, cumulativeScore: Math.round(runningSum / (i + 1)) };
    });

    const latestScore = points.length > 0 ? points[points.length - 1].score : null;

    return { points, latestScore };
  } catch (error) {
    console.error("Error fetching quiz stats:", error);
    return { points: [], latestScore: null };
  }
}
