import JournalInterface from "@/components/journal/JournalInterface";
import { JournalEntry } from "@/types/journal";

// This simulates a database fetch. 
// In the future, you will replace this with: const data = await db.journal.findMany(...)
async function getJournalEntries(): Promise<JournalEntry[]> {
    // Simulating network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return [
        {
            id: "1",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
            content: "Today was really hard. I felt like I couldn't catch up with the tickets. My manager asked for an update and I froze.",
            analysis: { score: 78, feedback: "High stress markers detected. Focus on recovery." },
        },
        {
            id: "2",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
            content: "Had a breakthrough with the new feature. Felt good to ship it. I think I am getting the hang of this codebase.",
            analysis: { score: 45, feedback: "Positive sentiment detected. Keep this momentum." },
        },
    ];
}

export default async function JournalPage() {
    const data = await getJournalEntries();

    return (
        <div className="h-screen flex flex-col">
            {/* Optional: Add a Global Nav Bar here if you have one */}
            <JournalInterface initialEntries={data} />
        </div>
    );
}