"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/firebase-admin";
import { getAuthenticatedUserId } from "./auth";

export type JournalBriPoint = {
  date: string;
  bri: number | null;
  cumulativeBri: number | null;
};

export type JournalBriSummary = {
  points: JournalBriPoint[];
  latestBri: number | null;
  latestCumulativeBri: number | null;
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
        bri: typeof data.bri === "number" ? data.bri : null,
        cumulativeBri:
          typeof data.cumulativeBri === "number" ? data.cumulativeBri : null,
      };
    });

    const nonNull = points.filter(
      (p) => p.bri !== null || p.cumulativeBri !== null,
    );
    const latest = nonNull.length > 0 ? nonNull[nonNull.length - 1] : null;

    return {
      points,
      latestBri: latest?.bri ?? null,
      latestCumulativeBri: latest?.cumulativeBri ?? null,
    };
  } catch (error) {
    console.error("Failed to fetch journal BRI summary:", error);
    return { points: [], latestBri: null, latestCumulativeBri: null };
  }
}
