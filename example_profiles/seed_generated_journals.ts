import { initializeApp, cert, deleteApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as fs from "fs";
import * as path from "path";

// Reuse the logic for generating plausible MBI responses based on HRV and baseline health
function generateQuizResponses(rmssd: number, phq9: number, gad7: number) {
    const isStressedDay = rmssd > 0 && rmssd < 25;
    const isDepressed = phq9 >= 10;
    const isAnxious = gad7 >= 10;
    
    let burnoutScore = 0;
    if (isStressedDay) burnoutScore += 2;
    if (isDepressed) burnoutScore += 1;
    if (isAnxious) burnoutScore += 1;
    
    const responses: Record<string, number> = {};
    for (let i = 0; i < 22; i++) {
        const rand = Math.random();
        if (i < 14) {
            if (burnoutScore >= 3) responses[i.toString()] = rand > 0.3 ? 0 : 1;
            else if (burnoutScore >= 1) responses[i.toString()] = rand > 0.5 ? 1 : 2;
            else responses[i.toString()] = rand > 0.2 ? 3 : 2;
        } else {
            if (burnoutScore >= 3) responses[i.toString()] = rand > 0.3 ? 3 : 2;
            else if (burnoutScore >= 1) responses[i.toString()] = rand > 0.5 ? 2 : 1;
            else responses[i.toString()] = rand > 0.2 ? 0 : 1;
        }
    }
    return responses;
}

async function run() {
    // Prefer remote service account, fall back to local
    const SERVICE_ACCOUNT_PATH = fs.existsSync("./service-account.remote.json")
        ? "./service-account.remote.json"
        : "./service-account.local.json";
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        console.error(`Missing service account file. Expected service-account.remote.json or service-account.local.json.`);
        process.exit(1);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
    const app = initializeApp({ credential: cert(serviceAccount) });
    const db = getFirestore(app);
    const auth = getAuth(app);

    const journalsPath = path.join("example_profiles", "final_journals.json");
    if (!fs.existsSync(journalsPath)) {
        console.error(`Missing ${journalsPath}. Run the generation script first.`);
        process.exit(1);
    }

    // We also need the raw datasets for HRV and Sleep metrics to seed biometrics correctly
    const hrvRaw = fs.readFileSync("raw_data/sensor_hrv.csv", "utf8");
    const sleepRaw = fs.readFileSync("raw_data/sleep_diary.csv", "utf8");
    const { parse } = require("csv-parse/sync");
    const hrvData = parse(hrvRaw, { columns: true, skip_empty_lines: true });
    const sleepData = parse(sleepRaw, { columns: true, skip_empty_lines: true });

    const generatedData = JSON.parse(fs.readFileSync(journalsPath, "utf8"));
    const targetUserIds = Object.keys(generatedData);

    console.log(`--- Seeding ${targetUserIds.length} AI-Generated Demo Users ---`);

    for (const userId of targetUserIds) {
        const demoUid = `demo_${userId}`;
        const demoEmail = `${userId}@demo.burnout.app`;
        const userData = generatedData[userId];
        
        console.log(`\nProcessing User: ${demoUid}...`);

        // 1. Ensure Auth User Exists
        try {
            await auth.getUser(demoUid);
        } catch (e: any) {
            if (e.code === 'auth/user-not-found') {
                await auth.createUser({ uid: demoUid, email: demoEmail, password: "password123" });
                console.log(`  Created Auth user.`);
            }
        }

        const batch = db.batch();

        // 2. Update Profile
        const userRef = db.collection("users").doc(demoUid);
        batch.set(userRef, {
            email: demoEmail,
            displayName: userId.toUpperCase() + " (Demo)",
            age: userData.profile.metadata.age,
            sex: userData.profile.metadata.sex,
            baseline_metrics: userData.profile.metadata.mental_health_baseline,
            isDemoUser: true,
            updatedAt: Timestamp.now()
        }, { merge: true });

        // 3. Process Entries
        const userSleep = sleepData.filter((s: any) => s.userId === userId);
        const userHrv = hrvData.filter((h: any) => h.deviceId === userId || h.userId === userId);

        for (const [dateStr, journalContent] of Object.entries<string>(userData.entries)) {
            const journalRef = db.doc(`users/${demoUid}/journals/${dateStr}`);
            batch.set(journalRef, {
                createdAt: Timestamp.fromDate(new Date(dateStr + "T08:00:00Z")),
                hidden: false
            }, { merge: true });

            // AI Journal Entry
            const entryRef = journalRef.collection("entries").doc("ai_journal");
            batch.set(entryRef, {
                content: journalContent,
                type: "text",
                createdAt: Timestamp.fromDate(new Date(dateStr + "T08:05:00Z")),
                updatedAt: Timestamp.fromDate(new Date(dateStr + "T08:05:00Z"))
            });

            // Sleep Data
            const sleepInfo = userSleep.find((s: any) => s.date === dateStr);
            if (sleepInfo) {
                const sleepRef = journalRef.collection("entries").doc("sleep_log");
                batch.set(sleepRef, {
                    content: `Sleep Diary: Went to bed at ${sleepInfo.go2bed} and woke up at ${sleepInfo.wakeup}. Total sleep duration was ${sleepInfo.sleep_duration} hours. Efficiency: ${Math.round(parseFloat(sleepInfo.sleep_efficiency) * 100)}%.`,
                    type: "sleep_log",
                    createdAt: Timestamp.fromDate(new Date(dateStr + "T08:02:00Z")),
                    updatedAt: Timestamp.fromDate(new Date(dateStr + "T08:02:00Z"))
                });
            }

            // Biometrics & MBI
            const dayStart = new Date(dateStr + "T00:00:00Z").getTime();
            const dayEnd = dayStart + 86400000;
            const dayHrv = userHrv.filter((h: any) => {
                const ts = parseInt(h.ts_start);
                return ts >= dayStart && ts < dayEnd;
            });

            let rmssd = 50;
            if (dayHrv.length > 0) {
                const avgRmssd = dayHrv.reduce((acc: number, h: any) => acc + parseFloat(h.rmssd || 0), 0) / dayHrv.length;
                const avgSdnn = dayHrv.reduce((acc: number, h: any) => acc + parseFloat(h.sdnn || 0), 0) / dayHrv.length;
                const avgHr = dayHrv.reduce((acc: number, h: any) => acc + parseFloat(h.HR || 0), 0) / dayHrv.length;
                rmssd = avgRmssd;

                const bioRef = db.doc(`users/${demoUid}/biometrics/${dateStr}`);
                batch.set(bioRef, {
                    date: Timestamp.fromDate(new Date(dateStr + "T09:00:00Z")),
                    rmssd: avgRmssd,
                    sdnn: avgSdnn,
                    heartRate: avgHr,
                    readingCount: dayHrv.length,
                    source: "ai_generated_dataset"
                });
            }

            // MBI Quiz
            const responses = generateQuizResponses(
                rmssd, 
                parseInt(userData.profile.metadata.mental_health_baseline.PHQ9_1) || 0,
                parseInt(userData.profile.metadata.mental_health_baseline.GAD7_1) || 0
            );
            const quizRef = db.collection(`users/${demoUid}/quizzes`).doc(dateStr); // Use date as ID for idempotency
            batch.set(quizRef, {
                completedAt: Timestamp.fromDate(new Date(dateStr + "T09:00:00Z")),
                processed: true,
                processedAt: Timestamp.now(),
                responses: responses,
            });
        }

        await batch.commit();
        console.log(`  Committed data for ${userId}.`);
    }

    console.log("\nSeeding completed successfully!");
    await deleteApp(app);
}

run().catch(console.error);
