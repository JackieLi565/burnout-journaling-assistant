import { initializeApp, cert, deleteApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as fs from "fs";
import { parse } from "csv-parse/sync";

async function run() {
  const SERVICE_ACCOUNT_PATH = "./service-account.remote.json";
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  
  const TARGET_UID = "G2h62uVlMo91xe9UeLHKgTt5oenC"; 

  const app = initializeApp({
    credential: cert(serviceAccount),
  });
  const db = getFirestore(app);

  console.log(`--- Seeding REAL dataset data for UID: ${TARGET_UID} ---`);

  // 1. Load Data
  console.log("Loading CSV files...");
  const hrvRaw = fs.readFileSync("raw_data/sensor_hrv.csv", "utf8");
  const sleepRaw = fs.readFileSync("raw_data/sleep_diary.csv", "utf8");
  const surveyRaw = fs.readFileSync("raw_data/survey.csv", "utf8");

  const hrvData = parse(hrvRaw, { columns: true, skip_empty_lines: true }).filter((r: any) => r.deviceId === "pm96" || r.userId === "pm96");
  const sleepData = parse(sleepRaw, { columns: true, skip_empty_lines: true }).filter((r: any) => r.userId === "pm96");
  const surveyData = parse(surveyRaw, { columns: true, skip_empty_lines: true }).find((r: any) => r.deviceId === "pm96" || r.userId === "pm96") as any;

  // 2. Update Profile with Survey Data
  if (surveyData) {
      console.log("Updating profile from survey...");
      await db.collection("users").doc(TARGET_UID).set({
          age: parseInt(surveyData.age),
          sex: surveyData.sex === "1" ? "male" : "female",
          baseline_metrics: {
              isi: parseInt(surveyData.ISI_1),
              phq9: parseInt(surveyData.PHQ9_1),
              gad7: parseInt(surveyData.GAD7_1),
              meq: parseInt(surveyData.MEQ)
          },
          updatedAt: Timestamp.now()
      }, { merge: true });
  }

  // 3. Process Sleep and HRV by Date
  const dates = [...new Set(sleepData.map((s: any) => s.date))].sort() as string[];
  
  for (const dateStr of dates) {
      console.log(`Processing ${dateStr}...`);
      const sleep = sleepData.find((s: any) => s.date === dateStr) as any;
      
      // Find HRV readings for this date
      const dayStart = new Date(dateStr + "T00:00:00Z").getTime();
      const dayEnd = dayStart + 86400000;
      
      const dayHrv = hrvData.filter((h: any) => {
          const ts = parseInt(h.ts_start);
          return ts >= dayStart && ts < dayEnd;
      });

      // Aggregate HRV for the day
      let avgRmssd = 0;
      let avgSdnn = 0;
      let avgHr = 0;
      if (dayHrv.length > 0) {
          avgRmssd = dayHrv.reduce((acc: number, h: any) => acc + parseFloat(h.rmssd || 0), 0) / dayHrv.length;
          avgSdnn = dayHrv.reduce((acc: number, h: any) => acc + parseFloat(h.sdnn || 0), 0) / dayHrv.length;
          avgHr = dayHrv.reduce((acc: number, h: any) => acc + parseFloat(h.HR || 0), 0) / dayHrv.length;
      }

      // Create Journal
      const journalRef = db.doc(`users/${TARGET_UID}/journals/${dateStr}`);
      await journalRef.set({
          createdAt: Timestamp.fromDate(new Date(dateStr + "T08:00:00Z")),
          hidden: false
      });

      // Add Sleep Entry
      if (sleep) {
          await journalRef.collection("entries").add({
              content: `Sleep Diary: I went to bed at ${sleep.go2bed} and woke up at ${sleep.wakeup}. Total sleep duration was ${sleep.sleep_duration} hours. Sleep efficiency was ${Math.round(parseFloat(sleep.sleep_efficiency) * 100)}%.`,
              type: "sleep_log",
              createdAt: Timestamp.fromDate(new Date(dateStr + "T08:05:00Z")),
              updatedAt: Timestamp.fromDate(new Date(dateStr + "T08:05:00Z"))
          });
      }

      // Add Quiz/HRV Result
      const quizRef = db.collection(`users/${TARGET_UID}/quizzes`).doc();
      await quizRef.set({
          completedAt: Timestamp.fromDate(new Date(dateStr + "T09:00:00Z")),
          processed: true,
          processedAt: Timestamp.now(),
          responses: { "0": 1, "1": 1 }, // Placeholder responses
          hrvData: {
              rmssd: avgRmssd,
              sdnn: avgSdnn,
              heartRate: avgHr,
              readingCount: dayHrv.length,
              source: "dataset_pm96"
          }
      });
  }

  console.log("\nSeeding completed successfully!");
  await deleteApp(app);
}

run();
