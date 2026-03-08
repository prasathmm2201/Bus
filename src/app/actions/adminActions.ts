"use server";

import { adminService } from "@/services/adminService";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/jwt";
import { BusType, SeatLayout, SeatType, Deck } from "@prisma/client";
import { serialize } from "@/lib/serialize";
import { uploadToS3, deleteFromS3 } from "@/lib/s3";

export async function createBusAction(formData: FormData) {
    try {
        const busData = JSON.parse(formData.get("data") as string);
        const images = formData.getAll("images") as File[];
        const imageUrls = [];

        for (const file of images) {
            if (file.size > 0) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const url = await uploadToS3(buffer, file.name, file.type);
                imageUrls.push(url);
            }
        }

        const bus = await adminService.createBus({
            ...busData,
            images: imageUrls
        });

        revalidatePath("/admin/buses");
        return { success: true, data: bus };
    } catch (error: any) {
        console.error("Create Bus Error:", error);
        return { success: false, error: error.message };
    }
}

export async function createScheduleAction(data: {
    bus_id: string;
    route_id: string;
    startDate: string;
    endDate: string;
    departureTime: string;
    arrivalTime: string;
    price?: number;
    addon_amount?: number;
    discount_percentage?: number;
    isNextDay?: boolean;
    is_pickup?: boolean;
}) {
    try {
        const schedules = await adminService.createScheduleRange({
            ...data,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate)
        });
        revalidatePath("/admin/schedules");
        return { success: true, data: serialize(schedules) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getDashboardStatsAction() {
    try {
        const stats = await adminService.getDashboardStats();
        return { success: true, data: serialize(stats) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getSchedulesByDateAction(date: string) {
    try {
        const schedules = await adminService.getSchedulesByDate(date);
        return { success: true, data: serialize(schedules) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

import { getISTDayBounds } from "@/lib/utils";

export async function getSchedulesAction(params?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    bus_id?: string;
    route_id?: string;
    dateFilter?: string;
}) {
    try {
        let start: Date | undefined = params?.startDate ? new Date(params.startDate) : undefined;
        let end: Date | undefined = params?.endDate ? new Date(params.endDate) : undefined;

        // If dateFilter is provided, use server-side IST bounds (preferred)
        if (params?.dateFilter === "today") {
            const bounds = getISTDayBounds(new Date());
            start = bounds.start;
            end = bounds.end;
        } else if (params?.dateFilter === "tomorrow") {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const bounds = getISTDayBounds(tomorrow);
            start = bounds.start;
            end = bounds.end;
        }

        const schedules = await adminService.getSchedules({
            ...params,
            startDate: start,
            endDate: end
        });
        return { success: true, data: serialize(schedules) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateScheduleAction(id: string, data: { departureTime: string; arrivalTime: string; addon_amount?: number; discount_percentage?: number; isNextDay?: boolean; is_pickup?: boolean }) {
    try {
        const schedule = await adminService.updateSchedule(id, data);
        revalidatePath("/admin/schedules");
        revalidatePath("/search");
        return { success: true, data: serialize(schedule) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteScheduleAction(id: string) {
    try {
        await adminService.deleteSchedule(id);
        revalidatePath("/admin/schedules");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getCitiesAction() {
    try {
        const cities = await adminService.getCities();
        return { success: true, data: cities };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getRecentBookingsAction(limit?: number) {
    try {
        const bookings = await adminService.getRecentBookings(limit);
        return { success: true, data: serialize(bookings) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getBusesAction() {
    try {
        const buses = await adminService.getBuses();
        return { success: true, data: serialize(buses) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateBusAction(id: string, formData: FormData) {
    try {
        const busData = JSON.parse(formData.get("data") as string);
        const newImageFiles = formData.getAll("images") as File[];
        const existingImageUrls = formData.getAll("existingImages") as string[];

        const finalImageUrls = [...existingImageUrls];

        for (const file of newImageFiles) {
            if (file.size > 0) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const url = await uploadToS3(buffer, file.name, file.type);
                finalImageUrls.push(url);
            }
        }

        const bus = await adminService.updateBus(id, {
            ...busData,
            images: finalImageUrls
        });

        revalidatePath("/admin/buses");
        return { success: true, data: bus };
    } catch (error: any) {
        console.error("Update Bus Error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteBusAction(id: string) {
    try {
        await adminService.deleteBus(id);
        revalidatePath("/admin/buses");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Route Actions
export async function createRouteAction(data: any) {
    try {
        const route = await adminService.createRoute(data);
        revalidatePath("/admin/routes");
        return { success: true, data: route };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getRoutesAction() {
    try {
        const routes = await adminService.getRoutes();
        return { success: true, data: serialize(routes) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateRouteAction(id: string, data: any) {
    try {
        const route = await adminService.updateRoute(id, data);
        revalidatePath("/admin/routes");
        return { success: true, data: route };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteRouteAction(id: string) {
    try {
        await adminService.deleteRoute(id);
        revalidatePath("/admin/routes");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getCityWithPointsAction(cityId: string) {
    try {
        const city = await adminService.getCityWithPoints(cityId);
        return { success: true, data: city };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
// City Actions
export async function createCityAction(data: { name: string; state: string }) {
    try {
        const city = await adminService.createCity(data);
        revalidatePath("/admin/cities");
        return { success: true, data: city };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateCityAction(id: string, data: { name: string; state: string; is_active?: boolean }) {
    try {
        const city = await adminService.updateCity(id, data);
        revalidatePath("/admin/cities");
        return { success: true, data: city };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteCityAction(id: string) {
    try {
        await adminService.deleteCity(id);
        revalidatePath("/admin/cities");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Boarding Point Actions
export async function getBoardingPointsAction() {
    try {
        const points = await adminService.getBoardingPoints();
        return { success: true, data: serialize(points) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createBoardingPointAction(data: { name: string; city_id: string }) {
    try {
        const point = await adminService.createBoardingPoint(data);
        revalidatePath("/admin/boarding-points");
        return { success: true, data: point };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateBoardingPointAction(id: string, data: { name: string; city_id: string }) {
    try {
        const point = await adminService.updateBoardingPoint(id, data);
        revalidatePath("/admin/boarding-points");
        return { success: true, data: point };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteBoardingPointAction(id: string) {
    try {
        await adminService.deleteBoardingPoint(id);
        revalidatePath("/admin/boarding-points");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Coupon Actions
export async function createCouponAction(data: {
    user_id: string;
    description?: string;
    discount_type: "FLAT" | "PERCENTAGE";
    discount_value: number;
    min_order_value?: number;
    max_discount?: number;
    expiry_days: number;
    usage_limit?: number;
}) {
    try {
        const { generateSmartCouponCode } = await import("@/lib/coupon-generator");

        // Generate coupon code
        const code = await generateSmartCouponCode(data.discount_type, data.discount_value);

        // Get admin user ID from session
        const cookieStore = await cookies();
        const token = cookieStore.get("auth-token")?.value;
        const payload = token ? await verifyJWT(token) : null;

        console.log("Coupon Creation - Session Payload:", payload);

        if (!payload || payload.role !== "ADMIN") {
            return { success: false, error: "Unauthorized: Admin session not found" };
        }

        const created_by = payload.id as string;

        if (!created_by) {
            return { success: false, error: "Invalid admin session: Missing user ID" };
        }

        // Verify admin exists in DB to prevent foreign key error
        const adminUser = await (prisma as any).user.findUnique({
            where: { id: created_by }
        });

        if (!adminUser) {
            console.error("CRITICAL: CURRENT SESSION ADMIN ID NOT FOUND IN DB:", created_by);
            // List some users to help debug
            const someUsers = await (prisma as any).user.findMany({ take: 5, select: { id: true, email: true, role: true } });
            console.log("Current Users in DB (Sample):", someUsers);

            return { success: false, error: `Unauthorized: Admin user not found in database (ID: ${created_by}). Please logout and login again.` };
        }

        console.log("Creating coupon for user:", data.user_id, "by admin:", adminUser.email);

        // Verify recipient exists too
        const recipient = await (prisma as any).user.findUnique({
            where: { id: data.user_id }
        });

        if (!recipient) {
            console.error("RECIPIENT USER NOT FOUND IN DB:", data.user_id);
            return { success: false, error: `Recipient user not found in database (ID: ${data.user_id})` };
        }

        const coupon = await adminService.createCoupon({
            ...data,
            code,
            created_by
        });

        revalidatePath("/admin/coupons");
        return { success: true, data: serialize(coupon) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getCouponsAction(params?: {
    search?: string;
    user_id?: string;
    status?: "active" | "inactive" | "expired" | "all";
    limit?: number;
    offset?: number;
}) {
    try {
        const result = await adminService.getCoupons(params);
        return { success: true, data: serialize(result) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateCouponAction(id: string, data: {
    description?: string;
    expiry_days?: number;
    is_active?: boolean;
}) {
    try {
        const coupon = await adminService.updateCoupon(id, data);
        revalidatePath("/admin/coupons");
        return { success: true, data: serialize(coupon) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deactivateCouponAction(id: string) {
    try {
        const coupon = await adminService.deactivateCoupon(id);
        revalidatePath("/admin/coupons");
        return { success: true, data: serialize(coupon) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getCouponStatsAction(id: string) {
    try {
        const stats = await adminService.getCouponStats(id);
        return { success: true, data: serialize(stats) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getUsersForCouponAction() {
    try {
        const users = await adminService.getUsersForCoupon();
        return { success: true, data: serialize(users) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
