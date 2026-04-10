"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { submitQuizResult } from "@/app/actions/quiz";

const SCALE = [
  { value: 0, label: "Strongly Agree" },
  { value: 1, label: "Agree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Strongly Disagree" },
];

const QUESTIONS = [
  "I feel emotionally drained by my work.",
  "Working with people all day long requires a great deal of effort.",
  "I feel like my work is breaking me down.",
  "I feel frustrated by my work.",
  "I feel I work too hard at my job.",
  "It stresses me too much to work in direct contact with people.",
  "I feel like I'm at the end of my rope.",
  "I feel I look after certain patients/clients impersonally, as if they are objects.",
  "I feel tired when I get up in the morning and have to face another day at work.",
  "I have the impression that my patients/clients make me responsible for some of their problems.",
  "I am at the end of my patience at the end of my work day.",
  "I really don't care about what happens to some of my patients/clients.",
  "I have become more insensitive to people since I've been working.",
  "I'm afraid that this job is making me uncaring.",
  "I accomplish many worthwhile things in this job.",
  "I feel full of energy.",
  "I am easily able to understand what my patients/clients feel.",
  "I look after my patients'/clients' problems very effectively.",
  "In my work, I handle emotional problems very calmly.",
  "Through my work, I feel that I have a positive influence on people.",
  "I am easily able to create a relaxed atmosphere with my patients/clients.",
  "I feel refreshed when I have been close to my patients/clients at work.",
];

export default function QuizModal({ trigger }: { trigger?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = useCallback(
    (value: number) => {
      setResponses((prev) => ({ ...prev, [currentIndex]: value }));
    },
    [currentIndex]
  );

  const handleNext = useCallback(async () => {
    if (responses[currentIndex] === undefined) return;

    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsSubmitting(true);
      const result = await submitQuizResult(responses);
      setIsSubmitting(false);

      if (result.success) {
        setIsOpen(false);
        setCurrentIndex(0);
        setResponses({});
      } else {
        alert("Error saving quiz: " + result.error);
      }
    }
  }, [currentIndex, responses]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting) return;

      if (["1", "2", "3", "4"].includes(e.key)) {
        handleSelect(parseInt(e.key) - 1);
      }

      if (e.key === "Enter") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, handleNext, handleSelect]);

  function handleOpenChange(next: boolean) {
    if (!isSubmitting) {
      setIsOpen(next);
      if (!next) {
        setCurrentIndex(0);
        setResponses({});
      }
    }
  }

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="w-full cursor-pointer">
        {trigger ?? <Button variant="outline">Daily Quiz</Button>}
      </div>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
          <div className="relative overflow-hidden px-6 pt-6">
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl">Daily Check-in</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Question {currentIndex + 1} of {QUESTIONS.length}
              </p>
            </DialogHeader>
          </div>

          <div className="px-6 pb-2 pt-4">
            {/* Progress bar */}
            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / QUESTIONS.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="px-6 pb-2 pt-2 space-y-6">
            <h3 className="text-base font-medium text-center min-h-[48px] flex items-center justify-center">
              {QUESTIONS[currentIndex]}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SCALE.map((option, idx) => {
                const isSelected = responses[currentIndex] === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    disabled={isSubmitting}
                    className={`relative rounded-xl border px-4 py-3 text-sm text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/50 ${
                      isSelected
                        ? "border-primary/60 bg-primary/5 shadow-sm font-medium"
                        : "border-border bg-background"
                    }`}
                  >
                    <span className="absolute top-1.5 left-2.5 font-mono text-[10px] text-muted-foreground/50">
                      {idx + 1}
                    </span>
                    <span className="block text-center pt-1">{option.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-center text-[10px] text-muted-foreground/50 uppercase tracking-wider">
              Press 1–4 to answer · Enter to continue
            </p>
          </div>

          <DialogFooter className="px-6 pb-6 pt-2 sm:justify-between">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentIndex === 0 || isSubmitting}
            >
              Previous
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                disabled={responses[currentIndex] === undefined || isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : currentIndex === QUESTIONS.length - 1
                    ? "Submit"
                    : "Next"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
