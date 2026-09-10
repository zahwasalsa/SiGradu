import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

type YudisiumApplication = Tables<"yudisium_applications">;
type EmploymentStatus = Tables<"employment_status">;
type EmploymentProof = Tables<"employment_proofs">;
type TracerStudy = Tables<"tracer_studies">;
type GraduationRegistration = Tables<"graduation_registrations">;

export type HiringTracerProgress = {
  employmentStatus: EmploymentStatus | null;
  jobApplicationsCount: number;
  threshold: number | null;
  employmentProofs: EmploymentProof[];
  bypassed: boolean;
  tracerStudy: TracerStudy | null;
  /** Whether the Hiring/bukti-kerja requirement is satisfied (Tracer Study form is separate). */
  hiringRequirementMet: boolean;
};

export type StudentProgress = {
  yudisium: { application: YudisiumApplication | null };
  hiringTracer: HiringTracerProgress;
  wisuda: { registration: GraduationRegistration | null };
};

/** Modul 2 opens once the student's latest Yudisium application is approved. */
export function isModule2Unlocked(application: YudisiumApplication | null): boolean {
  return application?.status === "approved";
}

/** Modul 3 opens once Tracer Study is approved (which itself requires Hiring/bukti-kerja to be met — enforced by admin at review time). */
export function isModule3Unlocked(tracerStudy: TracerStudy | null): boolean {
  return tracerStudy?.status === "approved";
}

function computeHiringRequirementMet(
  employmentStatus: EmploymentStatus | null,
  jobApplicationsCount: number,
  threshold: number | null,
  employmentProofs: EmploymentProof[],
  bypassed: boolean
): boolean {
  if (!employmentStatus) return false;
  if (bypassed) return true;

  if (employmentStatus.current_status === "belum_bekerja") {
    return threshold !== null && jobApplicationsCount >= threshold;
  }

  // sudah_bekerja / wirausaha / melanjutkan_studi -> perlu bukti kerja terverifikasi
  return employmentProofs.some((p) => p.status === "verified");
}

/**
 * Loads the logged-in student's progress across all three modules in one pass.
 * Used by the student dashboard and by gate checks on Modul 2/3 pages.
 *
 * PERF NOTE: everything that only depends on `periodId`/`studentId` (employment
 * status, tracer study, both threshold lookups) is fetched in one Promise.all
 * instead of one-at-a-time — they don't depend on each other, so there's no
 * reason to make the browser wait through them sequentially. Same for the
 * job-application/proof/bypass trio, which was already parallel.
 */
export async function getStudentProgress(
  supabase: SupabaseClient<Database>,
  student: { id: string; studyProgramId: string }
): Promise<StudentProgress> {
  const { data: application } = await supabase
    .from("yudisium_applications")
    .select("*")
    .eq("student_id", student.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const module2Unlocked = isModule2Unlocked(application);

  let employmentStatus: EmploymentStatus | null = null;
  let jobApplicationsCount = 0;
  let threshold: number | null = null;
  let employmentProofs: EmploymentProof[] = [];
  let bypassed = false;
  let tracerStudy: TracerStudy | null = null;

  if (module2Unlocked && application) {
    const periodId = application.period_id;

    // These four only need periodId/studentId — none of them depends on the
    // others' result, so run them together instead of one round trip at a time.
    const [
      { data: es },
      { data: tracer },
      { data: scopedThreshold },
      { data: defaultThreshold },
    ] = await Promise.all([
      supabase
        .from("employment_status")
        .select("*")
        .eq("student_id", student.id)
        .eq("period_id", periodId)
        .maybeSingle(),
      supabase
        .from("tracer_studies")
        .select("*")
        .eq("student_id", student.id)
        .eq("period_id", periodId)
        .maybeSingle(),
      supabase
        .from("hiring_thresholds")
        .select("min_applications")
        .eq("period_id", periodId)
        .eq("study_program_id", student.studyProgramId)
        .maybeSingle(),
      supabase
        .from("hiring_thresholds")
        .select("min_applications")
        .eq("period_id", periodId)
        .is("study_program_id", null)
        .maybeSingle(),
    ]);

    employmentStatus = es;
    tracerStudy = tracer;
    // Prefer a threshold scoped to the student's program; fall back to the
    // period-wide default (study_program_id IS NULL). Both were already
    // fetched above, so picking between them costs nothing extra.
    threshold = scopedThreshold?.min_applications ?? defaultThreshold?.min_applications ?? null;

    if (es) {
      const [{ count }, { data: proofs }, { data: bypassRow }] = await Promise.all([
        supabase
          .from("job_applications")
          .select("id", { count: "exact", head: true })
          .eq("employment_status_id", es.id),
        supabase
          .from("employment_proofs")
          .select("*")
          .eq("employment_status_id", es.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("bypass_logs")
          .select("id")
          .eq("employment_status_id", es.id)
          .limit(1)
          .maybeSingle(),
      ]);

      jobApplicationsCount = count ?? 0;
      employmentProofs = proofs ?? [];
      bypassed = !!bypassRow;
    }
  }

  const module3Unlocked = isModule3Unlocked(tracerStudy);

  let registration: GraduationRegistration | null = null;
  if (module3Unlocked) {
    const { data: reg } = await supabase
      .from("graduation_registrations")
      .select("*")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    registration = reg;
  }

  return {
    yudisium: { application },
    hiringTracer: {
      employmentStatus,
      jobApplicationsCount,
      threshold,
      employmentProofs,
      bypassed,
      tracerStudy,
      hiringRequirementMet: computeHiringRequirementMet(
        employmentStatus,
        jobApplicationsCount,
        threshold,
        employmentProofs,
        bypassed
      ),
    },
    wisuda: { registration },
  };
}