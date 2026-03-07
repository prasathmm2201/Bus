"use server";

import { bookingService } from "@/services/bookingService";
import { revalidatePath } from "next/cache";
import { serialize } from "@/lib/serialize";

export async function createBookingAction(data: {
    userId: string;
    scheduleId: string;
    busId: string;
    couponCode?: string;
    lockToken?: string;
    passengers: {
        name: string;
        age: number;
        gender: "male" | "female" | "other";
        seatId: string;
    }[];
}) {
    try {
        const booking = await bookingService.createBooking(data);
        revalidatePath("/my-bookings");
        revalidatePath("/admin/schedules");
        return { success: true, data: serialize(booking) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function lockSeatsAction(scheduleId: string, seatIds: string[], userId: string) {
    try {
        const result = await bookingService.lockSeats(scheduleId, seatIds, userId);
        return { success: true, data: result };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function releaseSeatsAction(lockToken: string) {
    try {
        await bookingService.releaseSeats(lockToken);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
export async function getUserBookingsAction(userId: string) {
    try {
        const bookings = await bookingService.getUserBookings(userId);
        return { success: true, data: serialize(bookings) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
export async function cleanupExpiredLocksAction() {
    try {
        await bookingService.cleanupExpiredLocks();
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
export async function getBookingByIdAction(id: string) {
    try {
        const booking = await bookingService.getBookingById(id);
        if (!booking) throw new Error("Booking not found");
        return { success: true, data: serialize(booking) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
