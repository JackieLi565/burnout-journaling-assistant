"use server";

import { verifySession } from "@/lib/auth-rsc";
import { cookies } from "next/headers";
import { db } from "@/lib/firebase-admin";
import { getUserProfile } from "./profile";

export type HrvDataPoint = {
    date: string;
    rmssd: number;
    sdnn: number;
};

export async function getHrvStats(): Promise<HrvDataPoint[]> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("__session")?.value;
        if (!sessionCookie) return [];

        const decodedToken = await verifySession(sessionCookie);
        const uid = decodedToken.uid;

        const profile = await getUserProfile();
        const timezone = profile.timezone || "UTC";

        const snapshot = await db
            .collection("users")
            .doc(uid)
            .collection("quizzes")
            .orderBy("completedAt", "asc")
            .get();

        const dailyData: Record<string, { rmssdSum: number; sdnnSum: number; count: number }> = {};

        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (!data.hrvData || !data.completedAt) return;

            // Ensure we handle the Firestore Timestamp
            const date = data.completedAt.toDate();
            // Format to YYYY-MM-DD in user's timezone for stable aggregation
            const dateStr = date.toLocaleDateString("en-CA", { timeZone: timezone });

            if (!dailyData[dateStr]) {
                dailyData[dateStr] = { rmssdSum: 0, sdnnSum: 0, count: 0 };
            }

            dailyData[dateStr].rmssdSum += data.hrvData.rmssd || 0;
            dailyData[dateStr].sdnnSum += data.hrvData.sdnn || 0;
            dailyData[dateStr].count += 1;
        });

        const result: HrvDataPoint[] = Object.entries(dailyData).map(([date, values]) => ({
            date,
            rmssd: Math.round(values.rmssdSum / values.count),
            sdnn: Math.round(values.sdnnSum / values.count),
        }));

        return result.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
        console.error("Error fetching HRV stats:", error);
        return [];
    }
}
