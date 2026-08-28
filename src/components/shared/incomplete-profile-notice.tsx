import Link from "next/link";
import { UserRoundCog } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown wherever a page needs `user.student` but it's null — instead of a
 * dead-end message, sends the student straight to the one place that can
 * actually fix it (CompleteProfileForm on /profile).
 */
export function IncompleteProfileNotice() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-6">
      <div className="flex items-center gap-2 text-sm font-medium">
        <UserRoundCog className="size-4 text-muted-foreground" />
        Profil akademik Anda belum lengkap
      </div>
      <p className="text-sm text-muted-foreground">
        Lengkapi NIM, Fakultas, Program Studi, dan Jenjang Anda terlebih dahulu di halaman Profil
        sebelum menggunakan fitur ini.
      </p>
      <Button size="sm" render={<Link href="/profile" />}>
        Lengkapi Profil Sekarang
      </Button>
    </div>
  );
}
