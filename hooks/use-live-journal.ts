"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type LiveStatus = "idle" | "listening" | "error";

type StartSessionArgs = {
  date?: string;
  draft?: string;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<
          ArrayLike<{ transcript: string }> & { isFinal?: boolean }
        >;
      }) => void)
    | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type BrowserSpeechRecognitionCtor = new () => BrowserSpeechRecognition;

function getSpeechRecognitionCtor() {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as Window & {
    SpeechRecognition?: BrowserSpeechRecognitionCtor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
  };

  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
}

function getSpeechRecognitionError(error?: string) {
  switch (error) {
    case "audio-capture":
      return "No microphone was found for browser dictation.";
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission is blocked for browser dictation.";
    case "network":
      return "Browser dictation failed because the speech service was unavailable.";
    case "no-speech":
      return "No speech was detected. Try again and speak closer to the microphone.";
    default:
      return "Browser dictation failed.";
  }
}

export function useLiveJournal() {
  const [status, setStatus] = useState<LiveStatus>("idle");
  const [inputTranscript, setInputTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSessionOpen, setIsSessionOpen] = useState(false);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const transcriptFinalRef = useRef("");

  const stopRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }

    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;

    try {
      recognition.stop();
    } catch {
      // noop
    }

    try {
      recognition.abort();
    } catch {
      // noop
    }

    recognitionRef.current = null;
  }, []);

  const startRecognition = useCallback(() => {
    const speechCtor = getSpeechRecognitionCtor();
    if (!speechCtor) {
      setError("This browser does not support voice dictation.");
      setStatus("error");
      return false;
    }

    stopRecognition();

    const recognition = new speechCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = transcriptFinalRef.current;

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim();
        if (!transcript) {
          continue;
        }

        if (result.isFinal) {
          finalTranscript = finalTranscript
            ? `${finalTranscript}\n${transcript}`
            : transcript;
        } else {
          interimTranscript = interimTranscript
            ? `${interimTranscript} ${transcript}`
            : transcript;
        }
      }

      transcriptFinalRef.current = finalTranscript;
      setInputTranscript(
        interimTranscript
          ? `${finalTranscript}${finalTranscript ? "\n" : ""}${interimTranscript}`
          : finalTranscript,
      );
    };

    recognition.onerror = (event) => {
      recognitionRef.current = null;
      setError(getSpeechRecognitionError(event.error));
      setStatus("error");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setStatus((current) => (current === "error" ? current : "idle"));
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setError(null);
      setStatus("listening");
      return true;
    } catch {
      setError("Browser dictation could not start.");
      setStatus("error");
      return false;
    }
  }, [stopRecognition]);

  const startSession = useCallback(
    async (_args?: StartSessionArgs) => {
      transcriptFinalRef.current = "";
      setInputTranscript("");
      setError(null);
      setIsSessionOpen(true);

      if (!startRecognition()) {
        setIsSessionOpen(false);
      }
    },
    [startRecognition],
  );

  const stopSession = useCallback(async () => {
    stopRecognition();
    setStatus((current) => (current === "error" ? current : "idle"));
  }, [stopRecognition]);

  const resumeListening = useCallback(async () => {
    setIsSessionOpen(true);
    startRecognition();
  }, [startRecognition]);

  const endSession = useCallback(async () => {
    stopRecognition();
    setIsSessionOpen(false);
    setStatus("idle");
  }, [stopRecognition]);

  const resetSession = useCallback(async () => {
    stopRecognition();
    transcriptFinalRef.current = "";
    setInputTranscript("");
    setError(null);
    setIsSessionOpen(false);
    setStatus("idle");
  }, [stopRecognition]);

  useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, [stopRecognition]);

  const canApplyTranscript = useMemo(
    () => inputTranscript.trim().length > 0,
    [inputTranscript],
  );

  return {
    status,
    inputTranscript,
    coachReply: "",
    error,
    isSessionOpen,
    canApplyTranscript,
    startSession,
    resumeListening,
    stopSession,
    endSession,
    resetSession,
  };
}
