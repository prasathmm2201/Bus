"use client";

import { useAuth } from "@/store/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect, Suspense } from "react";
import { getScheduleDetailsAction } from "@/app/actions/busActions";
import { createBookingAction } from "@/app/actions/bookingActions";
import { toast } from "sonner";
import AuthGuard from "@/components/auth/AuthGuard";

function PassengerDetailsContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const scheduleId = searchParams.get("scheduleId");
    const seatIds = searchParams.get("selectedSeats")?.split(",") || [];

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [schedule, setSchedule] = useState<any>(null);
    const [passengers, setPassengers] = useState<any[]>([]);

    useEffect(() => {
        if (!scheduleId || seatIds.length === 0) return;

        const fetchDetails = async () => {
            const res = await getScheduleDetailsAction(scheduleId);
            if (res.success && res.data) {
                setSchedule(res.data);
                const selectedSeatsData = res.data.seats.filter((s: any) => seatIds.includes(s.id));
                setPassengers(selectedSeatsData.map((s: any) => ({
                    seatId: s.id,
                    seatNumber: s.seat_number,
                    deck: s.deck,
                    name: "",
                    age: "",
                    gender: "male"
                })));
            }
            setLoading(false);
        };
        fetchDetails();
    }, [scheduleId, seatIds]);

    const handlePassengerChange = (index: number, field: string, value: any) => {
        const newPassengers = [...passengers];
        newPassengers[index][field] = value;
        setPassengers(newPassengers);
    };

    const handleBooking = async () => {
        if (!user || !schedule) return;

        // Validation
        const isAnyIncomplete = passengers.some(p => !p.name || !p.age);
        if (isAnyIncomplete) {
            toast.error("Please fill in all passenger details");
            return;
        }

        setSubmitting(true);
        try {
            const res = await createBookingAction({
                userId: user.id,
                scheduleId: schedule.id,
                busId: schedule.bus_id,
                passengers: passengers.map(p => ({
                    name: p.name,
                    age: parseInt(p.age),
                    gender: p.gender,
                    seatId: p.seatId
                }))
            });

            if (res.success) {
                toast.success("Booking confirmed!");
                router.push("/my-bookings");
            } else {
                toast.error(res.error || "Failed to confirm booking");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred during booking");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <AuthGuard>
            <LayoutWrapper>
                <div className="container mx-auto px-4 py-12">

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        <div className="md:col-span-2 space-y-6">
                            <h1 className="text-2xl font-bold">Passenger Details</h1>

                            {passengers.map((p, idx) => (
                                <Card key={p.seatId}>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Seat {p.seatNumber} ({p.deck} Deck)</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Full Name</Label>
                                                <Input
                                                    placeholder="Enter passenger name"
                                                    value={p.name}
                                                    onChange={(e) => handlePassengerChange(idx, "name", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Age</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="Enter age"
                                                    value={p.age}
                                                    onChange={(e) => handlePassengerChange(idx, "age", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Gender</Label>
                                            <RadioGroup
                                                value={p.gender}
                                                onValueChange={(val) => handlePassengerChange(idx, "gender", val)}
                                                className="flex gap-4"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="male" id={`male-${idx}`} />
                                                    <Label htmlFor={`male-${idx}`}>Male</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="female" id={`female-${idx}`} />
                                                    <Label htmlFor={`female-${idx}`}>Female</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            <div className="flex justify-end">
                                <Button
                                    size="lg"
                                    className="w-full md:w-auto px-12"
                                    onClick={handleBooking}
                                    disabled={submitting}
                                >
                                    {submitting ? "Processing..." : "Confirm Booking"}
                                </Button>
                            </div>
                        </div>

                        <aside className="space-y-6">
                            <Card className="bg-muted/30">
                                <CardHeader>
                                    <CardTitle>Booking Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-sm">Seats ({passengers.length})</span>
                                        <span className="font-bold">{passengers.map(p => p.seatNumber).join(", ")}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm">Base Fare</span>
                                        <span className="font-bold">₹{passengers.length * (schedule?.price || 0)}</span>
                                    </div>
                                    <div className="border-t pt-4 flex justify-between items-center text-lg font-bold">
                                        <span>Total amount</span>
                                        <span className="text-primary">₹{passengers.length * (schedule?.price || 0)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </aside>
                    </div>
                </div>
            </LayoutWrapper>
        </AuthGuard>
    );
}

export default function PassengerDetailsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PassengerDetailsContent />
        </Suspense>
    );
}
