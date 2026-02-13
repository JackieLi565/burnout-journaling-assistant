"use client";

import { useState } from "react";
import { JournalEntry, Analysis } from "@/types/journal";
import JournalSidebar from "./JournalSidebar";
import JournalEditor from "./JournalEditor";
import JournalViewer from "./JournalViewer";

interface InterfaceProps {
    initialEntries: JournalEntry[];
}

export default function JournalInterface({ initialEntries }: InterfaceProps) {
    const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);
    const [selectedEntryId, setSelectedEntryId] = useState<string | "new">("new");

    const handleSaveNewEntry = (content: string, analysis: Analysis) => {
        const newEntry: JournalEntry = {
            id: Date.now().toString(),
            createdAt: new Date(),
            content,
            analysis,
        };

        setEntries((prev) => [newEntry, ...prev]);
        setSelectedEntryId(newEntry.id);
    };

    const handleDelete = (id: string) => {
        setEntries((prev) => prev.filter((e) => e.id !== id));
        if (selectedEntryId === id) setSelectedEntryId("new");
    };

    const selectedEntry = entries.find((e) => e.id === selectedEntryId);

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] bg-gray-50 dark:bg-black overflow-hidden border-t border-gray-200 dark:border-gray-800">
            <JournalSidebar
                entries={entries}
                selectedId={selectedEntryId}
                onSelect={setSelectedEntryId}
                onNew={() => setSelectedEntryId("new")}
            />

            <main className="flex-1 flex flex-col overflow-hidden relative bg-white dark:bg-black">
                {selectedEntryId === "new" ? (
                    <JournalEditor onSave={handleSaveNewEntry} />
                ) : (
                    selectedEntry && (
                        <JournalViewer
                            entry={selectedEntry}
                            onBack={() => setSelectedEntryId("new")}
                            onDelete={handleDelete}
                        />
                    )
                )}
            </main>
        </div>
    );
}