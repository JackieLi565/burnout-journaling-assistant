"use client";

import { useState } from "react";
import { Analysis } from "@/types/journal";

interface EditorProps {
    onSave: (content: string, analysis: Analysis) => void;
}

export default function JournalEditor({ onSave }: EditorProps) {
    const [text, setText] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyzeAndSave = () => {
        if (!text.trim()) return;
        setIsAnalyzing(true);

        // TODO: Replace this timeout with a real API call
        setTimeout(() => {
            const wordCount = text.split(" ").length;
            const mockScore = Math.min(100, Math.floor(Math.random() * 40) + 40);
            const feedback =
                wordCount < 10
                    ? "Brief entry. Sometimes brevity indicates exhaustion. Consider expanding."
                    : "Good detailed entry. Writing helps process complex emotions and reduces cognitive load.";

            onSave(text, { score: mockScore, feedback });
            setIsAnalyzing(false);
            setText("");
        }, 1500);
    };

    return (
        <div className="max-w-3xl mx-auto w-full p-8 md:p-12 h-full flex flex-col">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Daily Check-in</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    How are you feeling about your work right now?
                </p>
            </div>

            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Start writing here..."
                className="flex-1 w-full p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-lg leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none shadow-sm transition-shadow"
            />

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleAnalyzeAndSave}
                    disabled={isAnalyzing || !text}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-md flex items-center gap-2"
                >
                    {isAnalyzing ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Analyzing...
                        </>
                    ) : (
                        "Save & Analyze Entry"
                    )}
                </button>
            </div>
        </div>
    );
}