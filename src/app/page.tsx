import Link from "next/link";
import Image from "next/image";

export default function Home() {
    return (
        <main className="flex flex-col items-center justify-center flex-1 px-6 text-center max-w-5xl mx-auto py-20">
            <div className="mb-8 relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 to-teal-400 opacity-20 blur-xl"></div>
                <Image
                    className=""
                    src="/TMU-rgb.svg" // Keeping existing asset usage
                    alt="Logo"
                    width={270}
                    height={56}
                    priority
                />
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
                AI-Assisted Burnout Journaling
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-10 leading-relaxed">
                Detect early signs of burnout through intelligent sentiment analysis.
                Track your emotional health, get personalized insights, and recover your mind.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Link
                    href="/login"
                    className="rounded-full bg-foreground text-background px-8 py-3.5 font-medium hover:opacity-90 transition-opacity"
                >
                    Start Journaling
                </Link>
                <Link
                    href="/quiz"
                    className="rounded-full border border-gray-200 dark:border-gray-800 px-8 py-3.5 font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                    Take Assessment
                </Link>
            </div>

            <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left w-full">
                <FeatureCard
                    title="Daily Check-ins"
                    desc="Quick journaling prompts designed to unpack your work day stress."
                />
                <FeatureCard
                    title="AI Analysis"
                    desc="Real-time sentiment scoring to detect exhaustion patterns early."
                />
                <FeatureCard
                    title="Clinical Scales"
                    desc="Assessments based on standard inventories like the MBI."
                />
            </div>
        </main>
    );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
            <h3 className="font-semibold text-lg mb-2">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
        </div>
    );
}