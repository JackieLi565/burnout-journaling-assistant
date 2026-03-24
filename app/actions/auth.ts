"use server";

import { initAdmin } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export async function loginAction(idToken: string, redirectUrl?: string) {
  const app = initAdmin();
  const auth = getAuth(app);
  const db = getFirestore(app);
  let decodedToken;
  try {
    decodedToken = await auth.verifyIdToken(idToken);
  } catch (error) {
    console.error("Error verifying ID token:", error);
    throw new Error("Invalid ID token");
  }

  const uid = decodedToken.uid;
  const email = decodedToken.email;

  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    await userRef.set({
      email: email,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await userRef.collection("sessions").add({
    loginTime: new Date(),
    authTime: new Date(decodedToken.auth_time * 1000),
    issuer: decodedToken.iss,
  });

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

  const cookieStore = await cookies();
  cookieStore.set("__session", sessionCookie, {
    maxAge: expiresIn,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });

  redirect(redirectUrl || "/app");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("__session");
  redirect("/signin");
}

export const verifySessionAction = cache(async (idToken: string) => {
  const app = initAdmin();
  const auth = getAuth(app);

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return undefined;
  }
});

/**
 * Helper function to get the authenticated user's UID. If not authenticated, redirects to signin.
 */
export async function getAuthenticatedUserId() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (!sessionCookie) {
    redirect("/signin");
  }

  const decodedToken = await verifySessionAction(sessionCookie);
  if (!decodedToken) redirect("/signin");

  return decodedToken.uid;
}
