import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/jwt";

export async function middleware(request: NextRequest) {
    const token = request.cookies.get("auth-token")?.value;
    const { pathname } = request.nextUrl;

    const payload = token ? await verifyJWT(token) : null;

    // Admin protection
    if (pathname.startsWith("/admin") && !pathname.includes("/admin/login")) {
        if (!payload || payload.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
    }

    // Protected routes for users
    const userProtectedRoutes = ["/passenger-details", "/my-bookings"];
    if (userProtectedRoutes.some(route => pathname.startsWith(route))) {
        if (!payload) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    // Redirect logged-in admin from public pages to dashboard
    const publicPages = ["/", "/login"];
    if (publicPages.includes(pathname)) {
        if (payload && payload.role === "ADMIN") {
            return NextResponse.redirect(new URL("/admin", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
