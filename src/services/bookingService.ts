import prisma from "@/lib/prisma";
import { SeatStatus } from "@prisma/client";

export const bookingService = {
    async createBooking(data: {
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
        // 1. Fetch seats to calculate total cost and verify availability/lock
        const seatIds = data.passengers.map(p => p.seatId);
        const seats = await prisma.scheduleSeat.findMany({
            where: { id: { in: seatIds } }
        });

        if (seats.length !== seatIds.length) {
            throw new Error("Some seats not found");
        }

        // Verify lock ownership if token is provided
        if (data.lockToken) {
            const invalidLocks = seats.filter(s => s.lock_token !== data.lockToken || s.status !== SeatStatus.locked);
            if (invalidLocks.length > 0) {
                throw new Error("Seat lock expired or invalid. Please select seats again.");
            }
        } else {
            // If no token, check if they are available
            const unavailableSeats = seats.filter(s => s.status !== SeatStatus.available);
            if (unavailableSeats.length > 0) {
                throw new Error(`Seats ${unavailableSeats.map(s => s.seat_number).join(", ")} are no longer available`);
            }
        }

        const totalCost = seats.reduce((sum, seat) => sum + Number(seat.price), 0);
        let discountAmount = 0;
        let finalAmount = totalCost;
        let couponId = null;

        // 2. Validate Coupon if provided
        if (data.couponCode) {
            const { couponService } = await import("./couponService");
            const couponResult = await couponService.validateCoupon(data.couponCode, data.userId, totalCost);
            discountAmount = couponResult.discountAmount;
            finalAmount = couponResult.finalAmount;
            couponId = couponResult.coupon.id;
        }

        return await prisma.$transaction(async (tx) => {
            // 3. Create the booking record
            const booking = await tx.booking.create({
                data: {
                    booking_no: `SRB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    user_id: data.userId,
                    schedule_id: data.scheduleId,
                    bus_id: data.busId,
                    total_cost: totalCost,
                    discount_amount: discountAmount,
                    final_amount: finalAmount,
                    coupon_id: couponId,
                    status: "CONFIRMED",
                }
            });

            // 4. Create passengers and link them to the booking and seats
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

                // 5. Mark the seat as booked in the schedule and clear lock
                await tx.scheduleSeat.update({
                    where: { id: p.seatId },
                    data: {
                        status: SeatStatus.booked,
                        lock_token: null,
                        locked_at: null,
                        gender_lock: p.gender as any // Set booked seat gender too
                    }
                });

                // 5.1 Propagate gender lock to nearest seat
                const bookedSeat = seats.find(s => s.id === p.seatId);
                if (bookedSeat) {
                    const pairedCol =
                        bookedSeat.col === 0 ? 1 :
                            bookedSeat.col === 1 ? 0 :
                                bookedSeat.col === 2 ? 3 :
                                    bookedSeat.col === 3 ? 2 : -1;

                    if (pairedCol !== -1) {
                        // Find adjacent seat that is NOT currently being booked by this group
                        const adjacentSeat = await tx.scheduleSeat.findFirst({
                            where: {
                                schedule_id: data.scheduleId,
                                row: bookedSeat.row,
                                col: pairedCol,
                                deck: bookedSeat.deck,
                                status: SeatStatus.available, // Only lock if it's currently free
                                id: { notIn: seatIds } // Don't lock a seat we are also booking right now
                            }
                        });

                        if (adjacentSeat) {
                            await tx.scheduleSeat.update({
                                where: { id: adjacentSeat.id },
                                data: {
                                    gender_lock: p.gender as any
                                }
                            });
                        }
                    }
                }
            }

            // 6. Record Coupon Usage
            if (couponId) {
                await tx.couponUsage.create({
                    data: {
                        coupon_id: couponId,
                        user_id: data.userId,
                        booking_id: booking.id
                    }
                });
            }

            return booking;
        });
    },

    async lockSeats(scheduleId: string, seatIds: string[], userId: string) {
        const lockToken = `LOCK-${userId}-${Date.now()}`;
        const expiryTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago

        return await prisma.$transaction(async (tx) => {
            // Find seats that are either available OR have an expired lock
            const seats = await tx.scheduleSeat.findMany({
                where: {
                    id: { in: seatIds },
                    schedule_id: scheduleId,
                    OR: [
                        { status: SeatStatus.available },
                        {
                            status: SeatStatus.locked,
                            locked_at: { lt: expiryTime }
                        }
                    ]
                }
            });

            if (seats.length !== seatIds.length) {
                throw new Error("One or more selected seats are already booked or locked by another user.");
            }

            // Update seats to locked status
            await tx.scheduleSeat.updateMany({
                where: { id: { in: seatIds } },
                data: {
                    status: SeatStatus.locked,
                    lock_token: lockToken,
                    locked_at: new Date()
                }
            });

            return { lockToken, expiryAt: new Date(Date.now() + 10 * 60 * 1000) };
        });
    },

    async releaseSeats(lockToken: string) {
        return await prisma.scheduleSeat.updateMany({
            where: { lock_token: lockToken },
            data: {
                status: SeatStatus.available,
                lock_token: null,
                locked_at: null
            }
        });
    },

    async cleanupExpiredLocks() {
        const expiryTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
        return await prisma.scheduleSeat.updateMany({
            where: {
                status: SeatStatus.locked,
                locked_at: { lt: expiryTime }
            },
            data: {
                status: SeatStatus.available,
                lock_token: null,
                locked_at: null
            }
        });
    },

    async getUserBookings(userId: string) {
        return await prisma.booking.findMany({
            where: { user_id: userId },
            include: {
                bus: true,
                schedule: {
                    include: {
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
                        }
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
    },
    async getBookingById(id: string) {
        return await prisma.booking.findUnique({
            where: { id },
            include: {
                bus: true,
                schedule: {
                    include: {
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
                        }
                    }
                },
                passengers: {
                    include: {
                        passenger: true,
                        seat: true
                    }
                }
            }
        });
    }
};
