import { Suspense } from "react";
import { getHrvStats } from "@/app/actions/hrv";
import HrvChart from "@/components/statistics/HrvChart";
import { Skeleton } from "@/components/ui/skeleton";

async function HrvStatsSection() {
  const data = await getHrvStats();
  return <HrvChart data={data} />;
}

export default function StatisticsPage() {
  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Physiological Insights</h1>
        <p className="text-muted-foreground mt-2">
          Visualize your heart rate variability data over time to monitor recovery and stress levels.
        </p>
      </div>

      <div className="grid gap-6">
        <Suspense fallback={<Skeleton className="w-full h-[450px] rounded-xl" />}>
          <HrvStatsSection />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="p-6 rounded-xl border bg-card/50">
          <h3 className="font-semibold mb-2">How to read this chart</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Higher HRV (RMSSD/SDNN) values generally indicate better cardiovascular fitness and resilience to stress. 
            Significant drops in these metrics over several days may signal overtraining, high stress, or illness.
          </p>
        </div>
        <div className="p-6 rounded-xl border bg-card/50">
          <h3 className="font-semibold mb-2">Data Source</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            These metrics are calculated from the heart rate sensor data recorded during your daily check-ins 
            and processed via our physiological analysis engine.
          </p>
        </div>
      </div>
    </div>
  );
}