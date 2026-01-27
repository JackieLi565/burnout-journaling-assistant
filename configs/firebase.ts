export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const emulatorConfig = {
  useEmulator: process.env.NEXT_PUBLIC_USE_EMULATOR === "true",
  host: process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || "localhost",
  authPort: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT || "9099",
  firestorePort: process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || "8080",
  storagePort: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT || "9199",
};

export const adminConfig = {
  serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
};
