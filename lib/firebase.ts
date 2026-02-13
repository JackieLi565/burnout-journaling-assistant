import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { emulatorConfig, firebaseConfig } from "@/configs/firebase";

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

if (emulatorConfig.useEmulator) {
  const { host, authPort } = emulatorConfig;

  connectAuthEmulator(auth, `http://${host}:${authPort}`);
}

export { auth, app };