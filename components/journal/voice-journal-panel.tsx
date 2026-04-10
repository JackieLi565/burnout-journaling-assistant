"use client";

import { useEffect, useMemo, useState } from "react";
import { Mic, MicOff, RefreshCw, Sparkles } from "lucide-react";

import { useLiveCoach } from "@/hooks/use-live-coach";
import { useLiveJournal } from "@/hooks/use-live-journal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type VoiceJournalPanelProps = {
  date: string;
  draft: string;
  onAppendTranscript: (text: string, source: "dictation" | "live") => void;
  onReplaceDraft: (text: string, source: "dictation" | "live") => void;
  onLiveTranscriptChange?: (text: string) => void;
};

const STATUS_COPY: Record<string, string> = {
  idle: "Idle",
  connecting: "Connecting",
  listening: "Listening",
  connected: "Connected",
  error: "Error",
};

export function VoiceJournalPanel({
  date,
  draft,
  onAppendTranscript,
  onReplaceDraft,
  onLiveTranscriptChange,
}: VoiceJournalPanelProps) {
  const [mode, setMode] = useState<"dictation" | "live">("dictation");
  const dictation = useLiveJournal();
  const liveCoach = useLiveCoach();
  const dictationResetSession = dictation.resetSession;
  const liveResetSession = liveCoach.resetSession;

  useEffect(() => {
    if (mode === "dictation") {
      void liveResetSession();
      return;
    }

    void dictationResetSession();
  }, [dictationResetSession, liveResetSession, mode]);

  const activeSession = mode === "live" ? liveCoach : dictation;
  const {
    status,
    inputTranscript,
    coachReply,
    error,
    isSessionOpen,
    canApplyTranscript,
    resumeListening,
    stopSession,
    endSession,
    resetSession,
  } = activeSession;
  const handleStartSession = () =>
    mode === "live"
      ? (onLiveTranscriptChange?.(""), liveCoach.startSession({ date, draft }))
      : dictation.startSession();

  useEffect(() => {
    if (mode === "live" && inputTranscript.trim()) {
      onLiveTranscriptChange?.(inputTranscript);
    }
  }, [inputTranscript, mode, onLiveTranscriptChange]);

  const statusTone = useMemo(() => {
    switch (status) {
      case "listening":
        return "text-emerald-600 border-emerald-200 bg-emerald-50";
      case "connecting":
        return "text-amber-700 border-amber-200 bg-amber-50";
      case "error":
        return "text-red-700 border-red-200 bg-red-50";
      default:
        return "text-muted-foreground border-border bg-muted/50";
    }
  }, [status]);

  return (
    <Card className="mx-4 mt-4 gap-4 border-dashed bg-gradient-to-br from-card via-card to-muted/30">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              Voice Layer
            </CardTitle>
            <CardDescription>
              {mode === "live"
                ? "Start one continuous Gemini Live conversation, then append the transcript into the draft when you are done."
                : "Use browser dictation to capture thoughts, then append or replace the current draft. Saving and analysis still work exactly the same as before."}
            </CardDescription>
          </div>
          <div
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusTone}`}
          >
            {STATUS_COPY[status]}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={mode === "dictation" ? "secondary" : "outline"}
            onClick={() => setMode("dictation")}
          >
            Dictation
          </Button>
          <Button
            variant={mode === "live" ? "secondary" : "outline"}
            onClick={() => setMode("live")}
          >
            Live Coach
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isSessionOpen ? (
            <Button
              onClick={() => void handleStartSession()}
              className="gap-2"
            >
              <Mic className="h-4 w-4" />
              {mode === "live" ? "Start Conversation" : "Start Dictation"}
            </Button>
          ) : status === "listening" ? (
            <Button
              variant="secondary"
              onClick={() => void stopSession()}
              className="gap-2"
            >
              <MicOff className="h-4 w-4" />
              {mode === "live" ? "Mute Mic" : "Pause Dictation"}
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => void resumeListening()}
              className="gap-2"
            >
              <Mic className="h-4 w-4" />
              {mode === "live" ? "Resume Conversation" : "Resume Dictation"}
            </Button>
          )}

          {isSessionOpen && (
            <Button
              variant="outline"
              onClick={() => void endSession()}
              className="gap-2"
            >
              End Session
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => {
              if (mode === "live") {
                onLiveTranscriptChange?.("");
              }
              void resetSession();
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {mode === "live" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border bg-background/80 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Conversation
              </p>
              <div className="min-h-32 whitespace-pre-wrap text-sm leading-6">
                {inputTranscript || (
                  <span className="text-muted-foreground">
                    Your full conversation with Gemini Live will appear here.
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl border bg-background/80 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Latest Coach Reply
              </p>
              <div className="min-h-32 whitespace-pre-wrap text-sm leading-6">
                {coachReply || (
                  <span className="text-muted-foreground">
                    The latest transcribed coach reply will appear here.
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border bg-background/80 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Transcript
            </p>
            <div className="min-h-32 whitespace-pre-wrap text-sm leading-6">
              {inputTranscript || (
                <span className="text-muted-foreground">
                  Your dictated text will appear here as you speak.
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!canApplyTranscript}
            onClick={() => onAppendTranscript(inputTranscript, mode)}
          >
            {mode === "live" ? "Append Conversation" : "Append Transcript"}
          </Button>
          <Button
            disabled={!canApplyTranscript}
            onClick={() => onReplaceDraft(inputTranscript, mode)}
          >
            {mode === "live" ? "Replace With Conversation" : "Replace Draft"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
