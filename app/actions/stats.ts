// app/actions/stats.ts
"use server";

import { getAuthenticatedUserId } from "@/app/actions/auth";
import { getAdminFirestore } from "@/lib/firebase-admin";

// ---------------------------------------------------------------------------
// MBI subscale definitions
// Indices correspond to question positions in the 22-item quiz (0-based).
//
// reversed=true  → negative statement: Strongly Agree (0) = high burnout.
//                  Burnout contribution per item = (3 − response).
// reversed=false → positive statement: Strongly Disagree (3) = high burnout
//                  (reduced personal accomplishment).
//                  Burnout contribution per item = response value directly.
// ---------------------------------------------------------------------------
const MBI_SECTIONS = {
    emotionalExhaustion: {
        indices: [0, 1, 2, 3, 4, 5, 6, 8, 10] as const,
        reversed: true,
    },
    depersonalization: {
        indices: [7, 9, 11, 12, 13] as const,
        reversed: true,
    },
    personalAccomplishment: {
        indices: [14, 15, 16, 17, 18, 19, 20, 21] as const,
        reversed: false,
    },
} as const;

function scoreMbiSection(
    responses: Record<string, number>,
    indices: readonly number[],
    reversed: boolean
): number {
    const values = indices
        .map((i) => responses[i.toString()])
        .filter((v) => v !== undefined);
    if (values.length === 0) return 0;
    const totalPossible = values.length * 3;
    const rawSum = values.reduce((a, b) => a + b, 0);
    // For reversed sections (EE, DP): invert so that agreement = higher burnout score
    const burnoutSum = reversed ? totalPossible - rawSum : rawSum;
    return Math.min(100, Math.round((burnoutSum / totalPossible) * 100));
}

export type MbiSections = {
    emotionalExhaustion: number;   // 0–100, higher = more burned out
    depersonalization: number;     // 0–100, higher = more burned out
    personalAccomplishment: number; // 0–100, higher = more reduced accomplishment
};

export type QuizStat = {
  date: string;
  /** Overall burnout score (0–100): mean of the three MBI section scores. */
  score: number;
  id: string;
  sections: MbiSections;
};

export async function getQuizStats(): Promise<QuizStat[]> {
  const uid = await getAuthenticatedUserId();

  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("quizzes")
      .orderBy("completedAt", "asc") // Oldest to newest for the graph
      .get();

    const stats = snapshot.docs.map((doc) => {
      const data = doc.data();
      const responses = data.responses as Record<string, number>;

      const sections: MbiSections = {
        emotionalExhaustion: scoreMbiSection(
          responses,
          MBI_SECTIONS.emotionalExhaustion.indices,
          MBI_SECTIONS.emotionalExhaustion.reversed
        ),
        depersonalization: scoreMbiSection(
          responses,
          MBI_SECTIONS.depersonalization.indices,
          MBI_SECTIONS.depersonalization.reversed
        ),
        personalAccomplishment: scoreMbiSection(
          responses,
          MBI_SECTIONS.personalAccomplishment.indices,
          MBI_SECTIONS.personalAccomplishment.reversed
        ),
      };

      // Overall burnout score: mean of the three section scores
      const sectionScores = Object.values(sections);
      const normalizedScore = Math.round(
        sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length
      );

      return {
        id: doc.id,
        date: data.completedAt.toDate().toLocaleDateString(),
        score: normalizedScore,
        sections,
      };
    });

    return stats;
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return [];
  }
}
