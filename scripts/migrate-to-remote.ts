import { initializeApp, cert, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";

async function run() {
  const SERVICE_ACCOUNT_PATH = "./service-account.remote.json";
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  
  console.log("--- PHASE 1: Fetching Local Data ---");
  
  // 1. Point to Emulator and fetch everything into memory
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
  const localApp = initializeApp({ projectId: "dev-project-id" }, "local-app");
  const localDb = getFirestore(localApp);

  const migrationData: any[] = [];

  try {
    const usersSnap = await localDb.collection("users").get();
    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();
      const journals: any[] = [];

      const journalsSnap = await localDb.collection(`users/${uid}/journals`).get();
      for (const journalDoc of journalsSnap.docs) {
        const journalId = journalDoc.id;
        const entriesSnap = await localDb.collection(`users/${uid}/journals/${journalId}/entries`).get();
        journals.push({
          id: journalId,
          data: journalDoc.data(),
          entries: entriesSnap.docs.map(e => ({ id: e.id, data: e.data() }))
        });
      }
      migrationData.push({ uid, userData, journals });
    }
    console.log(`Successfully read ${migrationData.length} users from emulator.`);
  } catch (err: any) {
      console.error("Local Fetch Failed:", err.message);
      return;
  } finally {
    await deleteApp(localApp);
  }

  console.log("\n--- PHASE 2: Uploading to Remote ---");
  
  // 2. IMPORTANT: Clear the emulator variable so the SDK connects to the real internet
  delete process.env.FIRESTORE_EMULATOR_HOST;

  const remoteApp = initializeApp({
    credential: cert(serviceAccount),
  }, "remote-app");
  const remoteDb = getFirestore(remoteApp);

  try {
    for (const user of migrationData) {
      console.log(`Migrating UID: ${user.uid} (${user.userData.email || 'No email'})...`);
      await remoteDb.collection("users").doc(user.uid).set(user.userData);
      
      for (const journal of user.journals) {
        await remoteDb.collection(`users/${user.uid}/journals`).doc(journal.id).set(journal.data);
        
        if (journal.entries.length > 0) {
            const batch = remoteDb.batch();
            journal.entries.forEach((entry: any) => {
              const entryRef = remoteDb.doc(`users/${user.uid}/journals/${journal.id}/entries/${entry.id}`);
              batch.set(entryRef, entry.data);
            });
            await batch.commit();
        }
        console.log(`  [OK] Journal ${journal.id} (${journal.entries.length} entries) migrated.`);
      }
    }
    console.log("\nMigration completed successfully!");
  } catch (err: any) {
    console.error("Remote Upload Failed:", err.message);
  } finally {
    await deleteApp(remoteApp);
  }
}

run();
