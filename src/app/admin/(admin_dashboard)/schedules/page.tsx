"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    CalendarClock,
    Plus,
    Save,
    Trash2,
    MapPin,
    Bus as BusIcon,
    ChevronLeft,
    Calendar as CalendarIcon,
    DollarSign,
    Tag,
    Clock,
    ArrowRight,
    Eye,
    Users,
    CheckCircle2,
    Loader2,
    Pencil,
    Filter,
} from "lucide-react";
import Link from "next/link";
import { createScheduleAction, getBusesAction, getRoutesAction, getSchedulesAction, deleteScheduleAction, updateScheduleAction } from "@/app/actions/adminActions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TimePicker12h } from "@/components/ui/TimePicker12h";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";

const SeaterIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={cn("w-full h-full text-current", className)}>
        <path d="M7 13V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 10H7V18C7 19.1046 7.89543 20 9 20H15C16.1046 20 17 19.1046 17 18V10H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 14V17C5 18.6569 6.34315 20 8 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M19 14V17C19 18.6569 17.6569 20 16 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const SleeperIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={cn("w-full h-full text-current", className)}>
        <rect x="4" y="2" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
        <line x1="4" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="2" />
        <path d="M8 6H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export default function AdminSchedulesPage() {
    const [view, setView] = useState<"list" | "create">("list");
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [buses, setBuses] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [dateFilter, setDateFilter] = useState<"all" | "today" | "tomorrow" | "custom">("today");
    const [customDate, setCustomDate] = useState("");
    const [editId, setEditId] = useState<string | null>(null);

    const [viewingSchedule, setViewingSchedule] = useState<any | null>(null);
    const [activeDeck, setActiveDeck] = useState<"LOWER" | "UPPER">("LOWER");

    const [formData, setFormData] = useState({
        bus_id: "",
        route_id: "",
        startDate: "",
        endDate: "",
        departureTime: "09:00 PM",
        arrivalTime: "06:00 AM",
        addon_amount: 0,
        discount_percentage: 0,
        isNextDay: false,
        is_pickup: true
    });

    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setOffset(prev => prev + 10);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);

    const getFilterData = (filter: string, custom: string) => {
        const today = new Date();
        if (filter === "today") {
            const startStr = format(today, "yyyy-MM-dd") + "T00:00:00.000Z";
            const endStr = format(today, "yyyy-MM-dd") + "T23:59:59.999Z";
            return { startDate: startStr, endDate: endStr };
        }
        if (filter === "tomorrow") {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const startStr = format(tomorrow, "yyyy-MM-dd") + "T00:00:00.000Z";
            const endStr = format(tomorrow, "yyyy-MM-dd") + "T23:59:59.999Z";
            return { startDate: startStr, endDate: endStr };
        }
        if (filter === "custom" && custom) {
            const startStr = custom + "T00:00:00.000Z";
            const endStr = custom + "T23:59:59.999Z";
            return { startDate: startStr, endDate: endStr };
        }
        return {};
    };

    const loadData = async (newOffset = 0) => {
        if (newOffset === 0) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const filters = getFilterData(dateFilter, customDate);
            const res = await getSchedulesAction({
                limit: 10,
                offset: newOffset,
                ...filters
            });

            if (res.success) {
                const newSchedules = res.data || [];
                if (newOffset === 0) {
                    setSchedules(newSchedules);
                } else {
                    setSchedules(prev => [...prev, ...newSchedules]);
                }
                setHasMore(newSchedules.length === 10);
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const [b, r] = await Promise.all([getBusesAction(), getRoutesAction()]);
            if (b.success) setBuses(b.data || []);
            if (r.success) setRoutes(r.data || []);
        };
        init();
    }, []);

    useEffect(() => {
        setOffset(0);
        loadData(0);
    }, [dateFilter, customDate]);

    useEffect(() => {
        if (offset > 0) {
            loadData(offset);
        }
    }, [offset]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let res;
            if (editId) {
                res = await updateScheduleAction(editId, {
                    departureTime: formData.departureTime,
                    arrivalTime: formData.arrivalTime,
                    addon_amount: formData.addon_amount,
                    discount_percentage: formData.discount_percentage,
                    isNextDay: formData.isNextDay,
                    is_pickup: formData.is_pickup
                });
            } else {
                res = await createScheduleAction(formData);
            }

            if (res.success) {
                toast.success(editId ? "Schedule updated successfully!" : "Schedules created successfully!");
                setView("list");
                setEditId(null);
                setOffset(0);
                loadData(0);
            } else {
                toast.error(res.error || "Failed to process request");
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (s: any) => {
        setEditId(s.id);
        const dep = new Date(s.departure_time);
        const arr = new Date(s.arrival_time);
        setFormData({
            bus_id: s.bus_id,
            route_id: s.route_id,
            startDate: format(dep, "yyyy-MM-dd"),
            endDate: format(dep, "yyyy-MM-dd"),
            departureTime: format(dep, "hh:mm a"),
            arrivalTime: format(arr, "hh:mm a"),
            addon_amount: Number(s.addon_amount),
            discount_percentage: Number(s.discount_percentage),
            isNextDay: dep.getDate() !== arr.getDate(),
            is_pickup: s.is_pickup ?? true
        });
        setView("create");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will delete all seats and bookings for this schedule.")) return;
        const res = await deleteScheduleAction(id);
        if (res.success) {
            toast.success("Schedule deleted");
            loadData();
        } else {
            toast.error(res.error);
        }
    };

    return (
        <div className="p-8">
            <header className="max-w-5xl mx-auto flex justify-between items-center mb-8">
                <div>
                    {view === "create" ? (
                        <button
                            onClick={() => setView("list")}
                            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2"
                        >
                            <ChevronLeft className="h-4 w-4" /> Back to Schedules
                        </button>
                    ) : (
                        <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
                            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
                        </Link>
                    )}
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <CalendarClock className="h-8 w-8 text-primary" />
                        Bus Schedules
                    </h1>
                </div>
                {view === "list" && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { setEditId(null); setFormData({ ...formData, bus_id: "", route_id: "", addon_amount: 0, discount_percentage: 0 }); setView("create"); }}>
                            <Plus className="mr-2 h-4 w-4" /> Create New Schedule
                        </Button>
                    </div>
                )}
            </header>

            <main className="max-w-5xl mx-auto">
                {view === "list" ? (
                    <div className="space-y-6">
                        {/* Filters */}
                        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/20 border rounded-2xl">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground mr-1" />
                                <Button
                                    variant={dateFilter === "all" ? "default" : "ghost"}
                                    size="sm"
                                    className="rounded-full px-4 h-8 text-xs font-bold"
                                    onClick={() => setDateFilter("all")}
                                >
                                    All Upcoming
                                </Button>
                                <Button
                                    variant={dateFilter === "today" ? "default" : "ghost"}
                                    size="sm"
                                    className="rounded-full px-4 h-8 text-xs font-bold"
                                    onClick={() => setDateFilter("today")}
                                >
                                    Today
                                </Button>
                                <Button
                                    variant={dateFilter === "tomorrow" ? "default" : "ghost"}
                                    size="sm"
                                    className="rounded-full px-4 h-8 text-xs font-bold"
                                    onClick={() => setDateFilter("tomorrow")}
                                >
                                    Tomorrow
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="date"
                                    className="h-8 w-40 text-xs rounded-full"
                                    value={customDate}
                                    onChange={(e) => {
                                        setCustomDate(e.target.value);
                                        if (e.target.value) setDateFilter("custom");
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {loading && schedules.length === 0 ? (
                                <div className="text-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                </div>
                            ) : (
                                schedules.map((s) => (
                                    <Card key={s.id} className="hover:border-primary/30 transition-all group">
                                        <CardContent className="p-6">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                        <CalendarClock className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-lg">{s.route.from_city?.name}</span>
                                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-bold text-lg">{s.route.to_city?.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                                            <span className="flex items-center gap-1"><BusIcon className="h-3.5 w-3.5" /> {s.bus.name}</span>
                                                            <span className="flex items-center gap-1 font-medium text-foreground"><CalendarIcon className="h-3.5 w-3.5" /> {format(new Date(s.departure_time), "MMM dd, yyyy")}</span>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded text-[11px] font-bold">
                                                                    <Clock className="h-3 w-3" /> {format(new Date(s.departure_time), "hh:mm a")}
                                                                </div>
                                                                <ArrowRight className="h-3 w-3 opacity-30" />
                                                                <div className="flex items-center gap-1 bg-primary/5 px-2 py-0.5 rounded text-[11px] font-bold text-primary">
                                                                    {format(new Date(s.arrival_time), "hh:mm a")}
                                                                    {new Date(s.arrival_time).getDate() !== new Date(s.departure_time).getDate() && (
                                                                        <span className="text-[9px] ml-1 bg-primary text-white px-1 rounded-sm tracking-tighter">+1 DAY</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                                    <div className="text-right">
                                                        {Number(s.price) > 0 ? (
                                                            <p className="text-2xl font-black text-primary">₹{Number(s.price)}</p>
                                                        ) : (
                                                            <p className="text-sm font-bold text-primary uppercase tracking-tighter">Seat Based Pricing</p>
                                                        )}
                                                        <div className="flex flex-col items-end">
                                                            {Number(s.addon_amount) > 0 && (
                                                                <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">+₹{Number(s.addon_amount)} Addon</p>
                                                            )}
                                                            {Number(s.discount_percentage) > 0 && (
                                                                <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest">-{Number(s.discount_percentage)}% Discount</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-1 items-end min-w-[100px]">
                                                        <Badge className={cn(
                                                            "font-mono",
                                                            s.bookedCount > 0 ? "bg-emerald-500 hover:bg-emerald-600" : "bg-muted text-muted-foreground hover:bg-muted"
                                                        )}>
                                                            {s.bookedCount} Booked
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground">{s.availableCount} Available</span>
                                                        {s.is_pickup ? (
                                                            <Badge variant="outline" className="text-[9px] border-primary/30 text-primary py-0 h-4 uppercase font-black">Pickup Enabled</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[9px] border-muted-foreground/30 text-muted-foreground py-0 h-4 uppercase font-black">Pickup Disabled</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setViewingSchedule(s)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="outline" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10" onClick={() => handleEdit(s)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(s.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}

                            {hasMore && (
                                <div ref={lastElementRef} className="py-8 text-center">
                                    {loadingMore && <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />}
                                </div>
                            )}
                            {!loading && schedules.length === 0 && (
                                <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/5">
                                    <CalendarClock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                    <p className="text-muted-foreground font-medium">No schedules found. Start by creating one!</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="overflow-hidden">
                                <div className="h-2 bg-primary" />
                                <CardHeader>
                                    <CardTitle>Schedule Configuration</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-8 p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Bus</Label>
                                            <div className="relative group">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-primary/5 rounded text-primary group-focus-within:bg-primary group-focus-within:text-white transition-colors">
                                                    <BusIcon className="h-4 w-4" />
                                                </div>
                                                <select
                                                    className="w-full flex h-12 rounded-xl border border-input bg-background pl-12 pr-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none shadow-sm"
                                                    value={formData.bus_id}
                                                    onChange={(e) => setFormData({ ...formData, bus_id: e.target.value })}
                                                    required
                                                    disabled={!!editId}
                                                >
                                                    <option value="">Choose a vehicle</option>
                                                    {buses.map(b => (
                                                        <option key={b.id} value={b.id}>{b.name} ({b.type})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Route</Label>
                                            <div className="relative group">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-primary/5 rounded text-primary group-focus-within:bg-primary group-focus-within:text-white transition-colors">
                                                    <MapPin className="h-4 w-4" />
                                                </div>
                                                <select
                                                    className="w-full flex h-12 rounded-xl border border-input bg-background pl-12 pr-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none shadow-sm"
                                                    value={formData.route_id}
                                                    onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
                                                    required
                                                    disabled={!!editId}
                                                >
                                                    <option value="">Operational direction</option>
                                                    {routes.map(r => (
                                                        <option key={r.id} value={r.id}>{r.from_city?.name} → {r.to_city?.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-1 gap-8 pt-4 border-t">
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Frequency Period</Label>
                                            <div className="flex items-center gap-3">
                                                <div className="relative flex-1">
                                                    <Input
                                                        type="date"
                                                        className="h-12 rounded-xl pl-4"
                                                        value={formData.startDate}
                                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <span className="text-muted-foreground/50 font-black">TO</span>
                                                <div className="relative flex-1">
                                                    <Input
                                                        type="date"
                                                        className="h-12 rounded-xl pl-4"
                                                        value={formData.endDate}
                                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground pl-1 leading-relaxed">
                                                <span className="font-bold text-primary">Repetition Active:</span> A new schedule record will be generated for every day in this timeframe.
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trip Duration</Label>
                                            <div className="flex items-center gap-3">
                                                <div className="relative flex-1">
                                                    <TimePicker12h
                                                        className="h-12"
                                                        value={formData.departureTime}
                                                        onChange={(val) => setFormData({ ...formData, departureTime: val })}
                                                    />
                                                    <Label className="mt-1 block text-[9px] text-muted-foreground uppercase text-center font-bold">Departure</Label>
                                                </div>
                                                <div className="relative flex-1">
                                                    <TimePicker12h
                                                        className="h-12"
                                                        value={formData.arrivalTime}
                                                        onChange={(val) => setFormData({ ...formData, arrivalTime: val })}
                                                    />
                                                    <div className="flex flex-col items-center">
                                                        <Label className="mt-1 block text-[9px] text-muted-foreground uppercase text-center font-bold">Arrival</Label>
                                                        <Button
                                                            type="button"
                                                            variant={formData.isNextDay ? "default" : "outline"}
                                                            size="sm"
                                                            className={cn(
                                                                "mt-2 h-7 px-3 text-[9px] font-black uppercase tracking-tighter rounded-full transition-all",
                                                                formData.isNextDay ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "text-muted-foreground"
                                                            )}
                                                            onClick={() => setFormData({ ...formData, isNextDay: !formData.isNextDay })}
                                                        >
                                                            {formData.isNextDay ? (
                                                                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> Next Day</span>
                                                            ) : (
                                                                "Same Day"
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t">
                                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-bold">Include in Pickup</Label>
                                                <p className="text-[11px] text-muted-foreground leading-tight">If enabled, this bus will be visible in the user search API for bookings.</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant={formData.is_pickup ? "default" : "outline"}
                                                size="sm"
                                                className={cn(
                                                    "h-10 px-6 font-bold rounded-xl transition-all",
                                                    formData.is_pickup ? "shadow-lg shadow-primary/20" : "text-muted-foreground"
                                                )}
                                                onClick={() => setFormData({ ...formData, is_pickup: !formData.is_pickup })}
                                            >
                                                {formData.is_pickup ? "ENABLED" : "DISABLED"}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-1 space-y-6">
                            <Card className="bg-gradient-to-br from-background to-primary/5 border-primary/20">
                                <CardHeader>
                                    <CardTitle className="text-lg">Pricing Engine</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    {/* Removed Base Ticket Fare Input */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground">Addon (₹)</Label>
                                            <Input
                                                type="number"
                                                className="h-10 rounded-lg bg-white/50"
                                                value={formData.addon_amount}
                                                onChange={(e) => setFormData({ ...formData, addon_amount: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground">Discount (%)</Label>
                                            <Input
                                                type="number"
                                                max={100}
                                                min={0}
                                                className="h-10 rounded-lg bg-white/50"
                                                value={formData.discount_percentage}
                                                onChange={(e) => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20">
                                        <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest mb-1">Pricing Modifier</p>
                                        <p className="text-2xl font-black">
                                            {formData.addon_amount > 0 ? `+ ₹${formData.addon_amount}` : ""}
                                            {formData.discount_percentage > 0 ? ` - ${formData.discount_percentage}%` : ""}
                                            {formData.addon_amount === 0 && formData.discount_percentage === 0 ? "No modifiers" : ""}
                                        </p>
                                        <p className="text-[10px] mt-2 italic opacity-60">* These modifiers will be applied to each seat's base price set in the bus layout.</p>
                                    </div>

                                    <div className="pt-6 space-y-3">
                                        <Button className="w-full h-14 rounded-2xl text-md font-bold shadow-2xl transition-all active:scale-95" type="submit" disabled={loading}>
                                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                                <>{editId ? <Save className="mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />} {editId ? "Update Schedule" : "Generate Schedules"}</>
                                            )}
                                        </Button>
                                        <Button variant="ghost" className="w-full h-12 text-muted-foreground rounded-xl" type="button" onClick={() => { setView("list"); setEditId(null); }}>
                                            Discard & Cancel
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                                <div className="p-2 bg-amber-500 rounded-full text-white mt-1 shadow-lg shadow-amber-500/30">
                                    <Tag className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-900">Seat Pricing Logic</p>
                                    <p className="text-xs text-amber-700 leading-relaxed mt-1">Creating a schedule generates a dedicated **ScheduleSeat** snapshot. All bookings and status updates happen on this local copy, leaving the original bus template untainted.</p>
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </main>

            {/* Seat Viewer Modal */}
            <Dialog open={!!viewingSchedule} onOpenChange={(open) => !open && setViewingSchedule(null)}>
                <DialogContent className="max-w-6xl max-h-[95vh] p-0 overflow-hidden flex flex-col gap-0 border-none rounded-3xl">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Users className="h-6 w-6 text-primary" />
                                <div className="flex flex-col">
                                    <span className="text-xl font-black">Seat Status Map</span>
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{viewingSchedule?.bus.name}</span>
                                </div>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 pt-4 flex-1 overflow-hidden flex flex-col">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="p-3 bg-muted/30 rounded-xl border border-dashed flex flex-col items-center justify-center">
                                <span className="text-2xl font-black">{viewingSchedule?.seats.length}</span>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Units</span>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-emerald-600">{viewingSchedule?.availableCount}</span>
                                <span className="text-[10px] uppercase font-bold text-emerald-700">Available</span>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-primary">{viewingSchedule?.bookedCount}</span>
                                <span className="text-[10px] uppercase font-bold text-primary">Booked</span>
                            </div>
                            <div className="p-3 bg-pink-50 rounded-xl border border-pink-100 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-pink-600">
                                    {viewingSchedule?.seats.filter((s: any) => s.gender_lock === "female").length}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-pink-700">Female Only</span>
                            </div>
                        </div>

                        {(() => {
                            const maxRow = Math.max(...(viewingSchedule?.seats.map((s: any) => s.row) || [0]), 0);
                            const maxCol = Math.max(...(viewingSchedule?.seats.map((s: any) => s.col) || [0]), 0);

                            const renderDeckGrid = (deck: string, label: string) => {
                                const deckSeats = viewingSchedule?.seats.filter((s: any) => s.deck === deck) || [];
                                if (deckSeats.length === 0) return null;

                                const columns = Array.from(new Set(deckSeats.map((s: any) => s.col))).sort((a: any, b: any) => Number(a) - Number(b));
                                const leftCols = columns.filter((c: any) => Number(c) < 2);
                                const rightCols = columns.filter((c: any) => Number(c) >= 2);

                                const renderColumn = (colIndex: number) => {
                                    const colSeats = deckSeats.filter((s: any) => s.col === colIndex).sort((a: any, b: any) => a - b);
                                    return (
                                        <div key={colIndex} className="flex flex-col gap-2 min-w-[60px]">
                                            {colSeats.map((seat: any) => (
                                                <div
                                                    key={seat.id}
                                                    style={{
                                                        height: "60px",
                                                        width: "60px",
                                                    }}
                                                    className={cn(
                                                        "rounded-xl border-2 flex flex-col items-center justify-center relative transition-all shadow-sm",
                                                        seat.status === "booked"
                                                            ? "bg-gray-200 border-gray-300 text-gray-400 opacity-50"
                                                            : seat.gender_lock === "female"
                                                                ? "bg-rose-50 border-rose-200 text-rose-600"
                                                                : "bg-gray-100/50 border-gray-200 text-gray-600"
                                                    )}
                                                >
                                                    <div className={cn("opacity-80 transition-transform", "w-7 h-7")}>
                                                        {seat.type?.toUpperCase() === "SEATER" ? <SeaterIcon /> : <SleeperIcon />}
                                                    </div>
                                                    <span className="text-[11px] font-black mt-1 leading-none uppercase tracking-tighter">{seat.seat_number}</span>
                                                    {seat.status === "booked" && (
                                                        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-slate-500 border-2 border-white shadow-md">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                };

                                return (
                                    <div className="flex flex-col items-center min-w-fit px-4">
                                        <div className="bg-muted/50 text-muted-foreground text-[10px] font-bold px-6 py-1.5 rounded-full uppercase tracking-[0.2em] mb-8 border border-muted-foreground/10">{label}</div>
                                        <div className="border border-muted/30 rounded-[40px] p-12 bg-white/50 shadow-xl relative overflow-x-auto max-w-full backdrop-blur-sm">
                                            <div className="absolute right-8 top-8 opacity-[0.03] pointer-events-none scale-150 text-primary"><BusIcon className="w-12 h-12" /></div>

                                            <div className="flex gap-16 items-start">
                                                {/* Left Side */}
                                                <div className="flex gap-2">
                                                    {leftCols.map((c: any) => renderColumn(c))}
                                                </div>

                                                {/* Aisle Area */}
                                                <div className="w-12 self-stretch flex items-center justify-center relative">
                                                    <div className="absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
                                                    <div className="bg-muted/5 text-[10px] font-bold uppercase tracking-[0.3em] -rotate-90 whitespace-nowrap opacity-20">AISLE</div>
                                                </div>

                                                {/* Right Side */}
                                                <div className="flex gap-2">
                                                    {rightCols.map((c: any) => renderColumn(c))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            };

                            const hasUpperDeck = viewingSchedule?.seats.some((s: any) => s.deck === "UPPER");

                            return (
                                <div className="flex flex-col h-full overflow-hidden">
                                    {hasUpperDeck && (
                                        <div className="flex justify-center gap-2 mb-6 flex-shrink-0">
                                            <Button
                                                variant={activeDeck === "LOWER" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setActiveDeck("LOWER")}
                                                className="rounded-full px-8 h-8 text-[11px] font-bold uppercase tracking-[0.2em] shadow-sm transition-all"
                                            >
                                                Lower Deck
                                            </Button>
                                            <Button
                                                variant={activeDeck === "UPPER" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setActiveDeck("UPPER")}
                                                className="rounded-full px-8 h-8 text-[11px] font-bold uppercase tracking-[0.2em] shadow-sm transition-all"
                                            >
                                                Upper Deck
                                            </Button>
                                        </div>
                                    )}
                                    <div className="flex-1 overflow-auto scrollbar-hide flex justify-center py-6 px-4">
                                        <div className="flex items-start pb-10">
                                            {renderDeckGrid(activeDeck, activeDeck === "LOWER" ? "Lower Deck" : "Upper Deck")}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="pb-8 border-t pt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-slate-50/50 -mx-6 px-10">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-100 border-2 border-gray-200" /> Available Unit</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-rose-50 border-2 border-rose-200" /> Female Only</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-200 border-2 border-gray-300" /> Booked Unit</div>
                            <div className="w-px h-4 bg-border mx-2 hidden lg:block" />
                            <div className="flex items-center gap-1"><SeaterIcon className="h-4 w-4" /> <span className="opacity-70 font-bold">Seater Type</span></div>
                            <div className="flex items-center gap-1"><SleeperIcon className="h-4 w-4" /> <span className="opacity-70 font-bold">Sleeper Type</span></div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
