"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { changePassword } from "@/lib/actions/profile";
import { signOutAction } from "@/lib/actions/auth";

export function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await changePassword({ newPassword, confirmPassword });
      if (result.error) {
        setError(result.error);
        return;
      }
      // Sign out of the temporary recovery session and send the user back to
      // /login to authenticate fresh with their new password.
      await signOutAction();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">Password Baru</Label>
        <PasswordInput
          id="newPassword"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Simpan Password Baru
      </Button>
    </form>
  );
}
