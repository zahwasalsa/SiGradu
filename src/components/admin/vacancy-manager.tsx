"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { createVacancy, setVacancyActive } from "@/app/admin/settings/actions";

type Vacancy = {
  id: string;
  title: string;
  company_name: string;
  description: string | null;
  is_active: boolean;
};

export function VacancyManager({ vacancies }: { vacancies: Vacancy[] }) {
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createVacancy({ title, companyName, description });
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("Lowongan berhasil ditambahkan.");
      setTitle("");
      setCompanyName("");
      setDescription("");
      router.refresh();
    });
  }

  function onToggle(vacancy: Vacancy) {
    setTogglingId(vacancy.id);
    startTransition(async () => {
      const result = await setVacancyActive(vacancy.id, !vacancy.is_active);
      setTogglingId(null);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(vacancy.is_active ? "Lowongan dinonaktifkan." : "Lowongan diaktifkan.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kelola Lowongan Campus Hiring</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={onCreate} className="flex flex-col gap-3">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vacancyTitle">Judul Lowongan</Label>
              <Input
                id="vacancyTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Staff IT"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vacancyCompany">Nama Perusahaan</Label>
              <Input
                id="vacancyCompany"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="PT Contoh"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vacancyDescription">Deskripsi (opsional)</Label>
            <Textarea
              id="vacancyDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Tambah Lowongan
          </Button>
        </form>

        {vacancies.length === 0 ? (
          <EmptyState icon={Briefcase} title="Belum ada lowongan" description="Tambahkan lowongan pertama di atas." />
        ) : (
          <ul className="flex flex-col gap-2">
            {vacancies.map((v) => (
              <li
                key={v.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{v.title}</p>
                  <p className="text-xs text-muted-foreground">{v.company_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      v.is_active
                        ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {v.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending && togglingId === v.id}
                    onClick={() => onToggle(v)}
                  >
                    {pending && togglingId === v.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : v.is_active ? (
                      "Nonaktifkan"
                    ) : (
                      "Aktifkan"
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
