import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Storage bucket layout, mirroring docs/STORAGE_DESIGN.md:
 *
 *   yudisium/ { ktp, kk, ijazah, dokumen-lain }
 *   hiring/   { bukti-lamaran, bukti-kerja }
 *   wisuda/   { pembayaran, foto }
 *
 * Design decision: each top-level folder in STORAGE_DESIGN.md is implemented as
 * its own Supabase Storage bucket (buckets are the closest primitive Supabase has
 * to that top level). These buckets must exist in the Supabase project — create
 * them (private, not public) before testing uploads. See README for the exact
 * bucket names expected here.
 */
export const BUCKETS = {
  yudisium: "yudisium",
  hiring: "hiring",
  wisuda: "wisuda",
} as const;

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export function buildStoragePath(segments: string[], fileName: string) {
  const stamp = Date.now();
  return [...segments, `${stamp}-${sanitizeFileName(fileName)}`].join("/");
}

export async function uploadPrivateFile(
  supabase: SupabaseClient<Database>,
  bucket: (typeof BUCKETS)[keyof typeof BUCKETS],
  path: string,
  file: File
) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Short-lived signed URL for viewing a private file (documents are not public). */
export async function getSignedUrl(
  supabase: SupabaseClient<Database>,
  bucket: (typeof BUCKETS)[keyof typeof BUCKETS],
  path: string,
  expiresInSeconds = 60 * 10
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
