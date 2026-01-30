import prisma from "@/lib/prisma";

export const bookingService = {
    async createBooking(data: {
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
        return await prisma.$transaction(async (tx) => {
            // 1. Create the booking record
            const booking = await tx.booking.create({
                data: {
                    booking_no: `SRB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    user_id: data.userId,
                    schedule_id: data.scheduleId,
                    bus_id: data.busId,
                    total_cost: data.totalCost,
                    status: "CONFIRMED",
                }
            });

            // 2. Create passengers and link them to the booking and seats
            for (const p of data.passengers) {
                const passenger = await tx.passenger.create({
                    data: {
                        name: p.name,
                        age: p.age,
                        gender: p.gender,
                        created_by: data.userId,
                    }
                });

                await tx.bookingPassenger.create({
                    data: {
                        booking_id: booking.id,
                        passenger_id: passenger.id,
                        seat_id: p.seatId,
                    }
                });

                // 3. Mark the seat as booked in the schedule
                await tx.scheduleSeat.update({
                    where: { id: p.seatId },
                    data: { status: "booked" }
                });
            }

            return booking;
        });
    },

    async getUserBookings(userId: string) {
        return await prisma.booking.findMany({
            where: { user_id: userId },
            include: {
                bus: true,
                schedule: {
                    include: {
                        route: true
                    }
                },
                passengers: {
                    include: {
                        passenger: true,
                        seat: true
                    }
                }
            },
            orderBy: { created_at: "desc" }
        });
    }
};
