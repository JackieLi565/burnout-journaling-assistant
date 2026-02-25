import { initializeApp, cert, deleteApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as fs from "fs";

async function run() {
  const SERVICE_ACCOUNT_PATH = "./service-account.remote.json";
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  
  // Use your actual UID
  const TARGET_UID = "G2h62uVlMo91xe9UeLHKgTt5oenC"; 

  const app = initializeApp({
    credential: cert(serviceAccount),
  });
  const db = getFirestore(app);

  console.log(`--- Seeding 30 days of data for UID: ${TARGET_UID} ---`);

  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0]; // yyyy-mm-dd

    console.log(`Processing ${dateStr}...`);

    // 1. Create Journal
    const journalRef = db.doc(`users/${TARGET_UID}/journals/${dateStr}`);
    await journalRef.set({
      createdAt: Timestamp.fromDate(date),
      hidden: false
    });

    // 2. Add 1-2 Entries
    const entryCount = Math.floor(Math.random() * 2) + 1;
    for (let j = 0; j < entryCount; j++) {
      await journalRef.collection("entries").add({
        content: `This is a mock entry for ${dateStr}. Random thought #${j + 1}.`,
        createdAt: Timestamp.fromDate(new Date(date.getTime() + (j * 3600000))), // Spread entries by hour
        updatedAt: Timestamp.fromDate(new Date(date.getTime() + (j * 3600000)))
      });
    }

    // 3. Add Quiz Result
    // Generate 10 random responses (0-3)
    const responses: Record<number, number> = {};
    for (let q = 0; q < 10; q++) {
        // Create a trend: higher scores at the start of the month, lower at the end (or vice versa)
        const trendBase = i > 15 ? 2 : 1; 
        responses[q] = Math.max(0, Math.min(3, Math.floor(Math.random() * 2) + trendBase));
    }

    await db.collection(`users/${TARGET_UID}/quizzes`).add({
      responses,
      completedAt: Timestamp.fromDate(date),
      processed: true
    });
  }

  console.log("
Seeding completed successfully!");
  await deleteApp(app);
}

run();
