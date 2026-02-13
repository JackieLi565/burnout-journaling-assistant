// app/actions/stats.ts
"use server";

import { verifySession } from "@/lib/auth-rsc";
import { cookies } from "next/headers";
import { db } from "@/lib/firebase-admin";

export type QuizStat = {
    date: string;
    score: number;
    id: string;
};

export async function getQuizStats(): Promise<QuizStat[]> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("__session")?.value;
        if (!sessionCookie) return [];

        const decodedToken = await verifySession(sessionCookie);
        const uid = decodedToken.uid;

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
            const totalPossible = Object.keys(data.responses).length * 3; // Max score per question is 3
            const currentScore = Object.values(data.responses as Record<string, number>).reduce((a, b) => a + b, 0);

            // Normalize to 0-100 scale
            const normalizedScore = Math.round((currentScore / totalPossible) * 100);

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