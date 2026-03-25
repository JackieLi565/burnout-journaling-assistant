"use server";

import { getAuthenticatedUserId } from "@/app/actions/auth";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export type FeedbackArea = "journaling" | "statistics" | "quiz" | "general" | "bug";

export async function submitFeedback(area: FeedbackArea, message: string) {
  const uid = await getAuthenticatedUserId();
  const db = getAdminFirestore();

  await db.collection("feedback").add({
    uid,
    area,
    message,
    createdAt: Timestamp.now(),
  });

  return { success: true };
}
