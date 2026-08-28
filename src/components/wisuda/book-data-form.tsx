"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadBookData } from "@/app/(student)/wisuda/actions";
import type { Tables } from "@/types/database";

type State = { error: string | null };
const initialState: State = { error: null };

export function BookDataForm({
  defaultFullName,
  defaultDegree,
  existing,
}: {
  defaultFullName: string;
  defaultDegree: string;
  existing: Tables<"graduation_book_data"> | null;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(async (_prev, formData) => {
    return uploadBookData(formData);
  }, initialState);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="printFullName">Nama Lengkap untuk Cetak</Label>
          <Input
            id="printFullName"
            name="printFullName"
            defaultValue={existing?.print_full_name ?? defaultFullName}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="printDegree">Gelar untuk Cetak</Label>
          <Input
            id="printDegree"
            name="printDegree"
            defaultValue={existing?.print_degree ?? defaultDegree}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="capGownSize">Ukuran Toga/Topi</Label>
          <Input id="capGownSize" name="capGownSize" defaultValue={existing?.cap_gown_size ?? ""} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="quoteText">Kutipan/Quote Wisuda (opsional)</Label>
          <Textarea id="quoteText" name="quoteText" rows={2} defaultValue={existing?.quote_text ?? ""} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="file">Foto Formal</Label>
          <Input id="file" name="file" type="file" accept=".jpg,.jpeg,.png" required />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Unggah Data Buku Wisuda
        </Button>
      </div>
    </form>
  );
}
