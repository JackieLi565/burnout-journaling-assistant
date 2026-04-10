import { Suspense } from "react";
import { getHrvStats } from "@/app/actions/hrv";
import { getJournalBriSummary } from "@/app/actions/journal-bri";
import { getQuizStats } from "@/app/actions/quiz-stats";
import HrvChart from "@/components/statistics/HrvChart";
import BriChart from "@/components/statistics/BriChart";
import QuizChart from "@/components/statistics/QuizChart";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyzeAllButton } from "@/components/statistics/analyze-all-button";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import MeditationModal from "@/components/misc/meditation-modal";
import meditationsData from "@/lib/meditations.json";

async function QuizSection() {
  const { points, latestScore } = await getQuizStats();

  if (points.length === 0) {
    return (
      <div className="p-6 rounded-xl border bg-card/50">
        <h3 className="text-lg font-semibold mb-2">Daily Quiz</h3>
        <p className="text-sm text-muted-foreground">
          No quiz results yet. Complete a Daily Check-in to see your scores
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl border bg-card/50 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Daily Quiz</h3>
          <p className="text-sm text-muted-foreground">
            Wellbeing score from each check-in (0–100, higher = less burnout
            indicators).
          </p>
        </div>
        {latestScore !== null && (
          <div className="shrink-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Latest score
            </p>
            <p className="text-2xl font-semibold">{latestScore}</p>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <QuizChart points={points} />
      </div>
    </div>
  );
}

async function HrvStatsSection() {
  const { data, error } = await getHrvStats();
  return (
    <>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}
      <HrvChart data={data} />
    </>
  );
}

async function JournalBriSection() {
  const [{ points, latestBri, latestCumulativeBri }, { points: quizPoints }] =
    await Promise.all([getJournalBriSummary(), getQuizStats()]);

  if (points.length === 0) {
    return (
      <div className="p-6 rounded-xl border bg-card/50">
        <h3 className="text-lg font-semibold mb-2">Journal Burnout Risk</h3>
        <p className="text-sm text-muted-foreground">
          No analyzed journals yet. Use the &quot;Analyze All Journals&quot;
          button above to generate scores.
        </p>
      </div>
    );
  }

  // Determine the lowest wellbeing dimension from the latest quiz
  let selectedMeditation = meditationsData.find((m) => m.id === "DEFAULT")!;

  if (quizPoints.length > 0) {
    const latest = quizPoints[quizPoints.length - 1];
    const scores = [
      { id: "EE", score: latest.eeScore },
      { id: "DP", score: latest.dpScore },
      { id: "PA", score: latest.paScore },
    ];

    // Pick the one with the lowest wellbeing score (highest burnout indicator)
    const lowest = scores.reduce((prev, curr) =>
      curr.score < prev.score ? curr : prev
    );

    // Only override if the score is actually low (e.g., < 80)
    if (lowest.score < 80) {
      const match = meditationsData.find((m) => m.id === lowest.id);
      if (match) selectedMeditation = match;
    }
  }

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
        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Recommended Meditation
        </h4>
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

export default function StatisticsPage() {
  return (
    <div className="w-full overflow-y-auto">
      <div className="p-8 space-y-8 max-w-5xl mx-auto ">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
            <p className="text-muted-foreground mt-2">
              Explore how your physiology and journaling patterns relate to
              burnout risk.
            </p>
          </div>
          <AnalyzeAllButton />
        </div>

        <div className="grid gap-6">
          <Suspense
            fallback={<Skeleton className="w-full h-[220px] rounded-xl" />}
          >
            <JournalBriSection />
          </Suspense>
        </div>

        <div className="grid gap-6">
          <Suspense
            fallback={<Skeleton className="w-full h-[220px] rounded-xl" />}
          >
            <QuizSection />
          </Suspense>
        </div>

        <div className="grid gap-6">
          <Suspense
            fallback={<Skeleton className="w-full h-[450px] rounded-xl" />}
          >
            <HrvStatsSection />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
