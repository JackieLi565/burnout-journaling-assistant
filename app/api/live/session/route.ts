import { verifySession } from "@/lib/auth-rsc";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const GEMINI_AUTH_TOKENS_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/authTokens";
const LIVE_WS_ENDPOINT =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";
const DEFAULT_LIVE_MODEL = "models/gemini-2.0-flash-live-001";

function normalizeModel(model: string | undefined) {
  if (!model) return DEFAULT_LIVE_MODEL;
  return model.startsWith("models/") ? model : `models/${model}`;
}

export async function POST() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await verifySession(sessionCookie);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server missing GEMINI_API_KEY" },
      { status: 500 },
    );
  }

  const model = normalizeModel(process.env.GEMINI_LIVE_MODEL);
  const constrainedModel = model.replace(/^models\//, "");
  const expireAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const response = await fetch(
    `${GEMINI_AUTH_TOKENS_ENDPOINT}?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uses: 1,
        expireTime: expireAt,
        newSessionExpireTime: "300s",
        liveConnectConstraints: {
          model: constrainedModel,
          config: {
            responseModalities: ["TEXT"],
          },
        },
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const details = await response.text();
    console.error("Failed to create Gemini ephemeral token:", details);
    return NextResponse.json(
      { error: "Could not create live session token" },
      { status: 502 },
    );
  }

  const token = (await response.json()) as { name?: string; expireTime?: string };

  if (!token.name) {
    return NextResponse.json(
      { error: "Invalid token response from Gemini" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    token: token.name,
    model,
    wsEndpoint: LIVE_WS_ENDPOINT,
    expireTime: token.expireTime ?? expireAt,
  });
}
