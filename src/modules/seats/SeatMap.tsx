"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User, Armchair, Bus as BusIcon, Clock, ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

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

const SteeringWheelIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={cn("w-full h-full text-current", className)} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 14l0 8" />
        <path d="M12 2l0 2" />
        <path d="M12 14l-6.3 -4.6" />
        <path d="M12 14l6.3 -4.6" />
    </svg>
);

interface Seat {
    id: string;
    number: string;
    status: "available" | "booked" | "locked";
    gender_lock: "male" | "female" | null;
    type: "SEATER" | "SLEEPER";
    deck: "LOWER" | "UPPER";
    row: number;
    col: number;
    price?: number | string;
}

interface SeatMapProps {
    seats: Seat[];
    price: number;
    selectedSeats: Seat[];
    onSeatClick: (seat: Seat) => void;
    filterPrice?: number | "all";
}

export default function SeatMap({ seats, price, selectedSeats, onSeatClick, filterPrice = "all" }: SeatMapProps) {
    const [activeDeck, setActiveDeck] = useState<"LOWER" | "UPPER">("LOWER");

    const handleSeatClick = (seat: Seat) => {
        onSeatClick(seat);
    };

    const getSeatColor = (seat: Seat) => {
        const seatPrice = Number(seat.price || price);
        const isFilteredOut = filterPrice !== "all" && seatPrice !== filterPrice;

        if (isFilteredOut) return "bg-gray-100 text-gray-300 border-gray-100 opacity-30 cursor-not-allowed";

        if (selectedSeats.find((s) => s.id === seat.id)) return "bg-blue-600 text-white border-blue-700 shadow-lg scale-105 z-20";

        if (seat.status === "booked") {
            if (seat.gender_lock === "female") return "bg-rose-100 text-rose-300 border-rose-200 cursor-not-allowed opacity-80";
            if (seat.gender_lock === "male") return "bg-blue-100 text-blue-300 border-blue-200 cursor-not-allowed opacity-80";
            return "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed opacity-80";
        }

        if (seat.status === "locked") return "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed opacity-50";

        // Gender specific styles for available seats
        if (seat.gender_lock === "female") return "bg-rose-50 text-rose-600 border-rose-300 ring-1 ring-rose-200 hover:bg-rose-100";
        if (seat.gender_lock === "male") return "bg-blue-50 text-blue-600 border-blue-300 ring-1 ring-blue-200 hover:bg-blue-100";

        return "bg-gray-100/50 text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-white hover:text-blue-600";
    };

    // Filter seats based on decks
    const lowerSeats = seats.filter(s => s.deck === "LOWER");
    const upperSeats = seats.filter(s => s.deck === "UPPER");

    const renderDeck = (deckSeats: Seat[], label: string) => {
        const columns = Array.from(new Set(deckSeats.map(s => s.col))).sort((a, b) => Number(a) - Number(b));
        const leftCols = columns.filter(c => Number(c) < 2);
        const rightCols = columns.filter(c => Number(c) >= 2);

        const renderColumn = (colIndex: number) => {
            const colSeats = deckSeats.filter(s => s.col === colIndex).sort((a, b) => a.row - b.row);
            return (
                <div key={colIndex} className="flex flex-col gap-2 min-w-[60px] py-4 h-full justify-between flex-1">
                    {colSeats.map((seat) => {
                        const seatPrice = Number(seat.price || price);
                        const isFilteredOut = filterPrice !== "all" && seatPrice !== filterPrice;

                        // Check adjacency for badge
                        const isAisleBetween = (c1: number, c2: number) => {
                            const min = Math.min(c1, c2);
                            const max = Math.max(c1, c2);
                            return min < 2 && max >= 2;
                        };
                        const adjFemale = seats.find(s => {
                            if (s.id === seat.id) return false;
                            if (s.deck !== seat.deck || s.row !== seat.row) return false;
                            const isAdj = Math.abs(s.col - seat.col) === 1;
                            if (!isAdj || isAisleBetween(s.col, seat.col)) return false;
                            return (s.gender_lock as string) === "female" || (s.status === "booked" && (s.gender_lock as string) === "female");
                        });

                        const isFemaleOnly = seat.gender_lock === "female" || !!adjFemale;

                        return (
                            <button
                                key={seat.id}
                                onClick={() => handleSeatClick(seat)}
                                style={{
                                    width: "60px",
                                }}
                                className={cn(
                                    "relative flex flex-col items-center justify-center border-2 transition-all p-1 shadow-sm flex-1",
                                    "rounded-[6px]",
                                    getSeatColor(seat)
                                )}
                            >
                                <div className={cn("opacity-80 transition-transform", "h-7 w-7")}>
                                    {seat.type?.toUpperCase() === "SEATER" ? <SeaterIcon /> : <SleeperIcon />}
                                </div>
                                <span className="text-[11px] font-black z-10 mt-1 uppercase tracking-tighter">{seat.number}</span>
                                {isFemaleOnly && (
                                    <div className={cn(
                                        "absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full border border-white shadow-sm ring-2",
                                        seat.status === "available" ? "bg-rose-500 ring-rose-100" : "bg-rose-300 ring-rose-50"
                                    )}>
                                        <div className="text-[8px] font-bold text-white leading-none">F</div>
                                    </div>
                                )}
                                {seat.gender_lock === "male" && (
                                    <div className={cn(
                                        "absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full border border-white shadow-sm ring-2",
                                        seat.status === "available" ? "bg-blue-500 ring-blue-100" : "bg-blue-300 ring-blue-50"
                                    )}>
                                        <div className="text-[8px] font-bold text-white leading-none">M</div>
                                    </div>
                                )}
                                {!isFilteredOut && filterPrice === "all" && ( // Show price if not filtered out and viewing all, or maybe always? User said "show price of each seats"
                                    <div className="text-[8px] font-medium opacity-60">₹{seat.price || price}</div>
                                )}
                                {seat.status === "booked" && !isFemaleOnly && (
                                    <div className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-slate-400 border border-white shadow-sm">
                                        <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )
        };

        return (
            <div className="flex flex-col items-center flex-1 h-full">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-6">{label}</h4>
                <div className="relative border border-muted/30 rounded-[32px] p-10 bg-white/50 shadow-2xl backdrop-blur-sm flex-1 h-full flex flex-col justify-center">
                    {label === "Lower Deck" && (
                        <div className="flex justify-end pr-4 pb-4">
                            <div className="w-8 h-8 text-gray-400 opacity-60">
                                <SteeringWheelIcon />
                            </div>
                        </div>
                    )}
                    <div className="flex gap-12 h-full w-full justify-between">
                        {/* Left Section */}
                        <div className="flex flex-col h-full flex-1">

                            <div className="flex gap-2 h-full flex-1 justify-center">
                                {leftCols.map(renderColumn)}
                            </div>
                        </div>

                        {/* Aisle Area (Implicit) */}
                        <div className="w-12 h-full flex items-center justify-center relative">
                            <div className="absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
                            <div className="bg-muted/5 text-[10px] font-bold uppercase tracking-widest -rotate-90 whitespace-nowrap opacity-20 group-hover:opacity-40 transition-opacity">AISLE AREA</div>
                        </div>

                        {/* Right Section */}
                        <div className="flex gap-2 h-full flex-1 justify-center">
                            {rightCols.map(renderColumn)}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-8 lg:flex-row overflow-auto">
            <Card className="flex-1 p-6 bg-muted/20 overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b pb-4 gap-4">
                    <h3 className="font-bold flex items-center gap-2">
                        <BusIcon className="h-5 w-5 text-primary" />
                        Seat Selection
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap justify-center">
                        <div className="flex items-center gap-1"><div className="h-3 w-3 bg-gray-100 border border-gray-200 rounded-[4px]"></div> Available</div>
                        <div className="flex items-center gap-1"><div className="h-3 w-3 bg-rose-50 border border-rose-200 rounded-[4px]"></div> Female</div>
                        <div className="flex items-center gap-1"><div className="h-3 w-3 bg-blue-600 border border-blue-700 rounded-[4px]"></div> Selected</div>
                        <div className="flex items-center gap-1"><div className="h-3 w-3 bg-gray-200 border border-gray-300 rounded-[4px]"></div> Booked</div>
                        <div className="w-px h-4 bg-border mx-1" />
                        <div className="flex items-center gap-1"><SeaterIcon className="h-3.5 w-3.5" /> <span className="opacity-70 font-bold">Seater</span></div>
                        <div className="flex items-center gap-1"><SleeperIcon className="h-3.5 w-3.5" /> <span className="opacity-70 font-bold">Sleeper</span></div>
                    </div>
                </div>

                <div className="overflow-auto scrollbar-hide flex justify-start">
                    <div className="flex gap-12 min-w-fit px-8">
                        {renderDeck(lowerSeats, "Lower Deck")}
                        {upperSeats.length > 0 && (
                            <>
                                <div className="w-px bg-border self-stretch my-8" />
                                {renderDeck(upperSeats, "Upper Deck")}
                            </>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
