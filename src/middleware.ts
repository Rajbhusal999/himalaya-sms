import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that should be blocked in maintenance mode
const PUBLIC_ROUTES = ["/", "/apply", "/recent-news"];

// Routes always allowed regardless of maintenance mode
const ALWAYS_ALLOWED = ["/admin", "/teacher", "/maintenance", "/_next", "/favicon", "/logo", "/school", "/api"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for admin/teacher/maintenance/static routes
  const isAlwaysAllowed = ALWAYS_ALLOWED.some((r) => pathname.startsWith(r));
  if (isAlwaysAllowed) return NextResponse.next();

  // Only check maintenance for public routes
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  if (!isPublicRoute) return NextResponse.next();

  try {
    // Fetch maintenance mode from Supabase REST API (edge-compatible, no Node.js SDK)
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
        // Cache for 10 seconds to avoid hammering Supabase on every request
        next: { revalidate: 10 },
      }
    );

    if (res.ok) {
      const data: { maintenance_mode: boolean }[] = await res.json();
      const isMaintenanceOn = data?.[0]?.maintenance_mode === true;

      if (isMaintenanceOn) {
        return NextResponse.redirect(new URL("/maintenance", request.url));
      }
    }
  } catch (e) {
    // If we can't check, allow through (fail open)
    console.warn("Middleware: could not check maintenance mode", e);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, public images
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)).*)",
  ],
};
