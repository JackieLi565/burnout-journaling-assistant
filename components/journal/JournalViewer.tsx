import { JournalEntry } from "@/types/journal";

interface ViewerProps {
    entry: JournalEntry;
    onBack: () => void;
    onDelete: (id: string) => void;
}

export default function JournalViewer({ entry, onBack, onDelete }: ViewerProps) {
    return (
        <div className="max-w-3xl mx-auto w-full p-8 md:p-12 h-full overflow-y-auto">
            {/* Navigation Header */}
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
                <button
                    onClick={onBack}
                    className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                >
                    ← Write new entry
                </button>
                <button
                    onClick={() => onDelete(entry.id)}
                    className="text-sm text-red-400 hover:text-red-600 transition-colors px-3 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                    Delete Entry
                </button>
            </div>

            {/* Date Header */}
            <div className="mb-8">
        <span className="text-sm font-semibold tracking-wider text-gray-400 uppercase">
          {new Date(entry.createdAt).toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
          })}
        </span>
                <h1 className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
                    Entry Analysis
                </h1>
            </div>

            {/* AI Analysis Card */}
            {entry.analysis && (
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-6 mb-8 flex flex-col md:flex-row gap-6 items-start shadow-sm">
                    <div className="flex-shrink-0 text-center min-w-[100px]">
                        <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                            {entry.analysis.score}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-gray-500 mt-1">
                            Stress Level
                        </div>
                    </div>
                    <div className="flex-1 border-l border-blue-200 dark:border-blue-800 pl-0 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0 mt-4 md:mt-0">
                        <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2 uppercase tracking-wide">
                            AI Insight
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            {entry.analysis.feedback}
                        </p>
                    </div>
                </div>
            )}

            {/* Content Body */}
            <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-lg leading-relaxed text-gray-800 dark:text-gray-200 font-serif">
                    {entry.content}
                </p>
            </div>
        </div>
    );
}