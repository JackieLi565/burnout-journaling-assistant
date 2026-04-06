"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type LiveCoachStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "connected"
  | "error";

type StartSessionArgs = {
  date: string;
  draft: string;
};

type LiveCoachMessage =
  | { type?: "authenticated"; userId?: string }
  | { type?: "session_ready" }
  | { type?: "input_transcript"; text?: string }
  | { type?: "output_transcript"; text?: string }
  | { type?: "model_text"; text?: string }
  | { type?: "output_audio_chunk"; audio?: string; mimeType?: string }
  | { type?: "turn_complete" }
  | { type?: "interrupted" }
  | { type?: "error"; text?: string; reason?: string };

type ConversationTurn = {
  speaker: "you" | "coach";
  text: string;
};

const TARGET_SAMPLE_RATE = 16000;
const PROCESSOR_BUFFER_SIZE = 4096;

function decodeBase64ToBytes(base64: string) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function pcm16ToAudioBuffer(
  context: AudioContext,
  bytes: Uint8Array,
  sampleRate: number,
) {
  const frameCount = Math.floor(bytes.length / 2);
  const audioBuffer = context.createBuffer(1, frameCount, sampleRate);
  const channel = audioBuffer.getChannelData(0);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  for (let i = 0; i < frameCount; i += 1) {
    channel[i] = view.getInt16(i * 2, true) / 0x8000;
  }

  return audioBuffer;
}

function parseSampleRate(mimeType?: string) {
  const match = mimeType?.match(/rate=(\d+)/i);
  return match ? Number(match[1]) : 24000;
}

function resampleTo16k(input: Float32Array, inputSampleRate: number) {
  if (inputSampleRate === TARGET_SAMPLE_RATE) {
    return input;
  }

  const ratio = inputSampleRate / TARGET_SAMPLE_RATE;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);

  let outputIndex = 0;
  let inputIndex = 0;
  while (outputIndex < outputLength) {
    const nextInputIndex = Math.round((outputIndex + 1) * ratio);
    let sum = 0;
    let count = 0;
    for (let i = inputIndex; i < nextInputIndex && i < input.length; i += 1) {
      sum += input[i];
      count += 1;
    }
    output[outputIndex] = count > 0 ? sum / count : 0;
    outputIndex += 1;
    inputIndex = nextInputIndex;
  }

  return output;
}

function audioBufferToBase64Pcm16(input: Float32Array, inputSampleRate: number) {
  const resampled = resampleTo16k(input, inputSampleRate);
  const pcmBytes = new Uint8Array(resampled.length * 2);
  const view = new DataView(pcmBytes.buffer);

  for (let i = 0; i < resampled.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, resampled[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  let binary = "";
  for (let i = 0; i < pcmBytes.length; i += 1) {
    binary += String.fromCharCode(pcmBytes[i]);
  }

  return window.btoa(binary);
}

function getSocketUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  const configured = process.env.NEXT_PUBLIC_ENGINE_WS_URL?.trim();
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const baseUrl = configured || `${protocol}://${window.location.hostname}:8000`;
  const url = new URL(baseUrl);

  return `${url.toString().replace(/\/$/, "")}/api/v1/live/journal`;
}

async function fetchLiveSessionToken() {
  const response = await fetch("/api/live-session", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error || "Failed to authenticate the live session.");
  }

  const payload = (await response.json()) as { token: string };
  return payload.token;
}

function formatConversationTranscript(turns: ConversationTurn[]) {
  return turns
    .filter((turn) => turn.text.trim().length > 0)
    .map((turn) => `${turn.speaker === "you" ? "You" : "Coach"}: ${turn.text.trim()}`)
    .join("\n\n");
}

function mergeChunkedText(current: string, incoming: string) {
  const next = incoming.trim();
  if (!next) {
    return current;
  }

  const existing = current.trim();
  if (!existing) {
    return next;
  }

  if (next.startsWith(existing)) {
    return next;
  }

  if (existing.startsWith(next)) {
    return existing;
  }

  const maxOverlap = Math.min(existing.length, next.length);
  for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
    if (existing.slice(-overlap) === next.slice(0, overlap)) {
      return `${existing}${next.slice(overlap)}`.trim();
    }
  }

  if (existing.endsWith(next)) {
    return existing;
  }

  const separator = /[\s\n]$/.test(existing) || /^[\s,.;!?]/.test(next) ? "" : " ";
  return `${existing}${separator}${next}`.trim();
}

