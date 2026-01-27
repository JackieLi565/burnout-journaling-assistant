import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { emulatorConfig, firebaseConfig } from "@/configs/firebase";

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

if (emulatorConfig.useEmulator) {
  const { host, authPort, firestorePort, storagePort } = emulatorConfig;

  // Note: auth emulator requires the URL, others require host/port split
  connectAuthEmulator(auth, `http://${host}:${authPort}`);
  connectFirestoreEmulator(db, host, Number(firestorePort));
  connectStorageEmulator(storage, host, Number(storagePort));
}

export { auth, db, storage };
