"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addJobApplication } from "@/app/(student)/hiring/actions";

export function AddExternalApplicationForm() {
  const [name, setName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor="vacancyName">Nama Lowongan (di luar sistem)</Label>
        <Input id="vacancyName" value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Staff IT - PT Contoh" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="appliedAt">Tanggal Melamar</Label>
        <Input id="appliedAt" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <Button
        disabled={pending || !name}
        onClick={() =>
          startTransition(async () => {
            const result = await addJobApplication({
              vacancyId: null,
              vacancyNameExternal: name,
              appliedAt: date,
            });
            if (result.error) toast.error(result.error);
            else {
              toast.success("Lamaran ditambahkan.");
              setName("");
              router.refresh();
            }
          })
        }
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Tambah
      </Button>
    </div>
  );
}
