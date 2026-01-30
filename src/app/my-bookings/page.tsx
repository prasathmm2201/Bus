"use client";

import { useAuth } from "@/store/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthDialog from "@/modules/auth/AuthDialog";
import { getUserBookingsAction } from "@/app/actions/bookingActions";
import { toast } from "sonner";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bus, Calendar, MapPin, ChevronRight, Ticket } from "lucide-react";
import Link from "next/link";

export default function MyBookingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthOpen, setIsAuthOpen] = useState(false);

    useEffect(() => {
        if (!user) {
            setIsAuthOpen(true);
        } else {
            fetchBookings();
        }
    }, [user]);

    const fetchBookings = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await getUserBookingsAction(user.id);
            if (res.success && res.data) {
                setBookings(res.data);
            } else {
                toast.error(res.error || "Failed to fetch bookings");
            }
        } catch (error) {
            toast.error("An error occurred while fetching bookings");
        } finally {
            setLoading(false);
        }
    };

    if (!user && !isAuthOpen) return null;

    return (
        <LayoutWrapper>
            <div className="container mx-auto px-4 py-12">
                <AuthDialog
                    isOpen={isAuthOpen}
                    onClose={() => {
                        if (!user) router.push("/");
                        else setIsAuthOpen(false);
                    }}
                    onSuccess={() => {
                        setIsAuthOpen(false);
                        fetchBookings();
                    }}
                />

                <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                    <Ticket className="h-8 w-8 text-primary" />
                    My Bookings
                </h1>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                ) : bookings.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {bookings.map((booking) => (
                            <Card key={booking.id} className="group hover:border-primary/50 transition-all cursor-pointer overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                        <div className="flex-1 p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Bus className="h-5 w-5 text-primary" />
                                                    <span className="font-bold">{booking.bus.name}</span>
                                                </div>
                                                <Badge
                                                    variant="secondary"
                                                    className={booking.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}
                                                >
                                                    {booking.status}
                                                </Badge>
                                            </div>

                                            <div className="flex flex-col md:flex-row md:items-center gap-4 text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <span className="text-sm font-medium text-foreground">
                                                        {booking.schedule.route.from_city} → {booking.schedule.route.to_city}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    <span className="text-sm">
                                                        {new Date(booking.schedule.departure_time).toLocaleDateString()} • {new Date(booking.schedule.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-muted/30 p-6 border-t md:border-t-0 md:border-l flex justify-between items-center md:flex-col md:items-end md:w-56 gap-4">
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground">Booking No.</p>
                                                <p className="font-mono font-bold">#{booking.booking_no}</p>
                                            </div>
                                            <Button variant="ghost" className="group-hover:text-primary" asChild>
                                                <Link href={`/confirmation/${booking.id}`}>
                                                    View Ticket <ChevronRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                        <Bus className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground">You haven't booked any bus yet.</p>
                        <Button asChild className="mt-4">
                            <Link href="/">Book Now</Link>
                        </Button>
                    </div>
                )}
            </div>
        </LayoutWrapper>
    );
}
