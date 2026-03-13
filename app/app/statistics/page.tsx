import { Suspense } from "react";
import { getHrvStats } from "@/app/actions/hrv";
import { getJournalBriSummary } from "@/app/actions/journal-bri";
import HrvChart from "@/components/statistics/HrvChart";
import { Skeleton } from "@/components/ui/skeleton";

async function HrvStatsSection() {
  const data = await getHrvStats();
  return <HrvChart data={data} />;
}

async function JournalBriSection() {
  const { points, latestBri, latestCumulativeBri } = await getJournalBriSummary();

  if (points.length === 0) {
    return (
      <div className="p-6 rounded-xl border bg-card/50">
        <h3 className="text-lg font-semibold mb-2">Journal Burnout Risk</h3>
        <p className="text-sm text-muted-foreground">
          No analyzed journals yet. Run an analysis from the journal editor to see your burnout risk over time.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl border bg-card/50 space-y-4">
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Journal Burnout Risk</h3>
          <p className="text-sm text-muted-foreground">
            These scores come from analyzing your journal entries with the burnout engine.
          </p>
        </div>
        <div className="flex gap-6">
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
              {latestCumulativeBri !== null ? Math.round(latestCumulativeBri) : "–"}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t pt-4 mt-2 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Recent journal scores
        </p>
        <div className="flex flex-col gap-1 max-h-56 overflow-y-auto text-sm">
          {points
            .slice()
            .reverse()
            .map((p) => (
              <div
                key={p.date}
                className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-muted/60"
              >
                <span className="font-mono text-xs">{p.date}</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs">
                    BRI:{" "}
                    {p.bri !== null ? Math.round(p.bri) : <span className="text-muted-foreground">n/a</span>}
                  </span>
                  <span className="text-xs">
                    Cum:{" "}
                    {p.cumulativeBri !== null
                      ? Math.round(p.cumulativeBri)
                      : <span className="text-muted-foreground">n/a</span>}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function StatisticsPage() {
  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
        <p className="text-muted-foreground mt-2">
          Explore how your physiology and journaling patterns relate to burnout risk.
        </p>
      </div>

      <div className="grid gap-6">
        <Suspense fallback={<Skeleton className="w-full h-[450px] rounded-xl" />}>
          <HrvStatsSection />
        </Suspense>
      </div>

      <div className="grid gap-6">
        <Suspense fallback={<Skeleton className="w-full h-[220px] rounded-xl" />}>
          {/* This section shows journal BRI history and the latest cumulative BRI */}
          <JournalBriSection />
        </Suspense>
      </div>
    </div>
  );
}
