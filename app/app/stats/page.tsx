// app/stats/page.tsx
import { getQuizStats } from "@/app/actions/stats";
import StatsChart from "./stats-chart"; // We will create this next

export default async function StatsPage() {
    const { data, error } = await getQuizStats();

    const avgScore =
        data.length > 0
            ? Math.round(data.reduce((acc, curr) => acc + curr.score, 0) / data.length)
            : 0;

    const latestSections = data.length > 0 ? data[data.length - 1].sections : null;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold">Your Wellness Insights</h1>

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Overall Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h3 className="text-sm font-medium text-gray-500">Total Check-ins</h3>
                        <p className="text-3xl font-bold mt-2">{data.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h3 className="text-sm font-medium text-gray-500">Avg. Burnout Score</h3>
                        <p className="text-3xl font-bold mt-2 text-blue-600">{avgScore}%</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h3 className="text-sm font-medium text-gray-500">Latest Score</h3>
                        <p className="text-3xl font-bold mt-2">
                            {data.length > 0 ? `${data[data.length - 1].score}%` : "-"}
                        </p>
                    </div>
                </div>

                {/* MBI Subscale Breakdown (latest check-in) */}
                {latestSections && (
                    <div>
                        <h2 className="text-lg font-semibold mb-3">Latest MBI Subscale Scores</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-6 rounded-xl shadow-sm border">
                                <h3 className="text-sm font-medium text-gray-500">Emotional Exhaustion</h3>
                                <p className="text-3xl font-bold mt-2 text-orange-500">
                                    {latestSections.emotionalExhaustion}%
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border">
                                <h3 className="text-sm font-medium text-gray-500">Depersonalization</h3>
                                <p className="text-3xl font-bold mt-2 text-red-500">
                                    {latestSections.depersonalization}%
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border">
                                <h3 className="text-sm font-medium text-gray-500">Reduced Personal Accomplishment</h3>
                                <p className="text-3xl font-bold mt-2 text-yellow-600">
                                    {latestSections.personalAccomplishment}%
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* The Graph */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-lg font-semibold mb-6">Burnout Trends Over Time</h2>
                    <div className="h-[400px] w-full">
                        {data.length > 0 ? (
                            <StatsChart data={data} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                Not enough data to display graph yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}