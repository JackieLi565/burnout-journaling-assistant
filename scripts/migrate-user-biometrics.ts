import { initializeApp, cert, deleteApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as fs from "fs";

async function run() {
  const targetUid = process.argv[2];
  if (!targetUid) {
    console.error("Please provide your UID as an argument.");
    console.error("Example: npx ts-node scripts/migrate-user-biometrics.ts <YOUR_UID>");
    process.exit(1);
  }

  const SERVICE_ACCOUNT_PATH = "./service-account.remote.json";
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  } catch (error) {
      console.error(`Failed to read ${SERVICE_ACCOUNT_PATH}. Please ensure it exists.`);
      process.exit(1);
  }

  const app = initializeApp({
    credential: cert(serviceAccount),
  });
  const db = getFirestore(app);

  console.log(`--- Migrating biometrics data for UID: ${targetUid} ---`);

  try {
    const quizzesRef = db.collection(`users/${targetUid}/quizzes`);
    const biometricsRef = db.collection(`users/${targetUid}/biometrics`);

    const snapshot = await quizzesRef.get();
    if (snapshot.empty) {
        console.log("No quizzes found for this user.");
        return;
    }

    let count = 0;
    
    // Process in batches of 200 to stay well below the 500 operation limit
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.hrvData) {
          const completedAt = data.completedAt;
          if (!completedAt) continue;

          const date = completedAt.toDate();
          // We'll use a standard date format as the document ID: YYYY-MM-DD
          // Using en-CA for YYYY-MM-DD local format based on UTC
          const dateStr = date.toLocaleDateString("en-CA", { timeZone: "UTC" });

          // Set the biometrics document
          const bioDocRef = biometricsRef.doc(dateStr);
          batch.set(bioDocRef, {
              date: completedAt,
              rmssd: data.hrvData.rmssd || null,
              sdnn: data.hrvData.sdnn || null,
              heartRate: data.hrvData.heartRate || null,
              readingCount: data.hrvData.readingCount || null,
              source: data.hrvData.source || "migration"
          }, { merge: true });

          // Remove hrvData from quiz document
          batch.update(doc.ref, {
              hrvData: FieldValue.delete()
          });

          count++;
          batchCount += 2; // two operations: set and update

          if (batchCount >= 400) {
              await batch.commit();
              batch = db.batch();
              batchCount = 0;
          }
      }
    }

    if (batchCount > 0) {
        await batch.commit();
    }

    console.log(`Successfully migrated ${count} documents to biometrics.`);
  } catch (err: any) {
      console.error("Migration failed:", err.message);
  } finally {
      await deleteApp(app);
  }
}

run();
