// app/actions/quiz.ts
"use server";

import { verifySession } from "@/lib/auth-rsc";
import { cookies } from "next/headers";
import { db } from "@/lib/firebase-admin"; // Adjust if your export is named differently

export async function submitQuizResult(responses: Record<number, number>) {
    try {
        // 1. Authenticate the user
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("__session")?.value;

        if (!sessionCookie) {
            return { success: false, error: "User not authenticated" };
        }

        const decodedToken = await verifySession(sessionCookie);
        const uid = decodedToken.uid;

        if (!uid) {
            return { success: false, error: "Invalid user ID" };
        }

        // 2. Prepare the data for the Python engine
        // We save a timestamp so the Python script knows which one is new
        const quizData = {
            responses: responses, // The raw map of {0: 3, 1: 0, ...}
            completedAt: new Date(),
            processed: false, // Flag for your Python engine to know it needs work
        };

        // 3. Write to Firestore: /users/[uid]/quizzes/[auto-generated-id]
        await db
            .collection("users")
            .doc(uid)
            .collection("quizzes")
            .add(quizData);

        return { success: true };

    } catch (error) {
        console.error("Quiz submission error:", error);
        return { success: false, error: "Failed to save quiz" };
    }
}