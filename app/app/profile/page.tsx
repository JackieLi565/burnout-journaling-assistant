import { getUserProfile } from "@/app/actions/profile";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const profile = await getUserProfile();

  return (
    <div className="flex-1 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto py-10 px-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">
          Account Profile
        </h1>
        <ProfileForm initialData={profile} />
      </div>
    </div>
  );
}
