"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { analyzeAllUnanalyzedJournals } from "@/app/actions/journal";

export function AnalyzeAllButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    analyzed: number;
    skipped: number;
    errors: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const r = await analyzeAllUnanalyzedJournals();
      setResult(r);
    } catch (e) {
      setError("Analysis failed. Is the engine running?");
    } finally {
      setIsLoading(false);
    }
  }

  let statusText: string | null = null;
  if (result) {
    if (result.analyzed === 0) {
      statusText = "All journals already analyzed.";
    } else {
      statusText = `${result.analyzed} journal${result.analyzed !== 1 ? "s" : ""} analyzed`;
      if (result.errors > 0) statusText += `, ${result.errors} failed`;
      statusText += ".";
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleClick}
        disabled={isLoading}
        variant="outline"
        size="sm"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
        {isLoading ? "Analyzing..." : "Analyze All Journals"}
      </Button>
      {statusText && (
        <p className="text-sm text-muted-foreground">{statusText}</p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
