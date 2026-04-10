import { NextResponse } from "next/server";

import { verifySessionAction } from "@/app/actions/auth";
import { createLiveSessionToken } from "@/utils/live-session";
import { getSessionCookie } from "@/utils/next";

export async function GET() {
  const secret = process.env.LIVE_SESSION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "LIVE_SESSION_SECRET is not configured." },
      { status: 500 },
    );
  }

  const sessionCookie = await getSessionCookie();
  if (!sessionCookie) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const decoded = await verifySessionAction(sessionCookie);
  if (!decoded?.uid) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  return NextResponse.json({
    token: createLiveSessionToken(decoded.uid, secret),
  });
}
