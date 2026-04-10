"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
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

export interface BurnoutAnalysisResult {
  overall_score: number;
  cumulative_bri?: number | null;
  risk_level?: string;
  [key: string]: any;
}

export async function analyzeAndSaveJournal(
  date: string,
  text: string,
): Promise<BurnoutAnalysisResult> {
  const uid = await getAuthenticatedUserId();
  const db = getAdminFirestore();

  const texts = [(text ?? "").toString()];

  const response = await fetch(
    "http://localhost:8000/api/v1/journals/analyze",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: uid,
        journal_date: date,
        texts,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`Analysis failed (${response.status}): ${message}`);
  }

  const data = (await response.json()) as BurnoutAnalysisResult;

  const bri = Number(data.overall_score);
  const cumulativeBriRaw = data.cumulative_bri;
  const cumulativeBri =
    cumulativeBriRaw === undefined || cumulativeBriRaw === null
      ? null
      : Number(cumulativeBriRaw);

  const journalRef = db.doc(`users/${uid}/journals/${date}`);
  await journalRef.set(
    {
      bri: Number.isFinite(bri) ? bri : null,
      cumulativeBri:
        cumulativeBri === null || !Number.isFinite(cumulativeBri)
          ? null
          : cumulativeBri,
      briUpdatedAt: Timestamp.now(),
    },
    { merge: true },
  );

  revalidatePath(`/app/${date}`);
  return data;
}

export async function analyzeAllUnanalyzedJournals(): Promise<{
  analyzed: number;
  skipped: number;
  errors: number;
}> {
  const uid = await getAuthenticatedUserId();
  const db = getAdminFirestore();

  // Fetch all journals in chronological order — order matters for cumulative BRI
  const snapshot = await db
    .collection("users")
    .doc(uid)
    .collection("journals")
    .orderBy("__name__", "asc")
    .get();

  const unanalyzed = snapshot.docs.filter(
    (doc) => !doc.data().hidden && typeof doc.data().bri !== "number",
  );

  let analyzed = 0;
  let skipped = 0;
  let errors = 0;

  for (const journalDoc of unanalyzed) {
    const date = journalDoc.id;

    const entriesSnap = await db
      .doc(`users/${uid}/journals/${date}`)
      .collection("entries")
      .orderBy("createdAt", "asc")
      .get();

    const text = entriesSnap.docs
      .map((e) => (e.data().content || "").toString())
      .join("\n\n")
      .trim();

    if (!text) {
      skipped++;
      continue;
    }

    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/journals/analyze",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: uid, journal_date: date, texts: [text] }),
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(`Analysis failed (${response.status}): ${message}`);
      }

      const data = (await response.json()) as BurnoutAnalysisResult;
      const bri = Number(data.overall_score);
      const cumulativeBriRaw = data.cumulative_bri;
      const cumulativeBri =
        cumulativeBriRaw === undefined || cumulativeBriRaw === null
          ? null
          : Number(cumulativeBriRaw);

      await db.doc(`users/${uid}/journals/${date}`).set(
        {
          bri: Number.isFinite(bri) ? bri : null,
          cumulativeBri:
            cumulativeBri === null || !Number.isFinite(cumulativeBri)
              ? null
              : cumulativeBri,
          briUpdatedAt: Timestamp.now(),
        },
        { merge: true },
      );

      analyzed++;
    } catch (e) {
      console.error(`Failed to analyze journal ${date}:`, e);
      errors++;
    }
  }

  revalidatePath("/app/statistics");
  return { analyzed, skipped, errors };
}

// Questions mapped to MBI sections (mirrors quiz-stats.ts)
const EE_INDICES = [0, 1, 2, 3, 4, 5, 6];
const DP_INDICES = [7, 8, 9, 10, 11, 12, 13];
const PA_INDICES = [14, 15, 16, 17, 18, 19, 20, 21];

function sectionWellbeing(
  responses: Record<string, number>,
  indices: number[],
  invert: boolean,
): number | null {
  const values = indices
    .map((i) => responses[String(i)])
    .filter((v) => typeof v === "number" && v >= 0 && v <= 3) as number[];
  if (values.length === 0) return null;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  return Math.round(invert ? ((3 - avg) / 3) * 100 : (avg / 3) * 100);
}

// "expressive" = process emotions/experiences (best for high EE or DP)
// "positive"   = gratitude/accomplishment focus (best for low PA)
type JournalType = "expressive" | "positive";

