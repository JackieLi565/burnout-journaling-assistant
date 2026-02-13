import { verifySession } from "@/lib/auth-rsc";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type BurnoutFeature = {
  emotion_type?: "negative" | "neutral" | "positive";
};

type BurnoutAnalysisResult = {
  overall_score?: number;
  risk_level?: string;
  features?: BurnoutFeature[];
};

function deriveSentiment(result: BurnoutAnalysisResult) {
  const features = result.features ?? [];

  if (features.length > 0) {
    const counts = features.reduce(
      (acc, feature) => {
        if (feature.emotion_type === "negative") acc.negative += 1;
        if (feature.emotion_type === "neutral") acc.neutral += 1;
        if (feature.emotion_type === "positive") acc.positive += 1;
        return acc;
      },
      { negative: 0, neutral: 0, positive: 0 },
    );

    const entries = Object.entries(counts) as Array<
      [keyof typeof counts, number]
    >;
    const [label, count] = entries.sort((a, b) => b[1] - a[1])[0];
    return {
      label,
      confidence: Number((count / features.length).toFixed(2)),
    };
  }

  const score = result.overall_score ?? 50;
  if (score >= 65) return { label: "negative", confidence: 0.6 };
  if (score <= 35) return { label: "positive", confidence: 0.6 };
  return { label: "neutral", confidence: 0.6 };
}

export async function POST(request: Request) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = typeof (body as { text?: unknown }).text === "string"
    ? (body as { text: string }).text.trim()
    : "";

  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const pythonEngineUrl = process.env.PYTHON_ENGINE_URL ?? "http://localhost:8000";
  const targetUrl = `${pythonEngineUrl.replace(/\/$/, "")}/api/v1/journals/analyze`;

  const pythonResponse = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionCookie}`,
    },
    body: JSON.stringify({ text }),
    cache: "no-store",
  });

  if (!pythonResponse.ok) {
    const details = await pythonResponse.text();
    console.error("Python analysis request failed:", details);
    return NextResponse.json(
      { error: "Analysis service unavailable" },
      { status: 502 },
    );
  }

  const analysis = (await pythonResponse.json()) as BurnoutAnalysisResult;
  return NextResponse.json({
    ...analysis,
    sentiment: deriveSentiment(analysis),
  });
}
