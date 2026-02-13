export type Analysis = {
    score: number;
    feedback: string;
};

export type JournalEntry = {
    id: string;
    createdAt: Date;
    content: string;
    analysis: Analysis | null;
};