"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/utils/cn";

interface MeditationInstruction {
  timestamp: number;
  text: string;
}

interface Meditation {
  id: string;
  name: string;
  tagline: string;
  instructions: MeditationInstruction[];
}

interface MeditationModalProps {
  trigger: React.ReactNode;
  meditation: Meditation;
}

type MeditationState = "instructions" | "playing" | "finished";

const TOTAL_TIME = 600; // 10 minutes default

export default function MeditationModal({
  trigger,
  meditation,
}: MeditationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<MeditationState>("instructions");
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [isActive, setIsActive] = useState(false);

  // Determine current instruction based on elapsed time
  const currentInstruction = useMemo(() => {
    const elapsed = TOTAL_TIME - timeLeft;
    // Find the instruction with the highest timestamp that is <= elapsed
    const matches = meditation.instructions
      .filter((ins) => ins.timestamp <= elapsed)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return matches.length > 0 ? matches[0].text : "Breathe deeply...";
  }, [timeLeft, meditation.instructions]);

  // Secret Dev Shortcut: Ctrl + Alt + K to skip forward by 1 minute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "k") {
        if (state === "playing") {
          setTimeLeft((prev) => Math.max(0, prev - 60));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state]);

  // Reset when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setState("instructions");
      setIsActive(false);
      setTimeLeft(TOTAL_TIME);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && state === "playing") {
      setIsActive(false);
      setState("finished");
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, state]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startMeditation = () => {
    setState("playing");
    setIsActive(true);
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(TOTAL_TIME);
    setState("instructions");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {state === "finished" ? "Session Complete" : meditation.name}
          </DialogTitle>
        </DialogHeader>

        <div className="py-8 flex flex-col items-center justify-center min-h-[350px]">
          {state === "instructions" && (
            <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Info className="w-8 h-8 text-blue-600" />
              </div>
              <div className="space-y-2 px-4">
                <p className="text-muted-foreground leading-relaxed">
                  {meditation.tagline}
                </p>
                <p className="text-sm font-medium text-blue-600">
                  Find a quiet space, sit comfortably, and prepare to begin.
                </p>
              </div>
              <Button onClick={startMeditation} size="lg" className="px-8 bg-blue-600 hover:bg-blue-700">
                I'm Ready
              </Button>
            </div>
          )}

          {state === "playing" && (
            <div className="flex flex-col items-center space-y-10 w-full animate-in fade-in duration-500">
              {/* Breathing Visualizer */}
              <div className="relative flex items-center justify-center w-48 h-48">
                {/* Outer pulsing ring */}
                <div 
                  className={cn(
                    "absolute inset-0 rounded-full bg-blue-400/20 transition-all duration-1000",
                    isActive ? "animate-pulse" : ""
                  )} 
                  style={{ animationDuration: '4s' }}
                />
                {/* Middle ring */}
                <div 
                  className={cn(
                    "absolute inset-4 rounded-full bg-blue-300/30 transition-all duration-1000",
                    isActive ? "animate-pulse" : ""
                  )}
                  style={{ animationDuration: '4s', animationDelay: '0.5s' }}
                />
                {/* Inner circle with time */}
                <div className="relative z-10 w-32 h-32 rounded-full bg-background border-4 border-blue-400/40 flex items-center justify-center shadow-inner">
                  <span className="text-3xl font-mono font-bold tracking-tighter text-blue-600">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              <div className="text-center space-y-4 px-6 min-h-[80px] flex flex-col justify-center">
                <p className="text-lg font-medium text-foreground leading-snug">
                  {currentInstruction}
                </p>
                {!isActive && (
                  <p className="text-sm text-blue-600 font-medium animate-pulse">
                    Paused
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={resetTimer} className="border-blue-200 text-blue-600 hover:bg-blue-50">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button 
                  size="icon" 
                  className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700" 
                  onClick={toggleTimer}
                >
                  {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </Button>
              </div>
            </div>
          )}

          {state === "finished" && (
            <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Excellent Work</h3>
                <p className="text-muted-foreground leading-relaxed px-4">
                  You've successfully completed your {meditation.name}. Notice how you feel in this moment.
                </p>
              </div>
              <Button onClick={() => setIsOpen(false)} size="lg" className="px-8 bg-blue-600 hover:bg-blue-700">
                Close
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-center text-xs text-muted-foreground border-t pt-4">
          Self-care is a practice, not a destination.
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
