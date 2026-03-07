"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, ArrowRightLeft, Search, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCitiesAction } from "@/app/actions/adminActions";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import CustomDatePicker from "@/components/ui/CustomDatePicker";

export default function SearchForm() {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [cities, setCities] = useState<{ id: string, name: string }[]>([]);
    const router = useRouter();

    useEffect(() => {
        const lastFrom = localStorage.getItem("last_search_from");
        const lastTo = localStorage.getItem("last_search_to");
        if (lastFrom) setFrom(lastFrom);
        if (lastTo) setTo(lastTo);

        const fetchCities = async () => {
            const res = await getCitiesAction();
            if (res.success && res.data) {
                setCities(res.data);
            }
        };
        fetchCities();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (from && to && date) {
            localStorage.setItem("last_search_from", from);
            localStorage.setItem("last_search_to", to);
            router.push(`/search?from=${from}&to=${to}&date=${date}`);
        }
    };

    const swapCities = () => {
        setFrom(to);
        setTo(from);
    };

    const todayStr = format(new Date(), "yyyy-MM-dd");

    return (
        <div className="relative z-20 mx-auto w-full max-w-7xl -translate-y-1/3">
            <Card className="overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[1rem] p-0">
                <CardContent className="p-2 md:p-3 bg-white">
                    <form onSubmit={handleSearch} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">

                        {/* From Sector */}
                        <div className="flex-1 relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                <div className="p-2 bg-teal-50 rounded-xl">
                                    <MapPin className="h-5 w-5 text-teal-600" />
                                </div>
                                <div className="hidden sm:block h-8 w-px bg-slate-100" />
                            </div>
                            <div className="pl-16 pr-4 py-3">
                                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-0.5">From</p>
                                <select
                                    className="w-full bg-transparent text-base font-bold text-slate-800 focus:outline-none appearance-none cursor-pointer"
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                    required
                                >
                                    <option value="">Departure City</option>
                                    {cities.map(city => (
                                        <option key={city.id} value={city.name}>{city.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Swap Button */}
                        <div className="flex items-center justify-center -my-4 lg:my-0 lg:-mx-4 relative z-10">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-10 w-10 rounded-full border-slate-100 bg-white hover:bg-teal-600 hover:text-white hover:border-teal-600 shadow-sm transition-all duration-300"
                                onClick={swapCities}
                            >
                                <ArrowRightLeft className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* To Sector */}
                        <div className="flex-1 relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                <div className="p-2 bg-teal-50 rounded-xl">
                                    <MapPin className="h-5 w-5 text-teal-600" />
                                </div>
                                <div className="hidden sm:block h-8 w-px bg-slate-100" />
                            </div>
                            <div className="pl-16 pr-4 py-3">
                                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-0.5">To</p>
                                <select
                                    className="w-full bg-transparent text-base font-bold text-slate-800 focus:outline-none appearance-none cursor-pointer"
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                    required
                                >
                                    <option value="">Destination City</option>
                                    {cities.map(city => (
                                        <option key={city.id} value={city.name}>{city.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="hidden lg:block h-12 w-px bg-slate-100 mx-2" />

                        {/* Date Sector */}
                        <div className="flex-1 relative group bg-white">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                <div className="p-2 bg-teal-50 rounded-xl">
                                    <Calendar className="h-5 w-5 text-teal-600" />
                                </div>
                                <div className="hidden sm:block h-8 w-px bg-slate-100" />
                            </div>
                            <div className="pl-16 pr-4 py-3">
                                <CustomDatePicker
                                    value={date}
                                    onChange={setDate}
                                    minDate={todayStr}
                                />
                            </div>
                        </div>

                        {/* Search Button */}
                        <Button
                            type="submit"
                            className="h-8 lg:h-[50px] lg:w-30 bg-teal-600 hover:bg-teal-700 text-white font-black text-lg rounded-md lg:rounded-[0.5rem] shadow-xl shadow-teal-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <span>Search</span>
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <p className="mt-6 text-center text-sm font-black uppercase tracking-[0.3em] text-slate-400/60 hidden md:block">
                India's most trusted bus ticket booking platform
            </p>
        </div>
    );
}
