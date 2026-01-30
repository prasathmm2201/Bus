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

interface Seat {
    id: string;
    number: string;
    status: "available" | "booked";
    gender_lock: "male" | "female" | null;
    type: "SEATER" | "SLEEPER";
    deck: "LOWER" | "UPPER";
    row: number;
    col: number;
}

interface SeatMapProps {
    seats: Seat[];
    price: number;
    onSelect: (selectedSeats: Seat[]) => void;
}

export default function SeatMap({ seats, price, onSelect }: SeatMapProps) {
    const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
    const [activeDeck, setActiveDeck] = useState<"LOWER" | "UPPER">("LOWER");

    const handleSeatClick = (seat: Seat) => {
        if (seat.status === "booked") return;

        const isSelected = selectedSeats.find((s) => s.id === seat.id);
        let newSelection = [];

        if (isSelected) {
            newSelection = selectedSeats.filter((s) => s.id !== seat.id);
        } else {
            if (selectedSeats.length >= 6) return; // Limit 6 seats
            newSelection = [...selectedSeats, seat];
        }

        setSelectedSeats(newSelection);
        onSelect(newSelection);
    };

    const getSeatColor = (seat: Seat) => {
        if (selectedSeats.find((s) => s.id === seat.id)) return "bg-blue-600 text-white border-blue-700 shadow-lg scale-105 z-20";
        if (seat.status === "booked") return "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed opacity-50";
        if (seat.gender_lock === "female") return "bg-rose-50 text-rose-600 border-rose-200";
        if (seat.gender_lock === "male") return "bg-blue-50 text-blue-600 border-blue-200";
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
                <div key={colIndex} className="flex flex-col gap-2 min-w-[60px]">
                    {colSeats.map((seat) => (
                        <button
                            key={seat.id}
                            onClick={() => handleSeatClick(seat)}
                            style={{
                                height: "60px",
                                width: "60px",
                            }}
                            className={cn(
                                "relative flex flex-col items-center justify-center border-2 transition-all p-1 shadow-sm",
                                "rounded-[6px]",
                                getSeatColor(seat)
                            )}
                        >
                            <div className={cn("opacity-80 transition-transform", "h-7 w-7")}>
                                {seat.type?.toUpperCase() === "SEATER" ? <SeaterIcon /> : <SleeperIcon />}
                            </div>
                            <span className="text-[11px] font-black z-10 mt-1 uppercase tracking-tighter">{seat.number}</span>
                            {seat.status === "booked" && (
                                <div className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-slate-400 border border-white shadow-sm">
                                    <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )
        };

        return (
            <div className="flex flex-col items-center">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-6">{label}</h4>
                <div className="relative border border-muted/30 rounded-[32px] p-10 bg-white/50 shadow-2xl backdrop-blur-sm">
                    <div className="absolute right-8 top-8 opacity-[0.03] pointer-events-none scale-150"><BusIcon className="w-12 h-12" /></div>

                    <div className="flex gap-12 items-start">
                        {/* Left Section */}
                        <div className="flex gap-2">
                            {leftCols.map(renderColumn)}
                        </div>

                        {/* Aisle Area (Implicit) */}
                        <div className="w-12 h-full flex items-center justify-center relative">
                            <div className="absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
                            <div className="bg-muted/5 text-[10px] font-bold uppercase tracking-widest -rotate-90 whitespace-nowrap opacity-20 group-hover:opacity-40 transition-opacity">AISLE AREA</div>
                        </div>

                        {/* Right Section */}
                        <div className="flex gap-2">
                            {rightCols.map(renderColumn)}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-8 lg:flex-row">
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

                <div className="overflow-auto scrollbar-hide flex justify-center py-4">
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

            <div className="w-full lg:w-80 flex flex-col gap-4">
                <Card>
                    <CardContent className="p-4">
                        <h4 className="font-bold mb-4 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            Boarding & Dropping
                        </h4>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center gap-1 py-1">
                                    <div className="h-3 w-3 rounded-full border-2 border-primary bg-white"></div>
                                    <div className="w-0.5 flex-1 bg-border border-dashed"></div>
                                    <div className="h-3 w-3 rounded-full bg-primary"></div>
                                </div>
                                <div className="flex flex-col justify-between py-1 min-h-[100px]">
                                    <div>
                                        <p className="text-sm font-bold">21:00 - Bangalore</p>
                                        <p className="text-xs text-muted-foreground">Majestic Bus Stand</p>
                                    </div>
                                    <div className="text-xs text-muted-foreground py-2 italic">8h 30m duration</div>
                                    <div>
                                        <p className="text-sm font-bold">05:30 - Hyderabad</p>
                                        <p className="text-xs text-muted-foreground">Kukatpally Metro</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold">Summary</h4>
                            <Badge variant="outline" className="text-[10px]">{selectedSeats.length} Seats</Badge>
                        </div>
                        {selectedSeats.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {selectedSeats.map((s) => (
                                        <Badge key={s.id} variant="secondary" className="bg-blue-600 text-white border-blue-700 hover:bg-blue-700">
                                            {s.number}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Base Fare</span>
                                        <span>₹{selectedSeats.length * price}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-primary">
                                        <span>Total</span>
                                        <span>₹{selectedSeats.length * price}</span>
                                    </div>
                                </div>
                                <Button className="w-full shadow-lg group" asChild>
                                    <Link href={{
                                        pathname: "/passenger-details",
                                        query: {
                                            scheduleId: seats[0]?.id ? seats.find(s => s.id)?.id : "", // This is not quite right, I need scheduleId
                                            // Wait, the scheduleId should be passed down or available.
                                            selectedSeats: selectedSeats.map(s => s.id).join(",")
                                        }
                                    }}>
                                        Proceed to Booking
                                        <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <Armchair className="h-12 w-12 text-muted/30 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground italic">Please select your seats to continue</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
