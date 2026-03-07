import prisma from "@/lib/prisma";
import { SeatType, Deck, BusType, SeatLayout, Prisma } from "@prisma/client";
import { deleteFromS3 } from "@/lib/s3";

const parseTime12h = (timeStr: string) => {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
    if (!match) {
        // Fallback to 24h format if match fails
        const [h, m] = timeStr.split(":").map(Number);
        return [h || 0, m || 0];
    }
    let h = Number(match[1]);
    const m = Number(match[2]);
    const period = match[3].toUpperCase();

    if (period === "PM" && h < 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return [h, m];
};

/**
 * Service to handle Admin operations for Bus Management
 */
export const adminService = {
    /**
     * Create a new bus with its layout template
     */
    async createBus(data: {
        name: string;
        type: BusType;
        is_ac: boolean;
        is_sleeper: boolean;
        is_seater: boolean;
        seat_layout: SeatLayout;
        total_seats: number;
        seats: {
            seat_number: string;
            type: SeatType;
            deck: Deck;
            row: number;
            col: number;
            price?: number;
        }[];
        images?: string[];
    }) {
        return await prisma.bus.create({
            data: {
                name: data.name,
                type: data.type,
                is_ac: data.is_ac,
                is_sleeper: data.is_sleeper,
                is_seater: data.is_seater,
                seat_layout: data.seat_layout,
                total_seats: data.total_seats,
                template_seats: {
                    createMany: {
                        data: data.seats
                    }
                },
                images: data.images
            },
            include: {
                template_seats: true
            }
        });
    },

    /**
     * Create schedules for a date range
     */
    async createScheduleRange(data: {
        bus_id: string;
        route_id: string;
        startDate: Date;
        endDate: Date;
        departureTime: string; // HH:mm
        arrivalTime: string;   // HH:mm
        price?: number;
        addon_amount?: number;
        discount_percentage?: number;
        isNextDay?: boolean;
        is_pickup?: boolean;
    }) {
        const bus = await prisma.bus.findUnique({
            where: { id: data.bus_id },
            include: { template_seats: true }
        });

        if (!bus) throw new Error("Bus not found");

        const schedules = [];
        const [depH, depM] = parseTime12h(data.departureTime);
        const [arrH, arrM] = parseTime12h(data.arrivalTime);

        for (let d = new Date(data.startDate); d <= data.endDate; d.setDate(d.getDate() + 1)) {
            const departure = new Date(d);
            departure.setHours(depH, depM, 0, 0);

            const arrival = new Date(d);
            arrival.setHours(arrH, arrM, 0, 0);

            if (data.isNextDay) {
                arrival.setDate(arrival.getDate() + 1);
            } else if (arrival < departure) {
                // Auto-fallback for simple cases if flag not provided or if it's logically next day anyway
                arrival.setDate(arrival.getDate() + 1);
            }

            const schedule = await prisma.schedule.create({
                data: {
                    bus_id: data.bus_id,
                    route_id: data.route_id,
                    departure_time: departure,
                    arrival_time: arrival,
                    price: data.price || 0,
                    addon_amount: data.addon_amount || 0,
                    discount_percentage: data.discount_percentage || 0,
                    is_pickup: data.is_pickup ?? true,
                    seats: {
                        createMany: {
                            data: bus.template_seats.map(ts => {
                                const base = ts.price ? Number(ts.price) : (data.price || 0);
                                const addon = data.addon_amount || 0;
                                const disc = data.discount_percentage || 0;
                                const finalPrice = (base + addon) * (1 - disc / 100);

                                return {
                                    bus_id: data.bus_id,
                                    route_id: data.route_id,
                                    template_seat_id: ts.id,
                                    seat_number: ts.seat_number,
                                    type: ts.type,
                                    deck: ts.deck,
                                    row: ts.row,
                                    col: ts.col,
                                    price: finalPrice,
                                    status: "available"
                                };
                            })
                        }
                    }
                }
            });
            schedules.push(schedule);
        }
        return schedules;
    },

    /**
     * Fetch Dashboard Statistics
     */
    async getDashboardStats() {
        const totalBookings = await prisma.booking.count();
        const revenueResult = await prisma.booking.aggregate({
            _sum: { total_cost: true }
        });
        const activeBuses = await prisma.bus.count();
        const totalUsers = await prisma.user.count({ where: { role: "USER" } });

        return {
            totalBookings,
            revenue: revenueResult._sum.total_cost?.toNumber() || 0,
            activeBuses,
            totalUsers
        };
    },

    /**
     * Fetch all buses with their details
     */
    async getBuses() {
        return await prisma.bus.findMany({
            include: {
                template_seats: true,
                schedules: {
                    include: {
                        route: {
                            include: {
                                from_city: true,
                                to_city: true
                            }
                        }
                    }
                }
            },
            orderBy: { created_at: "desc" }
        });
    },

    /**
     * Update a bus
     */
    async updateBus(id: string, data: {
        name: string;
        type: BusType;
        is_ac: boolean;
        is_sleeper: boolean;
        is_seater: boolean;
        seat_layout: SeatLayout;
        total_seats: number;
        seats: {
            seat_number: string;
            type: SeatType;
            deck: Deck;
            row: number;
            col: number;
            price?: number;
        }[];
        images?: string[];
    }) {
        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Update basic info
            const bus = await tx.bus.update({
                where: { id },
                data: {
                    name: data.name,
                    type: data.type,
                    is_ac: data.is_ac,
                    is_sleeper: data.is_sleeper,
                    is_seater: data.is_seater,
                    seat_layout: data.seat_layout,
                    total_seats: data.total_seats,
                    images: data.images
                }
            });

            // 2. Clear existing template seats and create new ones
            // Note: In a real prod app with relationships, this might be restricted if schedules exist.
            // For now we assume it's allowed or handled by cascade if configured (or we just do it).
            await tx.busTemplateSeat.deleteMany({
                where: { bus_id: id }
            });

            await tx.busTemplateSeat.createMany({
                data: data.seats.map(s => ({ ...s, bus_id: id }))
            });

            return bus;
        });
    },

    /**
     * Delete a bus
     */
    async deleteBus(id: string) {
        const bus = await prisma.bus.findUnique({ where: { id } });
        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Delete Payments linked to bookings of this bus's schedules
            await tx.payment.deleteMany({
                where: { booking: { bus_id: id } }
            });

            // 2. Delete BookingPassengers
            await tx.bookingPassenger.deleteMany({
                where: {
                    OR: [
                        { booking: { bus_id: id } },
                        { seat: { bus_id: id } }
                    ]
                }
            });

            // 3. Delete Bookings
            await tx.booking.deleteMany({
                where: { bus_id: id }
            });

            // 4. Delete Schedule Seats
            await tx.scheduleSeat.deleteMany({
                where: { bus_id: id }
            });

            // 5. Delete Schedules
            await tx.schedule.deleteMany({
                where: { bus_id: id }
            });

            // 6. Delete Template Seats
            await tx.busTemplateSeat.deleteMany({
                where: { bus_id: id }
            });

            // 7. Finally Delete the Bus
            const deleted = await tx.bus.delete({
                where: { id }
            });

            // Cleanup S3 image
            if (bus?.images && bus.images.length > 0) {
                await Promise.all(bus.images.map(img => deleteFromS3(img)));
            }

            return deleted;
        });
    },

    /**
     * Fetch all schedules with statistics
     */
    async getSchedules(params?: { limit?: number; offset?: number; startDate?: Date; endDate?: Date; bus_id?: string; route_id?: string }) {
        const where: any = {};
        if (params?.startDate || params?.endDate) {
            where.departure_time = {};
            if (params.startDate) where.departure_time.gte = params.startDate;
            if (params.endDate) where.departure_time.lte = params.endDate;
        }
        if (params?.bus_id) where.bus_id = params.bus_id;
        if (params?.route_id) where.route_id = params.route_id;

        const schedules = await prisma.schedule.findMany({
            where,
            include: {
                bus: true,
                route: {
                    include: {
                        from_city: true,
                        to_city: true
                    }
                },
                seats: true,
                bookings: true
            },
            orderBy: { departure_time: "desc" },
            take: params?.limit,
            skip: params?.offset
        });

        return schedules.map(s => {
            const bookedCount = s.seats.filter(seat => seat.status === "booked").length;
            const availableCount = s.seats.length - bookedCount;
            return {
                ...s,
                bookedCount,
                availableCount,
                bookingCount: s.bookings.length
            };
        });
    },

    async updateSchedule(id: string, data: { departureTime: string; arrivalTime: string; addon_amount?: number; discount_percentage?: number; isNextDay?: boolean; is_pickup?: boolean }) {
        const existing = await prisma.schedule.findUnique({
            where: { id },
            include: { seats: true }
        });

        if (!existing) throw new Error("Schedule not found");

        const departureDate = new Date(existing.departure_time);
        const [dHours, dMinutes] = parseTime12h(data.departureTime);
        departureDate.setHours(dHours, dMinutes, 0, 0);

        const arrivalDate = new Date(departureDate);
        const [aHours, aMinutes] = parseTime12h(data.arrivalTime);
        arrivalDate.setHours(aHours, aMinutes, 0, 0);

        if (data.isNextDay) {
            arrivalDate.setDate(arrivalDate.getDate() + 1);
        } else if (arrivalDate < departureDate) {
            arrivalDate.setDate(arrivalDate.getDate() + 1);
        }

        return await prisma.$transaction(async (tx) => {
            // Update the Schedule itself
            const schedule = await tx.schedule.update({
                where: { id },
                data: {
                    departure_time: departureDate,
                    arrival_time: arrivalDate,
                    addon_amount: data.addon_amount || 0,
                    discount_percentage: data.discount_percentage || 0,
                    is_pickup: data.is_pickup ?? true
                }
            });

            // Update all related seats that are still "available"
            // If they have a template_seat_id, we can recalculate their price based on the template
            // For now, let's just update the price of all available seats in this schedule
            // We need to fetch the bus template seats to get the base prices
            const bus = await tx.bus.findUnique({
                where: { id: existing.bus_id },
                include: { template_seats: true }
            });

            if (!bus) throw new Error("Bus not found");

            // Bulk update available seats' prices
            for (const seat of existing.seats) {
                if (seat.status === "available") {
                    const templateSeat = bus.template_seats.find(ts => ts.seat_number === seat.seat_number);
                    const base = templateSeat?.price ? Number(templateSeat.price) : 0;
                    const addon = data.addon_amount || 0;
                    const disc = data.discount_percentage || 0;
                    const finalPrice = (base + addon) * (1 - disc / 100);

                    await tx.scheduleSeat.update({
                        where: { id: seat.id },
                        data: { price: finalPrice }
                    });
                }
            }

            return schedule;
        });
    },

    /**
     * Delete a schedule and its seats
     */
    async deleteSchedule(id: string) {
        return await prisma.$transaction(async (tx) => {
            // 1. Delete Payments linked to bookings of this schedule
            await tx.payment.deleteMany({
                where: { booking: { schedule_id: id } }
            });

            // 2. Delete BookingPassengers
            await tx.bookingPassenger.deleteMany({
                where: {
                    OR: [
                        { booking: { schedule_id: id } },
                        { seat: { schedule_id: id } }
                    ]
                }
            });

            // 3. Delete Bookings
            await tx.booking.deleteMany({
                where: { schedule_id: id }
            });

            // 4. Delete Seats
            await tx.scheduleSeat.deleteMany({
                where: { schedule_id: id }
            });

            // 5. Delete the schedule
            return await tx.schedule.delete({
                where: { id }
            });
        });
    },

    /**
     * Get detailed schedule info for a specific date
     */
    async getSchedulesByDate(date: string) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const schedules = await prisma.schedule.findMany({
            where: {
                departure_time: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                bus: true,
                route: {
                    include: {
                        from_city: true,
                        to_city: true
                    }
                },
                seats: true,
                bookings: true
            }
        });

        return schedules.map(s => {
            const bookedCount = s.seats.filter(seat => seat.status === "booked").length;
            const availableCount = s.seats.length - bookedCount;
            return {
                ...s,
                bookedCount,
                availableCount,
                bookingCount: s.bookings.length
            };
        });
    },

    /**
     * Fetch all cities
     */
    async getCities() {
        return await prisma.city.findMany({
            where: { is_active: true },
            orderBy: { name: "asc" }
        });
    },

    /**
     * Fetch the most recent bookings
     */
    async getRecentBookings(limit: number = 5) {
        return await prisma.booking.findMany({
            take: limit,
            orderBy: {
                created_at: "desc"
            },
            include: {
                user: true,
                schedule: {
                    include: {
                        route: {
                            include: {
                                from_city: true,
                                to_city: true
                            }
                        }
                    }
                },
                passengers: true
            }
        });
    },

    /**
     * Route Management
     */
    async createRoute(data: {
        from_city_id: string;
        to_city_id: string;
        distance_km: number;
        via_cities?: { id: string; arrival_time?: string; is_next_day?: boolean; is_pickup?: boolean }[]; // Updated to object with arrival_time
        boarding_points?: { id: string, time?: string; is_next_day?: boolean }[];
        dropping_points?: { id: string, time?: string; is_next_day?: boolean }[];
    }) {
        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const route = await tx.route.create({
                data: {
                    from_city_id: data.from_city_id,
                    to_city_id: data.to_city_id,
                    distance_km: data.distance_km
                }
            });

            if (data.via_cities && data.via_cities.length > 0) {
                const viaData = data.via_cities.map((via, index) => ({
                    route_id: route.id,
                    city_id: via.id,
                    order: index + 1,
                    arrival_time: via.arrival_time,
                    is_next_day: via.is_next_day || false,
                    is_pickup: via.is_pickup !== false
                }));
                await tx.routeViaCity.createMany({ data: viaData });
            }

            if (data.boarding_points && data.boarding_points.length > 0) {
                const bpData = data.boarding_points.map((bp, index) => ({
                    route_id: route.id,
                    boarding_point_id: bp.id,
                    order: index + 1,
                    time: bp.time,
                    is_next_day: bp.is_next_day || false
                }));
                await tx.routeBoardingPoint.createMany({ data: bpData });
            }

            if (data.dropping_points && data.dropping_points.length > 0) {
                const dpData = data.dropping_points.map((dp, index) => ({
                    route_id: route.id,
                    dropping_point_id: dp.id,
                    order: index + 1,
                    time: dp.time,
                    is_next_day: dp.is_next_day || false
                }));
                await tx.routeDroppingPoint.createMany({ data: dpData });
            }

            return route;
        });
    },

    async getRoutes() {
        return await prisma.route.findMany({
            orderBy: { created_at: "desc" },
            include: {
                from_city: true,
                to_city: true,
                via_cities: {
                    include: { city: true },
                    orderBy: { order: "asc" }
                },
                boarding_points: {
                    include: { boarding_point: true },
                    orderBy: { order: "asc" }
                },
                dropping_points: {
                    include: { dropping_point: true },
                    orderBy: { order: "asc" }
                }
            }
        });
    },

    // Helper to get city details with boarding points
    async getCityWithPoints(cityId: string) {
        return await prisma.city.findUnique({
            where: { id: cityId },
            include: { boarding_points: true }
        });
    },

    async updateRoute(id: string, data: {
        from_city_id: string;
        to_city_id: string;
        distance_km: number;
        via_cities?: { id: string; arrival_time?: string; is_next_day?: boolean; is_pickup?: boolean }[]; // Updated to object with arrival_time
        boarding_points?: { id: string, time?: string; is_next_day?: boolean }[];
        dropping_points?: { id: string, time?: string; is_next_day?: boolean }[];
    }) {
        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Update main route
            const route = await tx.route.update({
                where: { id },
                data: {
                    from_city_id: data.from_city_id,
                    to_city_id: data.to_city_id,
                    distance_km: data.distance_km
                }
            });

            // Refresh via cities
            await tx.routeViaCity.deleteMany({ where: { route_id: id } });
            if (data.via_cities && data.via_cities.length > 0) {
                const viaData = data.via_cities.map((via, index) => ({
                    route_id: id,
                    city_id: via.id,
                    order: index + 1,
                    arrival_time: via.arrival_time,
                    is_next_day: via.is_next_day || false,
                    is_pickup: via.is_pickup !== false
                }));
                await tx.routeViaCity.createMany({ data: viaData });
            }

            // Refresh boarding points
            await tx.routeBoardingPoint.deleteMany({ where: { route_id: id } });
            if (data.boarding_points && data.boarding_points.length > 0) {
                const bpData = data.boarding_points.map((bp, index) => ({
                    route_id: id,
                    boarding_point_id: bp.id,
                    order: index + 1,
                    time: bp.time,
                    is_next_day: bp.is_next_day || false
                }));
                await tx.routeBoardingPoint.createMany({ data: bpData });
            }

            // Refresh dropping points
            await tx.routeDroppingPoint.deleteMany({ where: { route_id: id } });
            if (data.dropping_points && data.dropping_points.length > 0) {
                const dpData = data.dropping_points.map((dp, index) => ({
                    route_id: id,
                    dropping_point_id: dp.id,
                    order: index + 1,
                    time: dp.time,
                    is_next_day: dp.is_next_day || false
                }));
                await tx.routeDroppingPoint.createMany({ data: dpData });
            }

            return route;
        });
    },

    async deleteRoute(id: string) {
        // Check for active schedules
        const scheduleUsage = await prisma.schedule.findFirst({
            where: { route_id: id }
        });

        if (scheduleUsage) {
            throw new Error("Cannot delete route: It is currently used in one or more active schedules.");
        }

        return await prisma.route.delete({
            where: { id }
        });
    },

    /**
     * City Management
     */
    async createCity(data: { name: string; state: string }) {
        return await prisma.city.create({
            data: {
                name: data.name,
                state: data.state
            }
        });
    },

    async updateCity(id: string, data: { name: string; state: string; is_active?: boolean }) {
        return await prisma.city.update({
            where: { id },
            data: {
                name: data.name,
                state: data.state,
                is_active: data.is_active
            }
        });
    },

    async deleteCity(id: string) {
        // Check if city is used in any routes as from_city or to_city
        const city = await prisma.city.findUnique({
            where: { id },
            select: { name: true }
        });

        if (!city) throw new Error("City not found");

        const routeUsage = await prisma.route.findFirst({
            where: {
                OR: [
                    { from_city_id: id },
                    { to_city_id: id }
                ]
            }
        });

        if (routeUsage) {
            throw new Error("Cannot delete city: It is currently used in one or more routes.");
        }

        // Check via cities
        const viaCityUsage = await prisma.routeViaCity.findFirst({
            where: { city_id: id }
        });

        if (viaCityUsage) {
            throw new Error("Cannot delete city: It is currently used as a via-city in one or more routes.");
        }

        return await prisma.city.delete({
            where: { id }
        });
    },

    /**
     * Boarding Point Management
     */
    async getBoardingPoints() {
        return await prisma.boardingPoint.findMany({
            include: { city: true },
            orderBy: { name: "asc" }
        });
    },

    async createBoardingPoint(data: { name: string; city_id: string }) {
        return await prisma.boardingPoint.create({
            data: {
                name: data.name,
                city_id: data.city_id
            }
        });
    },

    async updateBoardingPoint(id: string, data: { name: string; city_id: string }) {
        return await prisma.boardingPoint.update({
            where: { id },
            data: {
                name: data.name,
                city_id: data.city_id
            }
        });
    },

    async deleteBoardingPoint(id: string) {
        // Check usage in RouteBoardingPoint or RouteDroppingPoint
        const bpUsage = await prisma.routeBoardingPoint.findFirst({
            where: { boarding_point_id: id }
        });

        if (bpUsage) {
            throw new Error("Cannot delete boarding point: It is currently mapped to one or more routes.");
        }

        const dpUsage = await prisma.routeDroppingPoint.findFirst({
            where: { dropping_point_id: id }
        });

        if (dpUsage) {
            throw new Error("Cannot delete boarding point: It is currently mapped as a dropping point in one or more routes.");
        }

        return await prisma.boardingPoint.delete({
            where: { id }
        });
    },

    /**
     * Coupon Management
     */
    async createCoupon(data: {
        code: string;
        user_id: string;
        created_by: string;
        description?: string;
        discount_type: "FLAT" | "PERCENTAGE";
        discount_value: number;
        min_order_value?: number;
        max_discount?: number;
        expiry_days: number;
        usage_limit?: number;
    }) {
        // Validate user exists and has USER role
        const user = await prisma.user.findUnique({
            where: { id: data.user_id }
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (user.role !== "USER") {
            throw new Error("Coupons can only be created for users with USER role");
        }

        // Check if user already has an active coupon
        const existingActiveCoupon = await prisma.coupon.findFirst({
            where: {
                user_id: data.user_id,
                is_active: true,
                valid_until: {
                    gte: new Date()
                }
            }
        });

        if (existingActiveCoupon) {
            throw new Error(`User already has an active coupon: ${existingActiveCoupon.code}`);
        }

        // Validate discount values
        if (data.discount_type === "PERCENTAGE" && data.discount_value > 100) {
            throw new Error("Percentage discount cannot exceed 100%");
        }

        if (data.discount_value <= 0) {
            throw new Error("Discount value must be greater than 0");
        }

        if (data.expiry_days <= 0) {
            throw new Error("Expiry days must be greater than 0");
        }

        // Calculate expiry date
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + data.expiry_days);
        validUntil.setHours(23, 59, 59, 999); // End of day

        // Create coupon
        return await prisma.coupon.create({
            data: {
                code: data.code,
                user_id: data.user_id,
                created_by: data.created_by,
                description: data.description,
                discount_type: data.discount_type,
                discount_value: data.discount_value,
                min_order_value: data.min_order_value || 0,
                max_discount: data.max_discount,
                valid_until: validUntil,
                usage_limit: data.usage_limit,
                user_limit: 1, // User-specific coupons are single-use per user
                is_active: true
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        mobile_no: true
                    }
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
    },

    async getCoupons(params?: {
        search?: string;
        user_id?: string;
        status?: "active" | "inactive" | "expired" | "all";
        limit?: number;
        offset?: number;
    }) {
        const where: any = {};

        // Search by code
        if (params?.search) {
            where.code = {
                contains: params.search.toUpperCase(),
                mode: "insensitive"
            };
        }

        // Filter by user
        if (params?.user_id) {
            where.user_id = params.user_id;
        }

        // Filter by status
        if (params?.status && params.status !== "all") {
            const now = new Date();

            if (params.status === "active") {
                where.is_active = true;
                where.OR = [
                    { valid_until: null },
                    { valid_until: { gte: now } }
                ];
            } else if (params.status === "inactive") {
                where.is_active = false;
            } else if (params.status === "expired") {
                where.valid_until = { lt: now };
            }
        }

        const [coupons, total] = await Promise.all([
            prisma.coupon.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            mobile_no: true
                        }
                    },
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    usages: true,
                    _count: {
                        select: {
                            usages: true
                        }
                    }
                },
                orderBy: { created_at: "desc" },
                take: params?.limit || 50,
                skip: params?.offset || 0
            }),
            prisma.coupon.count({ where })
        ]);

        // Add computed fields
        const now = new Date();
        const enrichedCoupons = coupons.map(coupon => ({
            ...coupon,
            is_expired: coupon.valid_until ? coupon.valid_until < now : false,
            usage_count: coupon._count.usages,
            can_edit: coupon._count.usages === 0 // Can only edit if not used
        }));

        return {
            coupons: enrichedCoupons,
            total,
            page: Math.floor((params?.offset || 0) / (params?.limit || 50)) + 1,
            totalPages: Math.ceil(total / (params?.limit || 50))
        };
    },

    async updateCoupon(id: string, data: {
        description?: string;
        expiry_days?: number;
        is_active?: boolean;
    }) {
        const existing = await prisma.coupon.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { usages: true }
                }
            }
        });

        if (!existing) {
            throw new Error("Coupon not found");
        }

        // Prevent editing if coupon has been used
        if (existing._count.usages > 0 && (data.expiry_days !== undefined)) {
            throw new Error("Cannot modify expiry of a coupon that has already been used");
        }

        const updateData: any = {};

        if (data.description !== undefined) {
            updateData.description = data.description;
        }

        if (data.is_active !== undefined) {
            updateData.is_active = data.is_active;
        }

        if (data.expiry_days !== undefined) {
            if (data.expiry_days <= 0) {
                throw new Error("Expiry days must be greater than 0");
            }

            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + data.expiry_days);
            validUntil.setHours(23, 59, 59, 999);

            updateData.valid_until = validUntil;
        }

        return await prisma.coupon.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        mobile_no: true
                    }
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
    },

    async deactivateCoupon(id: string) {
        const coupon = await prisma.coupon.findUnique({
            where: { id }
        });

        if (!coupon) {
            throw new Error("Coupon not found");
        }

        return await prisma.coupon.update({
            where: { id },
            data: { is_active: false },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
    },

    async getCouponStats(id: string) {
        const coupon = await prisma.coupon.findUnique({
            where: { id },
            include: {
                usages: {
                    include: {
                        booking: {
                            select: {
                                booking_no: true,
                                total_cost: true,
                                discount_amount: true,
                                created_at: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (!coupon) {
            throw new Error("Coupon not found");
        }

        const totalDiscount = coupon.usages.reduce(
            (sum, usage) => sum + Number(usage.booking.discount_amount),
            0
        );

        return {
            coupon,
            usage_count: coupon.usages.length,
            total_discount: totalDiscount,
            is_expired: coupon.valid_until ? coupon.valid_until < new Date() : false
        };
    },

    async getUsersForCoupon() {
        return await prisma.user.findMany({
            where: {
                role: "USER",
                is_delete: false
            },
            select: {
                id: true,
                name: true,
                email: true,
                mobile_no: true,
                country_code: true
            },
            orderBy: { created_at: "desc" }
        });
    }
};


