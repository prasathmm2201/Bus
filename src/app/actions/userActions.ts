"use server";

import { userService } from "@/services/userService";
import { revalidatePath } from "next/cache";

import { signJWT } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function loginAction(email: string, password: string) {
    try {
        const user = await userService.loginUser(email, password);
        // Exclude password from the returned object
        const { password: _, ...userWithoutPassword } = user;

        // Also sign a JWT for regular users for consistency and middleware protection
        const token = await signJWT({ id: user.id, email: user.email, role: user.role });
        (await cookies()).set("auth-token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
        });

        return { success: true, data: userWithoutPassword, token };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function adminLoginAction(email: string, password: string) {
    try {
        const user = await userService.loginUser(email, password);

        if (user.role !== "ADMIN") {
            throw new Error("Unauthorized: Admin access required");
        }

        const adminData = { id: user.id, name: user.name || "Sriram Admin", email: user.email, role: user.role as "ADMIN" };
        const token = await signJWT(adminData);

        (await cookies()).set("auth-token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
        });

        return { success: true, data: adminData, token };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function sendOtpAction(mobile_no: string) {
    try {
        await userService.sendOtp(mobile_no);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function verifyOtpAction(mobile_no: string, code: string) {
    try {
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

        return { success: true, data: userWithoutPassword, token };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function registerAction(data: { name: string, email?: string, password?: string, mobile_no?: string }) {
    try {
        const user = await userService.registerUser(data);
        const { password: _, ...userWithoutPassword } = user;
        return { success: true, data: userWithoutPassword };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
export async function logoutAction() {
    (await cookies()).delete("auth-token");
    return { success: true };
}