function determineJournalType(
  bri: number | null,
  eeScore: number | null,
  dpScore: number | null,
  paScore: number | null,
): JournalType {
  // Today's journal BRI is usually null (the user hasn't written yet), so fall back to
  // the quiz overall score (mean of the three normalized section scores) as the burnout signal.
  const quizOverall =
    eeScore !== null && dpScore !== null && paScore !== null
      ? Math.round((eeScore + dpScore + paScore) / 3)
      : null;
  const overallBurnout = bri ?? quizOverall;

  // High overall burnout → positive writing to avoid adding to emotional load / rumination
  if (overallBurnout !== null && overallBurnout > 60) {
    return "positive";
  }

  // No data at all → default to expressive
  if (eeScore === null && dpScore === null && paScore === null) {
    return "expressive";
  }

  // Moderate burnout: use dimensional profile
  const eeBurnout = eeScore ?? 0;
  const dpBurnout = dpScore ?? 0;
  const paBurnout = paScore ?? 0;

  // PA is the dominant burnout dimension → positive writing to rebuild self-efficacy
  if (paBurnout >= eeBurnout && paBurnout >= dpBurnout) {
    return "positive";
  }

  // EE or DP dominant → expressive writing to process emotional burden
  return "expressive";
}

export async function getJournalingSuggestion(date: string): Promise<string> {
  const uid = await getAuthenticatedUserId();
  const db = getAdminFirestore();

  // 1. Fetch BRI from today's journal document
  const journalSnap = await db.doc(`users/${uid}/journals/${date}`).get();
  const bri: number | null =
    typeof journalSnap.data()?.bri === "number"
      ? (journalSnap.data()!.bri as number)
      : null;

  // 2. Fetch the most recent quiz and compute section wellbeing scores
  const quizSnap = await db
    .collection(`users/${uid}/quizzes`)
    .orderBy("completedAt", "desc")
    .limit(1)
    .get();

  let eeScore: number | null = null;
  let dpScore: number | null = null;
  let paScore: number | null = null;

  if (!quizSnap.empty) {
    const responses = quizSnap.docs[0].data().responses as Record<string, number>;
    eeScore = sectionWellbeing(responses, EE_INDICES, true);
    dpScore = sectionWellbeing(responses, DP_INDICES, true);
    paScore = sectionWellbeing(responses, PA_INDICES, false);
  }

  // 3. Determine journaling type from burnout profile
  const journalType = determineJournalType(bri, eeScore, dpScore, paScore);

  const typeDescription =
    journalType === "expressive"
      ? "expressive writing — guiding the person to openly process their feelings, stressors, and experiences to release emotional burden"
      : "positive writing — focusing on small wins, moments of competence, or gratitude to rebuild energy without triggering rumination on stressors";

  // 4. Build context string for the model
  const scoreLines = [
    bri !== null ? `- Journal Burnout Risk Index (BRI, 0–100, higher = more burnout): ${Math.round(bri)}` : null,
    eeScore !== null ? `- Emotional Exhaustion burnout index (0–100, higher = more burnout): ${eeScore}` : null,
    dpScore !== null ? `- Depersonalization burnout index (0–100, higher = more burnout): ${dpScore}` : null,
    paScore !== null ? `- Reduced Personal Accomplishment burnout index (0–100, higher = more burnout): ${paScore}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const modelPrompt = `You are a compassionate burnout support assistant helping someone journal today (${date}).

Their current burnout profile:
${scoreLines || "No burnout data available yet."}

Based on this profile, the recommended journaling approach is: ${typeDescription}.

${
  journalType === "positive"
    ? "IMPORTANT: This user is at risk of exhaustion. DO NOT ask them to explore deep negative emotions or 'vent'. Instead, focus on 'Micro-Mastery' (small wins) or 'Positive Writing' (gratitude)."
    : "Encourage 'Emotional Labeling' and narrative processing of their complex feelings or stressors."
}

Write a single journaling prompt for this person. The prompt should:
- Be 2 sentences maximum
- Be warm, specific, and non-clinical
- Directly invite them to start writing
- Reflect the selected journaling approach

Respond with only the prompt itself — no preamble, no labels.`;

  // 5. Generate with Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return "Take a moment to write about what's been weighing on you most today — there are no right answers, just your honest experience.";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent(modelPrompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Gemini API error:", error);
    // Strategy-aware fallback if the API fails
    return journalType === "positive"
      ? "Take a moment to write about one small thing that went well today, no matter how tiny it might seem."
      : "Take a moment to write about what's been on your mind today — there are no right answers, just your honest experience.";
  }
}
