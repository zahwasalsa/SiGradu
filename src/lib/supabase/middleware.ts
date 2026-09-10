import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Paths that do not require an authenticated session.
 * Everything else is treated as protected by default (fail closed).
 */
const PUBLIC_PATH_PREFIXES = ["/login", "/register", "/auth", "/forgot-password"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Refreshes the Supabase session on every request and enforces the baseline
 * "must be logged in" gate. Role-based authorization (mahasiswa vs admin routes,
 * which admin role can see which module) is enforced deeper in each route's
 * layout/page via `requireRole()` (src/lib/auth/session.ts), since that needs a
 * DB lookup against `public.users` and is easier to keep correct co-located with
 * the routes it protects.
 *
 * TESTING MODE (temporary): /login and /register never redirect based on
 * session state here — they always render, even for an already signed-in
 * visitor, so both pages stay reachable for manual testing regardless of
 * whatever session is active in the browser. (Previously this file bounced an
 * authenticated visitor away from /login/register to "/"; that block has been
 * removed — see the audit note further down for exactly what was removed.)
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not run logic between createServerClient and getUser() —
  // it needs to run on every request to keep the session cookie fresh.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // NOTE: the block that used to live here —
  //   if (user && (pathname === "/login" || pathname === "/register")) {
  //     redirect to "/"
  //   }
  // — has been intentionally removed (see TESTING MODE note above). This was
  // the ONLY code in the entire app that could send an authenticated visitor
  // away from /login or /register; with it gone, both pages always render
  // their own content regardless of session state.
  return supabaseResponse;
}