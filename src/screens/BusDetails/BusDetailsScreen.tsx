"use client";

import { useState, useEffect } from "react";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import SeatMap from "@/modules/seats/SeatMap";
import { useParams, useSearchParams } from "next/navigation";
import { MoveLeft, MoveRight, Fan, BedDouble, Armchair, Bus, MapPin, Clock, Users, ChevronRight, Check, Mail, Phone, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getScheduleDetailsAction } from "@/app/actions/busActions";
import { lockSeatsAction, createBookingAction } from "@/app/actions/bookingActions";
import { getSavedPassengersAction } from "@/app/actions/userActions";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/store/useAuth";
import { useRouter } from "next/navigation";
import { useBookingStore } from "@/store/useBookingStore";

// --- Types ---
type Step = 1 | 2 | 3;

interface Passenger {
    seatId: string;
    seatNumber: string;
    name: string;
    age: string;
    gender: "male" | "female";
    isQuickSelected?: boolean;
    savedId?: string;
}

// --- Components ---

const BusHeader = ({ busData }: { busData: any }) => {
    if (!busData) return null;

    return (
        <div className="bg-white border-b shadow-sm">
            <div className="container mx-auto px-4 py-4">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Bus Image & Basic Info */}
                    <div className="flex gap-4 flex-1">
                        <div className="relative h-24 w-36 flex-shrink-0 rounded-lg overflow-hidden border bg-gray-100 hidden sm:block">
                            {busData.images && busData.images.length > 0 ? (
                                <img src={busData.images[0]} alt={busData.name} className="object-cover w-full h-full" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Bus className="h-8 w-8" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h1 className="text-xl font-bold text-gray-900">{busData.name}</h1>
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                                    {busData.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">{busData.busNumber}</span>
                            </div>

                            <div className="flex items-center text-sm text-gray-600 gap-3 mb-3 flex-wrap">
                                <div className="flex items-center gap-1">
                                    <span className="font-semibold">{busData.from}</span>
                                    <MoveRight className="h-3 w-3 text-gray-400" />
                                    <span className="font-semibold">{busData.to}</span>
                                </div>
                                <div className="h-4 w-px bg-gray-300 hidden sm:block" />
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                                    <span>{format(busData.departureTime, 'dd MMM, hh:mm a')}</span>
                                    <span className="text-gray-400 text-xs">-</span>
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{busData.duration}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {busData.amenities.map((a: string) => (
                                    <div key={a} className="flex items-center gap-1.5 text-[10px] uppercase font-medium tracking-wide text-gray-600 bg-gray-50 px-2 py-1 rounded border">
                                        {a === "AC" && <Fan className="h-3 w-3" />}
                                        {a === "Sleeper" && <BedDouble className="h-3 w-3" />}
                                        {a === "Seater" && <Armchair className="h-3 w-3" />}
                                        {a}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StepIndicator = ({ currentStep }: { currentStep: Step }) => {
    const steps = [
        { id: 1, label: "Select Seats" },
        { id: 2, label: "Boarding & Dropping" },
        { id: 3, label: "Passenger Details" },
    ];

    return (
        <div className="flex justify-center w-full py-6">
            <div className="flex items-center w-full max-w-2xl px-4">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center flex-1 last:flex-none">
                        <div className={cn(
                            "flex items-center gap-2",
                            index < steps.length - 1 ? "flex-1" : ""
                        )}>
                            <div className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 transition-all flex-shrink-0",
                                currentStep >= step.id
                                    ? "bg-primary border-primary text-white"
                                    : "bg-white border-gray-200 text-gray-400"
                            )}>
                                {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                            </div>
                            <span className={cn(
                                "text-sm font-medium hidden sm:block whitespace-nowrap",
                                currentStep >= step.id ? "text-gray-900" : "text-gray-400"
                            )}>
                                {step.label}
                            </span>
                            {index < steps.length - 1 && (
                                <div className={cn(
                                    "h-0.5 w-full mx-4 transition-all",
                                    currentStep > step.id ? "bg-primary" : "bg-gray-200"
                                )} />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function BusDetailsScreen() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const backUrl = `/search?${searchParams.toString()}`;
    const { setBookingDetails } = useBookingStore();

    const [loading, setLoading] = useState(true);
    const [busData, setBusData] = useState<any>(null);
    const { user } = useAuth();

    // --- Booking State ---
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
    const [selectedPriceFilter, setSelectedPriceFilter] = useState<number | "all">("all");

    const [selectedBoardingPoint, setSelectedBoardingPoint] = useState<string>("");
    const [selectedDroppingPoint, setSelectedDroppingPoint] = useState<string>("");
    const [savedPassengers, setSavedPassengers] = useState<any[]>([]);
    const [isLoadingSaved, setIsLoadingSaved] = useState(false);

    const [contactInfo, setContactInfo] = useState({ mobile: user?.mobile_no || "", email: user?.email || "" });
    const [passengers, setPassengers] = useState<Passenger[]>([]);

    useEffect(() => {
        if (!id) return;
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const res = await getScheduleDetailsAction(id as string);
                if (res.success && res.data) {
                    const schedule = res.data;
                    const route = schedule.route;
                    const depDate = new Date(schedule.departure_time);
                    const arrDate = new Date(schedule.arrival_time);

                    setBusData({
                        id: schedule.id,
                        busId: schedule.bus.id,
                        routeId: schedule.route_id,
                        name: schedule.bus.name,
                        type: schedule.bus.type,
                        busNumber: "", // Bus number not available in schema
                        amenities: [
                            schedule.bus.is_ac ? "AC" : "Non-AC",
                            schedule.bus.is_sleeper ? "Sleeper" : null,
                            schedule.bus.is_seater ? "Seater" : null
                        ].filter(Boolean),
                        images: schedule.bus.images || [],
                        from: route.from_city.name,
                        to: route.to_city.name,
                        departureTime: depDate,
                        arrivalTime: arrDate,
                        duration: calculateDuration(depDate, arrDate),
                        price: Number(schedule.price),
                        seats: schedule.seats.map((s: any) => ({
                            id: s.id,
                            number: s.seat_number,
                            status: s.status,
                            gender_lock: s.gender_lock,
                            type: s.type,
                            deck: s.deck,
                            row: s.row,
                            col: s.col,
                            price: Number(s.price)
                        })),
                        boardingPoints: route.boarding_points?.map((bp: any) => ({
                            id: bp.id,
                            name: bp.boarding_point.name,
                            time: bp.time
                        })) || [],
                        droppingPoints: route.dropping_points?.map((dp: any) => ({
                            id: dp.id,
                            name: dp.dropping_point.name,
                            time: dp.time
                        })) || []
                    });
                }
            } catch (error) {
                console.error("Failed to fetch schedule details", error);
                toast.error("Failed to load bus details");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    // Initialize passengers when seats change
    useEffect(() => {
        setPassengers(prev => {
            // Keep existing passenger details if seat is still selected
            const newPassengers = selectedSeats.map(seat => {
                const existing = prev.find(p => p.seatId === seat.id);
                if (existing) return existing;

                const adjLocked = checkAdjacencyRestriction(seat);
                const genderLock = seat.gender_lock || (adjLocked ? "female" : null);

                return {
                    seatId: seat.id,
                    seatNumber: seat.number,
                    name: "",
                    age: "",
                    gender: genderLock || "male",
                    isQuickSelected: false,
                    savedId: undefined
                };
            });
            return newPassengers;
        });
    }, [selectedSeats]);

    useEffect(() => {
        if (user) {
            setContactInfo(prev => ({
                ...prev,
                email: prev.email || user.email || "",
                mobile: prev.mobile || user.mobile_no || ""
            }));
        }
    }, [user]);

    useEffect(() => {
        if (currentStep === 3 && user?.id && savedPassengers.length === 0) {
            const fetchSaved = async () => {
                setIsLoadingSaved(true);
                const res = await getSavedPassengersAction(user.id);
                if (res.success && res.data) {
                    setSavedPassengers(res.data);
                }
                setIsLoadingSaved(false);
            };
            fetchSaved();
        }
    }, [currentStep, user?.id]);

    const handleSelectSavedPassenger = (index: number, saved: any) => {
        const seatId = passengers[index].seatId;
        const seat = selectedSeats.find(s => s.id === seatId);

        // Validation: If seat is gender locked, check if saved passenger matches
        const isAdjFemale = !!checkAdjacencyRestriction(seat);
        const isFemaleLocked = seat?.gender_lock === "female" || isAdjFemale;
        const isMaleLocked = seat?.gender_lock === "male";

        if (isFemaleLocked && saved.gender !== "female") {
            toast.error("This seat is restricted to female passengers only");
            return;
        }
        if (isMaleLocked && saved.gender !== "male") {
            toast.error("This seat is restricted to male passengers only");
            return;
        }

        setPassengers(prev => {
            const next = [...prev];
            next[index] = {
                ...next[index],
                name: saved.name,
                age: String(saved.age),
                gender: saved.gender,
                isQuickSelected: true,
                savedId: saved.id
            };
            return next;
        });
        toast.success(`Selected ${saved.name}`);
    };

    const calculateDuration = (start: Date, end: Date) => {
        const diffMs = end.getTime() - start.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const checkAdjacencyRestriction = (seat: any) => {
        if (!busData || !busData.seats) return null;

        // Adjacency logic: Same deck, same row, adjacent column (not across aisle)
        const isAisleBetween = (c1: number, c2: number) => {
            const min = Math.min(c1, c2);
            const max = Math.max(c1, c2);
            return min < 2 && max >= 2;
        };

        const adjacentFemaleSeat = busData.seats.find((s: any) => {
            if (s.id === seat.id) return false;
            if (s.deck !== seat.deck || s.row !== seat.row) return false;

            const isAdjacentCol = Math.abs(s.col - seat.col) === 1;
            if (!isAdjacentCol || isAisleBetween(s.col, seat.col)) return false;

            // Check if this adjacent seat is female-locked or booked by a female
            return s.gender_lock === "female" || (s.status === "booked" && s.gender_lock === "female");
        });

        return adjacentFemaleSeat;
    };

    const handleSeatSelect = (seat: any) => {
        if (seat.status === "booked" || seat.status === "locked") return;

        // Gender Lock Alert & Restriction
        const adjacencyLocked = checkAdjacencyRestriction(seat);

        if (seat.gender_lock === "female" || adjacencyLocked) {
            const reason = adjacencyLocked
                ? `as it is next to a female passenger (Seat ${adjacencyLocked.number})`
                : "only";

            toast.error(`This seat is available only for female passengers ${reason}`, {
                duration: 5000,
                icon: <div className="h-5 w-5 rounded-full bg-rose-500 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">F</div>
            });
            // Note: We still allow selection, but Step 3 will enforce female gender selection.
        } else if (seat.gender_lock === "male") {
            toast.info("This seat is reserved for male passengers", {
                duration: 3000,
                icon: <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold">M</div>
            });
        }

        // Prevent selection if filtered out
        if (selectedPriceFilter !== "all" && Number(seat.price || busData.price) !== selectedPriceFilter) return;

        const isSelected = selectedSeats.find((s) => s.id === seat.id);
        let newSelection = [];

        if (isSelected) {
            newSelection = selectedSeats.filter((s) => s.id !== seat.id);
        } else {
            if (selectedSeats.length >= 6) {
                toast.error("You can select up to 6 seats only");
                return;
            }
            newSelection = [...selectedSeats, seat];
        }
        setSelectedSeats(newSelection);
    };

    const handleNext = () => {
        if (currentStep === 1) {
            if (selectedSeats.length === 0) {
                toast.error("Please select at least one seat");
                return;
            }
            setCurrentStep(2);
        } else if (currentStep === 2) {
            if (!selectedBoardingPoint || !selectedDroppingPoint) {
                toast.error("Please select both boarding and dropping points");
                return;
            }
            setCurrentStep(3);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => (prev - 1) as Step);
        }
    };

    const handlePassengerChange = (index: number, field: keyof Passenger, value: any) => {
        setPassengers(prev => {
            const next = [...prev];
            const updatedPassenger = { ...next[index], [field]: value };

            // If changing name/age/gender manually, reset isQuickSelected
            if (field === 'name' || field === 'age' || field === 'gender') {
                updatedPassenger.isQuickSelected = false;
            }

            next[index] = updatedPassenger;
            return next;
        });
    };

    const isStep3Valid = () => {
        if (!contactInfo.mobile || !contactInfo.email) return false;
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactInfo.email)) return false;
        // Basic mobile validation (10 digits)
        if (contactInfo.mobile.length < 10) return false;

        return passengers.every(p => p.name.trim().length >= 3 && Number(p.age) > 0 && Number(p.age) < 120 && p.gender);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-pulse flex flex-col items-center"><Bus className="h-10 w-10 text-gray-300 mb-4" /><div className="h-4 w-32 bg-gray-200 rounded"></div></div></div>;
    if (!busData) return <div className="min-h-screen flex items-center justify-center text-red-500">Bus details not found</div>;

    const uniquePrices = Array.from(new Set(busData.seats.map((s: any) => s.price))).sort((a: any, b: any) => a - b);
    const totalPrice = selectedSeats.reduce((sum, s) => sum + (s.price || busData.price), 0);

    const handleProceedToConfirmation = async () => {
        if (!user) {
            toast.error("Please login to proceed");
            return;
        }

        setLoading(true);
        try {
            const seatIds = selectedSeats.map(s => s.id);
            const lockResult = await lockSeatsAction(busData.id, seatIds, user.id);

            if (lockResult.success && lockResult.data) {
                setBookingDetails({
                    busId: busData.busId,
                    scheduleId: busData.id,
                    routeId: busData.routeId,
                    fromCity: busData.from,
                    toCity: busData.to,
                    date: busData.departureTime ? new Date(busData.departureTime) : null,

                    boardingPoint: busData.boardingPoints.find((bp: any) => bp.id === selectedBoardingPoint)?.name || "Selected Point",
                    droppingPoint: busData.droppingPoints.find((dp: any) => dp.id === selectedDroppingPoint)?.name || "Selected Point",

                    boardingTime: busData.boardingPoints.find((bp: any) => bp.id === selectedBoardingPoint)?.time || format(busData.departureTime, 'HH:mm'),
                    droppingTime: busData.droppingPoints.find((dp: any) => dp.id === selectedDroppingPoint)?.time || format(busData.arrivalTime, 'HH:mm'),

                    selectedSeatIds: selectedSeats.map(s => s.id),
                    passengers: passengers.map(p => ({
                        ...p,
                        age: p.age.toString(),
                    })),

                    totalAmount: totalPrice,
                    busName: busData.name,
                    busType: `${busData.type} ${busData.is_ac ? 'AC' : 'Non-AC'}`,

                    lockToken: lockResult.data.lockToken,
                    lockExpiry: lockResult.data.expiryAt.toISOString()
                });
                router.push('/booking/confirmation');
            } else {
                toast.error(lockResult.error || "Failed to reserve seats. They might have been taken.");
            }
        } catch (error) {
            toast.error("An error occurred while reserving seats");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            <LayoutWrapper>
                <div className="flex items-center container mx-auto px-4 py-2 text-sm text-gray-500">
                    <Link href={backUrl} className="flex items-center hover:text-primary transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Search
                    </Link>
                </div>

                <BusHeader busData={busData} />

                <div className="container mx-auto px-4">
                    <StepIndicator currentStep={currentStep} />

                    <div className="">

                        {/* STEP 1: SEAT SELECTION */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Card className="border-0 shadow-lg overflow-hidden">
                                    <div className="bg-white p-4 border-b flex justify-between items-center bg-gray-50/50">
                                        <h2 className="font-semibold text-lg">Select Your Seats</h2>

                                        {/* Price Filter */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground mr-2 hidden sm:inline-block">Filter Price:</span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => setSelectedPriceFilter("all")}
                                                    className={cn("px-3 py-1 text-xs rounded-full border transition-all", selectedPriceFilter === "all" ? "bg-gray-800 text-white border-gray-800" : "bg-white border-gray-200 hover:border-gray-300")}
                                                >All</button>
                                                {uniquePrices.map((p: any) => (
                                                    <button
                                                        key={p}
                                                        onClick={() => setSelectedPriceFilter(p)}
                                                        className={cn("px-3 py-1 text-xs rounded-full border transition-all", selectedPriceFilter === p ? "bg-gray-800 text-white border-gray-800" : "bg-white border-gray-200 hover:border-gray-300")}
                                                    >₹{p}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-6 bg-white min-h-[400px] flex items-center justify-center">
                                        <SeatMap
                                            seats={busData.seats}
                                            price={busData.price}
                                            selectedSeats={selectedSeats}
                                            onSeatClick={handleSeatSelect}
                                            filterPrice={selectedPriceFilter}
                                        />
                                    </CardContent>
                                    <div className="bg-gray-50 p-4 text-center text-xs text-gray-500 flex flex-wrap justify-center gap-6 border-t">
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-white border border-gray-300"></div> Available</div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-600"></div> Selected</div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-300"></div> Booked</div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-rose-50 border border-rose-200"></div> Female</div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* STEP 2: BOARDING & DROPPING */}
                        {currentStep === 2 && (
                            <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Boarding Points */}
                                <Card className="border-0 shadow-md h-full">
                                    <div className="p-4 border-b bg-gray-50/50">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <div className="bg-primary/10 p-1.5 rounded text-primary"><MapPin className="h-4 w-4" /></div>
                                            Boarding from {busData.from}
                                        </h3>
                                    </div>
                                    <CardContent className="p-0">
                                        <RadioGroup value={selectedBoardingPoint} onValueChange={setSelectedBoardingPoint} className="divide-y">
                                            {busData.boardingPoints.length > 0 ? busData.boardingPoints.map((bp: any) => (
                                                <div key={bp.id} className={cn("flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors", selectedBoardingPoint === bp.id ? "bg-primary/5" : "")}>
                                                    <div className="flex items-center space-x-3 flex-1">
                                                        <RadioGroupItem value={bp.id} id={`bp-${bp.id}`} />
                                                        <Label htmlFor={`bp-${bp.id}`} className="flex-1 cursor-pointer">
                                                            <div className="font-medium text-gray-900">{bp.name}</div>
                                                        </Label>
                                                    </div>
                                                    <div className="font-mono text-sm font-semibold text-primary">{bp.time || format(busData.departureTime, 'HH:mm')}</div>
                                                </div>
                                            )) : <div className="p-6 text-center text-gray-400">No specific boarding points</div>}
                                        </RadioGroup>
                                    </CardContent>
                                </Card>

                                {/* Dropping Points */}
                                <Card className="border-0 shadow-md h-full">
                                    <div className="p-4 border-b bg-gray-50/50">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <div className="bg-primary/10 p-1.5 rounded text-primary"><MapPin className="h-4 w-4" /></div>
                                            Dropping at {busData.to}
                                        </h3>
                                    </div>
                                    <CardContent className="p-0">
                                        <RadioGroup value={selectedDroppingPoint} onValueChange={setSelectedDroppingPoint} className="divide-y hidden-radio-circles">
                                            {busData.droppingPoints.length > 0 ? busData.droppingPoints.map((dp: any) => (
                                                <div key={dp.id} className={cn("flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors", selectedDroppingPoint === dp.id ? "bg-primary/5" : "")}>
                                                    <div className="flex items-center space-x-3 flex-1">
                                                        <RadioGroupItem value={dp.id} id={`dp-${dp.id}`} />
                                                        <Label htmlFor={`dp-${dp.id}`} className="flex-1 cursor-pointer">
                                                            <div className="font-medium text-gray-900">{dp.name}</div>
                                                        </Label>
                                                    </div>
                                                    <div className="font-mono text-sm font-semibold text-gray-600">{dp.time || format(busData.arrivalTime, 'HH:mm')}</div>
                                                </div>
                                            )) : <div className="p-6 text-center text-gray-400">No specific dropping points</div>}
                                        </RadioGroup>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {/* Contact Info Card */}
                                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-md ring-1 ring-gray-100">
                                    <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 p-2 rounded-xl text-primary shadow-sm">
                                                <Mail className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 tracking-tight">Contact Information</h3>
                                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Where should we send your ticket?</p>
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-8">
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-2.5">
                                                <Label htmlFor="email" className="text-xs font-bold text-gray-700 ml-1">Email Address</Label>
                                                <div className="relative group">
                                                    <div className="absolute left-3.5 top-3 text-gray-400 group-focus-within:text-primary transition-colors">
                                                        <Mail className="h-4 w-4" />
                                                    </div>
                                                    <Input
                                                        id="email"
                                                        placeholder="e.g. sriram@example.com"
                                                        className="pl-11 h-12 bg-gray-50/50 border-gray-200 focus-visible:ring-primary/20 transition-all rounded-xl"
                                                        value={contactInfo.email}
                                                        onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2.5">
                                                <Label htmlFor="mobile" className="text-xs font-bold text-gray-700 ml-1">Phone Number</Label>
                                                <div className="relative group">
                                                    <div className="absolute left-3.5 top-3 text-gray-400 group-focus-within:text-primary transition-colors">
                                                        <Phone className="h-4 w-4" />
                                                    </div>
                                                    <div className="absolute left-10 top-3 text-gray-300 font-light mr-2">|</div>
                                                    <Input
                                                        id="mobile"
                                                        placeholder="9876543210"
                                                        className="pl-14 h-12 bg-gray-50/50 border-gray-200 focus-visible:ring-primary/20 transition-all rounded-xl"
                                                        value={contactInfo.mobile}
                                                        onChange={(e) => setContactInfo({ ...contactInfo, mobile: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Passenger Details List */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                            Passenger Details
                                            <Badge variant="secondary" className="bg-primary/10 text-primary h-6 px-3 rounded-full font-bold">
                                                {passengers.length} {passengers.length === 1 ? 'Seat' : 'Seats'}
                                            </Badge>
                                        </h3>
                                    </div>

                                    {passengers.map((p, index) => {
                                        const seat = selectedSeats.find(s => s.id === p.seatId);
                                        const adjLocked = checkAdjacencyRestriction(seat);
                                        const isFemaleLocked = seat?.gender_lock === "female" || !!adjLocked;
                                        const isMaleLocked = seat?.gender_lock === "male";

                                        return (
                                            <Card key={p.seatId} className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 ring-1 ring-gray-100 bg-white">
                                                <div className={cn(
                                                    "px-6 py-4 flex items-center justify-between transition-colors",
                                                    isFemaleLocked ? "bg-rose-50/50" : isMaleLocked ? "bg-blue-50/50" : "bg-gray-50/50"
                                                )}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "h-12 w-12 rounded-2xl flex flex-col items-center justify-center shadow-sm font-black text-white",
                                                            isFemaleLocked ? "bg-rose-500" : isMaleLocked ? "bg-blue-500" : "bg-slate-700"
                                                        )}>
                                                            <span className="text-[10px] leading-none opacity-80 uppercase">Seat</span>
                                                            <span className="text-lg leading-none mt-0.5">{p.seatNumber}</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-extrabold text-gray-900 tracking-tight">Passenger {index + 1}</h4>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                {isFemaleLocked && (
                                                                    <Badge variant="outline" className="text-[9px] h-4 bg-rose-100/50 text-rose-600 border-rose-200 font-bold uppercase tracking-tighter">Female Mandatory</Badge>
                                                                )}
                                                                {isMaleLocked && (
                                                                    <Badge variant="outline" className="text-[9px] h-4 bg-blue-100/50 text-blue-600 border-blue-200 font-bold uppercase tracking-tighter">Male Mandatory</Badge>
                                                                )}
                                                                <span className="text-[10px] text-muted-foreground font-semibold">Enter details below</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <CardContent className="p-8 space-y-8">
                                                    {user && savedPassengers.length > 0 && (
                                                        <div className="space-y-6">
                                                            <div className="flex flex-col gap-3">
                                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest text-[10px]">
                                                                    <Users className="h-3.5 w-3.5 text-primary" /> Quick Select from Saved
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex-1">
                                                                        <Select
                                                                            value={p.savedId}
                                                                            onValueChange={(val) => {
                                                                                if (val === "clear") {
                                                                                    handlePassengerChange(index, "name", "");
                                                                                    handlePassengerChange(index, "age", "");
                                                                                    handlePassengerChange(index, "isQuickSelected", false);
                                                                                    handlePassengerChange(index, "savedId", undefined);
                                                                                    return;
                                                                                }
                                                                                const saved = savedPassengers.find(sp => sp.id === val);
                                                                                if (saved) handleSelectSavedPassenger(index, saved);
                                                                            }}
                                                                        >
                                                                            <SelectTrigger className={cn(
                                                                                "h-12 bg-white border-gray-200 shadow-sm rounded-xl text-sm font-bold hover:border-primary transition-all",
                                                                                p.isQuickSelected && "border-primary bg-primary/5"
                                                                            )}>
                                                                                <SelectValue placeholder="Choose a saved passenger..." />
                                                                            </SelectTrigger>
                                                                            <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                                                                {savedPassengers.map((sp) => (
                                                                                    <SelectItem key={sp.id} value={sp.id} className="py-2.5">
                                                                                        <div className="flex items-center justify-between w-full">
                                                                                            <span className="font-bold">{sp.name}</span>
                                                                                            <Badge variant="secondary" className="ml-2 text-[10px] scale-90">{sp.gender}, {sp.age}y</Badge>
                                                                                        </div>
                                                                                    </SelectItem>
                                                                                ))}
                                                                                {p.isQuickSelected && (
                                                                                    <SelectItem value="clear" className="text-rose-500 font-bold border-t mt-1">
                                                                                        Clear Selection
                                                                                    </SelectItem>
                                                                                )}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    {p.isQuickSelected && (
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                handlePassengerChange(index, "name", "");
                                                                                handlePassengerChange(index, "age", "");
                                                                                handlePassengerChange(index, "isQuickSelected", false);
                                                                                handlePassengerChange(index, "savedId", undefined);
                                                                            }}
                                                                            className="h-12 px-4 rounded-xl border-gray-200 text-gray-500 hover:text-rose-500 hover:border-rose-200"
                                                                        >
                                                                            Reset
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="relative py-2">
                                                                <div className="absolute inset-0 flex items-center">
                                                                    <span className="w-full border-t border-gray-100" />
                                                                </div>
                                                                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black">
                                                                    <span className="bg-white px-4 text-gray-300">OR</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="grid lg:grid-cols-12 gap-8 items-end">
                                                        <div className="lg:col-span-6 space-y-2.5">
                                                            <Label className="text-[11px] font-black uppercase tracking-widest text-gray-500 ml-1">Full Name</Label>
                                                            <div className="relative group/input">
                                                                <Users className="absolute left-4 top-3.5 h-5 w-5 text-gray-300 group-focus-within/input:text-primary transition-colors" />
                                                                <Input
                                                                    placeholder="Full name as on ID"
                                                                    className={cn(
                                                                        "pl-12 h-12 bg-gray-50/30 border-gray-200 rounded-xl font-medium focus:bg-white transition-all shadow-inner",
                                                                        p.isQuickSelected && "opacity-50 cursor-not-allowed"
                                                                    )}
                                                                    value={p.name}
                                                                    disabled={p.isQuickSelected}
                                                                    onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="lg:col-span-2 space-y-2.5">
                                                            <Label className="text-[11px] font-black uppercase tracking-widest text-gray-500 ml-1">Age</Label>
                                                            <Input
                                                                placeholder="Age"
                                                                type="number"
                                                                className={cn(
                                                                    "h-12 bg-gray-50/30 border-gray-200 rounded-xl text-center font-bold focus:bg-white transition-all shadow-inner",
                                                                    p.isQuickSelected && "opacity-50 cursor-not-allowed"
                                                                )}
                                                                value={p.age}
                                                                disabled={p.isQuickSelected}
                                                                onChange={(e) => handlePassengerChange(index, 'age', e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="lg:col-span-4 space-y-2.5">
                                                            <Label className="text-[11px] font-black uppercase tracking-widest text-gray-500 ml-1">Gender</Label>
                                                            <div className={cn(
                                                                "flex bg-gray-100/80 p-1 rounded-[14px] shadow-inner ring-1 ring-gray-100",
                                                                p.isQuickSelected && "opacity-50 pointer-events-none"
                                                            )}>
                                                                <button
                                                                    onClick={() => !isFemaleLocked && handlePassengerChange(index, 'gender', 'male')}
                                                                    disabled={isFemaleLocked || p.isQuickSelected}
                                                                    className={cn(
                                                                        "flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2",
                                                                        p.gender === 'male'
                                                                            ? "bg-white text-blue-600 shadow-md ring-1 ring-blue-100"
                                                                            : "text-gray-400 hover:text-gray-600",
                                                                        (isFemaleLocked || p.isQuickSelected) && "opacity-30 cursor-not-allowed"
                                                                    )}
                                                                >
                                                                    {p.gender === 'male' && <Check className="h-3.5 w-3.5" />}
                                                                    Male
                                                                </button>
                                                                <button
                                                                    onClick={() => !isMaleLocked && handlePassengerChange(index, 'gender', 'female')}
                                                                    disabled={isMaleLocked || p.isQuickSelected}
                                                                    className={cn(
                                                                        "flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2",
                                                                        p.gender === 'female'
                                                                            ? "bg-white text-rose-500 shadow-md ring-1 ring-rose-100"
                                                                            : "text-gray-400 hover:text-gray-600",
                                                                        (isMaleLocked || p.isQuickSelected) && "opacity-30 cursor-not-allowed"
                                                                    )}
                                                                >
                                                                    {p.gender === 'female' && <Check className="h-3.5 w-3.5" />}
                                                                    Female
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* STICKY FOOTER */}
                        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)]">
                            <div className="container mx-auto flex items-center justify-between max-w-4xl">
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Price</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-gray-900">₹{totalPrice}</span>
                                        <span className="text-sm text-gray-500">for {selectedSeats.length} Seats</span>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    {currentStep > 1 && (
                                        <Button variant="outline" onClick={handleBack} size="lg">
                                            Back
                                        </Button>
                                    )}

                                    <Button
                                        onClick={currentStep === 3 ? handleProceedToConfirmation : handleNext}
                                        size="lg"
                                        className="px-8 font-semibold shadow-lg shadow-primary/20"
                                        disabled={
                                            (currentStep === 1 && selectedSeats.length === 0) ||
                                            (currentStep === 2 && (!selectedBoardingPoint || !selectedDroppingPoint)) ||
                                            (currentStep === 3 && !isStep3Valid())
                                        }
                                    >
                                        {currentStep === 3 ? "Proceed to Pay" : "Continue"} <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutWrapper>
        </div>
    );
}

