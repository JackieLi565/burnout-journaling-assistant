"use client";

import React, { useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import { QuizDataPoint } from "@/app/actions/quiz-stats";

type ViewMode = "overall" | "sections";

interface QuizChartProps {
    points: QuizDataPoint[];
}

const TOGGLE_OPTIONS: { value: ViewMode; label: string }[] = [
    { value: "sections", label: "By Section" },
    { value: "overall", label: "Overall" },
];

export default function QuizChart({ points }: QuizChartProps) {
    const [view, setView] = useState<ViewMode>("sections");

    if (points.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-muted-foreground border rounded-lg bg-muted/20 text-sm">
                No quiz results yet.
            </div>
        );
    }

    const data = points.map((p) => ({
        date: p.date,
        "Burnout Score": p.score,
        "Emotional Exhaustion": p.eeScore,
        "Depersonalization": p.dpScore,
        "Reduced Personal Accomplishment": p.paScore,
    }));

    const tickFormatter = (str: string) => {
        const date = new Date(str + "T00:00:00");
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    };

    const axisProps = {
        stroke: "#888888" as const,
        fontSize: 11,
        tickLine: false,
        axisLine: false,
    };

    const tooltipStyle = {
        backgroundColor: "hsl(var(--card))",
        borderRadius: "8px",
        border: "1px solid hsl(var(--border))",
        fontSize: "12px",
    };

    return (
        <div className="space-y-3">
            {/* Toggle */}
            <div className="flex gap-1">
                {TOGGLE_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setView(opt.value)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            view === opt.value
                                ? "bg-foreground text-background"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Chart */}
            <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="date" {...axisProps} tickFormatter={tickFormatter} />
                        <YAxis domain={[0, 100]} {...axisProps} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <ReferenceLine y={50} stroke="#888888" strokeDasharray="4 4" opacity={0.4} />

                        {view === "overall" && (
                            <>
                                <Legend verticalAlign="top" height={28} iconType="circle" />
                                <Line
                                    type="monotone"
                                    dataKey="Burnout Score"
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: "#f97316", strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                />
                            </>
                        )}

                        {view === "sections" && (
                            <>
                                <Legend verticalAlign="top" height={28} iconType="circle" />
                                <Line
                                    type="monotone"
                                    dataKey="Emotional Exhaustion"
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: "#f97316", strokeWidth: 0 }}
                                    activeDot={{ r: 5 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="Depersonalization"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 0 }}
                                    activeDot={{ r: 5 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="Reduced Personal Accomplishment"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
                                    activeDot={{ r: 5 }}
                                />
                            </>
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
