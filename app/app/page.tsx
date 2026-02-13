import { redirect } from "next/navigation";
import { getUserProfile } from "@/app/actions/profile";
import { getCurrentDateInTimezone } from "@/utils/date";

export default async function JournalIndexPage() {
  const profile = await getUserProfile();
  const timezone = profile.timezone || "UTC";
  const userToday = getCurrentDateInTimezone(timezone);
  redirect(`/app/${userToday}`);
}
