"use client";

import { useState } from "react";
import Link from "next/link";

const SCALE = [
    { value: 0, label: "Strongly Agree" },
    { value: 1, label: "Agree" },
    { value: 2, label: "Disagree" },
    { value: 3, label: "Strongly Disagree" },
];

const QUESTIONS = [
    // Section 1
    "I feel emotionally drained by my work.",
    "Working with people all day long requires a great deal of effort.",
    "I feel like my work is breaking me down.",
    "I feel frustrated by my work.",
    "I feel I work too hard at my job.",
    "It stresses me too much to work in direct contact with people.",
    "I feel like I’m at the end of my rope.",

    // Section 2
    "I feel I look after certain patients/clients impersonally, as if they are objects.",
    "I feel tired when I get up in the morning and have to face another day at work.",
    "I have the impression that my patients/clients make me responsible for some of their problems.",
    "I am at the end of my patience at the end of my work day.",
    "I really don’t care about what happens to some of my patients/clients.",
    "I have become more insensitive to people since I’ve been working.",
    "I’m afraid that this job is making me uncaring.",

    // Section 3
    "I accomplish many worthwhile things in this job.",
    "I feel full of energy.",
    "I am easily able to understand what my patients/clients feel.",
    "I look after my patients’/clients’ problems very effectively.",
    "In my work, I handle emotional problems very calmly.",
    "Through my work, I feel that I have a positive influence on people.",
    "I am easily able to create a relaxed atmosphere with my patients/clients.",
    "I feel refreshed when I have been close to my patients/clients at work.",
];

export default function Home() {
    const [responses, setResponses] = useState<Record<number, number>>({});

    function setResponse(questionIndex: number, value: number) {
        setResponses((prev) => ({ ...prev, [questionIndex]: value }));
    }

    return (
        <main className="max-w-6xl mx-auto px-8 py-10">
            <h1 className="text-2xl font-semibold mb-2">
                Work Experience Questionnaire
            </h1>

            <p className="text-sm text-white-600 mb-6">
                Please indicate how strongly you agree with each statement.
            </p>

            <Link
                href="/"
                className="text-blue-600 underline hover:text-blue-800"
            >
                Go to Home page
            </Link>

            {/* Scale header */}
            <div className="grid grid-cols-[2fr_repeat(4,1fr)] border-t border-b text-sm font-medium">
                <div className="p-3" />
                {SCALE.map((s) => (
                    <div
                        key={s.value}
                        className="p-3 text-center border-l"
                    >
                        {s.label}
                    </div>
                ))}
            </div>

            {/* Matrix */}
            <div>
                {QUESTIONS.map((q, qi) => (
                    <div
                        key={qi}
                        className="grid grid-cols-[2fr_repeat(4,1fr)] border-b hover:bg-gray-50"
                    >
                        <div className="p-3 text-sm leading-snug">
                            {q}
                        </div>

                        {SCALE.map((s) => (
                            <label
                                key={s.value}
                                className="flex items-center justify-center p-3 border-l"
                            >
                                <input
                                    type="radio"
                                    name={`question-${qi}`}
                                    value={s.value}
                                    checked={responses[qi] === s.value}
                                    onChange={() => setResponse(qi, s.value)}
                                    className="accent-black"
                                />
                            </label>
                        ))}
                    </div>
                ))}
            </div>
        </main>
    );
}
