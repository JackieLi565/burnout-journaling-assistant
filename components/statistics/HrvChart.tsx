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
import { HrvDataPoint } from "@/app/actions/hrv";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HrvChartProps {
    data: HrvDataPoint[];
}

export default function HrvChart({ data }: HrvChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground border rounded-lg bg-muted/20">
                No HRV data recorded yet.
            </div>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-xl font-semibold">HRV Trends (RMSSD vs SDNN)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                            <XAxis
                                dataKey="date"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(str) => {
                                    const date = new Date(str + "T00:00:00");
                                    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                }}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                label={{ value: 'ms', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#888888' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    borderRadius: "8px",
                                    border: "1px solid hsl(var(--border))",
                                    fontSize: "12px"
                                }}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Line
                                type="monotone"
                                dataKey="rmssd"
                                name="RMSSD (Parasympathetic)"
                                stroke="#2563eb"
                                strokeWidth={2}
                                dot={{ r: 4, fill: "#2563eb", strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="sdnn"
                                name="SDNN (Total Variability)"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-muted-foreground italic">
                    <p>* RMSSD: Primarily reflects parasympathetic activity (recovery).</p>
                    <p>* SDNN: Reflects the overall autonomic nervous system balance.</p>
                </div>
            </CardContent>
        </Card>
    );
}
