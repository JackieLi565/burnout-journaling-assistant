import { initializeApp, cert, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as fs from "fs";

async function run() {
  const SERVICE_ACCOUNT_PATH = "./service-account.remote.json";
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  
  const EMAIL = "jdmonte@torontomu.ca";
  const OLD_UID = "G2h62uVlMo91xe9UeLHKgTt5oenC";
  const TEMP_PASSWORD = "Password123!";

  const app = initializeApp({
    credential: cert(serviceAccount),
  });
  const auth = getAuth(app);

  try {
    console.log(`Checking for existing user with email: ${EMAIL}...`);
    try {
      const existingUser = await auth.getUserByEmail(EMAIL);
      console.log(`Found user with email ${EMAIL} and UID ${existingUser.uid}.`);
      
      if (existingUser.uid !== OLD_UID) {
        console.log(`Deleting temporary remote user ${existingUser.uid} to make room for original UID...`);
        await auth.deleteUser(existingUser.uid);
        console.log("Deleted successfully.");
      } else {
        console.log("User already has the correct UID. Updating password just in case...");
        await auth.updateUser(OLD_UID, { password: TEMP_PASSWORD });
        console.log("Success!");
        return;
      }
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        console.log("No existing user found with that email. Proceeding to create...");
      } else {
        throw e;
      }
    }

    console.log(`Creating user with original UID: ${OLD_UID}...`);
    await auth.createUser({
      uid: OLD_UID,
      email: EMAIL,
      password: TEMP_PASSWORD,
      emailVerified: true
    });

    console.log("\nReconciliation Successful!");
    console.log(`Email: ${EMAIL}`);
    console.log(`Password: ${TEMP_PASSWORD}`);
    console.log("\nYou can now log in at http://localhost:3000/signin and you will see all your migrated data.");

  } catch (err: any) {
    console.error("Reconciliation Failed:", err.message);
  } finally {
    await deleteApp(app);
  }
}

run();
