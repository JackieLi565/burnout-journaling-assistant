"use client";

import { useState } from "react";

export default function JournalPage() {
    const [entry, setEntry] = useState("");
    const [analysis, setAnalysis] = useState<{ score: number; feedback: string } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyze = () => {
        if (!entry.trim()) return;
        setIsAnalyzing(true);

        // Simulate AI processing time
        setTimeout(() => {
            // Mock AI Logic: Simple heuristic for demonstration
            const wordCount = entry.split(" ").length;
            const mockScore = Math.min(100, Math.floor(Math.random() * 30) + 50); // Random "stress" score

            setAnalysis({
                score: mockScore,
                feedback: wordCount < 10
                    ? "It seems you're keeping things brief today. Short entries can sometimes indicate exhaustion. Try to expand on one emotion."
                    : "You've expressed a lot today. Writing it out is the first step to recovery. Your stress markers are elevated, consider a 5-minute break.",
            });
            setIsAnalyzing(false);
        }, 1500);
    };

    return (
        <main className="max-w-4xl mx-auto px-6 py-12 w-full">
            <h1 className="text-3xl font-bold mb-2">Daily Check-in</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
                How are you feeling about your work today?
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Input Section */}
                <div className="md:col-span-2 space-y-4">
          <textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              className="w-full h-64 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              placeholder="Start writing here..."
          />
                    <div className="flex justify-end">
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || !entry}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {isAnalyzing ? "Analyzing..." : "Save & Analyze"}
                        </button>
                    </div>
                </div>

                {/* AI Sidebar */}
                <div className="md:col-span-1">
                    {analysis ? (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-100 dark:border-gray-800">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
                                AI Insights
                            </h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-blue-600">{analysis.score}</span>
                                <span className="text-sm text-gray-500 ml-2">/ 100 Stress Level</span>
                            </div>
                            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                {analysis.feedback}
                            </p>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-6 text-center">
                            <p className="text-sm text-gray-400">
                                Write a journal entry to receive AI-powered burnout insights.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}