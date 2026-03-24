import "server-only";
import { initializeApp, getApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { emulatorConfig, firebaseConfig } from "@/configs/firebase";
import { getAuth } from "firebase-admin/auth";

export function initAdmin() {
  if (getApps().length > 0) return getApp();

  if (emulatorConfig.useEmulator) {
    const { host, authPort, firestorePort, storagePort } = emulatorConfig;

    process.env.FIREBASE_AUTH_EMULATOR_HOST = `${host}:${authPort}`;
    process.env.FIRESTORE_EMULATOR_HOST = `${host}:${firestorePort}`;
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = `${host}:${storagePort}`;
  }

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_PATH environment variable is not set.",
    );

  return initializeApp({
    credential: cert(process.env.FIREBASE_SERVICE_ACCOUNT_PATH),
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
  });
}

/**
 * Returns a Firestore instance for the first initialized app. If no app is initialized
 * an app will be initialized.
 */
export function getAdminFirestore() {
  const app = initAdmin();
  return getFirestore(app);
}

/**
 * Returns an Auth instance for the first initialized app. If no app is initialized
 * an app will be initialized.
 */
export function getAdminAuth() {
  const app = initAdmin();
  return getAuth(app);
}

// 2. ADD THIS AT THE BOTTOM
// This initializes the app (if needed) and exports the database connection
export const db = getFirestore(initAdmin());
