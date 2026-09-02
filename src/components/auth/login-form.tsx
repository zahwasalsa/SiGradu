"use client";

import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { signInAction, resendConfirmationEmail, type SignInState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initialState: SignInState = { error: null };

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const [resendPending, startResendTransition] = useTransition();
  const [resent, setResent] = useState(false);

  function onResend() {
    if (!state.unconfirmedEmail) return;
    startResendTransition(async () => {
      const result = await resendConfirmationEmail(state.unconfirmedEmail!);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setResent(true);
      toast.success("Email konfirmasi baru sudah dikirim.");
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col gap-2">
            <span>{state.error}</span>
            {state.unconfirmedEmail ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                disabled={resendPending || resent}
                onClick={onResend}
              >
                {resendPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                {resent ? "Email konfirmasi terkirim" : "Kirim ulang email konfirmasi"}
              </Button>
            ) : null}
          </AlertDescription>
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </div>

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Masuk
      </Button>
    </form>
  );
}
