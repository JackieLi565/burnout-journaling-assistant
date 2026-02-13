import { SigninForm } from "@/components/auth/signin-form";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { initAdmin } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";

export default async function SigninPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (sessionCookie) {
    let isValid = false;
    try {
      const app = initAdmin();
      const auth = getAuth(app);
      // Verify the session cookie. This will throw if invalid.
      await auth.verifySessionCookie(sessionCookie, true);
      isValid = true;
    } catch (error) {}

    if (isValid) {
      redirect("/app");
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <SigninForm />
    </div>
  );
}
