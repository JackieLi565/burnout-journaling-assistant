/**
 * Wipes all journal data for the three demo users, then re-uploads the
 * AI-generated entries from final_journals.json. Does not touch biometrics or quizzes.
 *
 * Usage: npx tsx example_profiles/cleanup_demo_users.ts
 */

import { initializeApp, cert, deleteApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

async function run() {
    // Prefer remote service account, fall back to local
    const SERVICE_ACCOUNT_PATH = fs.existsSync("./service-account.remote.json")
        ? "./service-account.remote.json"
        : "./service-account.local.json";
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        console.error("Missing service account file. Expected service-account.remote.json or service-account.local.json.");
        process.exit(1);
    }

    const journalsPath = path.join("example_profiles", "final_journals.json");
    if (!fs.existsSync(journalsPath)) {
        console.error(`Missing ${journalsPath}. Run generate_journals.ts first.`);
        process.exit(1);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
    const app = initializeApp({ credential: cert(serviceAccount) });
    const db = getFirestore(app);

    const generatedData = JSON.parse(fs.readFileSync(journalsPath, "utf8"));
    const targetUserIds = Object.keys(generatedData);

    console.log(`--- Resetting journals for ${targetUserIds.length} demo users ---`);

    for (const userId of targetUserIds) {
        const demoUid = `demo_${userId}`;
        console.log(`\nProcessing ${demoUid}...`);

        // 1. Wipe all existing journals and their entries subcollections
        const journalsSnap = await db.collection(`users/${demoUid}/journals`).get();
        let deleted = 0;
        for (const journalDoc of journalsSnap.docs) {
            const entriesSnap = await journalDoc.ref.collection("entries").get();
            for (const entryDoc of entriesSnap.docs) {
                await entryDoc.ref.delete();
            }
            await journalDoc.ref.delete();
            deleted++;
        }
        console.log(`  Deleted ${deleted} existing journal(s).`);

        // 2. Re-upload generated entries
        const entries = generatedData[userId].entries as Record<string, string>;
        const batch = db.batch();

        for (const [dateStr, content] of Object.entries(entries)) {
            const journalRef = db.doc(`users/${demoUid}/journals/${dateStr}`);
            batch.set(journalRef, {
                createdAt: Timestamp.fromDate(new Date(dateStr + "T08:00:00Z")),
                hidden: false,
            });

            const entryRef = journalRef.collection("entries").doc("ai_journal");
            batch.set(entryRef, {
                content,
                type: "text",
                createdAt: Timestamp.fromDate(new Date(dateStr + "T08:05:00Z")),
                updatedAt: Timestamp.fromDate(new Date(dateStr + "T08:05:00Z")),
            });
        }

        await batch.commit();
        console.log(`  Re-uploaded ${Object.keys(entries).length} journal(s).`);
    }

    console.log("\nDone!");
    await deleteApp(app);
}

run().catch(console.error);
