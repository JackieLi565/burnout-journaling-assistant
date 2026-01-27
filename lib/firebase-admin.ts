import "server-only";
import { initializeApp, getApp, getApps, cert } from "firebase-admin/app";
import { adminConfig, emulatorConfig, firebaseConfig } from "./config";

export function initAdmin() {
  if (emulatorConfig.useEmulator) {
    const { host, authPort, firestorePort, storagePort } = emulatorConfig;

    process.env.FIREBASE_AUTH_EMULATOR_HOST = `${host}:${authPort}`;
    process.env.FIRESTORE_EMULATOR_HOST = `${host}:${firestorePort}`;
    process.env.STORAGE_EMULATOR_HOST = `http://${host}:${storagePort}`;
  }

  if (getApps().length > 0) return getApp();

  return initializeApp({
    credential: cert(adminConfig.serviceAccountPath!),
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
  });
}
