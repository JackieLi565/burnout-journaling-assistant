import { initializeApp, cert, deleteApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as fs from "fs";

function generateQuizResponses(rmssd: number, phq9: number, gad7: number) {
    const isStressedDay = rmssd > 0 && rmssd < 25;
    const isDepressed = phq9 >= 10;
    const isAnxious = gad7 >= 10;
    
    // burnoutScore from 0 to 4
    let burnoutScore = 0;
    if (isStressedDay) burnoutScore += 2;
    if (isDepressed) burnoutScore += 1;
    if (isAnxious) burnoutScore += 1;
    
    const responses: Record<string, number> = {};
    
    for (let i = 0; i < 22; i++) {
        const rand = Math.random();
        if (i < 14) {
            // Q0-13 (Negative phrasing): 0/1 = Burnout, 2/3 = Healthy
            if (burnoutScore >= 3) {
                responses[i.toString()] = rand > 0.3 ? 0 : 1;
            } else if (burnoutScore >= 1) {
                responses[i.toString()] = rand > 0.5 ? 1 : 2;
            } else {
                responses[i.toString()] = rand > 0.2 ? 3 : 2;
            }
        } else {
            // Q14-21 (Positive phrasing): 2/3 = Burnout, 0/1 = Healthy
            if (burnoutScore >= 3) {
                responses[i.toString()] = rand > 0.3 ? 3 : 2;
            } else if (burnoutScore >= 1) {
                responses[i.toString()] = rand > 0.5 ? 2 : 1;
            } else {
                responses[i.toString()] = rand > 0.2 ? 0 : 1;
            }
        }
    }
    
    return responses;
}

async function run() {
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
  const auth = getAuth(app);

  console.log("Loading generated journals JSON...");
  const dataPath = "raw_data/generated_journals.json";
  if (!fs.existsSync(dataPath)) {
      console.error(`Missing ${dataPath}. Please run 'npm run generate:demo' first.`);
      process.exit(1);
  }
  
  const generatedData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const userIds = Object.keys(generatedData);

  console.log(`--- Seeding ${userIds.length} Demo Users to Firestore & Auth ---`);

  for (const rawUserId of userIds) {
      const demoUid = `demo_${rawUserId}`;
      const demoEmail = `${rawUserId}@demo.burnout.app`;
      const demoPassword = "password123"; // Standard password for all demo users

      console.log(`\nProcessing: ${demoUid}...`);

      // 0. Create or Update Firebase Auth User
      try {
          // Check if user already exists
          await auth.getUser(demoUid);
          console.log(`  Auth user ${demoUid} already exists. Updating password to default.`);
          await auth.updateUser(demoUid, { password: demoPassword });
      } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
              console.log(`  Creating new Auth user for ${demoUid}...`);
              await auth.createUser({
                  uid: demoUid,
                  email: demoEmail,
                  password: demoPassword,
                  emailVerified: true
              });
          } else {
              console.error(`  Error managing Auth user:`, error);
              continue; // Skip this user if auth fails
          }
      }
      
      const userData = generatedData[rawUserId];
      const batch = db.batch();

      // 1. Create/Update User Profile
      const userRef = db.collection("users").doc(demoUid);
      batch.set(userRef, {
          email: demoEmail,
          age: userData.profile.age,
          sex: userData.profile.sex,
          baseline_metrics: userData.profile.baseline_metrics,
          updatedAt: Timestamp.now(),
          isDemoUser: true
      }, { merge: true });

      let daysCount = 0;

      // 2. Iterate through generated days
      for (const [dateStr, dayData] of Object.entries<any>(userData.days)) {
          // Add Journal
          const journalRef = db.doc(`users/${demoUid}/journals/${dateStr}`);
          batch.set(journalRef, {
              createdAt: Timestamp.fromDate(new Date(dateStr + "T08:00:00Z")),
              hidden: false
          });

          // Add Journal Entry (The LLM/Dummy text)
          const entryRef = journalRef.collection("entries").doc();
          batch.set(entryRef, {
              content: dayData.journal,
              type: "text",
              createdAt: Timestamp.fromDate(new Date(dateStr + "T08:05:00Z")),
              updatedAt: Timestamp.fromDate(new Date(dateStr + "T08:05:00Z"))
          });

          // Add Sleep Log (if exists)
          if (dayData.sleep && dayData.sleep.sleep_duration) {
              const sleepRef = journalRef.collection("entries").doc();
              batch.set(sleepRef, {
                  content: `Sleep Diary: Went to bed at ${dayData.sleep.go2bed} and woke up at ${dayData.sleep.wakeup}. Total sleep duration was ${dayData.sleep.sleep_duration} hours. Efficiency: ${Math.round(parseFloat(dayData.sleep.sleep_efficiency) * 100)}%.`,
                  type: "sleep_log",
                  createdAt: Timestamp.fromDate(new Date(dateStr + "T08:02:00Z")),
                  updatedAt: Timestamp.fromDate(new Date(dateStr + "T08:02:00Z"))
              });
          }

          // Add Biometrics (HRV) into the new 'biometrics' collection
          const bioRef = db.doc(`users/${demoUid}/biometrics/${dateStr}`);
          batch.set(bioRef, {
              date: Timestamp.fromDate(new Date(dateStr + "T09:00:00Z")),
              rmssd: dayData.biometrics.rmssd,
              sdnn: dayData.biometrics.sdnn,
              heartRate: dayData.biometrics.heartRate,
              readingCount: dayData.biometrics.readingCount,
              source: dayData.biometrics.source
          });

          // Generate plausible MBI responses based on HRV stress and baseline PHQ/GAD
          const phq9 = userData.profile.baseline_metrics?.phq9 || 0;
          const gad7 = userData.profile.baseline_metrics?.gad7 || 0;
          const rmssd = dayData.biometrics.rmssd || 50;
          
          const generatedResponses = generateQuizResponses(rmssd, phq9, gad7);

          // Add Quiz Entry
          const quizRef = db.collection(`users/${demoUid}/quizzes`).doc();
          batch.set(quizRef, {
              completedAt: Timestamp.fromDate(new Date(dateStr + "T09:00:00Z")),
              processed: true,
              processedAt: Timestamp.now(),
              responses: generatedResponses,
          });

          daysCount++;
      }

      await batch.commit();
      console.log(`  Committed profile and ${daysCount} days of journals/biometrics.`);
  }

  console.log("\nSeeding completed successfully!");
  await deleteApp(app);
}

run();