// app/stats/StatsChart.tsx
"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { QuizStat } from "@/app/actions/stats";

export default function StatsChart({ data }: { data: QuizStat[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]} // Force scale from 0 to 100
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                />
                <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}