"use server";

import { db } from "@/lib/firebase-admin";
import { getAuthenticatedUserId } from "./auth";

export type JournalBriPoint = {
  date: string;
  baseBri: number | null;
  bri: number | null;
  cumulativeBri: number | null;
  coachModifier: number | null;
  coachUsed: boolean;
};

export type JournalBriSummary = {
  points: JournalBriPoint[];
  latestBaseBri: number | null;
  latestBri: number | null;
  latestCumulativeBri: number | null;
  latestCoachModifier: number | null;
};

export async function getJournalBriSummary(): Promise<JournalBriSummary> {
  try {
    const uid = await getAuthenticatedUserId();

    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("journals")
      .orderBy("__name__", "asc")
      .get();

    const points: JournalBriPoint[] = snapshot.docs.map((doc) => {
      const data = doc.data() || {};
      return {
        date: doc.id,
        baseBri: typeof data.baseBri === "number" ? data.baseBri : null,
        bri: typeof data.bri === "number" ? data.bri : null,
        cumulativeBri:
          typeof data.cumulativeBri === "number" ? data.cumulativeBri : null,
        coachModifier:
          typeof data.coachModifier === "number" ? data.coachModifier : null,
        coachUsed: data.coachUsed === true,
      };
    });

    const nonNull = points.filter(
      (p) => p.bri !== null || p.cumulativeBri !== null,
    );
    const latest = nonNull.length > 0 ? nonNull[nonNull.length - 1] : null;

    return {
      points,
      latestBaseBri: latest?.baseBri ?? null,
      latestBri: latest?.bri ?? null,
      latestCumulativeBri: latest?.cumulativeBri ?? null,
      latestCoachModifier: latest?.coachModifier ?? null,
    };
  } catch (error) {
    console.error("Failed to fetch journal BRI summary:", error);
    return {
      points: [],
      latestBaseBri: null,
      latestBri: null,
      latestCumulativeBri: null,
      latestCoachModifier: null,
    };
  }
}
