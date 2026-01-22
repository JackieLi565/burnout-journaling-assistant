"use client";

import { useState } from "react";

const OPTIONS = [
    { value: "strongly-disagree", label: "Strongly disagree" },
    { value: "disagree", label: "Disagree" },
    { value: "agree", label: "Agree" },
    { value: "strongly-agree", label: "Strongly agree" },
];

type Question = {
    id: string;
    text: string;
};

export default function AgreementScale({
                                         questions,
                                     }: {
    questions: Question[];
}) {
    const [responses, setResponses] = useState<Record<string, string>>({});

    return (
        <table className="border-collapse text-sm">
            <thead>
            <tr>
                {/* Empty corner cell */}
                <th className="p-2"></th>

                {OPTIONS.map((opt) => (
                    <th
                        key={opt.value}
                        className="p-2 text-center font-medium"
                    >
                        {opt.label}
                    </th>
                ))}
            </tr>
            </thead>

            <tbody>
            {questions.map((q) => (
                <tr key={q.id} className="border-t">
                    {/* Question text */}
                    <td className="p-2 pr-6 whitespace-nowrap">
                        {q.text}
                    </td>

                    {OPTIONS.map((opt) => (
                        <td key={opt.value} className="p-2 text-center">
                            <input
                                type="radio"
                                name={q.id}
                                value={opt.value}
                                checked={responses[q.id] === opt.value}
                                onChange={() =>
                                    setResponses((prev) => ({
                                        ...prev,
                                        [q.id]: opt.value,
                                    }))
                                }
                            />
                        </td>
                    ))}
                </tr>
            ))}
            </tbody>
        </table>
    );
}
