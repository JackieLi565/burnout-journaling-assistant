"use server";

import { getAdminFirestore, getAdminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedUserId } from "@/app/actions/auth";
import { z } from "zod";

// --- Schema ---

const profileSchema = z.object({
  displayName: z.string().min(1, "Name is required").optional(),
  timezone: z.string().optional(),
  dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).optional(),
  timeFormat: z.enum(["12h", "24h"]).optional(),
});

export type ProfileData = z.infer<typeof profileSchema>;

export async function getUserProfile() {
  const uid = await getAuthenticatedUserId();
  const db = getAdminFirestore();

  const userDoc = await db.collection("users").doc(uid).get();

  // Default return
  if (!userDoc.exists)
    return {
      displayName: "",
      timezone: "UTC",
      dateFormat: "YYYY-MM-DD",
      timeFormat: "24h",
    };

  const data = userDoc.data();

  return {
    displayName: data?.displayName || "",
    timezone: data?.timezone || "UTC",
    dateFormat: data?.dateFormat || "YYYY-MM-DD",
    timeFormat: data?.timeFormat || "24h",
  };
}

export async function updateUserProfile(data: ProfileData) {
  const uid = await getAuthenticatedUserId();
  const db = getAdminFirestore();

  // Validate data
  const parsedData = profileSchema.safeParse(data);
  if (!parsedData.success) {
    return { error: "Invalid data", details: parsedData.error.format() };
  }

  try {
    await db
      .collection("users")
      .doc(uid)
      .set(
        {
          ...parsedData.data,
          updatedAt: new Date(),
        },
        { merge: true },
      );
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { error: "Failed to update profile" };
  }
}

async function deleteSubcollection(
  db: Firestore,
  uid: string,
  name: string
) {
  const snapshot = await db
    .collection("users")
    .doc(uid)
    .collection(name)
    .get();
  await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
}

export async function deleteUserAccount() {
  const uid = await getAuthenticatedUserId();
  const db = getAdminFirestore();
  const auth = getAdminAuth();

  try {
    // 1. Delete all subcollections before removing the parent document.
    //    Firestore does not cascade-delete subcollections automatically,
    //    so omitting this step leaves orphaned data permanently.
    await Promise.all([
      deleteSubcollection(db, uid, "journals"),
      deleteSubcollection(db, uid, "quizzes"),
      deleteSubcollection(db, uid, "biometrics"),
    ]);

    // 2. Delete the top-level user document
    await db.collection("users").doc(uid).delete();

    // 3. Delete user from Auth
    await auth.deleteUser(uid);

    // 4. Clear session cookie
    const cookieStore = await cookies();
    cookieStore.delete("__session");
  } catch (error) {
    console.error("Error deleting account:", error);
    return { error: "Failed to delete account" };
  }

  redirect("/signup");
}
