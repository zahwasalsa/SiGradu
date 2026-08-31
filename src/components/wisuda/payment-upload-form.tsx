"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadPayment } from "@/app/(student)/wisuda/actions";

type State = { error: string | null };
const initialState: State = { error: null };

export function PaymentUploadForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(async (_prev, formData) => {
    return uploadPayment(formData);
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
      toast.success("Bukti pembayaran berhasil diunggah.");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Nominal Bayar (Rp)</Label>
          <Input id="amount" name="amount" type="number" min={0} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="paymentDate">Tanggal Bayar</Label>
          <Input id="paymentDate" name="paymentDate" type="date" required />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="paymentMethod">Metode Bayar / Bank Tujuan</Label>
          <Input id="paymentMethod" name="paymentMethod" placeholder="mis. Transfer BCA" />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="file">Bukti Transfer/Struk Pembayaran</Label>
          <Input id="file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png" required />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Unggah Bukti Bayar
        </Button>
      </div>
    </form>
  );
}
