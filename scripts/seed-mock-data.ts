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
        createdAt: Timestamp.fromDate(new Date(date.getTime() + (j * 3600000))), 
        updatedAt: Timestamp.fromDate(new Date(date.getTime() + (j * 3600000)))
      });
    }

    // 3. Add Quiz Result with linked HRV data
    const responses: Record<number, number> = {};
    for (let q = 0; q < 10; q++) {
        const trendBase = i > 15 ? 2 : 1; 
        responses[q] = Math.max(0, Math.min(3, Math.floor(Math.random() * 2) + trendBase));
    }

    // Generate mock HRV data based on the stress level (lower RMSSD/SDNN = higher stress)
    const stressFactor = Object.values(responses).reduce((a, b) => a + b, 0) / 30; // 0 to 1
    
    await db.collection(`users/${TARGET_UID}/quizzes`).add({
      responses,
      completedAt: Timestamp.fromDate(date),
      processed: true,
      processedAt: Timestamp.fromDate(date),
      // Mocked HRV metrics based on the real dataset format
      hrvData: {
          heartRate: 70 + (stressFactor * 20) + (Math.random() * 5), // 70-95 BPM
          rmssd: 100 - (stressFactor * 60) + (Math.random() * 10),    // 40-110 ms
          sdnn: 90 - (stressFactor * 50) + (Math.random() * 10),      // 40-100 ms
          pnn50: 0.8 - (stressFactor * 0.5),                          // 0.3-0.8
          source: "seeded_from_dataset"
      }
    });
  }

  console.log("\nSeeding completed successfully!");
  await deleteApp(app);
}

run();
