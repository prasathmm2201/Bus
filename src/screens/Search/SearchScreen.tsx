"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bus, Clock, Calendar, MoveRight, Filter, ChevronRight } from "lucide-react";
import Link from "next/link";
import { searchBusesAction } from "@/app/actions/busActions";

interface BusResult {
    id: string;
    busName: string;
    busType: string;
    departureTime: string;
    arrivalTime: string;
    price: number;
    availableSeats: number;
    from: string;
    to: string;
}

export default function SearchScreen() {
    const searchParams = useSearchParams();
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const date = searchParams.get("date");

    const [buses, setBuses] = useState<BusResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, this would be a server action or fetch
        // For now, I'll mock the fetching or call the service via an API route
        const fetchBuses = async () => {
            if (!from || !to || !date) return;

            setLoading(true);
            try {
                const res = await searchBusesAction(from, to, date);
                if (res.success && res.data) {
                    setBuses(res.data);
                } else {
                    console.error(res.error);
                }
            } catch (error) {
                console.error("Failed to fetch buses", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBuses();
    }, [from, to, date]);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {from} <MoveRight className="h-5 w-5 text-primary" /> {to}
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2 text-sm mt-1">
                        <Calendar className="h-4 w-4" /> {date} • {buses.length} Buses found
                    </p>
                </div>
                <Button variant="outline" className="md:hidden">
                    <Filter className="mr-2 h-4 w-4" /> Filters
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                {/* Filters Sidebar */}
                <aside className="hidden md:block space-y-6">
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-semibold mb-4">Filters</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Bus Type</label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" className="rounded border-gray-300" /> AC
                                        </label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" className="rounded border-gray-300" /> Non-AC
                                        </label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" className="rounded border-gray-300" /> Sleeper
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Departure Time</label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" className="rounded border-gray-300" /> Before 6 AM
                                        </label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" className="rounded border-gray-300" /> 6 AM - 12 PM
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </aside>

                {/* Bus List */}
                <div className="md:col-span-3 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        </div>
                    ) : buses.length > 0 ? (
                        buses.map((bus) => (
                            <Card key={bus.id} className="overflow-hidden transition-all hover:border-primary/50">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                        <div className="flex-1 p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-lg">{bus.busName}</h3>
                                                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                                                    {bus.busType}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="text-center md:text-left">
                                                    <p className="text-xl font-bold">{new Date(bus.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    <p className="text-sm text-muted-foreground">{bus.from}</p>
                                                </div>

                                                <div className="flex flex-col items-center px-4">
                                                    <div className="h-px w-12 bg-border relative">
                                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-1 w-1 bg-border rounded-full"></div>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground mt-1">8h 00m</span>
                                                </div>

                                                <div className="text-center md:text-right">
                                                    <p className="text-xl font-bold">{new Date(bus.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    <p className="text-sm text-muted-foreground">{bus.to}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-muted/30 border-t md:border-t-0 md:border-l p-6 flex flex-col justify-center items-center md:items-end md:w-48 gap-3">
                                            <div className="text-center md:text-right">
                                                <p className="text-xs text-muted-foreground">Prices from</p>
                                                <p className="text-2xl font-bold text-primary">₹{bus.price}</p>
                                            </div>
                                            <p className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                                {bus.availableSeats} Seats left
                                            </p>
                                            <Button asChild className="w-full">
                                                <Link href={`/bus/${bus.id}`}>
                                                    Select Seats
                                                    <ChevronRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No buses found for this date. Try another date.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