export function useLiveCoach() {
  const [status, setStatus] = useState<LiveCoachStatus>("idle");
  const [inputTranscript, setInputTranscript] = useState("");
  const [coachReply, setCoachReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSessionOpen, setIsSessionOpen] = useState(false);

  const websocketRef = useRef<WebSocket | null>(null);
  const committedTurnsRef = useRef<ConversationTurn[]>([]);
  const pendingUserTurnRef = useRef("");
  const pendingCoachTurnRef = useRef("");

  const captureStreamRef = useRef<MediaStream | null>(null);
  const captureContextRef = useRef<AudioContext | null>(null);
  const captureSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const captureProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const captureSinkRef = useRef<GainNode | null>(null);
  const isCapturingRef = useRef(false);

  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackCursorRef = useRef(0);
  const activePlaybackRef = useRef<AudioBufferSourceNode[]>([]);
  const receivedModelAudioRef = useRef(false);

  const syncTranscriptState = useCallback(() => {
    const previewTurns = [...committedTurnsRef.current];
    if (pendingUserTurnRef.current.trim()) {
      previewTurns.push({ speaker: "you", text: pendingUserTurnRef.current.trim() });
    }
    if (pendingCoachTurnRef.current.trim()) {
      previewTurns.push({
        speaker: "coach",
        text: pendingCoachTurnRef.current.trim(),
      });
    }

    setInputTranscript(formatConversationTranscript(previewTurns));
    const latestCoachTurn = [...previewTurns]
      .reverse()
      .find((turn) => turn.speaker === "coach");
    setCoachReply(latestCoachTurn?.text ?? "");
  }, []);

  const setPendingTurn = useCallback(
    (speaker: ConversationTurn["speaker"], text: string) => {
      const nextText = text.trim();
      if (!nextText) {
        return;
      }

      if (speaker === "you") {
        pendingUserTurnRef.current = mergeChunkedText(
          pendingUserTurnRef.current,
          nextText,
        );
      } else {
        pendingCoachTurnRef.current = mergeChunkedText(
          pendingCoachTurnRef.current,
          nextText,
        );
      }

      syncTranscriptState();
    },
    [syncTranscriptState],
  );

  const commitPendingTurns = useCallback(() => {
    const nextTurns = [...committedTurnsRef.current];
    const pendingUser = pendingUserTurnRef.current.trim();
    const pendingCoach = pendingCoachTurnRef.current.trim();

    if (pendingUser) {
      nextTurns.push({ speaker: "you", text: pendingUser });
    }

    if (pendingCoach) {
      nextTurns.push({ speaker: "coach", text: pendingCoach });
    }

    committedTurnsRef.current = nextTurns;
    pendingUserTurnRef.current = "";
    pendingCoachTurnRef.current = "";
    syncTranscriptState();
  }, [syncTranscriptState]);

  const resetPlayback = useCallback(async () => {
    activePlaybackRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // noop
      }
    });
    activePlaybackRef.current = [];
    playbackCursorRef.current = 0;
  }, []);

  const clearConversationState = useCallback(() => {
    committedTurnsRef.current = [];
    pendingUserTurnRef.current = "";
    pendingCoachTurnRef.current = "";
    receivedModelAudioRef.current = false;
    setCoachReply("");
    setInputTranscript("");
  }, []);

  const stopSpeechSynthesis = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
  }, []);

  const speakCoachReply = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      const content = text.trim();
      if (!content) {
        return;
      }

      stopSpeechSynthesis();
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    },
    [stopSpeechSynthesis],
  );

  const getPlaybackContext = useCallback(async () => {
    if (!playbackContextRef.current || playbackContextRef.current.state === "closed") {
      playbackContextRef.current = new AudioContext();
      playbackCursorRef.current = playbackContextRef.current.currentTime;
    }

    if (playbackContextRef.current.state === "suspended") {
      await playbackContextRef.current.resume();
    }

    return playbackContextRef.current;
  }, []);

  const playAudioChunk = useCallback(
    async (base64Audio: string, mimeType?: string) => {
      const context = await getPlaybackContext();
      const bytes = decodeBase64ToBytes(base64Audio);
      const buffer = pcm16ToAudioBuffer(context, bytes, parseSampleRate(mimeType));
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);

      const startAt = Math.max(context.currentTime, playbackCursorRef.current);
      source.start(startAt);
      playbackCursorRef.current = startAt + buffer.duration;
      activePlaybackRef.current.push(source);
      source.onended = () => {
        activePlaybackRef.current = activePlaybackRef.current.filter(
          (node) => node !== source,
        );
      };
    },
    [getPlaybackContext],
  );

  const stopMicrophoneCapture = useCallback(async () => {
    isCapturingRef.current = false;

    if (captureProcessorRef.current) {
      captureProcessorRef.current.onaudioprocess = null;
      captureProcessorRef.current.disconnect();
      captureProcessorRef.current = null;
    }

    if (captureSourceRef.current) {
      captureSourceRef.current.disconnect();
      captureSourceRef.current = null;
    }

    if (captureSinkRef.current) {
      captureSinkRef.current.disconnect();
      captureSinkRef.current = null;
    }

    if (captureStreamRef.current) {
      captureStreamRef.current.getTracks().forEach((track) => track.stop());
      captureStreamRef.current = null;
    }

    if (captureContextRef.current && captureContextRef.current.state !== "closed") {
      await captureContextRef.current.close().catch(() => undefined);
    }
    captureContextRef.current = null;
  }, []);

  const hardCleanup = useCallback(async () => {
    await stopMicrophoneCapture();
    stopSpeechSynthesis();
    websocketRef.current = null;
    setIsSessionOpen(false);
    receivedModelAudioRef.current = false;
  }, [stopMicrophoneCapture, stopSpeechSynthesis]);

  const startMicrophoneCapture = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("This browser does not support microphone capture.");
    }

    const ws = websocketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error("Live coach session is not connected.");
    }

    await stopMicrophoneCapture();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const context = new AudioContext();
    if (context.state === "suspended") {
      await context.resume();
    }

    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(PROCESSOR_BUFFER_SIZE, 1, 1);
    const silentSink = context.createGain();
    silentSink.gain.value = 0;

    processor.onaudioprocess = (event) => {
      if (!isCapturingRef.current) {
        return;
      }

      const currentSocket = websocketRef.current;
      if (!currentSocket || currentSocket.readyState !== WebSocket.OPEN) {
        return;
      }

      const channelData = event.inputBuffer.getChannelData(0);
      if (channelData.length === 0) {
        return;
      }

      const audio = audioBufferToBase64Pcm16(channelData, context.sampleRate);
      currentSocket.send(JSON.stringify({ type: "audio_chunk", audio }));
    };

    source.connect(processor);
    processor.connect(silentSink);
    silentSink.connect(context.destination);

    captureStreamRef.current = stream;
    captureContextRef.current = context;
    captureSourceRef.current = source;
    captureProcessorRef.current = processor;
    captureSinkRef.current = silentSink;
    isCapturingRef.current = true;
  }, [stopMicrophoneCapture]);

  const startSession = useCallback(
    async ({ date, draft }: StartSessionArgs) => {
      try {
        await stopMicrophoneCapture();
        websocketRef.current?.close();

        setError(null);
        clearConversationState();
        setIsSessionOpen(false);
        await resetPlayback();
        stopSpeechSynthesis();
        await getPlaybackContext();

        setStatus("connecting");

        const token = await fetchLiveSessionToken();
        const ws = new WebSocket(`${getSocketUrl()}?token=${encodeURIComponent(token)}`);
        websocketRef.current = ws;

        await new Promise<void>((resolve, reject) => {
          const cleanup = () => {
            ws.removeEventListener("message", handleMessage);
            ws.removeEventListener("error", handleError);
            ws.removeEventListener("close", handleClose);
          };

          const handleOpen = () => {
            ws.send(
              JSON.stringify({
                type: "start_session",
                date,
                draft,
              }),
            );
          };

          const handleMessage = (event: MessageEvent<string>) => {
            const payload = JSON.parse(event.data) as LiveCoachMessage;

            switch (payload.type) {
              case "authenticated":
                setIsSessionOpen(true);
                break;
              case "session_ready":
                cleanup();
                resolve();
                break;
              case "error":
                cleanup();
                reject(
                  new Error(
                    payload.reason || payload.text || "Live coach session failed.",
                  ),
                );
                break;
              default:
                break;
            }
          };

          const handleError = () => {
            cleanup();
            reject(new Error("Failed to open the live coach session."));
          };

          const handleClose = (event: CloseEvent) => {
            cleanup();
            const detail = event.reason
              ? event.reason
              : event.code
                ? `close code ${event.code}`
                : "unexpected close";
            reject(new Error(`The live coach session closed before it was ready: ${detail}.`));
          };

          ws.addEventListener("open", handleOpen, { once: true });
          ws.addEventListener("message", handleMessage);
          ws.addEventListener("error", handleError, { once: true });
          ws.addEventListener("close", handleClose, { once: true });
        });

        ws.onmessage = (event) => {
          const payload = JSON.parse(event.data) as LiveCoachMessage;

          switch (payload.type) {
            case "input_transcript":
              if (payload.text) {
                setPendingTurn("you", payload.text);
              }
              break;
            case "output_transcript":
              if (payload.text) {
                setPendingTurn("coach", payload.text);
              }
              break;
            case "model_text":
              if (payload.text) {
                setPendingTurn("coach", payload.text);
              }
              break;
            case "output_audio_chunk":
              if (payload.audio) {
                receivedModelAudioRef.current = true;
                void playAudioChunk(payload.audio, payload.mimeType);
              }
              break;
            case "turn_complete":
              if (!receivedModelAudioRef.current && pendingCoachTurnRef.current.trim()) {
                speakCoachReply(pendingCoachTurnRef.current);
              }
              commitPendingTurns();
              receivedModelAudioRef.current = false;
              setStatus(isCapturingRef.current ? "listening" : "connected");
              break;
            case "interrupted":
              commitPendingTurns();
              void resetPlayback();
              stopSpeechSynthesis();
              receivedModelAudioRef.current = false;
              setStatus(isCapturingRef.current ? "listening" : "connected");
              break;
            case "error":
              commitPendingTurns();
              void stopMicrophoneCapture();
              stopSpeechSynthesis();
              receivedModelAudioRef.current = false;
              setError(payload.reason || payload.text || "Live coach session failed.");
              setStatus("error");
              break;
            default:
              break;
          }
        };

        ws.onerror = () => {
          void hardCleanup();
          setError("The live coach websocket encountered an error.");
          setStatus("error");
        };

        ws.onclose = (event) => {
          void hardCleanup();
          const isNormalClose = event.code === 1000 || event.code === 1005;
          const message =
            isNormalClose
              ? null
              : event.reason ||
                (event.code
                  ? `Live coach closed unexpectedly (code ${event.code}).`
                  : null);
          if (message) {
            setError(message);
          }
          setStatus((current) => (current === "error" ? current : "idle"));
        };

        await startMicrophoneCapture();
        setStatus("listening");
      } catch (err) {
        await hardCleanup();
        setStatus("error");
        setError(err instanceof Error ? err.message : "Live coach session failed.");
      }
    },
    [clearConversationState, commitPendingTurns, getPlaybackContext, hardCleanup, playAudioChunk, resetPlayback, setPendingTurn, speakCoachReply, startMicrophoneCapture, stopMicrophoneCapture, stopSpeechSynthesis],
  );

  const stopSession = useCallback(async () => {
    const ws = websocketRef.current;
    await stopMicrophoneCapture();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "audio_stream_end" }));
    }
    stopSpeechSynthesis();
    setStatus("connected");
  }, [stopMicrophoneCapture, stopSpeechSynthesis]);

  const resumeListening = useCallback(async () => {
    const ws = websocketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error("Live coach session is not connected.");
    }

    setError(null);
    await getPlaybackContext();
    await startMicrophoneCapture();
    setStatus("listening");
  }, [getPlaybackContext, startMicrophoneCapture]);

  const endSession = useCallback(async () => {
    commitPendingTurns();
    await stopMicrophoneCapture();
    stopSpeechSynthesis();

    const ws = websocketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "stop_session" }));
      ws.close();
    }

    websocketRef.current = null;
    setIsSessionOpen(false);
    await resetPlayback();
    setStatus("idle");
  }, [commitPendingTurns, resetPlayback, stopMicrophoneCapture, stopSpeechSynthesis]);

  const resetSession = useCallback(async () => {
    await stopMicrophoneCapture();
    stopSpeechSynthesis();

    const ws = websocketRef.current;
    if (ws) {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "stop_session" }));
        }
        ws.close();
      } catch {
        // noop
      }
    }

    websocketRef.current = null;
    clearConversationState();
    setError(null);
    setIsSessionOpen(false);
    await resetPlayback();
    setStatus("idle");
  }, [clearConversationState, resetPlayback, stopMicrophoneCapture, stopSpeechSynthesis]);

  useEffect(() => {
    return () => {
      void stopMicrophoneCapture();
      stopSpeechSynthesis();
      const ws = websocketRef.current;
      if (ws) {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "stop_session" }));
          }
          ws.close();
        } catch {
          // noop
        }
      }
      websocketRef.current = null;
    };
  }, [stopMicrophoneCapture, stopSpeechSynthesis]);

  useEffect(() => {
    return () => {
      resetPlayback().catch(() => undefined);
      if (playbackContextRef.current && playbackContextRef.current.state !== "closed") {
        playbackContextRef.current.close().catch(() => undefined);
      }
    };
  }, [resetPlayback]);

  const canApplyTranscript = useMemo(
    () => inputTranscript.trim().length > 0,
    [inputTranscript],
  );

  return {
    status,
    inputTranscript,
    coachReply,
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
