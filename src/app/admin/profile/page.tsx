import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { ROLE_LABELS } from "@/types/domain";

export default async function AdminProfilePage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Profil Saya" />
      <ProfileForm
        fullName={user.fullName}
        phoneNumber={user.phoneNumber}
        readOnlyFields={[
          { label: "Email", value: user.email },
          { label: "Role", value: ROLE_LABELS[user.role] },
        ]}
      />
      <ChangePasswordForm />
    </div>
  );
}
