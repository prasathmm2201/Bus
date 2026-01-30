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

    return results.map((schedule: any) => {
        const route = schedule.route;

        // Helper to find node for returning original from/to names
        const cities = [
            { id: route.from_city_id, name: route.from_city.name },
            ...route.via_cities.map((v: any) => ({ id: v.city_id, name: v.city.name })),
            { id: route.to_city_id, name: route.to_city.name }
        ];

        const fromNode = cities.find(c => c.id === from || c.name.toLowerCase() === from.toLowerCase());
        const toNode = cities.find(c => c.id === to || c.name.toLowerCase() === to.toLowerCase());

        return {
            id: schedule.id,
            busName: schedule.bus.name,
            busType: schedule.bus.type,
            departureTime: schedule.departure_time, // In a real app, you'd offset this by via city arrival_time
            arrivalTime: schedule.arrival_time,
            price: schedule.price.toNumber(),
            availableSeats: schedule.seats.length,
            from: fromNode?.name || from,
            to: toNode?.name || to,
        };
    });
}
