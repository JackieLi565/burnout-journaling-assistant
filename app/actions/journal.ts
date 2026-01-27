"use server";

import { initAdmin } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const app = initAdmin();
    const auth = getAuth(app);
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function getUploadUrl(filename: string, contentType: string) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const app = initAdmin();
  const storage = getStorage(app);
  const bucket = storage.bucket();
  const filePath = `uploads/${user.uid}/${Date.now()}-${filename}`;
  const file = bucket.file(filePath);

  const [url] = await file.getSignedUrl({
    version: "v2",
    action: "write",
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  return { url, filePath };
}

export async function createJournalEntry(data: {
  title: string;
  content: string;
  mediaPath?: string;
}) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const app = initAdmin();
  const db = getFirestore(app);
  
  // Create the journal entry under /users/{userId}/journals/{journalId}
  await db.collection("users").doc(user.uid).collection("journals").add({
    title: data.title,
    content: data.content,
    mediaPath: data.mediaPath || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: user.uid, // Redundant if under subcollection but good for querying group
  });

  revalidatePath("/journal");
}
