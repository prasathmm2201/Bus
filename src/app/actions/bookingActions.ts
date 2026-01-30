"use server";

import { bookingService } from "@/services/bookingService";
import { revalidatePath } from "next/cache";

export async function createBookingAction(data: {
    userId: string;
    scheduleId: string;
    busId: string;
    totalCost: number;
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
        return { success: true, data: booking };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
export async function getUserBookingsAction(userId: string) {
    try {
        const bookings = await bookingService.getUserBookings(userId);
        return { success: true, data: bookings };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
