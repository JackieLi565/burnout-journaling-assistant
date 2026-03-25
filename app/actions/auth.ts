"use server";

import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";
import { getSessionCookie } from "@/utils/next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

/**
 * `loginAction` verifies the ID token and creates a user account in Firestore if it doesn't exists.
 *
 * @param idToken ID token obtained from client
 * @param redirectUrl
 */
export async function loginAction(idToken: string, redirectUrl?: string) {
  const auth = getAdminAuth();
  const db = getAdminFirestore();
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

export const verifySessionAction = cache(async (sessionCookie: string) => {
  const auth = getAdminAuth();

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return undefined;
  }
});

/**
 * Helper function to get the authenticated user's UID. If not authenticated, redirects to signin.
 */
export async function getAuthenticatedUserId() {
  const sessionCookie = await getSessionCookie();

  if (!sessionCookie) {
    redirect("/signin");
  }

  const decodedToken = await verifySessionAction(sessionCookie);
  if (!decodedToken) redirect("/signin");

  return decodedToken.uid;
}
