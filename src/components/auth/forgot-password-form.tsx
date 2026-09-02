"use client";

import { useActionState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { requestPasswordReset, type ForgotPasswordState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initialState: ForgotPasswordState = { error: null, success: false };

export function ForgotPasswordForm({ expired }: { expired: boolean }) {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <MailCheck className="size-5" />
        </div>
        <p className="text-sm">
          Jika email tersebut terdaftar di Sigradu, kami sudah mengirim tautan untuk membuat
          password baru. Silakan cek kotak masuk (dan folder spam) email Anda.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {expired ? (
        <Alert variant="destructive">
          <AlertDescription>
            Tautan reset password sudah kedaluwarsa atau tidak valid. Silakan minta tautan baru.
          </AlertDescription>
        </Alert>
      ) : null}

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="nama@student.utdi.ac.id"
          required
        />
      </div>

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Kirim Tautan Reset
      </Button>
    </form>
  );
}
