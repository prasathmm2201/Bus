import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const token = (await cookies()).get("auth-token")?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 });
        }

        const payload = await verifyJWT(token);
        if (!payload) {
            return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 });
        }

        return NextResponse.json({ success: true, user: payload });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 });
    }
}
