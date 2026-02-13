"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  User,
  BarChart2,
  FileText,
  AlertCircle,
  PenSquare,
  MessageSquare,
  CircleHelp,
  LogOut,
  Settings,
} from "lucide-react";
import { useJournals, Journal } from "@/hooks/use-journals";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface JournalSidebarProps {
  today: string;
}

// Main Sidebar Component
export function JournalSidebar({ today }: JournalSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Expanded: Title and Trigger */}
            <div className="flex items-center justify-between group-data-[collapsible=icon]:hidden">
              <SidebarMenuButton
                size="lg"
                asChild
                className="w-auto hover:bg-transparent"
              >
                <span className="text-xl font-semibold">Capstone</span>
              </SidebarMenuButton>
              <SidebarTrigger className="h-8 w-8" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation Group */}
        <SidebarGroupContent>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Profile">
                <Link href="/app/profile">
                  <User className="size-4" />
                  <span>Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Statistics">
                <Link href="/app/statistics">
                  <BarChart2 className="size-4" />
                  <span>Statistics</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>

        <JournalListGroup today={today} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Popover>
              <PopoverTrigger asChild>
                <SidebarMenuButton tooltip="Settings & help">
                  <Settings className="size-4" />
                  <span>Settings & help</span>
                </SidebarMenuButton>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-56 p-1"
              >
                <div className="flex flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs h-8"
                  >
                    <MessageSquare className="size-3.5 mr-2" />
                    Send Feedback
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs h-8"
                  >
                    <CircleHelp className="size-3.5 mr-2" />
                    Help
                  </Button>
                  <Separator className="my-1" />
                  <a href="/api/logout" className="w-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs text-destructive hover:text-destructive h-8"
                    >
                      <LogOut className="size-3.5 mr-2" />
                      Log out
                    </Button>
                  </a>
                </div>
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

// Extracted for cleaner logic
function JournalListGroup({ today }: { today: string }) {
  const { journals, loading, loadingMore, hasMore, error, loadMore, refresh } =
    useJournals();
  const pathname = usePathname();

  // Observer for infinite scroll
  const observerTarget = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadMore, loading, loadingMore]);

  // Filter out today's journal from the list to avoid duplication
  const filteredJournals = journals.filter((journal) => journal.id !== today);

  if (error) {
    return (
      <div className="p-4 group-data-[collapsible=icon]:hidden">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={() => refresh()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Your Journals</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {/* Today's Journal Link */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === `/app/${today}`}
              tooltip="Today's Journal"
              className="text-primary font-medium"
            >
              <Link href={`/app/${today}`}>
                <PenSquare className="size-4" />
                <div className="flex flex-col items-start gap-1 group-data-[collapsible=icon]:hidden">
                  <span>Today's Journal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarSeparator className="my-2" />

          {loading && journals.length === 0 ? (
            <JournalSkeleton />
          ) : (
            <>
              {filteredJournals.map((journal: Journal) => {
                const isActive =
                  pathname === `/app/journal/${journal.id}` ||
                  pathname === `/app/${journal.id}`;
                return (
                  <SidebarMenuItem key={journal.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={format(parseISO(journal.id), "MMMM d, yyyy")}
                    >
                      <Link href={`/app/${journal.id}`}>
                        <FileText className="size-4" />
                        <div className="flex flex-col items-start gap-1 group-data-[collapsible=icon]:hidden">
                          <span className="font-medium">
                            {format(parseISO(journal.id), "MMMM d, yyyy")}
                          </span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {/* Loader for next page */}
              {loadingMore && (
                <div className="p-2 space-y-2 group-data-[collapsible=icon]:hidden">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              )}

              {/* Infinite Scroll Target */}
              {/* Only show if we have more or are loading */}
              <div ref={observerTarget} className="h-4 w-full" />

              {!loading && filteredJournals.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
                  No past journals found.
                </div>
              )}
            </>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function JournalSkeleton() {
  return (
    <div className="space-y-2 p-2 group-data-[collapsible=icon]:hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full rounded-md" />
      ))}
    </div>
  );
}
