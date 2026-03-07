"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "@/store/useBookingStore";
import { useAuth } from "@/store/useAuth";
import { toast } from "sonner";
import { createBookingAction } from "@/app/actions/bookingActions";
import { verifyCouponAction } from "@/app/actions/couponActions";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Tag, Armchair, TicketCheck, MapPin, Calendar, Clock, Bus as BusIcon, User } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";

export default function BookingConfirmationPage() {
    const router = useRouter();
    const bookingDetails = useBookingStore();
    const { user } = useAuth();

    // Coupon State
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_amount: number; final_amount: number; description?: string } | null>(null);
    const [verifyingCoupon, setVerifyingCoupon] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Countdown Timer State
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isHydrated, setIsHydrated] = useState(false);
    const { lockToken, lockExpiry, clearBooking } = bookingDetails;

    // --- Helper Functions (Defined before useEffect to avoid TDZ) ---

    const handleReleaseSeats = async () => {
        if (lockToken) {
            const { releaseSeatsAction } = await import("@/app/actions/bookingActions");
            await releaseSeatsAction(lockToken);
            clearBooking();
        }
    };

    const handleApplyCoupon = async () => {
        const baseAmount = bookingDetails.totalAmount;
        if (!couponCode.trim()) {
            toast.error("Please enter a coupon code");
            return;
        }

        setVerifyingCoupon(true);
        try {
            const res = await verifyCouponAction(couponCode, baseAmount);
            if (res.success && res.data) {
                setAppliedCoupon(res.data as any);
                toast.success("Coupon applied successfully!");
            } else {
                setAppliedCoupon(null);
                toast.error(res.error || "Invalid coupon");
            }
        } catch (error) {
            toast.error("Failed to apply coupon");
        } finally {
            setVerifyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode("");
        toast.info("Coupon removed");
    };

    const handleProceedToPay = async () => {
        if (!user) {
            toast.error("Please login to proceed");
            return;
        }

        if (timeLeft === 0 && lockExpiry) {
            toast.error("Session expired");
            return;
        }

        setIsBooking(true);
        try {
            const bookingData = {
                userId: user.id || "",
                scheduleId: bookingDetails.scheduleId || "",
                busId: bookingDetails.busId || "",
                couponCode: appliedCoupon?.code || undefined,
                lockToken: lockToken || undefined,
                passengers: bookingDetails.passengers.map(p => ({
                    name: p.name,
                    age: parseInt(p.age) || 0,
                    gender: p.gender as "male" | "female" | "other",
                    seatId: p.seatId
                }))
            };

            const res = await createBookingAction(bookingData);

            if (res.success) {
                toast.success("Booking confirmed successfully!");
                setIsSuccess(true);
                clearBooking();
                router.push("/my-bookings");
            } else {
                console.error("Booking failed. Payload:", bookingData);
                toast.error(res.error || "Failed to create booking");
            }
        } catch (error) {
            console.error("Booking error details:", error);
            toast.error("An error occurred processing your booking");
        } finally {
            setIsBooking(false);
        }
    };

    const handleCancelAndExit = async () => {
        setIsBooking(true); // Prevent further actions
        try {
            await handleReleaseSeats();
            toast.info("Reservation cancelled");
            router.back();
        } catch (error) {
            router.back();
        }
    };

    const handleBackClick = () => {
        if (!isBooking) {
            setShowExitConfirm(true);
        } else {
            router.back();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Effects ---

    // Handle hydration
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (!isHydrated) return;

        // If after hydration we still don't have a busId, and it's not currently booking
        // AND it's not a success case (where state is cleared but we are redirecting)
        if (!bookingDetails.busId && !isBooking && !isSuccess) {
            toast.error("No booking in progress", { id: "no-booking" });
            router.push("/");
        }
    }, [isHydrated, bookingDetails.busId, isBooking, isSuccess, router]);

    useEffect(() => {
        if (lockExpiry) {
            const expiry = new Date(lockExpiry).getTime();
            const updateTimer = () => {
                const now = new Date().getTime();
                const diff = Math.max(0, Math.floor((expiry - now) / 1000));
                setTimeLeft(diff);

                if (diff === 0) {
                    toast.error("Session expired. Please select seats again.");
                    handleReleaseSeats();
                    router.push(`/search`);
                }
            };
            updateTimer();
            const interval = setInterval(updateTimer, 1000);
            return () => clearInterval(interval);
        }
    }, [lockExpiry, router]);

    // Handle seat release on unmount/browser close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isBooking && lockToken) {
                const url = '/api/booking/release-lock';
                const data = JSON.stringify({ lockToken });
                navigator.sendBeacon(url, data);
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && !isBooking && lockToken) {
                // Secondary fallback for mobile
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // REMOVED handleReleaseSeats() from here!
            // It was clearing the booking state on every unmount (including re-renders/refresh)
        };
    }, [lockToken, isBooking]);

    if (!isHydrated || !bookingDetails.busId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const baseAmount = bookingDetails.totalAmount;
    const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
    const finalAmount = Math.max(0, baseAmount - discountAmount);
    const taxAmount = 0;
    const totalPayable = finalAmount + taxAmount;

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50 pb-20">
                <LayoutWrapper>
                    {/* Header */}
                    <div className="bg-white shadow-sm border-b sticky top-0 z-30">
                        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={handleBackClick}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <h1 className="text-xl font-bold text-gray-900">Review Booking</h1>
                            {timeLeft > 0 && (
                                <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-full animate-pulse">
                                    <Clock className="h-4 w-4 text-rose-500" />
                                    <span className="text-sm font-bold text-rose-600 font-mono">
                                        {formatTime(timeLeft)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="container mx-auto px-4 py-8">
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* LEFT COLUMN: Booking Details */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Trip Details */}
                                <Card className="border-0 shadow-sm overflow-hidden">
                                    <CardHeader className="bg-primary/5 pb-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                                    {bookingDetails.fromCity}
                                                    <span className="text-muted-foreground">→</span>
                                                    {bookingDetails.toCity}
                                                </CardTitle>
                                                <CardDescription className="mt-1 flex items-center gap-2">
                                                    <Calendar className="h-3 w-3" />
                                                    {bookingDetails.date ? format(new Date(bookingDetails.date), "EEE, dd MMM yyyy") : "Date not selected"}
                                                </CardDescription>
                                            </div>
                                            <Badge variant="outline" className="bg-white text-primary border-primary/20">
                                                {bookingDetails.busType}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                <BusIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{bookingDetails.busName}</p>
                                                <p className="text-sm text-muted-foreground">Sriram Travels</p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6 relative">
                                            {/* Connector Line */}
                                            <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-[1px] bg-gray-100 -translate-x-1/2"></div>

                                            <div className="space-y-1">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Boarding</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-xl font-bold text-gray-900">{bookingDetails.boardingTime}</span>
                                                    <span className="text-sm text-gray-500">{bookingDetails.fromCity}</span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mt-1">
                                                    <MapPin className="h-3.5 w-3.5 text-primary" />
                                                    {bookingDetails.boardingPoint || "Selected Point"}
                                                </p>
                                            </div>

                                            <div className="space-y-1 md:pl-8">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dropping</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-xl font-bold text-gray-900">{bookingDetails.droppingTime}</span>
                                                    <span className="text-sm text-gray-500">{bookingDetails.toCity}</span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mt-1">
                                                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                                                    {bookingDetails.droppingPoint || "Selected Point"}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Passenger List */}
                                <Card className="border-0 shadow-sm">
                                    <CardHeader className="pb-3 border-b">
                                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Passenger Details
                                            <Badge variant="secondary" className="ml-auto text-xs font-normal">
                                                {bookingDetails.passengers.length} Passenger{bookingDetails.passengers.length !== 1 ? 's' : ''}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0 divide-y">
                                        {bookingDetails.passengers.map((p, i) => (
                                            <div key={i} className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-gray-100 h-8 w-8 rounded-full flex items-center justify-center text-gray-500 font-medium text-xs">
                                                        {i + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm text-gray-900">{p.name} <span className="text-gray-400 font-normal">({p.age}, {p.gender})</span></p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="font-mono bg-white">Seat {p.seatNumber}</Badge>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* RIGHT COLUMN: Price & Coupons */}
                            <div className="space-y-6">
                                {/* Coupon Code */}
                                <Card className="border-0 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-primary" />
                                            Offers & Coupons
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-4">
                                        {!appliedCoupon ? (
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Input
                                                        placeholder="Enter coupon code"
                                                        className="uppercase placeholder:normal-case font-medium pr-8"
                                                        value={couponCode}
                                                        onChange={(e) => setCouponCode(e.target.value)}
                                                    />
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    onClick={handleApplyCoupon}
                                                    disabled={verifyingCoupon || !couponCode}
                                                >
                                                    {verifyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex justify-between items-center animate-in fade-in">
                                                <div>
                                                    <p className="text-green-700 font-bold text-sm flex items-center gap-1">
                                                        <TicketCheck className="h-4 w-4" />
                                                        {appliedCoupon.code} Applied
                                                    </p>
                                                    <p className="text-xs text-green-600 mt-0.5">
                                                        You saved ₹{appliedCoupon.discount_amount}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-auto p-1 text-green-700 hover:text-green-800 hover:bg-green-100"
                                                    onClick={handleRemoveCoupon}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Price Breakup */}
                                <Card className="border-0 shadow-lg ring-1 ring-gray-100">
                                    <CardHeader className="bg-gray-50/50 pb-4 border-b">
                                        <CardTitle className="text-lg">Payment Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-3">
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Base Fare ({bookingDetails.passengers.length} seats)</span>
                                            <span className="font-medium">₹{baseAmount}</span>
                                        </div>

                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Tax & Charges</span>
                                            <span className="font-medium">₹0</span>
                                        </div>

                                        {appliedCoupon && (
                                            <div className="flex justify-between text-sm text-green-600 font-medium pb-2 border-b border-dashed">
                                                <span>Coupon Discount</span>
                                                <span>- ₹{appliedCoupon.discount_amount}</span>
                                            </div>
                                        )}

                                        <div className="pt-2 flex justify-between items-baseline">
                                            <span className="font-bold text-gray-900">Total Payable</span>
                                            <span className="text-2xl font-bold text-primary">₹{totalPayable}</span>
                                        </div>

                                        <div className="pt-6">
                                            <Button
                                                size="lg"
                                                className="w-full font-bold shadow-lg shadow-primary/25"
                                                onClick={handleProceedToPay}
                                                disabled={isBooking}
                                            >
                                                {isBooking ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    `Pay ₹${totalPayable}`
                                                )}
                                            </Button>
                                            <p className="text-xs text-center text-muted-foreground mt-3">
                                                By clicking pay, you agree to our terms and conditions.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </LayoutWrapper>

                {/* Exit Confirmation Dialog */}
                <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <div className="mx-auto w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="h-6 w-6 text-amber-600" />
                            </div>
                            <DialogTitle className="text-center text-xl">Cancel Reservation?</DialogTitle>
                            <DialogDescription className="text-center">
                                Going back will release your selected seats. Are you sure you want to cancel this booking?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="sm:justify-center gap-2 mt-4">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowExitConfirm(false)}
                                disabled={isBooking}
                            >
                                Stay and Pay
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={handleCancelAndExit}
                                disabled={isBooking}
                            >
                                {isBooking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Cancel & Exit"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AuthGuard>
    );
}
