"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProfile } from "@/lib/actions/profile";

export function ProfileForm({
  fullName: initialFullName,
  phoneNumber: initialPhoneNumber,
  readOnlyFields,
}: {
  fullName: string;
  phoneNumber: string | null;
  readOnlyFields: { label: string; value: string }[];
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateProfile({ fullName, phoneNumber });
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("Profil berhasil diperbarui");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Akun</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="phoneNumber">Nomor HP</Label>
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                autoComplete="tel"
                placeholder="08xxxxxxxxxx"
              />
            </div>

            {readOnlyFields.map((field) => (
              <div key={field.label} className="flex flex-col gap-2">
                <Label>{field.label}</Label>
                <Input value={field.value} disabled readOnly />
              </div>
            ))}
          </div>

          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Simpan Perubahan
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
