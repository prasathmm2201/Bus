"use server";

import { adminService } from "@/services/adminService";
import { revalidatePath } from "next/cache";
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
        revalidatePath("/search");
        return { success: true, data: schedules };
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

export async function getSchedulesAction(params?: { limit?: number; offset?: number; startDate?: string; endDate?: string; bus_id?: string; route_id?: string }) {
    try {
        const schedules = await adminService.getSchedules({
            ...params,
            startDate: params?.startDate ? new Date(params.startDate) : undefined,
            endDate: params?.endDate ? new Date(params.endDate) : undefined
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
