import * as fs from "fs";
import { parse } from "csv-parse/sync";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Read API key from environment variable
// const apiKey = process.env.GEMINI_API_KEY;
// if (!apiKey) {
//     console.error("Missing GEMINI_API_KEY environment variable.");
//     process.exit(1);
// }

// const genAI = new GoogleGenerativeAI(apiKey);
// const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const DEMO_USERS = ["pm96", "vc10", "pg18", "nd56", "ab60"];
const DELAY_MS = 10000; // 10 second delay between users to avoid rate limits

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
    console.log("Loading CSV files...");
    const hrvRaw = fs.readFileSync("raw_data/sensor_hrv.csv", "utf8");
    const sleepRaw = fs.readFileSync("raw_data/sleep_diary.csv", "utf8");
    const surveyRaw = fs.readFileSync("raw_data/survey.csv", "utf8");

    const hrvData = parse(hrvRaw, { columns: true, skip_empty_lines: true });
    const sleepData = parse(sleepRaw, { columns: true, skip_empty_lines: true });
    const surveyData = parse(surveyRaw, { columns: true, skip_empty_lines: true });

    const outputData: Record<string, any> = {};
    
    // Get all unique users from the survey data
    const DEMO_USERS = [...new Set(surveyData.map((r: any) => r.deviceId || r.userId).filter(Boolean))];

    for (const userId of DEMO_USERS as string[]) {
        console.log(`\nProcessing user: ${userId}...`);
        
        const userSurvey: any = surveyData.find((r: any) => r.deviceId === userId || r.userId === userId);
        if (!userSurvey) {
            console.log(`Survey not found for ${userId}, skipping.`);
            continue;
        }

        const userSleep = sleepData.filter((r: any) => r.userId === userId);
        const userHrv = hrvData.filter((r: any) => r.deviceId === userId || r.userId === userId);

        const age = userSurvey.age;
        const sex = userSurvey.sex === "1" ? "male" : "female";
        const occupation = userSurvey.occupation;
        const gad7 = parseInt(userSurvey.GAD7_1) || 0;
        const phq9 = parseInt(userSurvey.PHQ9_1) || 0;
        const isi = parseInt(userSurvey.ISI_1) || 0;

        outputData[userId] = {
            profile: {
                age: parseInt(age),
                sex,
                baseline_metrics: {
                    isi,
                    phq9,
                    gad7,
                    meq: parseInt(userSurvey.MEQ) || 0
                }
            },
            days: {}
        };

        const dates = [...new Set(userSleep.map((s: any) => s.date))].sort() as string[];
        
        // Use all available dates for the user
        const limitedDates = dates; 
        
        const dailyContexts = [];

        for (const dateStr of limitedDates) {
            const sleepInfo: any = userSleep.find((s: any) => s.date === dateStr);
            
            const dayStart = new Date(dateStr + "T00:00:00Z").getTime();
            const dayEnd = dayStart + 86400000;
            
            const dayHrv = userHrv.filter((h: any) => {
                const ts = parseInt(h.ts_start);
                return ts >= dayStart && ts < dayEnd;
            });

            let avgRmssd = 0;
            let avgSdnn = 0;
            let avgHr = 0;
            if (dayHrv.length > 0) {
                avgRmssd = dayHrv.reduce((acc: number, h: any) => acc + parseFloat(h.rmssd || 0), 0) / dayHrv.length;
                avgSdnn = dayHrv.reduce((acc: number, h: any) => acc + parseFloat(h.sdnn || 0), 0) / dayHrv.length;
                avgHr = dayHrv.reduce((acc: number, h: any) => acc + parseFloat(h.HR || 0), 0) / dayHrv.length;
            }

            const sleepDuration = sleepInfo ? parseFloat(sleepInfo.sleep_duration).toFixed(1) : "unknown";
            const sleepEfficiency = sleepInfo ? Math.round(parseFloat(sleepInfo.sleep_efficiency) * 100) : "unknown";

            let stressLevel = "medium";
            if (avgRmssd > 0 && avgRmssd < 20) stressLevel = "high";
            else if (avgRmssd > 50) stressLevel = "low";

            dailyContexts.push({
                date: dateStr,
                sleepDurationHours: sleepDuration,
                sleepEfficiencyPercent: sleepEfficiency,
                stressLevel: stressLevel
            });

            outputData[userId].days[dateStr] = {
                journal: "", // To be filled by LLM
                sleep: sleepInfo,
                biometrics: {
                    rmssd: avgRmssd,
                    sdnn: avgSdnn,
                    heartRate: avgHr,
                    readingCount: dayHrv.length,
                    source: "dataset_" + userId
                }
            };
        }

        const prompt = `You are acting as a ${age} year old ${sex}. 
You have a baseline anxiety score (GAD-7) of ${gad7} (0-21 scale, >10 is high) and a depression score (PHQ-9) of ${phq9} (0-27 scale, >10 is high). 

Here is a list of your daily statistics for the past ${limitedDates.length} days:
${JSON.stringify(dailyContexts, null, 2)}

Write a short, casual, 2-5 sentence private journal entry for EACH day reflecting on how you felt physically and mentally that day based on your sleep and stress. Do not use medical terms or mention the scores explicitly. Sound like a real human writing a diary entry.

Respond strictly with a JSON object where the keys are the exact dates (e.g., "2021-03-09") and the values are the generated journal entry strings.`;

        console.log(`  Generating dummy journals for all ${limitedDates.length} days (API BYPASS)...`);
        
        for (let i = 0; i < limitedDates.length; i++) {
            const dateStr = limitedDates[i];
            const ctx = dailyContexts[i];
            
            let dummyJournal = "";
            if (ctx.stressLevel === "high") {
                dummyJournal = `I feel completely drained today. Only got ${ctx.sleepDurationHours} hours of sleep and my mind has been racing since I woke up. Work was overwhelming and I just want to crash.`;
            } else if (ctx.stressLevel === "low") {
                dummyJournal = `Actually feeling pretty decent today! Slept for about ${ctx.sleepDurationHours} hours and felt surprisingly rested. Managed to stay focused throughout the day without getting too anxious.`;
            } else {
                dummyJournal = `Just an average day today. Sleep was okay (${ctx.sleepDurationHours} hours), but nothing special. Pushed through work, though I felt a bit sluggish around the afternoon.`;
            }

            outputData[userId].days[dateStr].journal = dummyJournal;
        }
        console.log(`  Successfully mapped dummy journals for ${userId}.`);

        // Sleep to simulate work, though not strictly needed without API
        await sleep(500);
    }

    fs.writeFileSync("raw_data/generated_journals.json", JSON.stringify(outputData, null, 2));
    console.log("\nFinished generating journals! Saved to raw_data/generated_journals.json");
}

run();