import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { verifySession } from "@/lib/auth-rsc";

export default async function AppPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (!sessionCookie) {
    redirect("/signin");
  }

  let decodedToken;
  try {
    decodedToken = await verifySession(sessionCookie);
  } catch (e) {
    // Should be handled by layout, but for safety/type narrowing:
    redirect("/api/logout");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">App Dashboard</h1>
          <form action={logoutAction}>
            <Button variant="outline" type="submit">
              Logout
            </Button>
          </form>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You are logged in as{" "}
              <span className="font-semibold text-foreground">
                {decodedToken.email}
              </span>
            </p>
            <div className="mt-4 p-4 bg-zinc-100 rounded-md">
              <p className="text-sm font-mono break-all">
                UID: {decodedToken.uid}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
