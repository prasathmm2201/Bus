"use server";

import { couponService } from "@/services/couponService";
import { verifyJWT } from "@/lib/jwt";
import { cookies } from "next/headers";
import { serialize } from "@/lib/serialize";

export async function verifyCouponAction(code: string, orderAmount: number) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth-token")?.value;

        if (!token) {
            return { success: false, error: "Please login to apply coupons" };
        }

        const decoded = await verifyJWT(token);
        if (!decoded || !decoded.id) {
            return { success: false, error: "Invalid session" };
        }

        const result = await couponService.validateCoupon(code, decoded.id as string, orderAmount);

        // Don't return the full coupon object to frontend to avoid leaking sensitive info
        return {
            success: true,
            data: serialize({
                code: result.coupon.code,
                discount_amount: result.discountAmount,
                final_amount: result.finalAmount,
                description: result.coupon.description
            })
        };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
