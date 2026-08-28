import { z } from "zod";
import { DEGREE_LEVELS } from "@/types/domain";

/**
 * Shared between the client form (react-hook-form + zodResolver, for instant
 * feedback) and the Server Action (re-validated there too — client-side
 * validation is never trusted alone).
 */
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "Nama lengkap minimal 3 karakter")
      .max(120, "Nama lengkap terlalu panjang"),
    email: z.string().trim().toLowerCase().email("Format email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
    nim: z
      .string()
      .trim()
      .min(3, "NIM tidak valid")
      .max(30, "NIM terlalu panjang"),
    facultyId: z.string().uuid("Pilih fakultas"),
    studyProgramId: z.string().uuid("Pilih program studi"),
    degreeLevel: z.enum(DEGREE_LEVELS, { message: "Pilih jenjang" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
