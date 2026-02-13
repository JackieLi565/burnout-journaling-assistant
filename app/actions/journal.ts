"use server";

import { initAdmin } from "@/lib/firebase-admin";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth-rsc";

// Types
export interface Journal {
  id: string; // The date string (yyyy-mm-dd)
  createdAt: number;
  hidden: boolean;
  preview?: string; // Derived from first entry
}

export interface Entry {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

// Helpers
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

// Actions

export async function getJournals(
  limitCount: number = 20,
  startAfterId?: string,
): Promise<Journal[]> {
  const uid = await getAuthenticatedUser();
  const db = getDb();

  let query = db
    .collection(`users/${uid}/journals`)
    .where("hidden", "==", false)
    .orderBy("__name__", "desc") // Orders by ID (date) descending
    .limit(limitCount);

  if (startAfterId) {
    const docSnap = await db.doc(`users/${uid}/journals/${startAfterId}`).get();
    if (docSnap.exists) {
      query = query.startAfter(docSnap);
    }
  }

  const snap = await query.get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    createdAt: doc.data().createdAt?.toMillis() || 0,
    hidden: doc.data().hidden || false,
  }));
}

export async function getJournal(
  date: string,
): Promise<{ journal: Journal | null; entries: Entry[] }> {
  const uid = await getAuthenticatedUser();
  const db = getDb();
  const journalRef = db.doc(`users/${uid}/journals/${date}`);
  const journalSnap = await journalRef.get();

  if (!journalSnap.exists || journalSnap.data()?.hidden) {
    return { journal: null, entries: [] };
  }

  const entriesSnap = await journalRef
    .collection("entries")
    .orderBy("createdAt", "asc")
    .get();

  const entries = entriesSnap.docs.map((doc) => ({
    id: doc.id,
    content: doc.data().content || "",
    createdAt: doc.data().createdAt?.toMillis() || 0,
    updatedAt: doc.data().updatedAt?.toMillis() || 0,
  }));

  return {
    journal: {
      id: journalSnap.id,
      createdAt: journalSnap.data()?.createdAt?.toMillis() || 0,
      hidden: journalSnap.data()?.hidden || false,
    },
    entries,
  };
}

export async function createJournal(date: string) {
  const uid = await getAuthenticatedUser();
  const db = getDb();
  const journalRef = db.doc(`users/${uid}/journals/${date}`);

  await journalRef.set(
    {
      createdAt: Timestamp.now(),
      hidden: false,
    },
    { merge: true },
  ); // Use merge to avoid overwriting if exists but was hidden

  return { success: true };
}

export async function addEntry(date: string, content: string = "") {
  const uid = await getAuthenticatedUser();
  const db = getDb();
  const journalRef = db.doc(`users/${uid}/journals/${date}`);

  // Ensure journal exists
  const journalSnap = await journalRef.get();
  if (!journalSnap.exists) {
    await createJournal(date);
  }

  const entryRef = journalRef.collection("entries").doc();
  const now = Timestamp.now();

  await entryRef.set({
    content,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id: entryRef.id,
    createdAt: now.toMillis(),
    updatedAt: now.toMillis(),
  };
}

export async function autoSaveEntry(
  date: string,
  entryId: string,
  content: string,
) {
  const uid = await getAuthenticatedUser();
  const db = getDb();
  const entryRef = db.doc(`users/${uid}/journals/${date}/entries/${entryId}`);

  await entryRef.update({
    content,
    updatedAt: Timestamp.now(),
  });

  return { success: true };
}

export async function softDeleteJournal(date: string) {
  const uid = await getAuthenticatedUser();
  const db = getDb();
  const journalRef = db.doc(`users/${uid}/journals/${date}`);

  await journalRef.update({
    hidden: true,
  });

  return { success: true };
}

export async function hardDeleteEntry(date: string, entryId: string) {
  const uid = await getAuthenticatedUser();
  const db = getDb();
  const entryRef = db.doc(`users/${uid}/journals/${date}/entries/${entryId}`);

  await entryRef.delete();
  return { success: true };
}
