/**
 * Application-level enums and domain types for Sigradu.
 *
 * Values mirror docs/DATABASE_DESIGN.md section 3 (Enum & Status). That document
 * flags several of these as OPEN QUESTION (naming not yet confirmed against the
 * live database) — see the comments below and docs/DATABASE_DESIGN.md for details.
 */

export const USER_ROLES = [
  "mahasiswa",
  "kaprodi",
  "admin_fakultas",
  "admin_bkk",
  "admin_keuangan",
  "admin_kemahasiswaan",
  "admin_wisuda",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ADMIN_ROLES = USER_ROLES.filter((r) => r !== "mahasiswa") as Exclude<
  UserRole,
  "mahasiswa"
>[];

export const ROLE_LABELS: Record<UserRole, string> = {
  mahasiswa: "Mahasiswa",
  kaprodi: "Kaprodi",
  admin_fakultas: "Admin Fakultas",
  admin_bkk: "Admin BKK",
  admin_keuangan: "Admin Keuangan",
  admin_kemahasiswaan: "Admin Kemahasiswaan",
  admin_wisuda: "Admin Wisuda",
};

/** Home route each role lands on after login. */
export const ROLE_HOME: Record<UserRole, string> = {
  mahasiswa: "/dashboard",
  kaprodi: "/admin/dashboard",
  admin_fakultas: "/admin/dashboard",
  admin_bkk: "/admin/dashboard",
  admin_keuangan: "/admin/dashboard",
  admin_kemahasiswaan: "/admin/dashboard",
  admin_wisuda: "/admin/dashboard",
};

export const DEGREE_LEVELS = ["sarjana", "magister"] as const;
export type DegreeLevel = (typeof DEGREE_LEVELS)[number];
export const DEGREE_LEVEL_LABELS: Record<DegreeLevel, string> = {
  sarjana: "Sarjana",
  magister: "Magister",
};

// ---------------------------------------------------------------------------
// Modul 1 — Yudisium
// ---------------------------------------------------------------------------

export const YUDISIUM_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "revision",
  "approved",
  "rejected",
] as const;
export type YudisiumStatus = (typeof YUDISIUM_STATUSES)[number];

export const YUDISIUM_STATUS_LABELS: Record<YudisiumStatus, string> = {
  draft: "Draft",
  submitted: "Diajukan",
  under_review: "Sedang Ditinjau",
  revision: "Perlu Revisi",
  approved: "Lolos Administrasi Yudisium",
  rejected: "Tidak Lolos Yudisium",
};

export const DOCUMENT_TYPES = ["ktp", "kk", "ijazah", "dokumen_lain"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  ktp: "KTP",
  kk: "Kartu Keluarga",
  ijazah: "Ijazah / Surat Keterangan Lulus",
  dokumen_lain: "Dokumen Lain",
};
/**
 * OPEN QUESTION (docs/DATABASE_DESIGN.md §3.1): daftar dokumen persyaratan lengkap
 * merujuk ke dokumen "RANCANGAN ALUR YUDISIUM" yang tidak tersedia. Daftar di atas
 * hanya mencakup 4 folder yang sudah ada di docs/STORAGE_DESIGN.md.
 */

export const DOCUMENT_STATUSES = ["pending", "approved", "revision_needed"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];
export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: "Menunggu Verifikasi",
  approved: "Disetujui",
  revision_needed: "Perlu Revisi",
};

export const REVIEWER_ROLES = ["kaprodi", "admin_fakultas"] as const;
export type ReviewerRole = (typeof REVIEWER_ROLES)[number];

export const REVIEW_METHODS = ["manual", "digital"] as const;
export type ReviewMethod = (typeof REVIEW_METHODS)[number];
export const REVIEW_METHOD_LABELS: Record<ReviewMethod, string> = {
  manual: "Manual (di luar sistem)",
  digital: "Digital (login sistem)",
};

export const REVIEW_DECISIONS = ["lolos", "tidak_lolos"] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];
export const REVIEW_DECISION_LABELS: Record<ReviewDecision, string> = {
  lolos: "Lolos",
  tidak_lolos: "Tidak Lolos",
};

// ---------------------------------------------------------------------------
// Modul 2 — Campus Hiring & Tracer Study
// ---------------------------------------------------------------------------

export const EMPLOYMENT_CURRENT_STATUSES = [
  "belum_bekerja",
  "sudah_bekerja",
  "wirausaha",
  "melanjutkan_studi",
] as const;
export type EmploymentCurrentStatus = (typeof EMPLOYMENT_CURRENT_STATUSES)[number];
export const EMPLOYMENT_CURRENT_STATUS_LABELS: Record<EmploymentCurrentStatus, string> = {
  belum_bekerja: "Belum Bekerja",
  sudah_bekerja: "Sudah Bekerja",
  wirausaha: "Wirausaha",
  melanjutkan_studi: "Melanjutkan Studi",
};
/**
 * OPEN QUESTION (PDF §3c-A, docs/DATABASE_DESIGN.md §3.2): "wirausaha" dan
 * "melanjutkan_studi" disebut sebagai saran pengembangan, belum pasti cakupan MVP.
 * Keduanya diperlakukan setara "sudah_bekerja" (tidak wajib Hiring) di logika gating.
 */

export const JOB_APPLICATION_STATUSES = ["diproses", "interview", "diterima", "ditolak"] as const;
export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number];
export const JOB_APPLICATION_STATUS_LABELS: Record<JobApplicationStatus, string> = {
  diproses: "Diproses",
  interview: "Interview",
  diterima: "Diterima",
  ditolak: "Ditolak",
};

