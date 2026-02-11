import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { verifySession } from "@/lib/auth-rsc";

/* test change for commit */
/*
- everything under /app/ path for regular app
- stuff like /signup/ gets placed outside /app/ directory
- integrate quiz into popup, not necessarily its own route. pops up like dialog box for user to do on the fly. this is placed under app route
- for journaling:
    - left side: list of all journals ordered by time, able to click to pull up and reread. should be locked to once daily?
    - grouped by day, in order of time placed in that day
    - edits and additions are limited to current day. cant backdate journal entries
    - left sidebar lists by only date (maybe small ai-generated header summary?)
    - change survey format to only one question at a time w/ next button and numCompleted/numTotal display
 */
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
