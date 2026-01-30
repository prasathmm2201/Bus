"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, ArrowRightLeft, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCitiesAction } from "@/app/actions/adminActions";

export default function SearchForm() {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [date, setDate] = useState("");
    const [cities, setCities] = useState<{ id: string, name: string }[]>([]);
    const router = useRouter();

    useEffect(() => {
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
            router.push(`/search?from=${from}&to=${to}&date=${date}`);
        }
    };

    const swapCities = () => {
        setFrom(to);
        setTo(from);
    };

    return (
        <Card className="mx-auto w-full max-w-4xl -translate-y-1/2 shadow-xl">
            <CardContent className="p-6">
                <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="relative flex-1">
                        <label className="mb-2 block text-sm font-medium">From</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground z-10" />
                            <select
                                className="w-full flex h-10 rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                required
                            >
                                <option value="">Select Departure</option>
                                {cities.map(city => (
                                    <option key={city.id} value={city.name}>{city.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-center pt-6 md:pt-0">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="rounded-full bg-muted/50 hover:bg-primary hover:text-white"
                            onClick={swapCities}
                        >
                            <ArrowRightLeft className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="relative flex-1">
                        <label className="mb-2 block text-sm font-medium">To</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground z-10" />
                            <select
                                className="w-full flex h-10 rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                required
                            >
                                <option value="">Select Destination</option>
                                {cities.map(city => (
                                    <option key={city.id} value={city.name}>{city.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="relative flex-1">
                        <label className="mb-2 block text-sm font-medium">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="date"
                                className="pl-10"
                                value={date}
                                min={new Date().toISOString().split("T")[0]}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" size="lg" className="h-[44px] px-8">
                        <Search className="mr-2 h-5 w-5" />
                        Search
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
