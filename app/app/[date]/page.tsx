import {
  getJournal,
  createJournalWithEntry,
} from "@/app/actions/journal-actions";
import { JournalEditor } from "@/components/journal/journal-editor";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { getUserProfile } from "@/app/actions/profile";
import { getCurrentDateInTimezone } from "@/utils/date";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ date: string }>;
}

export default async function JournalDatePage({ params }: PageProps) {
  const { date } = await params;

  // 1. Basic format validation (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Invalid date format. Expected YYYY-MM-DD.
        </p>
      </div>
    );
  }

  // 2. Future Date Guard
  const profile = await getUserProfile();
  const timezone = profile.timezone || "UTC";
  const userToday = getCurrentDateInTimezone(timezone);

  if (date > userToday) {
    redirect(`/app/${userToday}`);
  }

  // 3. Render Logic
  // Parse date for display (force noon to avoid timezone shift issues when just displaying date)
  const dateObj = new Date(date + "T12:00:00");
  const dateDisplay = format(dateObj, "MMMM d, yyyy");

  const journalData = await getJournal(date);

  async function handleCreate() {
    "use server";
    await createJournalWithEntry(date);
    // revalidatePath is called inside the action
  }

  if (!journalData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 bg-background">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{dateDisplay}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Ready to capture your thoughts for{" "}
            {date === userToday ? "today" : "this day"}?
          </p>
        </div>

        <form action={handleCreate}>
          <Button size="lg" className="px-8 font-semibold text-lg h-12">
            Start Journal
          </Button>
        </form>
      </div>
    );
  }

  return <JournalEditor date={date} initialEntries={journalData.entries} />;
}
