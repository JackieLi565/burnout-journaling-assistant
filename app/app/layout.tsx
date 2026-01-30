import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth-rsc";
import Navbar from "@/components/misc/Navbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (!sessionCookie) {
    redirect("/signin");
  }

  try {
    await verifySession(sessionCookie);
  } catch (e) {
    console.error(
      "Invalid session in AppLayout, redirecting to logout handler:",
      e,
    );
    redirect("/api/logout");
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
