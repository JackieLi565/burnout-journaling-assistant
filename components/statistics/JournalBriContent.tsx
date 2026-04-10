"use client";

import { useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import MeditationModal from "@/components/misc/meditation-modal";
import meditationsData from "@/lib/meditations.json";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BriChart from "@/components/statistics/BriChart";
import { JournalBriPoint } from "@/app/actions/journal-bri";
import { QuizDataPoint } from "@/app/actions/quiz-stats";

export function JournalBriContent({
  points,
  latestBri,
  latestCumulativeBri,
  quizPoints,
}: {
  points: JournalBriPoint[];
  latestBri: number | null;
  latestCumulativeBri: number | null;
  quizPoints: QuizDataPoint[];
}) {
  // Determine the lowest wellbeing dimension from the latest quiz for INITIAL recommendation
  const getInitialMeditation = () => {
    let initial = meditationsData.find((m) => m.id === "DEFAULT")!;

    if (quizPoints.length > 0) {
      const latest = quizPoints[quizPoints.length - 1];
      const scores = [
        { id: "EE", score: latest.eeScore },
        { id: "DP", score: latest.dpScore },
        { id: "PA", score: latest.paScore },
      ];

      const highest = scores.reduce((prev, curr) =>
        curr.score > prev.score ? curr : prev
      );

      if (highest.score > 20) {
        const match = meditationsData.find((m) => m.id === highest.id);
        if (match) initial = match;
      }
    }
    return initial;
  };

  const [selectedMeditation, setSelectedMeditation] = useState(getInitialMeditation());

  return (
    <div className="p-6 rounded-xl border bg-card/50 space-y-4">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Journal Burnout Risk</h3>
          <p className="text-sm text-muted-foreground">
            Scores from analyzing your journal entries with the burnout engine.
          </p>
        </div>
        <div className="flex gap-6 shrink-0">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Latest BRI
            </p>
            <p className="text-2xl font-semibold">
              {latestBri !== null ? Math.round(latestBri) : "–"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Latest cumulative BRI
            </p>
            <p className="text-2xl font-semibold">
              {latestCumulativeBri !== null
                ? Math.round(latestCumulativeBri)
                : "–"}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <BriChart points={points} />
      </div>

      {/* Recommended Meditation based on Stats */}
      <div className="border-t pt-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recommended Meditation
          </h4>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                Choose another <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {meditationsData.map((m) => (
                <DropdownMenuItem 
                  key={m.id} 
                  onClick={() => setSelectedMeditation(m)}
                  className="flex flex-col items-start gap-0.5"
                >
                  <span className="font-medium">{m.name}</span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1">{m.tagline}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h5 className="font-semibold">{selectedMeditation.name}</h5>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedMeditation.tagline}
              </p>
            </div>
          </div>
          <MeditationModal
            meditation={selectedMeditation}
            trigger={
              <Button className="shrink-0" variant="outline">
                Start Session
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
