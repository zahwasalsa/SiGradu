import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { CompleteProfileForm } from "@/components/profile/complete-profile-form";
import { DEGREE_LEVEL_LABELS } from "@/types/domain";

export default async function StudentProfilePage() {
  const user = await requireUser();
  const supabase = await createClient();

  if (!user.student) {
    const [{ data: faculties }, { data: studyPrograms }] = await Promise.all([
      supabase.from("faculties").select("id, name").order("name"),
      supabase.from("study_programs").select("id, name, faculty_id").order("name"),
    ]);

    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Profil Saya"
          description="Profil akademik Anda belum tersedia — lengkapi sekali di bawah ini."
        />
        {!faculties || faculties.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Data fakultas belum tersedia. Silakan hubungi administrator.
          </p>
        ) : (
          <CompleteProfileForm faculties={faculties} studyPrograms={studyPrograms ?? []} />
        )}
      </div>
    );
  }

  const [{ data: faculty }, { data: studyProgram }] = await Promise.all([
    supabase.from("faculties").select("name").eq("id", user.student.facultyId).maybeSingle(),
    supabase.from("study_programs").select("name").eq("id", user.student.studyProgramId).maybeSingle(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Profil Saya"
        description="Data akademik hanya dapat diubah oleh Admin Fakultas."
      />
      <ProfileForm
        fullName={user.fullName}
        phoneNumber={user.phoneNumber}
        readOnlyFields={[
          { label: "Email", value: user.email },
          { label: "NIM", value: user.student.nim },
          { label: "Fakultas", value: faculty?.name ?? "-" },
          { label: "Program Studi", value: studyProgram?.name ?? "-" },
          { label: "Jenjang", value: DEGREE_LEVEL_LABELS[user.student.degreeLevel] },
        ]}
      />
      <ChangePasswordForm />
    </div>
  );
}
