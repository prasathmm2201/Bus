import { NextResponse } from "next/server";
import { userService } from "@/services/userService";
import { signJWT } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const { mobile_no, code } = await request.json();

        if (!mobile_no || !code) {
            return NextResponse.json({ success: false, error: "Mobile number and code are required" }, { status: 400 });
        }

        const user = await userService.verifyOtp(mobile_no, code);

        // Exclude password if it exists
        const { password: _, ...userWithoutPassword } = user;

        const token = await signJWT({ id: user.id, email: user.email || "", mobile_no: user.mobile_no || "", role: user.role });

        (await cookies()).set("auth-token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
        });

        return NextResponse.json({ success: true, data: userWithoutPassword, token });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
}
