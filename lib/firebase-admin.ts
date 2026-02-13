import "server-only";
import { initializeApp, getApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore"; // <--- 1. ADD THIS
import {
    adminConfig,
    emulatorConfig,
    firebaseConfig,
} from "@/configs/firebase";

export function initAdmin() {
    if (getApps().length > 0) return getApp();

    if (emulatorConfig.useEmulator) {
        const { host, authPort, firestorePort, storagePort } = emulatorConfig;

        process.env.FIREBASE_AUTH_EMULATOR_HOST = `${host}:${authPort}`;
        process.env.FIRESTORE_EMULATOR_HOST = `${host}:${firestorePort}`;
        process.env.FIREBASE_STORAGE_EMULATOR_HOST = `${host}:${storagePort}`;
    }

    return initializeApp({
        credential: cert(adminConfig.serviceAccountPath),
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
    });
}

// 2. ADD THIS AT THE BOTTOM
// This initializes the app (if needed) and exports the database connection
export const db = getFirestore(initAdmin());