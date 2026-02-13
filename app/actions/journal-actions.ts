"use server";

import { initAdmin } from "@/lib/firebase-admin";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth-rsc";
import { revalidatePath } from "next/cache";

// Types
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

export async function getJournal(date: string): Promise<JournalData | null> {
  const uid = await getAuthenticatedUser();
  const db = getDb();
  
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

export async function createJournalWithEntry(date: string) {
  const uid = await getAuthenticatedUser();
  const db = getDb();
  const batch = db.batch();

  const journalRef = db.doc(`users/${uid}/journals/${date}`);
  const entryRef = journalRef.collection("entries").doc();

  // Create Journal
  batch.set(journalRef, {
    createdAt: Timestamp.now(),
    hidden: false,
  }, { merge: true });

  // Create First Entry
  const now = Timestamp.now();
  batch.set(entryRef, {
    content: "",
    createdAt: now,
    updatedAt: now,
  });

  await batch.commit();
  revalidatePath(`/app/${date}`);
  
  return { 
    journalId: date,
    entryId: entryRef.id,
    success: true 
  };
}

export async function createEntry(date: string) {
  const uid = await getAuthenticatedUser();
  const db = getDb();
  
  const journalRef = db.doc(`users/${uid}/journals/${date}`);
  const entryRef = journalRef.collection("entries").doc();
  const now = Timestamp.now();

  await entryRef.set({
    content: "",
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath(`/app/${date}`);
  
  return {
    id: entryRef.id,
    content: "",
    createdAt: now.toMillis(),
    updatedAt: now.toMillis(),
  };
}

export async function saveEntry(date: string, entryId: string, content: string) {
  const uid = await getAuthenticatedUser();
  const db = getDb();
  
  const entryRef = db.doc(`users/${uid}/journals/${date}/entries/${entryId}`);

  await entryRef.update({
    content,
    updatedAt: Timestamp.now(),
  });

  revalidatePath(`/app/${date}`);
  return { success: true };
}

export async function deleteEntry(date: string, entryId: string) {
  const uid = await getAuthenticatedUser();
  const db = getDb();
  
  const entryRef = db.doc(`users/${uid}/journals/${date}/entries/${entryId}`);
  await entryRef.delete();

  revalidatePath(`/app/${date}`);
  return { success: true };
}
