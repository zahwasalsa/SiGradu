import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Exchanges the one-time `code` Supabase puts on the password-reset email
 * link for a real session (cookies), then hands off to `next` (defaults to
 * /reset-password). This is the standard @supabase/ssr PKCE recipe — the
 * code is single-use and expires quickly, so this route only ever runs once
 * per reset attempt, right after the user clicks the email link.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/reset-password";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/forgot-password?expired=1`);
}
