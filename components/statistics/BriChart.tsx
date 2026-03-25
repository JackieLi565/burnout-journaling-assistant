"use client";

import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { JournalBriPoint } from "@/app/actions/journal-bri";

interface BriChartProps {
    points: JournalBriPoint[];
}

export default function BriChart({ points }: BriChartProps) {
    const analyzed = points.filter((p) => p.bri !== null);

    if (analyzed.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground border rounded-lg bg-muted/20 text-sm">
                No analyzed journals yet.
            </div>
        );
    }

    const data = analyzed.map((p) => ({
        date: p.date,
        BRI: p.bri !== null ? Math.round(p.bri) : null,
        "Cumul. BRI": p.cumulativeBri !== null ? Math.round(p.cumulativeBri) : null,
    }));

    return (
        <div className="h-[280px] w-full">
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
                    />
                    <Legend verticalAlign="top" height={32} iconType="circle" />
                    <Line
                        type="monotone"
                        dataKey="BRI"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#f97316", strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                        connectNulls
                    />
                    <Line
                        type="monotone"
                        dataKey="Cumul. BRI"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        strokeDasharray="5 3"
                        dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                        connectNulls
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
