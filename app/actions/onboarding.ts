"use server";

import { getAdminFirestore } from "@/lib/firebase-admin";
import { getAuthenticatedUserId } from "@/app/actions/auth";
import { revalidatePath } from "next/cache";

interface OnboardingProfile {
  generalOnboardingCompleted: boolean;
}

/**
 * Retrieves an object that contains the user's onboarding status.
 */
export async function getUserOnboardingProfile(): Promise<OnboardingProfile> {
  const userId = await getAuthenticatedUserId();
  const db = getAdminFirestore();

  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    return {
      generalOnboardingCompleted: false,
    };
  }

  const data = userDoc.data();

  return {
    generalOnboardingCompleted: data?.generalOnboardingCompleted || false,
  };
}

/**
 * Completes the general onboarding process for the authenticated user.
 */
export async function completeGeneralOnboarding() {
  const userId = await getAuthenticatedUserId();
  const db = getAdminFirestore();

  try {
    await db.collection("users").doc(userId).update({
      generalOnboardingCompleted: true,
      updatedAt: new Date(),
    });
    revalidatePath("/", "layout");
  } catch (error) {
    console.error("Error completing onboarding:", error);
  }
}
