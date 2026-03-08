"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Bus, Clock, Calendar, MoveRight, Filter, ChevronRight, ChevronLeft,
    Star, ShieldCheck, Zap, Info, MapPin, Search, X, Check, ArrowUpDown
} from "lucide-react";
import Link from "next/link";
import { searchBusesAction } from "@/app/actions/busActions";
import { cn } from "@/lib/utils";
import { format, addDays, isSameDay, startOfToday, parseISO, subDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Point {
    id: string;
    name: string;
    time: string;
    is_next_day: boolean;
}

interface BusResult {
    id: string;
    busName: string;
    busType: string;
    isAc: boolean;
    isSleeper: boolean;
    isSeater: boolean;
    amenities: string[];
    departureTime: string;
    arrivalTime: string;
    price: number;
    availableSeats: number;
    from: string;
    to: string;
    boardingPoints: Point[];
    droppingPoints: Point[];
}

export default function SearchScreen() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const date = searchParams.get("date"); // Using 'date' as per original

    const [buses, setBuses] = useState<BusResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Filter States (Original)
    const [selectedBusTypes, setSelectedBusTypes] = useState<string[]>([]);
    const [selectedBoardingPoints, setSelectedBoardingPoints] = useState<string[]>([]);
    const [selectedDroppingPoints, setSelectedDroppingPoints] = useState<string[]>([]);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
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

    const handleDateChange = (days: number) => {
        if (!date) return;
        const currentDate = new Date(date);
        currentDate.setDate(currentDate.getDate() + days);
        const newDate = currentDate.toISOString().split("T")[0];
        router.push(`/search?from=${from}&to=${to}&date=${newDate}`);
    };

    const handleQuickDateChange = (newDate: Date) => {
        const formattedDate = format(newDate, "yyyy-MM-dd");
        router.push(`/search?from=${from}&to=${to}&date=${formattedDate}`);
    };

    const getUniquePoints = (buses: BusResult[], type: 'boarding' | 'dropping') => {
        const points = buses.flatMap(bus => type === 'boarding' ? bus.boardingPoints : bus.droppingPoints);
        const unique = new Map();
        points.forEach(p => {
            if (!unique.has(p.name)) unique.set(p.name, p);
        });
        return Array.from(unique.values());
    };

    const filteredBuses = useMemo(() => {
        return buses.filter(bus => {
            if (selectedBusTypes.length > 0) {
                const matchesType = selectedBusTypes.some(type => {
                    if (type === "AC") return bus.isAc;
                    if (type === "Non-AC") return !bus.isAc;
                    if (type === "Sleeper") return bus.isSleeper;
                    if (type === "Seater") return bus.isSeater;
                    return false;
                });
                if (!matchesType) return false;
            }

            if (selectedBoardingPoints.length > 0) {
                const matchesBP = bus.boardingPoints.some(bp => selectedBoardingPoints.includes(bp.name));
                if (!matchesBP) return false;
            }

            if (selectedDroppingPoints.length > 0) {
                const matchesDP = bus.droppingPoints.some(dp => selectedDroppingPoints.includes(dp.name));
                if (!matchesDP) return false;
            }

            return true;
        });
    }, [buses, selectedBusTypes, selectedBoardingPoints, selectedDroppingPoints]);

    const toggleFilter = (setFn: any, value: string) => {
        setFn((prev: string[]) =>
            prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
        );
    };

    // UI Date Scroller Logic
    const dates = useMemo(() => {
        const baseDate = date ? parseISO(date) : new Date();
        const start = subDays(baseDate, 2);
        return Array.from({ length: 14 }).map((_, i) => addDays(start, i));
    }, [date]);

    const calculateDuration = (start: string, end: string) => {
        const diff = new Date(end).getTime() - new Date(start).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Top Search Info Strip */}
            <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                                <ChevronLeft className="h-6 w-6 text-slate-400" />
                            </Link>
                            <div>
                                <h1 className="text-lg font-black text-slate-800 flex items-center gap-2 capitalize">
                                    {from} <MoveRight className="h-4 w-4 text-teal-600" /> {to}
                                </h1>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="h-3 w-3" /> {date} • {filteredBuses.length} Buses Available
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" className="rounded-full border-slate-100 font-bold px-4 hover:bg-teal-50 hover:text-teal-600 shadow-sm transition-all" asChild>
                                <Link href="/">Modify Search</Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Horizontal Date Scroller */}
                <div className="border-t border-slate-50 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center overflow-x-auto no-scrollbar py-2 gap-2" ref={scrollRef}>
                            {dates.map((d, i) => {
                                const isSelected = date && isSameDay(d, parseISO(date));
                                const isToday = isSameDay(d, startOfToday());
                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleQuickDateChange(d)}
                                        className={cn(
                                            "flex-shrink-0 min-w-[100px] py-2 px-3 rounded-2xl transition-all border flex flex-col items-center gap-0.5",
                                            isSelected
                                                ? "bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-200 scale-105 z-10"
                                                : "bg-white border-slate-100 text-slate-500 hover:border-teal-200 hover:bg-teal-50/30"
                                        )}
                                    >
                                        <span className="text-[10px] uppercase font-black tracking-widest opacity-70">
                                            {format(d, "EEE")}
                                        </span>
                                        <span className="text-base font-black">
                                            {format(d, "dd")} {format(d, "MMM")}
                                        </span>
                                        {isToday && !isSelected && <span className="h-1 w-1 bg-teal-600 rounded-full mt-0.5" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <aside className="hidden lg:block space-y-6">
                        <div className="sticky top-44 space-y-6">
                            <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                                <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                                    <h3 className="font-black uppercase tracking-widest text-sm text-white">Filters</h3>
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        onClick={() => {
                                            setSelectedBusTypes([]);
                                            setSelectedBoardingPoints([]);
                                            setSelectedDroppingPoints([]);
                                        }}
                                        className="h-auto p-0 text-teal-400 hover:text-teal-300 font-bold uppercase text-[10px] tracking-tighter"
                                    >
                                        Clear All
                                    </Button>
                                </div>
                                <CardContent className="p-6 space-y-8 bg-white">
                                    <FilterContent
                                        selectedBusTypes={selectedBusTypes}
                                        setSelectedBusTypes={setSelectedBusTypes}
                                        selectedBoardingPoints={selectedBoardingPoints}
                                        setSelectedBoardingPoints={setSelectedBoardingPoints}
                                        selectedDroppingPoints={selectedDroppingPoints}
                                        setSelectedDroppingPoints={setSelectedDroppingPoints}
                                        buses={buses}
                                        getUniquePoints={getUniquePoints}
                                        toggleFilter={toggleFilter}
                                    />
                                </CardContent>
                            </Card>

                            <div className="bg-gradient-to-br from-teal-600 to-teal-500 rounded-[2rem] p-6 text-white text-center shadow-xl shadow-teal-200/50">
                                <Zap className="h-10 w-10 text-white mx-auto mb-4 animate-pulse" />
                                <h4 className="font-black text-lg mb-2">VSR Plus</h4>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Premium Shield Protection Activated</p>
                            </div>
                        </div>
                    </aside>

                    {/* Main Results Column */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="flex items-center justify-between mb-2 px-2">
                            <h2 className="text-xl font-black text-slate-800">
                                {loading ? "Finding best routes..." : `${filteredBuses.length} Premium Buses Found`}
                            </h2>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl border-slate-100 font-bold text-xs"
                                    onClick={() => handleDateChange(-1)}
                                    disabled={date ? date <= format(new Date(), "yyyy-MM-dd") : false}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-xl border-slate-100 font-bold text-xs" onClick={() => handleDateChange(1)}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-48 w-full bg-slate-100 animate-pulse rounded-[2.5rem]" />
                                ))}
                            </div>
                        ) : filteredBuses.length > 0 ? (
                            <div className="space-y-6">
                                {filteredBuses.map((bus) => (
                                    <motion.div
                                        key={bus.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="group"
                                    >
                                        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/60 transition-all duration-500 overflow-hidden">
                                            <div className="flex flex-col md:flex-row">
                                                {/* Left: Journey Info */}
                                                <div className="flex-1 p-6 md:p-8">
                                                    <div className="flex items-center justify-between mb-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-teal-50 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-all duration-500">
                                                                <Bus className="h-6 w-6" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-black text-xl text-slate-800">{bus.busName}</h3>
                                                                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">{bus.busType}</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className="text-[10px] font-black uppercase border-emerald-100 bg-emerald-50 text-emerald-600 px-3 flex items-center gap-1">
                                                            <Star className="h-3 w-3 fill-emerald-600" /> 4.5
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="text-center md:text-left flex-shrink-0">
                                                            <p className="text-2xl font-black text-slate-800">
                                                                {format(new Date(bus.departureTime), "hh:mm")}
                                                                <span className="text-sm ml-1 text-slate-400">{format(new Date(bus.departureTime), "aa")}</span>
                                                            </p>
                                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{bus.from}</p>
                                                        </div>

                                                        <div className="flex flex-col items-center flex-1 min-w-[120px]">
                                                            <div className="flex items-center gap-3 w-full max-w-[180px]">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                                                                <div className="h-px flex-1 bg-gradient-to-r from-slate-100 via-slate-300 to-slate-100 relative">
                                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                                                                        <Zap className="h-3 w-3 text-teal-600 fill-teal-600" />
                                                                    </div>
                                                                </div>
                                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3 flex items-center gap-1.5">
                                                                <Clock className="h-3 w-3" /> {calculateDuration(bus.departureTime, bus.arrivalTime)}
                                                            </span>
                                                        </div>

                                                        <div className="text-center md:text-right flex-shrink-0">
                                                            <p className="text-2xl font-black text-slate-800">
                                                                {format(new Date(bus.arrivalTime), "hh:mm")}
                                                                <span className="text-sm ml-1 text-slate-400">{format(new Date(bus.arrivalTime), "aa")}</span>
                                                            </p>
                                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{bus.to}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-8 flex flex-wrap gap-2">
                                                        {bus.amenities.map(a => (
                                                            <Badge key={a} variant="outline" className="text-[9px] font-bold uppercase border-slate-100 bg-slate-50 text-slate-400 px-2 py-0.5">
                                                                {a}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Right: Price & Action */}
                                                <div className="bg-slate-50/50 border-t md:border-t-0 md:border-l border-slate-100 p-8 md:p-10 flex flex-col justify-center items-center md:items-end md:min-w-[240px] gap-6">
                                                    <div className="text-center md:text-right">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-md mb-2 inline-block">Save ₹200 with code VSR200</p>
                                                        <div className="flex items-baseline gap-2 justify-center md:justify-end">
                                                            <span className="text-sm font-bold text-slate-400 line-through">₹{bus.price + 200}</span>
                                                            <span className="text-4xl font-black text-slate-900 tracking-tighter">₹{bus.price}</span>
                                                        </div>
                                                        <p className="text-[11px] font-bold text-slate-400 mt-1">{bus.availableSeats} Seats Available</p>
                                                    </div>

                                                    <Button asChild size="lg" className="w-full rounded-md bg-teal-600 hover:bg-teal-700 text-white font-black uppercase tracking-widest shadow-xl shadow-teal-200 h-14 group/btn">
                                                        <Link href={`/bus/${bus.id}?from=${from}&to=${to}&date=${date}`} className="flex items-center justify-center gap-3">
                                                            <span>Select Seats</span>
                                                            <ChevronRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-sm px-6">
                                <div className="p-6 bg-slate-50 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                                    <Bus className="h-10 w-10 text-slate-300" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2">No Premium Buses Found</h3>
                                <p className="text-slate-400 font-medium max-w-sm mx-auto mb-10 leading-relaxed text-sm">
                                    There are no buses available for this route on the selected date. Try changing the date or filters.
                                </p>
                                <Button className="rounded-2xl border-none h-12 px-10 font-black uppercase tracking-widest bg-teal-600 text-white shadow-xl shadow-teal-200" onClick={() => handleDateChange(1)}>
                                    Check Tomorrow
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Sidebar */}
            <AnimatePresence>
                {isFilterOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFilterOpen(false)}
                            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 z-[101] h-screen w-[300px] bg-white shadow-2xl lg:hidden flex flex-col"
                        >
                            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                                <h3 className="font-black uppercase tracking-widest text-sm">Filters</h3>
                                <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(false)} className="text-white hover:bg-white/10">
                                    <X className="h-6 w-6" />
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                <FilterContent
                                    selectedBusTypes={selectedBusTypes}
                                    setSelectedBusTypes={setSelectedBusTypes}
                                    selectedBoardingPoints={selectedBoardingPoints}
                                    setSelectedBoardingPoints={setSelectedBoardingPoints}
                                    selectedDroppingPoints={selectedDroppingPoints}
                                    setSelectedDroppingPoints={setSelectedDroppingPoints}
                                    buses={buses}
                                    getUniquePoints={getUniquePoints}
                                    toggleFilter={toggleFilter}
                                />
                            </div>
                            <div className="p-6 border-t bg-slate-50">
                                <Button
                                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black uppercase tracking-widest h-12 rounded-xl"
                                    onClick={() => setIsFilterOpen(false)}
                                >
                                    Apply Filters
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Mobile Bottom Filter Bar */}
            <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <Button
                    onClick={() => setIsFilterOpen(true)}
                    className="rounded-full bg-slate-900 text-white shadow-2xl px-8 h-12 font-black uppercase tracking-widest flex items-center gap-3 active:scale-95 transition-transform"
                >
                    <Filter className="h-4 w-4 text-teal-400" />
                    <span>Filter Results</span>
                </Button>
            </div>
        </div>
    );

    function FilterContent({
        selectedBusTypes,
        setSelectedBusTypes,
        selectedBoardingPoints,
        setSelectedBoardingPoints,
        selectedDroppingPoints,
        setSelectedDroppingPoints,
        buses,
        getUniquePoints,
        toggleFilter
    }: any) {
        return (
            <>
                <div className="flex items-center justify-between lg:hidden mb-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSelectedBusTypes([]);
                            setSelectedBoardingPoints([]);
                            setSelectedDroppingPoints([]);
                        }}
                        className="h-auto p-0 text-teal-600 font-bold uppercase text-[10px] tracking-widest"
                    >
                        Reset All
                    </Button>
                </div>

                {/* Bus Type */}
                <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 block">Bus Type</label>
                    <div className="space-y-4">
                        {["AC", "Non-AC", "Sleeper", "Seater"].map(type => (
                            <label key={type} className="flex items-center gap-4 text-sm font-bold text-slate-700 cursor-pointer group">
                                <div className={cn(
                                    "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                    selectedBusTypes.includes(type) ? "bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-100" : "border-slate-200 group-hover:border-teal-400"
                                )}>
                                    {selectedBusTypes.includes(type) && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={selectedBusTypes.includes(type)}
                                    onChange={() => toggleFilter(setSelectedBusTypes, type)}
                                />
                                <span>{type}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Boarding Points */}
                {buses.length > 0 && (
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 block">Boarding Points</label>
                        <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {getUniquePoints(buses, 'boarding').map((bp: any) => (
                                <label key={bp.id} className="flex items-center gap-4 text-sm font-bold text-slate-700 cursor-pointer group">
                                    <div className={cn(
                                        "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                        selectedBoardingPoints.includes(bp.name) ? "bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-100" : "border-slate-200 group-hover:border-teal-400"
                                    )}>
                                        {selectedBoardingPoints.includes(bp.name) && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedBoardingPoints.includes(bp.name)}
                                        onChange={() => toggleFilter(setSelectedBoardingPoints, bp.name)}
                                    />
                                    <span className="truncate">{bp.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Dropping Points */}
                {buses.length > 0 && (
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 block">Dropping Points</label>
                        <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {getUniquePoints(buses, 'dropping').map((dp: any) => (
                                <label key={dp.id} className="flex items-center gap-4 text-sm font-bold text-slate-700 cursor-pointer group">
                                    <div className={cn(
                                        "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                        selectedDroppingPoints.includes(dp.name) ? "bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-100" : "border-slate-200 group-hover:border-teal-400"
                                    )}>
                                        {selectedDroppingPoints.includes(dp.name) && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedDroppingPoints.includes(dp.name)}
                                        onChange={() => toggleFilter(setSelectedDroppingPoints, dp.name)}
                                    />
                                    <span className="truncate">{dp.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </>
        );
    }
}
