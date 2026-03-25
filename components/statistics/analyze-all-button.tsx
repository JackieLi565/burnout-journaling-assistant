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
      setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setIsLoading(false);
    }
  }

  let statusText: string | null = null;
  if (result) {
    const { analyzed, errors, skipped } = result;
    if (analyzed === 0 && errors === 0 && skipped === 0) {
      statusText = "All journals already analyzed.";
    } else if (analyzed === 0 && errors > 0) {
      statusText = `${errors} journal${errors !== 1 ? "s" : ""} failed. Is the engine running?`;
    } else if (analyzed === 0 && skipped > 0) {
      statusText = `${skipped} journal${skipped !== 1 ? "s" : ""} skipped (no content).`;
    } else {
      statusText = `${analyzed} journal${analyzed !== 1 ? "s" : ""} analyzed`;
      if (errors > 0) statusText += `, ${errors} failed`;
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
