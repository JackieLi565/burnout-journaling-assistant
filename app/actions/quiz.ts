// app/actions/quiz.ts
"use server";

import { getAuthenticatedUserId } from "@/app/actions/auth";
import { db } from "@/lib/firebase-admin";

export async function submitQuizResult(responses: Record<number, number>) {
    const uid = await getAuthenticatedUserId();

    try {
        console.log("User Authenticated:", uid); //TODO remove
        const quizData = {
            responses: responses, // The raw map of {0: 3, 1: 0, ...}
            completedAt: new Date(),
            processed: false, // Flag for your Python engine to know it needs work
        };

        // Write to Firestore: /users/[uid]/quizzes/[auto-generated-id]
        await db
            .collection("users")
            .doc(uid)
            .collection("quizzes")
            .add(quizData);
        console.log("Data saved to Firestore!"); //TODO remove
        return { success: true };

    } catch (error) {
        console.error("Quiz submission error:", error);
        return { success: false, error: "Failed to save quiz" };
    }
}
