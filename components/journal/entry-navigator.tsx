"use client";

import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/utils/cn";
import { Menu, Plus, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Entry } from "@/app/actions/journal-actions";

interface EntryNavigatorProps {
  entries: Entry[];
  activeEntryId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export function EntryNavigator({
  entries,
  activeEntryId,
  onSelect,
  onAdd,
  onDelete,
}: EntryNavigatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const activeEntry = entries.find((e) => e.id === activeEntryId);

  const handleDeleteConfirm = () => {
    if (entryToDelete) {
      onDelete(entryToDelete);
      setEntryToDelete(null);
    }
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs font-medium gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-none"
          >
            <span>
              {activeEntry
                ? `Entry ${format(activeEntry.createdAt, "h:mm a")}`
                : "Select Entry"}
            </span>
            <Menu className="h-3 w-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="center">
          <div className="flex items-center justify-between space-y-0 pb-2 px-3 pt-3 border-b border-border/50">
            <h4 className="font-medium leading-none flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Document Entries
            </h4>
          </div>

          <div className="max-h-[300px] overflow-y-auto py-2 space-y-1">
            {entries.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No entries yet.
              </div>
            )}

            {entries.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "group flex items-center justify-between px-3 py-2 mx-1 rounded-sm text-sm cursor-pointer transition-colors",
                  activeEntryId === entry.id
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted/50",
                )}
                onClick={() => {
                  onSelect(entry.id);
                  setIsOpen(false);
                }}
              >
                <span>Entry {format(entry.createdAt, "h:mm a")}</span>

                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
                    activeEntryId === entry.id
                      ? "text-accent-foreground"
                      : "text-muted-foreground",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEntryToDelete(entry.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            ))}
          </div>

          <div className="p-2 border-t border-border/50">
            {(() => {
              const mostRecentTime =
                entries.length > 0
                  ? Math.max(...entries.map((e) => e.createdAt))
                  : 0;
              const isAddDisabled = Date.now() - mostRecentTime < 60000;

              return (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!isAddDisabled) {
                      onAdd();
                      setIsOpen(false);
                    }
                  }}
                  disabled={isAddDisabled}
                  className="w-full h-8"
                  title="New Time Entry"
                >
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  <span>Add New Entry</span>
                </Button>
              );
            })()}
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog
        open={!!entryToDelete}
        onOpenChange={(open) => !open && setEntryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEntryToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