export const EMPLOYMENT_PROOF_TYPES = [
  "surat_keterangan_kerja",
  "kontrak_kerja",
  "sk_pengangkatan",
  "slip_gaji",
  "lainnya",
] as const;
export type EmploymentProofType = (typeof EMPLOYMENT_PROOF_TYPES)[number];
export const EMPLOYMENT_PROOF_TYPE_LABELS: Record<EmploymentProofType, string> = {
  surat_keterangan_kerja: "Surat Keterangan Kerja",
  kontrak_kerja: "Kontrak Kerja",
  sk_pengangkatan: "SK Pengangkatan",
  slip_gaji: "Slip Gaji",
  lainnya: "Lainnya",
};

export const EMPLOYMENT_PROOF_STATUSES = ["pending", "revision_needed", "verified"] as const;
export type EmploymentProofStatus = (typeof EMPLOYMENT_PROOF_STATUSES)[number];
export const EMPLOYMENT_PROOF_STATUS_LABELS: Record<EmploymentProofStatus, string> = {
  pending: "Menunggu Verifikasi",
  revision_needed: "Revisi Bukti Kerja",
  verified: "Bukti Kerja Terverifikasi",
};

export const TRACER_STATUSES = ["draft", "submitted", "revision", "approved"] as const;
export type TracerStatus = (typeof TRACER_STATUSES)[number];
export const TRACER_STATUS_LABELS: Record<TracerStatus, string> = {
  draft: "Menunggu Pengisian",
  submitted: "Menunggu Verifikasi Tracer & Hiring",
  revision: "Revisi Tracer & Hiring",
  approved: "Lolos Tracer & Hiring",
};

// ---------------------------------------------------------------------------
// Modul 3 — Wisuda
// ---------------------------------------------------------------------------

export const ATTENDANCE_CHOICES = ["hadir", "in_absentia"] as const;
export type AttendanceChoice = (typeof ATTENDANCE_CHOICES)[number];
export const ATTENDANCE_CHOICE_LABELS: Record<AttendanceChoice, string> = {
  hadir: "Bersedia Hadir",
  in_absentia: "Tidak Bersedia Hadir (In Absentia)",
};

export const GRADUATION_STATUSES = [
  "menunggu_kesediaan",
  "menunggu_pembayaran",
  "menunggu_verifikasi_pembayaran",
  "pembayaran_ditolak",
  "pembayaran_terverifikasi",
  "menunggu_data_buku",
  "revisi_data_buku",
  "data_buku_lengkap",
  "terdaftar_sebagai_wisudawan",
  "wisuda_in_absentia",
] as const;
export type GraduationStatus = (typeof GRADUATION_STATUSES)[number];
export const GRADUATION_STATUS_LABELS: Record<GraduationStatus, string> = {
  menunggu_kesediaan: "Menunggu Kesediaan Wisuda",
  menunggu_pembayaran: "Menunggu Pembayaran",
  menunggu_verifikasi_pembayaran: "Menunggu Verifikasi Pembayaran",
  pembayaran_ditolak: "Pembayaran Ditolak",
  pembayaran_terverifikasi: "Pembayaran Terverifikasi",
  menunggu_data_buku: "Menunggu Data Buku Wisuda",
  revisi_data_buku: "Revisi Data Buku Wisuda",
  data_buku_lengkap: "Data Buku Wisuda Lengkap",
  terdaftar_sebagai_wisudawan: "Terdaftar sebagai Wisudawan",
  wisuda_in_absentia: "Wisuda In Absentia",
};

export const PAYMENT_STATUSES = ["pending", "verified", "rejected"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Menunggu Verifikasi",
  verified: "Terverifikasi",
  rejected: "Ditolak",
};

export const BOOK_DATA_STATUSES = ["pending", "revision_needed", "complete"] as const;
export type BookDataStatus = (typeof BOOK_DATA_STATUSES)[number];
export const BOOK_DATA_STATUS_LABELS: Record<BookDataStatus, string> = {
  pending: "Menunggu Verifikasi",
  revision_needed: "Revisi Data Buku Wisuda",
  complete: "Data Buku Wisuda Lengkap",
};

export const PERIOD_TYPES = ["yudisium", "wisuda"] as const;
export type PeriodType = (typeof PERIOD_TYPES)[number];

// ---------------------------------------------------------------------------
// Generic status badge tone helper (used by UI components)
// ---------------------------------------------------------------------------

export type StatusTone = "neutral" | "info" | "warning" | "success" | "danger";

const SUCCESS_STATUSES = new Set([
  "approved",
  "verified",
  "complete",
  "terdaftar_sebagai_wisudawan",
  "wisuda_in_absentia",
  "pembayaran_terverifikasi",
  "data_buku_lengkap",
]);
const DANGER_STATUSES = new Set([
  "rejected",
  "revision_needed",
  "revision",
  "pembayaran_ditolak",
  "ditolak",
]);
const WARNING_STATUSES = new Set([
  "under_review",
  "submitted",
  "pending",
  "menunggu_pembayaran",
  "menunggu_verifikasi_pembayaran",
  "menunggu_data_buku",
  "diproses",
  "interview",
]);

export function statusTone(status: string): StatusTone {
  if (SUCCESS_STATUSES.has(status)) return "success";
  if (DANGER_STATUSES.has(status)) return "danger";
  if (WARNING_STATUSES.has(status)) return "warning";
  if (status === "draft" || status === "menunggu_kesediaan") return "neutral";
  return "info";
}
