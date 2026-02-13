"use client";

import { useEffect, useRef, useState } from "react";

type BurnoutAnalysisResponse = {
  overall_score?: number;
  risk_level?: string;
  emotional_exhaustion?: { normalized_score?: number };
  depersonalization?: { normalized_score?: number };
  personal_accomplishment?: { normalized_score?: number };
  sentiment?: {
    label?: "negative" | "neutral" | "positive";
    confidence?: number;
  };
};

type LiveSessionResponse = {
  token: string;
  model: string;
  wsEndpoint: string;
};

export default function JournalPage() {
  const [entry, setEntry] = useState("");
  const [analysis, setAnalysis] = useState<BurnoutAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConnectingLive, setIsConnectingLive] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveReply, setLiveReply] = useState("");
  const [error, setError] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const connectPromiseRef = useRef<Promise<WebSocket> | null>(null);
  const pendingAssistantTurnRef = useRef("");
  const speechRecognitionRef = useRef<any>(null);
  const dictationBaseTextRef = useRef("");

  const extractTurnText = (parts: unknown): string => {
    if (!Array.isArray(parts)) return "";
    return parts
      .map((part) => {
        if (
          part &&
          typeof part === "object" &&
          typeof (part as { text?: unknown }).text === "string"
        ) {
          return (part as { text: string }).text;
        }
        return "";
      })
      .join("");
  };

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const disconnectLive = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsLiveConnected(false);
    pendingAssistantTurnRef.current = "";
  };

  const ensureLiveConnection = async (): Promise<WebSocket> => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return wsRef.current;
    }

    if (connectPromiseRef.current) {
      return connectPromiseRef.current;
    }

    connectPromiseRef.current = (async () => {
      setIsConnectingLive(true);
      setError("");

      const sessionResponse = await fetch("/api/live/session", {
        method: "POST",
      });

      if (!sessionResponse.ok) {
        throw new Error("Unable to create Gemini Live session");
      }

      const session = (await sessionResponse.json()) as LiveSessionResponse;
      const wsUrl = `${session.wsEndpoint}?access_token=${encodeURIComponent(
        session.token,
      )}`;

      return await new Promise<WebSocket>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        let setupReady = false;
        let settled = false;
        const setupTimeout = window.setTimeout(() => {
          if (!settled && !setupReady) {
            settled = true;
            ws.close();
            reject(new Error("Timed out while setting up Gemini Live"));
          }
        }, 10000);

        const settleResolve = () => {
          if (!settled) {
            settled = true;
            window.clearTimeout(setupTimeout);
            resolve(ws);
          }
        };

        const settleReject = (message: string) => {
          if (!settled) {
            settled = true;
            window.clearTimeout(setupTimeout);
            reject(new Error(message));
          }
        };

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              setup: {
                model: session.model,
                generationConfig: {
                  responseModalities: ["TEXT"],
                  temperature: 0.4,
                  maxOutputTokens: 280,
                },
                systemInstruction: {
                  parts: [
                    {
                      text:
                        "You are a calm burnout journaling companion. Respond with one concise reflection and one practical next step.",
                    },
                  ],
                },
              },
            }),
          );
        };

        ws.onerror = () => {
          settleReject("Gemini Live websocket connection failed");
        };

        ws.onclose = () => {
          wsRef.current = null;
          setIsLiveConnected(false);
          if (!settled && !setupReady) {
            settleReject("Gemini Live closed before setup completed");
          }
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data) as {
              setupComplete?: unknown;
              serverContent?: {
                modelTurn?: { parts?: unknown };
                turnComplete?: boolean;
              };
              error?: { message?: string };
            };

            if (payload.setupComplete && !setupReady) {
              setupReady = true;
              wsRef.current = ws;
              setIsLiveConnected(true);
              settleResolve();
              return;
            }

            if (payload.error?.message) {
              setError(payload.error.message);
              settleReject(payload.error.message);
              return;
            }

            const nextText = extractTurnText(
              payload.serverContent?.modelTurn?.parts,
            );

            if (nextText) {
              const current = pendingAssistantTurnRef.current;
              if (nextText.startsWith(current)) {
                pendingAssistantTurnRef.current = nextText;
              } else {
                pendingAssistantTurnRef.current = `${current}${nextText}`;
              }
              setLiveReply(pendingAssistantTurnRef.current);
            }

            if (payload.serverContent?.turnComplete) {
              const completedReply = pendingAssistantTurnRef.current.trim();
              pendingAssistantTurnRef.current = "";
              if (completedReply) {
                speak(completedReply);
              }
            }
          } catch {
            // Ignore non-JSON keepalive and unknown control messages.
          }
        };
      });
    })();

    try {
      return await connectPromiseRef.current;
    } finally {
      connectPromiseRef.current = null;
      setIsConnectingLive(false);
    }
  };

  const sendEntryToLive = (text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    pendingAssistantTurnRef.current = "";
    setLiveReply("");
    wsRef.current.send(
      JSON.stringify({
        clientContent: {
          turns: [{ role: "user", parts: [{ text }] }],
          turnComplete: true,
        },
      }),
    );
  };

  const handleAnalyze = async () => {
    const text = entry.trim();
    if (!text) return;

    setError("");
    setIsAnalyzing(true);

    try {
      await ensureLiveConnection();
      sendEntryToLive(text);

      const response = await fetch("/api/journal/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Sentiment analysis failed");
      }

      const data = (await response.json()) as BurnoutAnalysisResponse;
      setAnalysis(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not analyze entry";
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startDictation = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    setError("");
    dictationBaseTextRef.current = entry.trim();

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();

      const mergedText = [dictationBaseTextRef.current, transcript]
        .filter(Boolean)
        .join(" ")
        .trim();

      setEntry(mergedText);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setError("Dictation failed. Please try again.");
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopDictation = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      disconnectLive();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 w-full">
      <h1 className="text-3xl font-bold mb-2">Daily Check-in</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        How are you feeling about your work today? Use text or dictation, then
        run analysis.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            className="w-full h-64 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            placeholder="Start writing here..."
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={isListening ? stopDictation : startDictation}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                {isListening ? "Stop Dictation" : "Start Dictation"}
              </button>
              <button
                onClick={() => {
                  if (isLiveConnected) {
                    disconnectLive();
                  } else {
                    void ensureLiveConnection().catch((err) => {
                      const message =
                        err instanceof Error
                          ? err.message
                          : "Could not connect to Gemini Live";
                      setError(message);
                    });
                  }
                }}
                disabled={isConnectingLive}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-60 transition-colors"
              >
                {isConnectingLive
                  ? "Connecting..."
                  : isLiveConnected
                    ? "Disconnect Live"
                    : "Connect Live"}
              </button>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !entry}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Entry"}
            </button>
          </div>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
        </div>

        <div className="md:col-span-1">
          {analysis ? (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
                AI Insights
              </h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-blue-600">
                  {analysis.overall_score ?? 0}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  / 100 Stress Level
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Risk Level:{" "}
                <span className="font-medium capitalize">
                  {analysis.risk_level ?? "unknown"}
                </span>
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Sentiment:{" "}
                <span className="font-medium capitalize">
                  {analysis.sentiment?.label ?? "unknown"}
                </span>{" "}
                ({Math.round((analysis.sentiment?.confidence ?? 0) * 100)}%)
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  Emotional Exhaustion:{" "}
                  {Math.round(analysis.emotional_exhaustion?.normalized_score ?? 0)}
                </p>
                <p>
                  Depersonalization:{" "}
                  {Math.round(analysis.depersonalization?.normalized_score ?? 0)}
                </p>
                <p>
                  Personal Accomplishment:{" "}
                  {Math.round(
                    analysis.personal_accomplishment?.normalized_score ?? 0,
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-400">
                Write a journal entry to receive AI-powered sentiment and burnout
                insights.
              </p>
            </div>
          )}

          <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-950">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">Gemini Live Coach</h4>
              <span className="text-xs text-gray-500">
                {isSpeaking ? "Speaking..." : isLiveConnected ? "Connected" : "Offline"}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 min-h-14">
              {liveReply || "Live reflection will appear here after analysis."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
