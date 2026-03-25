"use client";

import React, { useState } from "react";
import { submitFeedback, FeedbackArea } from "@/app/actions/feedback";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

const AREAS: { value: FeedbackArea; label: string; description: string }[] = [
  {
    value: "general",
    label: "General",
    description: "Overall experience and product ideas.",
  },
  {
    value: "journaling",
    label: "Journaling",
    description: "Editor, prompts, and daily flow.",
  },
  {
    value: "statistics",
    label: "Statistics",
    description: "Charts, trends, and insights.",
  },
  {
    value: "quiz",
    label: "Daily Quiz",
    description: "Quiz flow and daily check-in.",
  },
  {
    value: "bug",
    label: "Bug Report",
    description: "Something broken or not working.",
  },
];

export default function FeedbackDialog({
  trigger,
}: {
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [area, setArea] = useState<FeedbackArea | "">("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const trimmedMessage = message.trim();
  const selectedArea = AREAS.find((item) => item.value === area);

  function handleOpenChange(next: boolean) {
    if (!submitting) {
      setOpen(next);
      if (!next) reset();
    }
  }

  function reset() {
    setStep(1);
    setArea("");
    setMessage("");
    setSubmitted(false);
  }

  async function handleSubmit() {
    if (!area || !trimmedMessage || submitting) return;
    setSubmitting(true);
    await submitFeedback(area, trimmedMessage);
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      reset();
    }, 1500);
  }

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer w-full">
        {trigger ?? <Button variant="outline">Send Feedback</Button>}
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <div className="relative overflow-hidden px-6 pt-6">
            <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full" />
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl">Send Feedback</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Help us fine-tune the experience.
              </p>
            </DialogHeader>
          </div>

          {submitted ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              Thanks for your feedback! We'll put it to work.
            </p>
          ) : (
            <div className="px-6 pb-6 pt-4">
              {step === 1 ? (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">
                    Choose the area you'd like to comment on.
                  </p>
                  <div
                    role="radiogroup"
                    aria-label="Feedback area"
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    {AREAS.map((item) => {
                      const selected = area === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setArea(item.value)}
                          className={cn(
                            "group relative rounded-xl border px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/50",
                            selected
                              ? "border-primary/60 bg-primary/5 shadow-sm"
                              : "border-border bg-background",
                          )}
                        >
                          <span className="text-sm font-semibold">
                            {item.label}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {item.description}
                          </span>
                          <span
                            className={cn(
                              "absolute right-3 top-3 h-2.5 w-2.5 rounded-full border transition-colors",
                              selected
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/40",
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3 py-1 text-xs font-medium">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {selectedArea?.label ?? "Selected area"}
                    </div>
                  </div>
                  <div className="rounded-2xl border  bg-muted/40 p-4 shadow-sm transition focus-within:border-primary/40 focus-within:bg-muted/60">
                    <Textarea
                      placeholder="Tell us more..."
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={submitting}
                      className="min-h-28 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {!submitted && (
            <DialogFooter className="px-6 pb-6 pt-2 sm:justify-between">
              {step === 1 ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => handleOpenChange(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!area || submitting}
                  >
                    Next
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setStep(1)}
                    disabled={submitting}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!area || !trimmedMessage || submitting}
                  >
                    {submitting ? "Sending..." : "Submit"}
                  </Button>
                </>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
