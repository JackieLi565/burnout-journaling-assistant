# Demo Users Guide

This document outlines how to access and utilize the 49 realistic demo users generated for the Burnout Journaling Assistant. 

These users have been algorithmically synthesized from the core dataset (`survey.csv`, `sleep_diary.csv`, `sensor_hrv.csv`) to provide realistic profiles, longitudinal daily journals, sleep data, HRV metrics, and daily Maslach Burnout Inventory (MBI) quiz responses.

## Authentication

All 49 demo users are pre-registered in Firebase Authentication. 

**Standard Password for all Demo Users:** `password123`

To log in, use the user's dataset ID followed by the demo domain: `[ID]@demo.burnout.app`

### Quick Start Accounts
Here are a few diverse profiles you can use to immediately see different states of burnout and mental health:

*   **High Burnout / High Stress User:** `pg18@demo.burnout.app`
    *   *Profile:* 38yo Female, High Anxiety (GAD-7: 10), High Depression (PHQ-9: 5).
    *   *What you will see:* Consistently poor sleep, low HRV (high stress), negative journal entries, and high burnout scores on the MBI quizzes.
*   **Low Burnout / Resilient User:** `pm96@demo.burnout.app`
    *   *Profile:* 36yo Male, Low Anxiety (GAD-7: 1), Low Depression (PHQ-9: 1).
    *   *What you will see:* Healthy sleep patterns, higher HRV, positive or neutral journal entries, and low burnout scores on quizzes.
*   **Moderate/Mixed User:** `vc10@demo.burnout.app`
    *   *Profile:* 31yo Female, Moderate Depression (PHQ-9: 3), Low Anxiety. 

*(Note: You can log in as any of the 49 dataset IDs, such as `nd56@demo.burnout.app`, `vs14@demo.burnout.app`, etc.)*

---

## What Data is Available?

For every demo user, there is roughly **30 days** of contiguous, cross-correlated data spanning March-April 2021. This data is structured exactly as a real user would generate it.

### 1. Daily Journals (`users/{uid}/journals/{date}/entries`)
*   **Journal Text:** Realistic, 2-5 sentence personal diary entries. These were intelligently synthesized to reflect the user's physical sleep quality and physiological HRV stress for that specific day. 
*   **Sleep Logs:** Automated sleep entries detailing bedtime, wake time, duration, and efficiency.

### 2. Biometrics / HRV (`users/{uid}/biometrics/{date}`)
*   Daily aggregated Heart Rate Variability metrics (`rmssd`, `sdnn`, `heartRate`). 
*   *Note:* A lower RMSSD generally indicates higher physiological stress.

### 3. Daily Quizzes (`users/{uid}/quizzes`)
*   Full 22-question MBI (Maslach Burnout Inventory) responses for every day.
*   These are procedurally generated to align with the user's baseline mental health (from their survey) and their physiological stress level for that specific day. 

---

## How to Regenerate or Modify Demo Data

If the database schema changes or we need to generate different types of demo users, developers can re-run the seeding pipeline.

### Step 1: Generate the Payload
*(You only need to do this if you deleted `raw_data/generated_journals.json` or want to change how journals are generated).*
```bash
npm run generate:demo
```
*Note: The current script bypasses the LLM to avoid rate limits and uses a heuristic dummy text generator. If you have an active Gemini API key and want true AI-generated journals, uncomment the LLM section in `scripts/generate-demo-journals.ts`.*

### Step 2: Seed the Database
This script reads the generated JSON payload and pushes the users into Firebase Authentication and Cloud Firestore. It is safe to run multiple times (it uses `merge: true` and will just overwrite existing demo data).
```bash
npm run seed:demo
```