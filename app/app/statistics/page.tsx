"use client";

import { useAnalysis } from "@/components/analysis-provider";

export default function Page() {
  const { analysisResult } = useAnalysis();

  if (!analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>No analysis data available.</p>
        <p className="text-sm">
          Go to the journal page and click "Analyze" on an entry.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4">Analysis Result</h1>
      <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap">
        {JSON.stringify(analysisResult, null, 2)}
      </pre>
    </div>
  );
}