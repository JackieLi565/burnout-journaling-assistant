"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { format, parseISO } from "date-fns";
import { Edit2, Eye, Settings2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  createEntry,
  saveEntry,
  deleteEntry,
  Entry,
} from "@/app/actions/journal-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EntryNavigator } from "./entry-navigator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useAnalysis } from "@/components/analysis-provider";
import { useRouter } from "next/navigation";

interface JournalEditorProps {
  date: string;
  initialEntries: Entry[];
}

export function JournalEditor({ date, initialEntries }: JournalEditorProps) {
  const { state, isMobile } = useSidebar();
  const { setAnalysisResult, setIsAnalyzing } = useAnalysis();
  const router = useRouter();

  // State
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(
    initialEntries.length > 0 ? initialEntries[0].id : null,
  );

  // Content state for the ACTIVE entry
  const [content, setContent] = useState<string>(
    initialEntries.length > 0 ? initialEntries[0].content : "",
  );

  const [lastSavedContent, setLastSavedContent] = useState<string>(
    initialEntries.length > 0 ? initialEntries[0].content : "",
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(true);

  // Debounce content to trigger auto-save
  const debouncedContent = useDebounce(content, 1000); // 1s debounce

  useEffect(() => {
    const save = async () => {
      if (!activeEntryId) return;
      if (content !== debouncedContent) return;

      if (debouncedContent === lastSavedContent) return;

      setIsSaving(true);
      try {
        await saveEntry(date, activeEntryId, debouncedContent);
        setLastSavedContent(debouncedContent);

        // Update local entries list to reflect changes
        setEntries((prev) =>
          prev.map((e) =>
            e.id === activeEntryId
              ? { ...e, content: debouncedContent, updatedAt: Date.now() }
              : e,
          ),
        );
      } catch (error) {
        console.error("Failed to save:", error);
      } finally {
        setIsSaving(false);
      }
    };

    save();
  }, [debouncedContent, activeEntryId, date, lastSavedContent, content]);

  // Global Keyboard Shortcut for Toggling Edit Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        setIsPreview((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handlers

  const handleSelectEntry = async (id: string) => {
    if (id === activeEntryId) {
      setIsPreview(true);
      return;
    }

    if (activeEntryId && content !== lastSavedContent) {
      setIsSaving(true);
      saveEntry(date, activeEntryId, content).then(() => {
        setIsSaving(false);
      });
      setEntries((prev) =>
        prev.map((e) => (e.id === activeEntryId ? { ...e, content } : e)),
      );
    }

    const target = entries.find((e) => e.id === id);
    if (target) {
      setActiveEntryId(id);
      setContent(target.content);
      setLastSavedContent(target.content);
      setIsPreview(true);
    }
  };

  const handleAddEntry = async () => {
    if (activeEntryId && content !== lastSavedContent) {
      setEntries((prev) =>
        prev.map((e) => (e.id === activeEntryId ? { ...e, content } : e)),
      );
      saveEntry(date, activeEntryId, content);
    }

    setIsSaving(true);
    try {
      const newEntry = await createEntry(date);
      const entryObj: Entry = {
        id: newEntry.id,
        content: "",
        createdAt: newEntry.createdAt,
        updatedAt: newEntry.updatedAt,
      };

      setEntries((prev) => [...prev, entryObj]);
      setActiveEntryId(newEntry.id);
      setContent("");
      setLastSavedContent("");
      setIsPreview(false);
    } catch (e) {
      console.error("Failed to add entry", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    const prevEntries = [...entries];
    const newEntries = entries.filter((e) => e.id !== id);
    setEntries(newEntries);

    if (activeEntryId === id) {
      if (newEntries.length > 0) {
        const last = newEntries[newEntries.length - 1];
        setActiveEntryId(last.id);
        setContent(last.content);
        setLastSavedContent(last.content);
      } else {
        setActiveEntryId(null);
        setContent("");
        setLastSavedContent("");
      }
    }

    try {
      await deleteEntry(date, id);
    } catch (e) {
      console.error("Failed to delete", e);
      setEntries(prevEntries);
    }
  };

  const activeEntry = entries.find((e) => e.id === activeEntryId);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      {/* Editor Header */}
      <div className="h-14 shrink-0 border-b flex items-center justify-between px-4 bg-card/10 relative">
        {/* Left: Date */}
        <div className="flex items-center">
          {(state === "collapsed" || isMobile) && (
            <SidebarTrigger className="mr-2" />
          )}
          <h2 className="text-lg font-semibold tracking-tight">
            {format(parseISO(date), "MMMM d, yyyy")}
          </h2>
        </div>

        {/* Center: Entry Navigator */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <EntryNavigator
            entries={entries}
            activeEntryId={activeEntryId}
            onSelect={handleSelectEntry}
            onAdd={handleAddEntry}
            onDelete={handleDeleteEntry}
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {activeEntry && (
            <span className="text-xs text-muted-foreground mr-2 hidden sm:inline-block">
              {isSaving ? "Saving..." : "Saved"}
            </span>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPreview(!isPreview)}
                  title="" // Removed native title to rely on Tooltip
                >
                  {isPreview ? (
                    <Edit2 className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Edit (Cmd+J)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" title="Settings">
                <Settings2 className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    Journal entry options
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    setIsAnalyzing(true);
                    try {
                      const response = await fetch(
                        "http://localhost:8000/journals/analyze",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ text: content }),
                        },
                      );
                      const data = await response.json();
                      setAnalysisResult(data);
                      router.push("/app/statistics");
                    } catch (error) {
                      console.error("Analysis failed:", error);
                    } finally {
                      setIsAnalyzing(false);
                    }
                  }}
                >
                  Analyze
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {activeEntryId ? (
          isPreview ? (
            content.trim() === "" ? (
              <div
                className="flex flex-col items-center justify-center h-full text-muted-foreground px-4 cursor-pointer"
                onDoubleClick={() => setIsPreview(false)}
              >
                <p>This entry is empty. Double click to edit.</p>
              </div>
            ) : (
              <div
                className="flex-1 w-full overflow-y-auto scrollbar-gutter-stable cursor-text"
                onDoubleClick={() => setIsPreview(false)}
              >
                <div className="max-w-4xl mx-auto p-8 prose dark:prose-invert min-h-full">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              </div>
            )
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full resize-none p-8 text-lg leading-relaxed bg-transparent border-0 focus-visible:ring-0 rounded-none font-mono px-8 md:px-[max(2rem,calc((100%-56rem)/2))] scrollbar-gutter-stable"
              placeholder="Start writing..."
              spellCheck={false}
              autoFocus // Added autofocus for better UX when switching
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>No entry selected.</p>
            <Button variant="link" onClick={handleAddEntry}>
              Create one?
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
