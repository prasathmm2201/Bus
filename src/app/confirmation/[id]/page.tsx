"use client";

import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, Share2, Bus, MapPin, Calendar, Clock, User, QrCode, Mail } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { getBookingByIdAction } from "@/app/actions/bookingActions";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function ConfirmationPage() {
    const { id } = useParams();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [qrCode, setQrCode] = useState("");

    const fetchBooking = useCallback(async () => {
        try {
            const result = await getBookingByIdAction(id as string);
            if (result.success && result.data) {
                setBooking(result.data);
                if (result.data.booking_no) {
                    const qr = await QRCode.toDataURL(result.data.booking_no);
                    setQrCode(qr);
                }
            } else {
                toast.error(result.error || "Failed to fetch booking details");
            }
        } catch (error) {
            console.error("Fetch Booking Error:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchBooking();
    }, [fetchBooking]);

    const downloadPDF = () => {
        if (!booking) return;

        const doc = new jsPDF();
        const primaryColor = "#ea580c"; // orange-600

        // Header
        doc.setFillColor(234, 88, 12); // #ea580c
        doc.rect(0, 0, 210, 40, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("VSR TRAVELS", 105, 25, { align: "center" });

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(18);
        doc.text("Booking Confirmation", 105, 55, { align: "center" });

        // Booking Info
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Booking No: ${booking.booking_no}`, 20, 75);
        doc.text(`Status: ${booking.status}`, 150, 75);

        // Route Info
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 85, 190, 85);

        doc.setFont("helvetica", "bold");
        doc.text("JOURNEY DETAILS", 20, 95);

        doc.setFont("helvetica", "normal");
        doc.text(`${booking.schedule.route.from_city.name} to ${booking.schedule.route.to_city.name}`, 20, 105);
        doc.text(`Bus: ${booking.bus.name} (${booking.bus.is_ac ? "AC" : "Non-AC"} ${booking.bus.is_sleeper ? "Sleeper" : "Seater"})`, 20, 115);

        // Points
        const boarding = booking.schedule.route.boarding_points?.[0];
        const dropping = booking.schedule.route.dropping_points?.slice(-1)[0];

        if (boarding) {
            doc.setFont("helvetica", "bold");
            doc.text("Boarding:", 20, 130);
            doc.setFont("helvetica", "normal");
            doc.text(`${boarding.boarding_point.name}`, 50, 130);
            doc.text(`${format(new Date(booking.schedule.departure_time), "dd MMM yyyy, hh:mm a")}`, 50, 138);
        }

        if (dropping) {
            doc.setFont("helvetica", "bold");
            doc.text("Dropping:", 110, 130);
            doc.setFont("helvetica", "normal");
            doc.text(`${dropping.dropping_point.name}`, 140, 130);
            doc.text(`${format(new Date(booking.schedule.arrival_time), "dd MMM yyyy, hh:mm a")}`, 140, 138);
        }

        // Passenger Details
        doc.line(20, 150, 190, 150);
        doc.setFont("helvetica", "bold");
        doc.text("PASSENGER DETAILS", 20, 160);

        doc.setFontSize(10);
        doc.text("Name", 20, 170);
        doc.text("Age/Gender", 80, 170);
        doc.text("Seat", 140, 170);
        doc.line(20, 173, 190, 173);

        let yPos = 180;
        booking.passengers.forEach((p: any) => {
            doc.text(p.passenger.name, 20, yPos);
            doc.text(`${p.passenger.age} / ${p.passenger.gender}`, 80, yPos);
            doc.text(p.seat.seat_number, 140, yPos);
            yPos += 10;
        });

        // Totals
        doc.line(20, yPos, 190, yPos);
        doc.setFontSize(12);
        doc.text(`Total Amount Paid: Rs. ${booking.final_amount}`, 130, yPos + 10);

        // QR Code
        if (qrCode) {
            doc.addImage(qrCode, "PNG", 160, 45, 30, 30);
        }

        doc.save(`Ticket_${booking.booking_no}.pdf`);
    };

    const shareViaWhatsApp = () => {
        if (!booking) return;
        const text = `Hi! Here are my VSR Travels booking details:\nBooking No: ${booking.booking_no}\nBus: ${booking.bus.name}\nFrom: ${booking.schedule.route.from_city.name}\nTo: ${booking.schedule.route.to_city.name}\nDeparture: ${format(new Date(booking.schedule.departure_time), "dd MMM, hh:mm a")}\nSeat(s): ${booking.passengers.map((p: any) => p.seat.seat_number).join(", ")}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    };

    const shareViaEmail = () => {
        if (!booking) return;
        const subject = `Bus Ticket - ${booking.booking_no}`;
        const body = `Booking Details:\n\nBooking No: ${booking.booking_no}\nBus: ${booking.bus.name}\nFrom: ${booking.schedule.route.from_city.name}\nTo: ${booking.schedule.route.to_city.name}\nDeparture: ${format(new Date(booking.schedule.departure_time), "dd MMM, hh:mm a")}\nSeat(s): ${booking.passengers.map((p: any) => p.seat.seat_number).join(", ")}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    if (loading) {
        return (
            <LayoutWrapper>
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
            </LayoutWrapper>
        );
    }

    if (!booking) {
        return (
            <LayoutWrapper>
                <div className="container mx-auto px-4 py-20 text-center">
                    <h2 className="text-2xl font-bold">Booking Not Found</h2>
                    <p className="text-muted-foreground mt-2">The booking details you are looking for could not be found.</p>
                </div>
            </LayoutWrapper>
        );
    }

    const boarding = booking.schedule.route.boarding_points?.[0];
    const dropping = booking.schedule.route.dropping_points?.slice(-1)[0];

    return (
        <LayoutWrapper>
            <div className="container mx-auto px-4 py-12">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-12 text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900">Booking Confirmed!</h1>
                        <p className="text-slate-500 mt-2 font-medium">Sit back and relax, your journey is booked.</p>
                    </div>

                    <Card className="overflow-hidden border-none shadow-2xl bg-white">
                        {/* Ticket Header */}
                        <div className="bg-primary px-6 py-6 text-white flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Bus className="h-6 w-6" />
                                </div>
                                <div>
                                    <span className="font-bold text-xl tracking-tight uppercase block leading-none">VSR Travels</span>
                                    <span className="text-[10px] text-white/70 uppercase tracking-widest leading-none mt-1">Premium Transport Service</span>
                                </div>
                            </div>
                            <div className="text-center md:text-right">
                                <p className="text-[10px] text-white/70 uppercase tracking-widest leading-none">Booking Number</p>
                                <p className="font-mono font-bold text-lg leading-tight mt-1">{booking.booking_no}</p>
                            </div>
                        </div>

                        <CardContent className="p-0">
                            <div className="p-8 space-y-10">
                                {/* Route & Time */}
                                <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative">
                                    <div className="flex-1 text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 mb-1">
                                            <MapPin className="h-4 w-4" />
                                            <span className="text-xs font-semibold uppercase tracking-wider">Departure</span>
                                        </div>
                                        <p className="text-4xl font-black text-slate-900 leading-tight">{format(new Date(booking.schedule.departure_time), "hh:mm a")}</p>
                                        <p className="text-lg font-bold text-slate-700">{booking.schedule.route.from_city.name}</p>
                                        <div className="mt-2 text-xs font-medium text-slate-500 flex items-center justify-center md:justify-start gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(booking.schedule.departure_time), "dd MMM yyyy")}
                                        </div>
                                        <p className="mt-1 text-xs text-primary font-bold">{boarding?.boarding_point.name}</p>
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                            {Math.round((new Date(booking.schedule.arrival_time).getTime() - new Date(booking.schedule.departure_time).getTime()) / (1000 * 60 * 60))}h Journey
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="h-0.5 w-12 md:w-24 bg-slate-200 relative">
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary ring-4 ring-primary/20"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 text-center md:text-right">
                                        <div className="flex items-center justify-center md:justify-end gap-2 text-slate-500 mb-1">
                                            <span className="text-xs font-semibold uppercase tracking-wider">Arrival</span>
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <p className="text-4xl font-black text-slate-900 leading-tight">{format(new Date(booking.schedule.arrival_time), "hh:mm a")}</p>
                                        <p className="text-lg font-bold text-slate-700">{booking.schedule.route.to_city.name}</p>
                                        <div className="mt-2 text-xs font-medium text-slate-500 flex items-center justify-center md:justify-end gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(booking.schedule.arrival_time), "dd MMM yyyy")}
                                        </div>
                                        <p className="mt-1 text-xs text-primary font-bold">{dropping?.dropping_point.name}</p>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="relative">
                                    <div className="absolute left-[-32px] top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-slate-50 shadow-inner"></div>
                                    <div className="border-t-2 border-dashed border-slate-100 w-full"></div>
                                    <div className="absolute right-[-32px] top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-slate-50 shadow-inner"></div>
                                </div>

                                {/* Passenger Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                <User className="h-3.5 w-3.5" />
                                                Passenger Details
                                            </h3>
                                            <div className="space-y-4">
                                                {booking.passengers.map((p: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-start bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                        <div>
                                                            <p className="font-bold text-slate-800">{p.passenger.name}</p>
                                                            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{p.passenger.age} years • {p.passenger.gender}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <Badge className="bg-primary/10 text-primary border-none font-bold">Seat {p.seat.seat_number}</Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5" />
                                                Bus Info
                                            </h3>
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <p className="font-bold text-slate-800">{booking.bus.name}</p>
                                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5 uppercase tracking-widest">
                                                    {booking.bus.is_ac ? "Air Conditioned" : "Non-AC"} • {booking.bus.is_sleeper ? "Sleeper" : "Seater"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center border-l border-slate-100 pl-0 md:pl-12">
                                        <div className="p-4 bg-white border-2 border-primary/10 rounded-2xl shadow-sm mb-4">
                                            {qrCode ? (
                                                <img src={qrCode} alt="Ticket QR" className="h-32 w-32" />
                                            ) : (
                                                <div className="h-32 w-32 flex items-center justify-center bg-slate-50 rounded-lg">
                                                    <QrCode className="h-10 w-10 text-slate-300" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Scan at Boarding Point</p>

                                        <div className="mt-8 text-center pt-8 border-t border-slate-100 w-full">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
                                            <p className="text-3xl font-black text-slate-900">₹{booking.final_amount.toLocaleString()}</p>
                                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Payment Successful</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Note */}
                            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                    * Please reach the boarding point 15 minutes before departure. Carry a valid photo ID for verification. Ticket is valid only for the specified date and time.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Button
                            variant="outline"
                            className="h-14 rounded-2xl border-2 font-bold text-slate-700 hover:bg-slate-50 gap-2"
                            onClick={downloadPDF}
                        >
                            <Download className="h-5 w-5" />
                            Download PDF
                        </Button>
                        <Button
                            className="h-14 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] border-none font-bold text-white shadow-lg shadow-emerald-100 gap-2"
                            onClick={shareViaWhatsApp}
                        >
                            <Share2 className="h-5 w-5" />
                            WhatsApp
                        </Button>
                        <Button
                            className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 border-none font-bold text-white shadow-lg shadow-slate-200 gap-2"
                            onClick={shareViaEmail}
                        >
                            <Mail className="h-5 w-5" />
                            Share via Email
                        </Button>
                    </div>
                </div>
            </div>
        </LayoutWrapper>
    );
}
