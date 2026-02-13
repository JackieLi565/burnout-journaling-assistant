import { JournalSidebar } from "@/components/journal/journal-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getUserProfile } from "@/app/actions/profile";
import { getCurrentDateInTimezone } from "@/utils/date";
import { AnalysisProvider } from "@/components/analysis-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUserProfile();
  const today = getCurrentDateInTimezone(profile.timezone);

  return (
    <AnalysisProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden">
          <JournalSidebar today={today} />
          <main className="flex-1 overflow-hidden h-full relative flex flex-col w-full">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </AnalysisProvider>
  );
}
