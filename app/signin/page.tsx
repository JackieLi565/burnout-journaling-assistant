import { SigninForm } from "@/components/auth/signin-form";
import { redirect } from "next/navigation";
import { verifySessionAction } from "../actions/auth";
import { getSessionCookie } from "@/utils/next";

export default async function SigninPage() {
  const sessionCookie = await getSessionCookie();

  if (sessionCookie) {
    const decodedToken = await verifySessionAction(sessionCookie);
    if (decodedToken) redirect("/app");
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <SigninForm />
    </div>
  );
}
