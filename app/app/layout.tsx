import { JournalSidebar } from "@/components/journal/journal-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getUserProfile } from "@/app/actions/profile";
import { getUserOnboardingProfile } from "@/app/actions/onboarding";
import { getCurrentDateInTimezone } from "@/utils/date";
import { AnalysisProvider } from "@/components/analysis-provider";
import { GeneralOnboardingDialog } from "@/components/onboarding/general-onboarding-dialog";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, onboarding] = await Promise.all([
    getUserProfile(),
    getUserOnboardingProfile(),
  ]);
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
      {!onboarding.generalOnboardingCompleted && (
        <GeneralOnboardingDialog isOpen={true} />
      )}
    </AnalysisProvider>
  );
}
