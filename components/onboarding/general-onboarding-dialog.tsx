"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { completeGeneralOnboarding } from "@/app/actions/onboarding";
import { cn } from "@/utils/cn";

interface GeneralOnboardingDialogProps {
  isOpen: boolean;
}

const STEPS = [
  {
    title: "Welcome!",
    description:
      "Thanks for joining! This is a private space to reflect on your day, track your wellbeing, and get personalized insights to help you avoid burnout.",
    image: null,
  },
  {
    title: "Daily Journaling",
    description:
      "Journals can be created every day to help you track your thoughts and feelings.",
    image: "/onboarding/journaling.png",
  },
  {
    title: "Track Your Progress",
    description: (
      <>
        View detailed statistics of your journaling progress in the{" "}
        <span className="text-primary hover:underline font-medium">
          statistics page
        </span>
        .
      </>
    ),
    image: "/onboarding/statistics.png",
  },
  {
    title: "AI Analysis",
    description:
      "Our AI analyzes each journal entry to provide insights into your emotions and burnout levels.",
    image: "/onboarding/ai.png",
  },
];

export function GeneralOnboardingDialog({
  isOpen: initialIsOpen,
}: GeneralOnboardingDialogProps) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = useCallback(async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    try {
      await completeGeneralOnboarding();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      setIsCompleting(false);
    }
  }, [isCompleting]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleComplete();
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md flex flex-col items-center text-center p-8"
        showCloseButton={true}
      >
        <DialogHeader className="w-full">
          <DialogTitle className="text-2xl font-bold">
            {STEPS[currentStep].title}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {STEPS[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        {STEPS[currentStep].image ? (
          <Image
            src={STEPS[currentStep].image}
            alt={STEPS[currentStep].title}
            width={500}
            height={500}
            className="object-cover rounded-lg"
            priority
          />
        ) : null}

        <div className="flex gap-2">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                index === currentStep ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>

        <DialogFooter className="w-full flex flex-row gap-4 sm:flex-row sm:justify-between mt-0">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isCompleting}
            className="flex-1"
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1"
            disabled={isCompleting}
          >
            {currentStep === STEPS.length - 1 ? "Get Started" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
