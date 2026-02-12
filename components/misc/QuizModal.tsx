"use client";

import {useState, useEffect} from "react";
import {createPortal} from "react-dom";
import {Button} from "@/components/ui/button";
import {submitQuizResult} from "@/app/actions/quiz";

// Constants moved outside component to avoid re-creation on render
const SCALE = [
    {value: 0, label: "Strongly Agree"},
    {value: 1, label: "Agree"},
    {value: 2, label: "Disagree"},
    {value: 3, label: "Strongly Disagree"},
];

const QUESTIONS = [
    "I feel emotionally drained by my work.",
    "Working with people all day long requires a great deal of effort.",
    "I feel like my work is breaking me down.",
    "I feel frustrated by my work.",
    "I feel I work too hard at my job.",
    "It stresses me too much to work in direct contact with people.",
    "I feel like I’m at the end of my rope.",
    "I feel I look after certain patients/clients impersonally, as if they are objects.",
    "I feel tired when I get up in the morning and have to face another day at work.",
    "I have the impression that my patients/clients make me responsible for some of their problems.",
    "I am at the end of my patience at the end of my work day.",
    "I really don’t care about what happens to some of my patients/clients.",
    "I have become more insensitive to people since I’ve been working.",
    "I’m afraid that this job is making me uncaring.",
    "I accomplish many worthwhile things in this job.",
    "I feel full of energy.",
    "I am easily able to understand what my patients/clients feel.",
    "I look after my patients’/clients’ problems very effectively.",
    "In my work, I handle emotional problems very calmly.",
    "Through my work, I feel that I have a positive influence on people.",
    "I am easily able to create a relaxed atmosphere with my patients/clients.",
    "I feel refreshed when I have been close to my patients/clients at work.",
];

export default function QuizModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [responses, setResponses] = useState<Record<number, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false); // New state

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [isOpen]);

    const handleSelect = (value: number) => {
        setResponses((prev) => ({...prev, [currentIndex]: value}));
    };

    const handleNext = async () => {
        if (currentIndex < QUESTIONS.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        } else {
            // === THIS IS THE NEW PART ===
            setIsSubmitting(true);

            const result = await submitQuizResult(responses);

            setIsSubmitting(false);

            if (result.success) {
                setIsOpen(false);
                // Optional: Reset form for next time
                setCurrentIndex(0);
                setResponses({});
            } else {
                alert("Error saving quiz: " + result.error);
            }
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    };

    // ... (Keep helper openModal) ...
    const openModal = () => setIsOpen(true);


    return (
        <>
            <Button onClick={openModal}>Start Daily Quiz</Button>

            {isOpen &&
                createPortal(
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                        onClick={() => !isSubmitting && setIsOpen(false)} // Prevent close while submitting
                    >
                        <div
                            className="bg-white text-black p-8 rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col gap-6 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center border-b pb-4">
                                <h2 className="text-xl font-bold">Daily Check-in</h2>
                                <span className="text-sm font-medium text-muted-foreground">
                  Question {currentIndex + 1} of {QUESTIONS.length}
                </span>
                            </div>

                            {/* Body */}
                            <div className="py-4 space-y-6">
                                <h3 className="text-lg font-medium text-center min-h-[60px] flex items-center justify-center">
                                    {QUESTIONS[currentIndex]}
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {SCALE.map((option) => {
                                        const isSelected = responses[currentIndex] === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => handleSelect(option.value)}
                                                disabled={isSubmitting}
                                                className={`p-3 text-sm rounded-lg border transition-all ${
                                                    isSelected
                                                        ? "bg-black text-white border-black"
                                                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-between items-center pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={handlePrev}
                                    disabled={currentIndex === 0 || isSubmitting}
                                >
                                    Previous
                                </Button>

                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsOpen(false)}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleNext}
                                        disabled={responses[currentIndex] === undefined || isSubmitting}
                                    >
                                        {isSubmitting ? "Saving..." : (currentIndex === QUESTIONS.length - 1 ? "Submit" : "Next")}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}