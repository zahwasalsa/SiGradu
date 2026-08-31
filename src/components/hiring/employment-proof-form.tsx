"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadEmploymentProof } from "@/app/(student)/hiring/actions";
import { EMPLOYMENT_PROOF_TYPES, EMPLOYMENT_PROOF_TYPE_LABELS } from "@/types/domain";

type State = { error: string | null };
const initialState: State = { error: null };

export function EmploymentProofForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(async (_prev, formData) => {
    return uploadEmploymentProof(formData);
  }, initialState);

  const formRef = useRef<HTMLFormElement>(null);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (state.error) {
      toast.error(state.error);
    } else {
      toast.success("Bukti kerja berhasil diunggah.");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="companyName">Nama Perusahaan/Instansi</Label>
          <Input id="companyName" name="companyName" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="businessField">Bidang Usaha</Label>
          <Input id="businessField" name="businessField" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="position">Jabatan</Label>
          <Input id="position" name="position" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="startDate">Tanggal Mulai Kerja</Label>
          <Input id="startDate" name="startDate" type="date" />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="proofType">Jenis Bukti</Label>
          <Select
            items={EMPLOYMENT_PROOF_TYPES.map((t) => ({ value: t, label: EMPLOYMENT_PROOF_TYPE_LABELS[t] }))}
            name="proofType"
            defaultValue="surat_keterangan_kerja"
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_PROOF_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {EMPLOYMENT_PROOF_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="file">Berkas Bukti</Label>
          <Input id="file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png" required />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Unggah Bukti Kerja
        </Button>
      </div>
    </form>
  );
}
