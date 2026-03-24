import { SigninForm } from "@/components/auth/signin-form";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionAction } from "../actions/auth";

export default async function SigninPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

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
