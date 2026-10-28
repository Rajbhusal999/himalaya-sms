import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Public routes that are blocked while maintenance mode is on
const PUBLIC_ROUTES = ["/", "/apply", "/recent-news"];

type Portal = "admin" | "teacher" | "accountant";
const PORTALS: Portal[] = ["admin", "teacher", "accountant"];

const CHANGE_PASSWORD_PATH = "/account/change-password";

function getPortal(pathname: string): Portal | null {
  return PORTALS.find((p) => pathname === `/${p}` || pathname.startsWith(`/${p}/`)) ?? null;
}

/**
 * Proxy (formerly middleware in Next < 16).
 *
 * This is an *optimistic* gate: it keeps unauthenticated users away from the
 * portals and refreshes the auth cookie. Real authorization is enforced by
 * Postgres RLS and by server actions, never by this file alone.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const portal = getPortal(pathname);

  // ── Portals: require a valid Supabase session with the matching role ──
  if (portal || pathname === CHANGE_PASSWORD_PATH) {
    return guardPortal(request, portal);
  }

  // ── Public pages: maintenance mode check ──
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  if (!isPublicRoute) return NextResponse.next();

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return NextResponse.next();

    const res = await fetch(
      `${supabaseUrl}/rest/v1/school_settings?id=eq.default&select=maintenance_mode`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (res.ok) {
      const data: { maintenance_mode: boolean }[] = await res.json();
      if (data?.[0]?.maintenance_mode === true) {
        return NextResponse.redirect(new URL("/maintenance", request.url));
      }
    }
  } catch (e) {
    // If we can't check, allow through (fail open)
    console.warn("Proxy: could not check maintenance mode", e);
  }

  return NextResponse.next();
}

async function guardPortal(request: NextRequest, portal: Portal | null) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { pathname } = request.nextUrl;
  const isLoginPage = portal !== null && pathname === `/${portal}/login`;

  // getUser() validates the JWT with the Auth server (getSession() does not).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.app_metadata?.role as Portal | undefined;

  // Login pages are always reachable.
  if (isLoginPage) return response;

  // Not signed in, or signed in with the wrong role → portal login.
  if (!user || (portal && role !== portal)) {
    const target = portal ?? (role ?? "admin");
    return NextResponse.redirect(new URL(`/${target}/login`, request.url));
  }

  // Forced password change (e.g. first admin login with the seeded password).
  if (user.app_metadata?.must_change_password === true && pathname !== CHANGE_PASSWORD_PATH) {
    return NextResponse.redirect(new URL(CHANGE_PASSWORD_PATH, request.url));
  }

  // Admin with MFA enrolled must have completed the second factor.
  if (portal === "admin") {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT Next internals, favicon and public images.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)).*)",
  ],
};
