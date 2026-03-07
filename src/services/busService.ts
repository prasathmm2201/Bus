import prisma from "@/lib/prisma";

export async function searchBuses(from: string, to: string, date: string) {
    const travelDate = new Date(date);
    travelDate.setHours(0, 0, 0, 0);

    // To handle next-day arrival/pickup, we need to check schedules departing 
    // on the search date AND schedules departing on the previous day.
    const prevDate = new Date(travelDate);
    prevDate.setDate(prevDate.getDate() - 1);

    const searchStart = new Date(prevDate);
    searchStart.setHours(0, 0, 0, 0);
    const searchEnd = new Date(travelDate);
    searchEnd.setHours(23, 59, 59, 999);

    const schedules = await prisma.schedule.findMany({
        where: {
            departure_time: {
                gte: searchStart,
                lte: searchEnd,
            },
        },
        include: {
            route: {
                include: {
                    from_city: true,
                    to_city: true,
                    via_cities: {
                        include: { city: true },
                        orderBy: { order: "asc" }
                    },
                    boarding_points: {
                        include: { boarding_point: true }
                    },
                    dropping_points: {
                        include: { dropping_point: true }
                    }
                }
            },
            bus: true,
            seats: {
                where: { status: "available" },
            },
        },
    });

    // Filter results based on the full route sequence
    const results = schedules.filter((schedule: any) => {
        const route = schedule.route;

        // Construct the full sequence of cities: Origin -> Via Cities -> Destination
        const cities = [
            { id: route.from_city_id, name: route.from_city.name, is_next_day: false, is_pickup: true, order: 0 },
            ...route.via_cities.map((v: any) => ({
                id: v.city_id,
                name: v.city.name,
                is_next_day: v.is_next_day,
                is_pickup: v.is_pickup,
                order: v.order
            })),
            { id: route.to_city_id, name: route.to_city.name, is_next_day: false, is_pickup: false, order: 999 }
        ];

        // Find the "from" and "to" nodes in the city sequence
        // We support searching by City ID (preferred) or City Name
        const fromNode = cities.find(c => c.id === from || c.name.toLowerCase() === from.toLowerCase());
        const toNode = cities.find(c => c.id === to || c.name.toLowerCase() === to.toLowerCase());

        // Basic validation: both cities must exist in the route and "from" must be before "to"
        if (!fromNode || !toNode || fromNode.order >= toNode.order) return false;

        // "from" must be a valid pickup point
        if (!fromNode.is_pickup) return false;

        // Check date match: schedule departure date + city next_day offset must equal travelDate
        const scheduleDepDate = new Date(schedule.departure_time);
        scheduleDepDate.setHours(0, 0, 0, 0);

        const actualPickupDate = new Date(scheduleDepDate);
        if (fromNode.is_next_day) {
            actualPickupDate.setDate(actualPickupDate.getDate() + 1);
        }

        return actualPickupDate.getTime() === travelDate.getTime();
    });

    // Helper to parse time string "HH:MM AM/PM"
    const parseTime = (date: Date, timeStr: string, isNextDay: boolean) => {
        if (!timeStr) return date;
        const [time, period] = timeStr.trim().split(" ");
        let [hours, minutes] = time.split(":").map(Number);

        if (period?.toUpperCase() === "PM" && hours !== 12) hours += 12;
        if (period?.toUpperCase() === "AM" && hours === 12) hours = 0;

        const newDate = new Date(date);
        newDate.setHours(hours, minutes, 0, 0);
        if (isNextDay) {
            newDate.setDate(newDate.getDate() + 1);
        }
        return newDate;
    };

    return results.map((schedule: any) => {
        const route = schedule.route;

        const cities = [
            { id: route.from_city_id, name: route.from_city.name, arrival_time: null, is_next_day: false },
            ...route.via_cities.map((v: any) => ({
                id: v.city_id,
                name: v.city.name,
                arrival_time: v.arrival_time,
                is_next_day: v.is_next_day
            })),
            { id: route.to_city_id, name: route.to_city.name, arrival_time: null, is_next_day: false }
        ];

        const fromNode = cities.find(c => c.id === from || c.name.toLowerCase() === from.toLowerCase());
        const toNode = cities.find(c => c.id === to || c.name.toLowerCase() === to.toLowerCase());

        // Calculate Departure Time
        let departureTime = new Date(schedule.departure_time);
        if (fromNode && fromNode.arrival_time) {
            const baseDate = new Date(schedule.departure_time);
            baseDate.setHours(0, 0, 0, 0);
            departureTime = parseTime(baseDate, fromNode.arrival_time, fromNode.is_next_day);
        }

        // Calculate Arrival Time
        let arrivalTime = new Date(schedule.arrival_time);
        if (toNode && toNode.id !== route.to_city_id && toNode.arrival_time) {
            const baseDate = new Date(schedule.departure_time);
            baseDate.setHours(0, 0, 0, 0);
            arrivalTime = parseTime(baseDate, toNode.arrival_time, toNode.is_next_day);
        }

        // Get Boarding Points
        const boardingPoints = route.boarding_points
            ?.filter((bp: any) => bp.boarding_point.city_id === fromNode?.id)
            .map((bp: any) => ({
                id: bp.id,
                name: bp.boarding_point.name,
                time: bp.time,
                is_next_day: bp.is_next_day
            })) || [];

        // Get Dropping Points
        const droppingPoints = route.dropping_points
            ?.filter((dp: any) => dp.dropping_point.city_id === toNode?.id)
            .map((dp: any) => ({
                id: dp.id,
                name: dp.dropping_point.name,
                time: dp.time,
                is_next_day: dp.is_next_day
            })) || [];

        return {
            id: schedule.id,
            busName: schedule.bus.name,
            busType: schedule.bus.type,
            isAc: schedule.bus.is_ac,
            isSleeper: schedule.bus.is_sleeper,
            isSeater: schedule.bus.is_seater,
            amenities: [
                schedule.bus.is_ac ? "AC" : "Non-AC",
                schedule.bus.is_sleeper ? "Sleeper" : null,
                schedule.bus.is_seater ? "Seater" : null
            ].filter((a): a is string => !!a),
            departureTime: departureTime.toISOString(),
            arrivalTime: arrivalTime.toISOString(),
            price: schedule.seats.length > 0
                ? Math.min(...schedule.seats.map((s: any) => Number(s.price)))
                : schedule.price.toNumber(),
            availableSeats: schedule.seats.length,
            from: fromNode?.name || from,
            to: toNode?.name || to,
            boardingPoints,
            droppingPoints
        };
    });
}

export async function getPopularRoutes() {
    // Get distinct routes from schedules to ensure we only show active routes
    const schedules = await prisma.schedule.findMany({
        distinct: ['route_id'],
        take: 6,
        include: {
            route: {
                include: {
                    from_city: true,
                    to_city: true
                }
            }
        },
        orderBy: {
            // We can't order by bookings count easily without aggregation, 
            // so we'll order by creation date or just take random/latest active ones.
            // For now, let's take the latest schedules' routes.
            created_at: 'desc'
        }
    });

    return schedules.map(s => ({
        id: s.route.id,
        from: s.route.from_city.name,
        to: s.route.to_city.name,
        price: s.price.toNumber() // Starting price for this route
    }));
}

export async function getBusImages() {
    const buses = await prisma.bus.findMany({
        where: {
            images: {
                isEmpty: false
            }
        },
        select: {
            images: true,
            name: true
        },
        take: 10
    });

    // Flatten images and take first 5-10
    const images: { url: string, alt: string }[] = [];
    buses.forEach(bus => {
        bus.images.forEach(img => {
            if (images.length < 10) {
                images.push({ url: img, alt: bus.name });
            }
        });
    });

    return images;
}
