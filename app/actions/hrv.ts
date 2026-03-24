"use server";

import { getAuthenticatedUserId } from "@/app/actions/auth";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getUserProfile } from "./profile";

export type HrvDataPoint = {
    date: string;
    rmssd: number;
    sdnn: number;
};

export async function getHrvStats(): Promise<HrvDataPoint[]> {
    const uid = await getAuthenticatedUserId();

    try {
        const db = getAdminFirestore();
        const profile = await getUserProfile();
        const timezone = profile.timezone || "UTC";

        const snapshot = await db
            .collection("users")
            .doc(uid)
            .collection("biometrics")
            .orderBy("date", "asc")
            .get();

        const dailyData: Record<string, { rmssdSum: number; sdnnSum: number; count: number }> = {};

        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (!data.date) return;

            // Ensure we handle the Firestore Timestamp
            const date = data.date.toDate();
            // Format to YYYY-MM-DD in user's timezone for stable aggregation
            const dateStr = date.toLocaleDateString("en-CA", { timeZone: timezone });

            if (!dailyData[dateStr]) {
                dailyData[dateStr] = { rmssdSum: 0, sdnnSum: 0, count: 0 };
            }

            dailyData[dateStr].rmssdSum += data.rmssd || 0;
            dailyData[dateStr].sdnnSum += data.sdnn || 0;
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
