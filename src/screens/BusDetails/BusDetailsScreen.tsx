"use client";

import { useState, useEffect } from "react";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import SeatMap from "@/modules/seats/SeatMap";
import { useParams } from "next/navigation";
import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getScheduleDetailsAction } from "@/app/actions/busActions";

export default function BusDetailsScreen() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [busData, setBusData] = useState<any>(null);

    useEffect(() => {
        if (!id) return;

        const fetchDetails = async () => {
            setLoading(true);
            try {
                const res = await getScheduleDetailsAction(id as string);
                if (res.success && res.data) {
                    const schedule = res.data;
                    setBusData({
                        id: schedule.id,
                        busId: schedule.bus_id,
                        name: schedule.bus.name,
                        type: schedule.bus.type,
                        from: schedule.route.from_city,
                        to: schedule.route.to_city,
                        price: Number(schedule.price),
                        seats: schedule.seats.map((s: any) => ({
                            id: s.id,
                            number: s.seat_number,
                            status: s.status,
                            gender_lock: s.gender_lock,
                            type: s.type, // Keep original case (SEATER/SLEEPER)
                            deck: s.deck,
                            row: s.row,
                            col: s.col,
                        }))
                    });
                }
            } catch (error) {
                console.error("Failed to fetch schedule details", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    if (loading) return <div>Loading...</div>;

    return (
        <LayoutWrapper>
            <div className="bg-muted/30 border-b py-4">
                <div className="container mx-auto px-4">
                    <Button variant="ghost" size="sm" asChild className="mb-2">
                        <Link href="/search">
                            <MoveLeft className="mr-2 h-4 w-4" /> Back to Results
                        </Link>
                    </Button>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">{busData.name}</h1>
                            <p className="text-muted-foreground truncate">{busData.from} → {busData.to} • {busData.type}</p>
                        </div>
                        <div className="mt-4 md:mt-0 text-right">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Starting from</p>
                            <p className="text-2xl font-bold text-primary">₹{busData.price}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <SeatMap
                    seats={busData.seats}
                    price={busData.price}
                    onSelect={(selected) => console.log("Selected:", selected)}
                />
            </div>
        </LayoutWrapper>
    );
}
