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
                bus: {
                    include: {
                        template_seats: true // Fetch template seats if needed for base price ref, though we use schedule seats mostly
                    }
                },
                route: {
                    include: {
                        from_city: true,
                        to_city: true,
                        boarding_points: {
                            include: { boarding_point: true },
                            orderBy: { order: "asc" }
                        },
                        dropping_points: {
                            include: { dropping_point: true },
                            orderBy: { order: "asc" }
                        }
                    }
                },
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
