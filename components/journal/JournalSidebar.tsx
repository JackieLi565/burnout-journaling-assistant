import { JournalEntry } from "@/types/journal";

interface SidebarProps {
    entries: JournalEntry[];
    selectedId: string | "new";
    onSelect: (id: string) => void;
    onNew: () => void;
}

export default function JournalSidebar({ entries, selectedId, onSelect, onNew }: SidebarProps) {
    return (
        <aside className="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                <h2 className="font-bold text-lg text-gray-800 dark:text-gray-200">Your Journal</h2>
                <button
                    onClick={onNew}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-full transition-colors shadow-sm"
                >
                    + New
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {entries.length === 0 && (
                    <p className="text-center text-gray-400 text-sm mt-10">No entries yet.</p>
                )}

                {entries.map((entry) => (
                    <button
                        key={entry.id}
                        onClick={() => onSelect(entry.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                            selectedId === entry.id
                                ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 shadow-sm"
                                : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                    >
                        <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {new Date(entry.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                })}
              </span>
                            {entry.analysis && (
                                <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                                        entry.analysis.score > 70
                                            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                            : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                    }`}
                                >
                  Stress: {entry.analysis.score}
                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                            {entry.content}
                        </p>
                    </button>
                ))}
            </div>
        </aside>
    );
}