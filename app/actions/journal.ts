"use server";

import { getAdminFirestore } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { getAuthenticatedUserId } from "@/app/actions/auth";

// Types

export interface Journal {
  id: string; // The date string (yyyy-mm-dd)
  createdAt: number;
  hidden: boolean;
  preview?: string;
}

export interface Entry {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface JournalData {
  id: string;
  createdAt: number;
  hidden: boolean;
  entries: Entry[];
}

// Actions

export async function getJournals(
  limitCount: number = 20,
  startAfterId?: string,
): Promise<Journal[]> {
  const uid = await getAuthenticatedUserId();
  const db = getAdminFirestore();

  let query = db
    .collection(`users/${uid}/journals`)
    .where("hidden", "==", false)
    .orderBy("__name__", "desc")
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

export async function getJournal(date: string): Promise<JournalData | null> {
  const uid = await getAuthenticatedUserId();
  const db = getAdminFirestore();

  const journalRef = db.doc(`users/${uid}/journals/${date}`);
  const journalSnap = await journalRef.get();

  if (!journalSnap.exists || journalSnap.data()?.hidden) {
    return null;
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
    id: journalSnap.id,
    createdAt: journalSnap.data()?.createdAt?.toMillis() || 0,
    hidden: journalSnap.data()?.hidden || false,
    entries,
  };
}

export async function createJournal(date: string) {
  const uid = await getAuthenticatedUserId();
  const db = getAdminFirestore();
  const batch = db.batch();

  const journalRef = db.doc(`users/${uid}/journals/${date}`);
  const entryRef = journalRef.collection("entries").doc();

  batch.set(
    journalRef,
    { createdAt: Timestamp.now(), hidden: false },
    { merge: true },
  );

  const now = Timestamp.now();
  const DEFAULT_ENTRY_CONTENT =
    "## Today's Journal Entry\n\nWrite your thoughts here...";
  batch.set(entryRef, {
    content: DEFAULT_ENTRY_CONTENT,
    createdAt: now,
    updatedAt: now,
  });

  await batch.commit();
  revalidatePath(`/app/${date}`);

  return { journalId: date, entryId: entryRef.id, success: true };
}

export async function createJournalEntry(date: string) {
  const uid = await getAuthenticatedUserId();
  const db = getAdminFirestore();

  const entryRef = db
    .doc(`users/${uid}/journals/${date}`)
    .collection("entries")
    .doc();
  const now = Timestamp.now();

  await entryRef.set({ content: "", createdAt: now, updatedAt: now });

  revalidatePath(`/app/${date}`);

  return {
    id: entryRef.id,
    content: "",
    createdAt: now.toMillis(),
    updatedAt: now.toMillis(),
  };
}

export async function saveJournalEntry(
  date: string,
  entryId: string,
  content: string,
) {
  const uid = await getAuthenticatedUserId();
  const db = getAdminFirestore();

  await db.doc(`users/${uid}/journals/${date}/entries/${entryId}`).update({
    content,
    updatedAt: Timestamp.now(),
  });

  revalidatePath(`/app/${date}`);
  return { success: true };
}

export async function deleteJournalEntry(date: string, entryId: string) {
  const uid = await getAuthenticatedUserId();
  const db = getAdminFirestore();

  await db.doc(`users/${uid}/journals/${date}/entries/${entryId}`).delete();

  revalidatePath(`/app/${date}`);
  return { success: true };
}
