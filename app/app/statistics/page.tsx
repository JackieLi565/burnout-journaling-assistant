import { Suspense } from "react";
import { getHrvStats } from "@/app/actions/hrv";
import { getJournalBriSummary } from "@/app/actions/journal-bri";
import HrvChart from "@/components/statistics/HrvChart";
import BriChart from "@/components/statistics/BriChart";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyzeAllButton } from "@/components/statistics/analyze-all-button";

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
  const { points, latestBri, latestCumulativeBri } =
    await getJournalBriSummary();

  if (points.length === 0) {
    return (
      <div className="p-6 rounded-xl border bg-card/50">
        <h3 className="text-lg font-semibold mb-2">Journal Burnout Risk</h3>
        <p className="text-sm text-muted-foreground">
          No analyzed journals yet. Use the &quot;Analyze All Journals&quot; button above
          to generate scores.
        </p>
      </div>
    );
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
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Latest BRI</p>
            <p className="text-2xl font-semibold">
              {latestBri !== null ? Math.round(latestBri) : "–"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Latest cumulative BRI</p>
            <p className="text-2xl font-semibold">
              {latestCumulativeBri !== null ? Math.round(latestCumulativeBri) : "–"}
            </p>
          </div>
        </div>
      </div>

      {/* Chart + List side by side */}
      <div className="border-t pt-4 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
        {/* Chart */}
        <BriChart points={points} />

        {/* Score list */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">All scores</p>
          <div className="flex flex-col gap-1 max-h-[280px] overflow-y-auto text-sm">
            {points
              .slice()
              .reverse()
              .map((p) => (
                <div
                  key={p.date}
                  className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-muted/60"
                >
                  <span className="font-mono text-xs">{p.date}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs">
                      BRI:{" "}
                      {p.bri !== null ? (
                        Math.round(p.bri)
                      ) : (
                        <span className="text-muted-foreground">n/a</span>
                      )}
                    </span>
                    <span className="text-xs">
                      Cumul:{" "}
                      {p.cumulativeBri !== null ? (
                        Math.round(p.cumulativeBri)
                      ) : (
                        <span className="text-muted-foreground">n/a</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
          </div>
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
            {/* This section shows journal BRI history and the latest cumulative BRI */}
            <JournalBriSection />
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
