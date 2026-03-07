import prisma from "@/lib/prisma";
import { DiscountType } from "@prisma/client";

export const couponService = {
    async validateCoupon(code: string, userId: string, orderAmount: number) {
        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!coupon) {
            throw new Error("Invalid coupon code");
        }

        if (!coupon.is_active) {
            throw new Error("Coupon is inactive");
        }

        // Check if coupon is user-specific
        if (coupon.user_id && coupon.user_id !== userId) {
            throw new Error("This coupon is not valid for your account");
        }

        const now = new Date();
        if (coupon.valid_until && coupon.valid_until < now) {
            throw new Error("Coupon has expired");
        }

        if (coupon.valid_from > now) {
            throw new Error("Coupon is not valid yet");
        }

        if (orderAmount < Number(coupon.min_order_value)) {
            throw new Error(`Minimum order value of ₹${coupon.min_order_value} required`);
        }

        // Global usage limit check
        if (coupon.usage_limit) {
            const usageCount = await prisma.couponUsage.count({
                where: { coupon_id: coupon.id }
            });
            if (usageCount >= coupon.usage_limit) {
                throw new Error("Coupon usage limit exceeded");
            }
        }

        // Per user usage limit check
        const userUsageCount = await prisma.couponUsage.count({
            where: {
                coupon_id: coupon.id,
                user_id: userId
            }
        });

        if (userUsageCount >= coupon.user_limit) {
            throw new Error("You have exceeded the usage limit for this coupon");
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discount_type === DiscountType.FLAT) {
            discount = Number(coupon.discount_value);
        } else {
            discount = (orderAmount * Number(coupon.discount_value)) / 100;
        }

        // Cap discount if max_discount is set
        if (coupon.max_discount && discount > Number(coupon.max_discount)) {
            discount = Number(coupon.max_discount);
        }

        // Ensure discount doesn't exceed order amount
        if (discount > orderAmount) {
            discount = orderAmount;
        }

        return {
            isValid: true,
            coupon,
            discountAmount: discount,
            finalAmount: orderAmount - discount
        };
    },

    async markCouponUsed(couponId: string, userId: string, bookingId: string) {
        return await prisma.couponUsage.create({
            data: {
                coupon_id: couponId,
                user_id: userId,
                booking_id: bookingId
            }
        });
    }
};
