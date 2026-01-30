"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Bus,
    Navigation,
    CalendarClock,
    Users,
    TrendingUp,
    DollarSign,
    Plus,
    ChevronRight,
    ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { getDashboardStatsAction, getRecentBookingsAction } from "@/app/actions/adminActions";
import { toast } from "sonner";

export default function AdminDashboard() {
    const [stats, setStats] = useState([
        { title: "Total Bookings", value: "...", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-100" },
        { title: "Revenue", value: "...", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
        { title: "Active Buses", value: "...", icon: Bus, color: "text-amber-600", bg: "bg-amber-100" },
        { title: "Total Users", value: "...", icon: Users, color: "text-violet-600", bg: "bg-violet-100" },
    ]);
    const [recentBookings, setRecentBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [statsRes, bookingsRes] = await Promise.all([
                    getDashboardStatsAction(),
                    getRecentBookingsAction(5)
                ]);

                if (statsRes.success && statsRes.data) {
                    setStats([
                        { title: "Total Bookings", value: statsRes.data.totalBookings.toLocaleString(), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-100" },
                        { title: "Revenue", value: `₹${statsRes.data.revenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
                        { title: "Active Buses", value: statsRes.data.activeBuses.toString(), icon: Bus, color: "text-amber-600", bg: "bg-amber-100" },
                        { title: "Total Users", value: statsRes.data.totalUsers.toString(), icon: Users, color: "text-violet-600", bg: "bg-violet-100" },
                    ]);
                }

                if (bookingsRes.success && bookingsRes.data) {
                    setRecentBookings(bookingsRes.data);
                }
            } catch (error) {
                toast.error("Failed to fetch dashboard data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Helper to get initials
    const getInitials = (name: string) => {
        return name.split(" ").map(n => n[0]).join("").toUpperCase();
    };

    return (
        <div className="p-8">
            <header className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Welcome back. Here's what's happening today.</p>
                </div>
                <div className="flex gap-4">
                    <Button className="shadow-lg" asChild>
                        <Link href="/admin/buses">
                            <Plus className="mr-2 h-4 w-4" /> Add Bus
                        </Link>
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center gap-5">
                            <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{stat.title}</p>
                                <p className="text-3xl font-black">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between bg-muted/30 pb-4">
                        <CardTitle className="text-lg font-bold">Recent Bookings</CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs">View All <ChevronRight className="ml-1 h-3 w-3" /></Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {loading ? (
                                <div className="p-8 text-center text-muted-foreground">Loading bookings...</div>
                            ) : recentBookings.length > 0 ? (
                                recentBookings.map((booking) => (
                                    <div key={booking.id} className="flex justify-between items-center p-5 hover:bg-muted/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-xs uppercase">
                                                {getInitials(booking.user.name || booking.user.email)}
                                            </div>
                                            <div>
                                                <p className="font-bold">Booking #{booking.booking_no.slice(-8).toUpperCase()}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {booking.schedule.route.from_city} → {booking.schedule.route.to_city} • {booking.passengers.length} {booking.passengers.length === 1 ? 'Seat' : 'Seats'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-primary">₹{booking.total_cost.toLocaleString()}</p>
                                            <div className="flex items-center gap-1 justify-end mt-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                                <p className="text-[10px] uppercase font-bold text-emerald-600">{booking.status}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">No recent bookings found.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-primary text-primary-foreground">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="secondary" className="w-full justify-between group" asChild>
                            <Link href="/admin/schedules">
                                New Schedule
                                <ArrowUpRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        </Button>
                        <Button variant="secondary" className="w-full justify-between group" asChild>
                            <Link href="/admin/routes">
                                Define Route
                                <ArrowUpRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        </Button>
                        <Button variant="secondary" className="w-full justify-between group" asChild>
                            <Link href="/admin/cities">
                                Manage Cities
                                <ArrowUpRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        </Button>
                        <Button variant="secondary" className="w-full justify-between group" asChild>
                            <Link href="/admin/boarding-points">
                                Boarding Points
                                <ArrowUpRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        </Button>
                        <div className="pt-8 text-center opacity-70">
                            <Bus className="h-16 w-16 mx-auto mb-4 opacity-20" />
                            <p className="text-xs">Manage your fleet and routes from a single place.</p>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}

