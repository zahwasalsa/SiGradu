"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  recordKaprodiDecision,
  setFinalDecision,
  requestRevision,
} from "@/app/admin/yudisium/actions";
import type { ReviewDecision, ReviewMethod, UserRole } from "@/types/domain";

export function KaprodiDecisionForm({ applicationId }: { applicationId: string }) {
  const [decision, setDecision] = useState<ReviewDecision>("lolos");
  const [method, setMethod] = useState<ReviewMethod>("digital");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Keputusan Kaprodi</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Keputusan</Label>
            <Select
              items={[
                { value: "lolos", label: "Lolos" },
                { value: "tidak_lolos", label: "Tidak Lolos" },
              ]}
              value={decision}
              onValueChange={(v) => setDecision(v as ReviewDecision)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lolos">Lolos</SelectItem>
                <SelectItem value="tidak_lolos">Tidak Lolos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Metode Penilaian</Label>
            <Select
              items={[
                { value: "digital", label: "Digital (login sistem)" },
                { value: "manual", label: "Manual (di luar sistem)" },
              ]}
              value={method}
              onValueChange={(v) => setMethod(v as ReviewMethod)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="digital">Digital (login sistem)</SelectItem>
                <SelectItem value="manual">Manual (di luar sistem)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Catatan</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
        <div className="flex justify-end">
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await recordKaprodiDecision({ applicationId, decision, method, notes });
                if (result.error) toast.error(result.error);
                else {
                  toast.success("Keputusan Kaprodi tersimpan.");
                  router.refresh();
                }
              })
            }
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Simpan Keputusan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminFakultasDecisionForm({
  applicationId,
  studentId,
  currentStatus,
}: {
  applicationId: string;
  studentId: string;
  currentStatus: string;
}) {
  const [decision, setDecision] = useState<ReviewDecision>("lolos");
  const [method, setMethod] = useState<ReviewMethod>("digital");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Penetapan Status Final (Admin Fakultas)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Keputusan</Label>
            <Select
              items={[
                { value: "lolos", label: "Lolos Administrasi Yudisium" },
                { value: "tidak_lolos", label: "Tidak Lolos Yudisium" },
              ]}
              value={decision}
              onValueChange={(v) => setDecision(v as ReviewDecision)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lolos">Lolos Administrasi Yudisium</SelectItem>
                <SelectItem value="tidak_lolos">Tidak Lolos Yudisium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Metode</Label>
            <Select
              items={[
                { value: "digital", label: "Digital (login sistem)" },
                { value: "manual", label: "Manual (di luar sistem)" },
              ]}
              value={method}
              onValueChange={(v) => setMethod(v as ReviewMethod)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="digital">Digital (login sistem)</SelectItem>
                <SelectItem value="manual">Manual (di luar sistem)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Catatan</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            disabled={pending || !notes}
            onClick={() =>
              startTransition(async () => {
                const result = await requestRevision({ applicationId, studentId, notes, currentStatus });
                if (result.error) toast.error(result.error);
                else {
                  toast.success("Pengajuan dikembalikan untuk revisi.");
                  router.refresh();
                }
              })
            }
          >
            Minta Revisi
          </Button>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await setFinalDecision({
                  applicationId,
                  studentId,
                  decision,
                  method,
                  notes,
                  currentStatus,
                });
                if (result.error) toast.error(result.error);
                else {
                  toast.success("Status final tersimpan.");
                  router.refresh();
                }
              })
            }
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Tetapkan Status Final
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function DecisionPanel({
  role,
  applicationId,
  studentId,
  currentStatus,
}: {
  role: UserRole;
  applicationId: string;
  studentId: string;
  currentStatus: string;
}) {
  if (role === "kaprodi") return <KaprodiDecisionForm applicationId={applicationId} />;
  return (
    <AdminFakultasDecisionForm
      applicationId={applicationId}
      studentId={studentId}
      currentStatus={currentStatus}
    />
  );
}
