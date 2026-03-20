// app/actions/stats.ts
"use server";

import { getAuthenticatedUserId } from "@/app/actions/auth";
import { getAdminFirestore } from "@/lib/firebase-admin";

export type QuizStat = {
  date: string;
  score: number;
  id: string;
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

    // Map the documents to a clean format
    const stats = snapshot.docs.map((doc) => {
      const data = doc.data();

      // Calculate a simple "Stress Score" from the raw answers
      // (This logic should match your Python engine eventually)
      const responses = data.responses as Record<string, number>;
      const responseValues = Object.values(responses);
      const totalPossible = responseValues.length * 3; // Max score per question is 3
      const currentScore = responseValues.reduce((a, b) => a + b, 0);

      // Normalize to 0-100 scale; guard against empty responses (no division by zero)
      const normalizedScore =
        totalPossible > 0
          ? Math.min(100, Math.round((currentScore / totalPossible) * 100))
          : 0;

      return {
        id: doc.id,
        date: data.completedAt.toDate().toLocaleDateString(), // Format: "2/12/2026"
        score: normalizedScore,
      };
    });

    return stats;
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return [];
  }
}
