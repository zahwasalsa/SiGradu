"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { completeStudentProfile } from "@/lib/actions/profile";
import { DEGREE_LEVELS, DEGREE_LEVEL_LABELS } from "@/types/domain";

type Faculty = { id: string; name: string };
type StudyProgram = { id: string; name: string; faculty_id: string };

const schema = z.object({
  nim: z.string().trim().min(3, "NIM tidak valid").max(30, "NIM terlalu panjang"),
  facultyId: z.string().uuid("Pilih fakultas"),
  studyProgramId: z.string().uuid("Pilih program studi"),
  degreeLevel: z.enum(DEGREE_LEVELS, { message: "Pilih jenjang" }),
});
type FormValues = z.infer<typeof schema>;

const emptyDefaults: FormValues = {
  nim: "",
  facultyId: "" as FormValues["facultyId"],
  studyProgramId: "" as FormValues["studyProgramId"],
  degreeLevel: "" as unknown as FormValues["degreeLevel"],
};

export function CompleteProfileForm({
  faculties,
  studyPrograms,
}: {
  faculties: Faculty[];
  studyPrograms: StudyProgram[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyDefaults,
  });

  const selectedFacultyId = useWatch({ control, name: "facultyId" });
  const filteredPrograms = useMemo(
    () => studyPrograms.filter((p) => p.faculty_id === selectedFacultyId),
    [studyPrograms, selectedFacultyId]
  );

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setPending(true);
    const result = await completeStudentProfile(values);
    setPending(false);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    toast.success("Profil akademik berhasil disimpan.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lengkapi Profil Akademik</CardTitle>
        <CardDescription>
          Data ini hanya bisa diisi sekali. Setelah tersimpan, perubahan hanya dapat dilakukan oleh
          Admin Fakultas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {serverError ? (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="nim">NIM</Label>
            <Input id="nim" autoComplete="off" {...register("nim")} />
            {errors.nim ? <p className="text-xs text-destructive">{errors.nim.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Fakultas</Label>
              <Controller
                control={control}
                name="facultyId"
                render={({ field }) => (
                  <Select
                    items={faculties.map((f) => ({ value: f.id, label: f.name }))}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value ?? "");
                      setValue("studyProgramId", "" as FormValues["studyProgramId"]);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih fakultas" />
                    </SelectTrigger>
                    <SelectContent>
                      {faculties.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.facultyId ? (
                <p className="text-xs text-destructive">{errors.facultyId.message}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Program Studi</Label>
              <Controller
                control={control}
                name="studyProgramId"
                render={({ field }) => (
                  <Select
                    items={filteredPrograms.map((p) => ({ value: p.id, label: p.name }))}
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "")}
                    disabled={!selectedFacultyId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={selectedFacultyId ? "Pilih program studi" : "Pilih fakultas dahulu"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedFacultyId && filteredPrograms.length === 0 ? (
                        <p className="px-2 py-1.5 text-sm text-muted-foreground">
                          Program studi untuk fakultas ini belum tersedia.
                        </p>
                      ) : (
                        filteredPrograms.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.studyProgramId ? (
                <p className="text-xs text-destructive">{errors.studyProgramId.message}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Jenjang</Label>
            <Controller
              control={control}
              name="degreeLevel"
              render={({ field }) => (
                <Select
                  items={DEGREE_LEVELS.map((level) => ({ value: level, label: DEGREE_LEVEL_LABELS[level] }))}
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih jenjang" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEGREE_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {DEGREE_LEVEL_LABELS[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.degreeLevel ? (
              <p className="text-xs text-destructive">{errors.degreeLevel.message}</p>
            ) : null}
          </div>

          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Simpan Profil Akademik
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
