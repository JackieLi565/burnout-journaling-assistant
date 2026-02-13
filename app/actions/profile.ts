"use server";

import { initAdmin } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth-rsc";
import { z } from "zod";

// --- Schema ---

const profileSchema = z.object({
  displayName: z.string().min(1, "Name is required").optional(),
  timezone: z.string().optional(),
  dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).optional(),
  timeFormat: z.enum(["12h", "24h"]).optional(),
});

export type ProfileData = z.infer<typeof profileSchema>;

// --- Helpers ---

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (!sessionCookie) {
    redirect("/signin");
  }

  try {
    const decodedToken = await verifySession(sessionCookie);
    return decodedToken.uid;
  } catch (error) {
    redirect("/signin");
  }
}

function getDb() {
  const app = initAdmin();
  return getFirestore(app);
}

function getAuthAdmin() {
    const app = initAdmin();
    return getAuth(app);
}


// --- Actions ---

export async function getUserProfile(): Promise<ProfileData> {
  const uid = await getAuthenticatedUser();
  const db = getDb();

  const userDoc = await db.collection("users").doc(uid).get();

  if (!userDoc.exists) {
    // Return default values if user doc doesn't exist (though it should)
    return {
      displayName: "",
      timezone: "UTC",
      dateFormat: "YYYY-MM-DD",
      timeFormat: "24h",
    };
  }

  const data = userDoc.data();

  return {
    displayName: data?.displayName || "",
    timezone: data?.timezone || "UTC",
    dateFormat: data?.dateFormat || "YYYY-MM-DD",
    timeFormat: data?.timeFormat || "24h",
  };
}

export async function updateUserProfile(data: ProfileData) {
  const uid = await getAuthenticatedUser();
  const db = getDb();

  // Validate data
  const parsedData = profileSchema.safeParse(data);
  if (!parsedData.success) {
    return { error: "Invalid data", details: parsedData.error.format() };
  }

  try {
    await db.collection("users").doc(uid).set(
      {
        ...parsedData.data,
        updatedAt: new Date(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { error: "Failed to update profile" };
  }
}

export async function deleteUserAccount() {
  const uid = await getAuthenticatedUser();
  const db = getDb();
  const auth = getAuthAdmin();

  try {
    // 1. Delete user data from Firestore (and subcollections if needed, but for now just the user doc)
    // Ideally, a cloud function handles recursive delete, but we'll delete the main doc here.
    await db.collection("users").doc(uid).delete();

    // 2. Delete user from Auth
    await auth.deleteUser(uid);

    // 3. Clear session cookie
    const cookieStore = await cookies();
    cookieStore.delete("__session");

  } catch (error) {
    console.error("Error deleting account:", error);
    return { error: "Failed to delete account" };
  }

  redirect("/signup");
}
