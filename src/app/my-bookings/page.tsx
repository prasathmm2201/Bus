"use client";

import { useAuth } from "@/store/useAuth";
import { useEffect, useState, useCallback } from "react";
import { getUserBookingsAction } from "@/app/actions/bookingActions";
import { toast } from "sonner";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bus, Calendar, ChevronRight, Ticket } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import { useRouter } from "next/navigation";

export default function MyBookingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBookings = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await getUserBookingsAction(user.id);
            if (res.success && res.data) {
                setBookings(res.data as any[]);
            } else {
                toast.error(res.error || "Failed to fetch bookings");
            }
        } catch (error) {
            toast.error("An error occurred while fetching bookings");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchBookings();
        }
    }, [user, fetchBookings]);

    return (
        <AuthGuard>
            <LayoutWrapper>
                <div className="container mx-auto px-4 py-12">

                    <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                        <Ticket className="h-8 w-8 text-primary" />
                        My Bookings
                    </h1>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        </div>
                    ) : bookings.length > 0 ? (
                        <div className="space-y-8">
                            {bookings.map((booking) => {
                                const boarding = booking.schedule.route.boarding_points?.[0];
                                const dropping = booking.schedule.route.dropping_points?.slice(-1)[0];
                                const busType = `${booking.bus.is_ac ? "AC" : "Non-AC"} ${booking.bus.is_sleeper ? "Sleeper" : "Seater"}`;

                                return (
                                    <div
                                        key={booking.id}
                                        onClick={() => router.push(`/confirmation/${booking.id}`)}
                                        className="cursor-pointer"
                                    >
                                        <Card className="overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-white group hover:-translate-y-1">
                                            <CardContent className="p-0">
                                                <div className="flex flex-col lg:flex-row">
                                                    {/* Left Section: Bus & Type */}
                                                    <div className="lg:w-1/3 p-6 bg-slate-50 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100 relative">
                                                        <div className="relative z-10">
                                                            <div className="flex items-center gap-4 mb-4">
                                                                <div className="p-1.5 bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden flex-shrink-0">
                                                                    {booking.bus.images && booking.bus.images.length > 0 ? (
                                                                        <img
                                                                            src={booking.bus.images[0]}
                                                                            alt="Bus Logo"
                                                                            className="h-14 w-14 object-cover rounded-lg"
                                                                        />
                                                                    ) : (
                                                                        <div className="h-14 w-14 flex items-center justify-center bg-primary/5 rounded-lg">
                                                                            <Bus className="h-8 w-8 text-primary" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-lg leading-tight uppercase tracking-wide">{booking.bus.name}</p>
                                                                    <p className="text-xs font-semibold text-primary/70 uppercase tracking-widest mt-1">{busType}</p>
                                                                </div>
                                                            </div>
                                                            <Badge
                                                                variant="secondary"
                                                                className={booking.status === "CONFIRMED"
                                                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1"
                                                                    : "bg-slate-50 text-slate-500 px-3 py-1"}
                                                            >
                                                                {booking.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="mt-6 pt-4 border-t border-slate-200/60 hidden lg:block relative z-10">
                                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Booking Number</p>
                                                            <p className="font-mono font-bold text-slate-700">#{booking.booking_no}</p>
                                                        </div>
                                                    </div>

                                                    {/* Middle Section: Route & Time */}
                                                    <div className="flex-1 p-6 md:p-8">
                                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
                                                            {/* From */}
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className="h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/10" />
                                                                    <p className="text-2xl font-bold text-slate-800">
                                                                        {booking.schedule.route.from_city?.name || booking.schedule.route.from_city || "Departure"}
                                                                    </p>
                                                                </div>
                                                                <div className="space-y-2 ml-[5px] border-l-2 border-slate-100 pl-5 py-2">
                                                                    <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                                                                        <p className="text-[10px] uppercase font-bold text-blue-500 mb-0.5">Boarding Point</p>
                                                                        <p className="text-sm font-bold text-slate-700">
                                                                            {boarding?.boarding_point?.name || "Main Boarding Point"}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-slate-500">
                                                                        <Calendar className="h-3.5 w-3.5" />
                                                                        <p className="text-sm font-medium">
                                                                            {new Date(booking.schedule.departure_time).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })} •
                                                                            <span className="text-primary font-bold ml-1">
                                                                                {boarding?.time || format(new Date(booking.schedule.departure_time), "hh:mm a")}
                                                                            </span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Journey Line */}
                                                            <div className="hidden md:flex flex-col items-center justify-center px-4 relative flex-1 max-w-[120px]">
                                                                <div className="w-full h-[2px] bg-slate-100 relative">
                                                                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-0 h-full bg-primary transition-all duration-700 group-hover:w-full" />
                                                                </div>
                                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1.5 rounded-full border border-slate-100 shadow-sm transition-transform duration-500 group-hover:scale-110">
                                                                    <Bus className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                                                                </div>
                                                            </div>

                                                            {/* To */}
                                                            <div className="flex-1 md:text-right">
                                                                <div className="flex items-center md:flex-row-reverse gap-2 mb-2">
                                                                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300 group-hover:bg-primary transition-colors ring-4 ring-slate-100" />
                                                                    <p className="text-2xl font-bold text-slate-800">
                                                                        {booking.schedule.route.to_city?.name || booking.schedule.route.to_city || "Destination"}
                                                                    </p>
                                                                </div>
                                                                <div className="space-y-2 mr-[5px] md:border-r-2 md:border-slate-100 md:pr-5 py-2 ml-[5px] md:ml-0 border-l-2 md:border-l-0 pl-5 md:pl-0">
                                                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Dropping Point</p>
                                                                        <p className="text-sm font-bold text-slate-700">
                                                                            {dropping?.dropping_point?.name || "Main Dropping Point"}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center md:flex-row-reverse gap-2 text-slate-500">
                                                                        <Calendar className="h-3.5 w-3.5" />
                                                                        <p className="text-sm font-medium">
                                                                            {new Date(booking.schedule.arrival_time).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })} •
                                                                            <span className="text-slate-700 font-bold ml-1">
                                                                                {dropping?.time || format(new Date(booking.schedule.arrival_time), "hh:mm a")}
                                                                            </span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-4 border-t pt-6 border-slate-50">
                                                            <div className="bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Seats</p>
                                                                <p className="text-sm font-black text-slate-700">{booking.passengers.map((p: any) => p.seat.seat_number).join(", ")}</p>
                                                            </div>
                                                            <div className="flex-1 h-[1px] bg-slate-50 hidden sm:block" />
                                                            <div className="flex flex-col items-start sm:items-end">
                                                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Total Fare paid</p>
                                                                <p className="text-xl font-black text-primary">₹{Number(booking.final_amount).toLocaleString()}</p>
                                                            </div>
                                                            <div className="lg:hidden flex items-center gap-2 text-primary font-bold text-sm">
                                                                View Details <ChevronRight className="h-4 w-4" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right Section: Visual indicator instead of buttons */}
                                                    <div className="hidden lg:flex w-12 bg-slate-50 items-center justify-center group-hover:bg-primary/5 transition-colors border-l border-slate-100">
                                                        <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Bus className="h-10 w-10 text-slate-200" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">No upcoming trips found</h2>
                            <p className="text-slate-500 max-w-xs mx-auto mb-8">Ready to start your next journey? Explore thousands of routes at best prices.</p>
                            <Button asChild size="lg" className="px-10 rounded-xl">
                                <Link href="/">Explore Routes</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </LayoutWrapper>
        </AuthGuard>
    );
}
