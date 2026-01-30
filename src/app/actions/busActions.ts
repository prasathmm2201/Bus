"use server";

import { searchBuses } from "@/services/busService";
import prisma from "@/lib/prisma";
import { serialize } from "@/lib/serialize";

export async function searchBusesAction(from: string, to: string, date: string) {
    try {
        const buses = await searchBuses(from, to, date);
        return { success: true, data: serialize(buses) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getScheduleDetailsAction(id: string) {
    try {
        const schedule = await prisma.schedule.findUnique({
            where: { id },
            include: {
                bus: true,
                route: true,
                seats: {
                    orderBy: {
                        seat_number: "asc"
                    }
                }
            }
        });
        return { success: true, data: serialize(schedule) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
