"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerSchema, type RegisterInput } from "@/app/register/schema";
import { registerStudent } from "@/app/register/actions";
import { DEGREE_LEVELS, DEGREE_LEVEL_LABELS } from "@/types/domain";

type Faculty = { id: string; name: string };
type StudyProgram = { id: string; name: string; faculty_id: string };

const emptyDefaults = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  nim: "",
  facultyId: "",
  studyProgramId: "",
  degreeLevel: "",
} as unknown as RegisterInput;

export function RegisterForm({
  faculties,
  studyPrograms,
}: {
  faculties: Faculty[];
  studyPrograms: StudyProgram[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: emptyDefaults,
  });

  const selectedFacultyId = useWatch({ control, name: "facultyId" });
  const filteredPrograms = useMemo(
    () => studyPrograms.filter((p) => p.faculty_id === selectedFacultyId),
    [studyPrograms, selectedFacultyId]
  );

  function onSubmit(values: RegisterInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await registerStudent(values);
      if (result.error) {
        setServerError(result.error);
        return;
      }
      setSuccess(true);
      setNeedsEmailConfirmation(!!result.needsEmailConfirmation);
      toast.success("Registrasi berhasil!");
      if (!result.needsEmailConfirmation) {
        setTimeout(() => router.push("/login"), 1200);
      }
    });
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="size-6" />
        </div>
        <p className="font-medium">Registrasi berhasil</p>
        {needsEmailConfirmation ? (
          <p className="max-w-xs text-sm text-muted-foreground">
            Cek inbox (atau folder spam) email Anda dan klik link konfirmasi sebelum bisa masuk ke
            Sigradu.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Mengarahkan ke halaman login…</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Nama Lengkap</Label>
        <Input id="fullName" autoComplete="name" {...register("fullName")} />
        {errors.fullName ? (
          <p className="text-xs text-destructive">{errors.fullName.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" autoComplete="new-password" {...register("password")} />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword ? (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          ) : null}
        </div>
      </div>

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
                  setValue("studyProgramId", "" as RegisterInput["studyProgramId"]);
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

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Daftar
      </Button>
    </form>
  );
}
