"use client";

import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import { QuizDataPoint } from "@/app/actions/quiz-stats";

interface QuizChartProps {
    points: QuizDataPoint[];
}

export default function QuizChart({ points }: QuizChartProps) {
    if (points.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-muted-foreground border rounded-lg bg-muted/20 text-sm">
                No quiz results yet.
            </div>
        );
    }

    const data = points.map((p) => ({
        date: p.date,
        "Wellbeing Score": p.score,
    }));

    return (
        <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis
                        dataKey="date"
                        stroke="#888888"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(str) => {
                            const date = new Date(str + "T00:00:00");
                            return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                        }}
                    />
                    <YAxis
                        domain={[0, 100]}
                        stroke="#888888"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            borderRadius: "8px",
                            border: "1px solid hsl(var(--border))",
                            fontSize: "12px",
                        }}
                        formatter={(value: number) => [`${value}`, "Wellbeing Score"]}
                    />
                    <ReferenceLine y={50} stroke="#888888" strokeDasharray="4 4" opacity={0.4} />
                    <Line
                        type="monotone"
                        dataKey="Wellbeing Score"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
