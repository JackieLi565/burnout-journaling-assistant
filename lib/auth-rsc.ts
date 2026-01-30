import { cache } from "react";
import { initAdmin } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import "server-only";

export const verifySession = cache(async (sessionCookie: string) => {
  const app = initAdmin();
  const auth = getAuth(app);
  // Verify the session cookie. In this case, we're checking for revocation.
  return auth.verifySessionCookie(sessionCookie, true);
});
