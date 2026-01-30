"use client";

import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, Share2, Mail, Bus } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

export default function ConfirmationPage() {
    const { id } = useParams();
    const [qrCode, setQrCode] = useState("");

    useEffect(() => {
        QRCode.toDataURL(id as string).then(setQrCode);
    }, [id]);

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.text("Sriram Bus - Booking Confirmation", 20, 20);
        doc.text(`Booking ID: ${id}`, 20, 30);
        doc.text("Route: Bangalore to Hyderabad", 20, 40);
        doc.text("Passenger: John Doe", 20, 50);
        doc.text("Seat: L12", 20, 60);
        doc.save(`Ticket_${id}.pdf`);
    };

    return (
        <LayoutWrapper>
            <div className="container mx-auto px-4 py-12">
                <div className="mx-auto max-w-2xl">
                    <div className="mb-12 text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                        </div>
                        <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
                        <p className="text-muted-foreground">Your ticket has been sent to your email.</p>
                    </div>

                    <Card className="overflow-hidden border-2 border-primary/10 shadow-xl">
                        <div className="bg-primary px-6 py-4 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Bus className="h-6 w-6" />
                                <span className="font-bold tracking-widest uppercase">Sriram Bus</span>
                            </div>
                            <span className="text-xs font-mono bg-white/20 px-2 py-1 rounded">#{id}</span>
                        </div>
                        <CardContent className="p-8 space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-2xl font-bold">21:00</p>
                                    <p className="text-sm font-semibold">Bangalore</p>
                                    <p className="text-xs text-muted-foreground">29 Jan, 2026</p>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <div className="h-0.5 w-16 bg-muted relative">
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">8h 00m</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">06:00</p>
                                    <p className="text-sm font-semibold">Hyderabad</p>
                                    <p className="text-xs text-muted-foreground">30 Jan, 2026</p>
                                </div>
                            </div>

                            <div className="border-t border-dashed pt-8 grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase">Passenger</p>
                                        <p className="font-bold">John Doe (25, M)</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase">Seat Number</p>
                                        <p className="font-bold text-primary">L12 (Sleeper)</p>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    {qrCode && <img src={qrCode} alt="QR Code" className="h-24 w-24 border p-1 rounded bg-white" />}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" className="h-12" onClick={downloadPDF}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                        <Button className="h-12">
                            <Share2 className="mr-2 h-4 w-4" />
                            Share Ticket
                        </Button>
                    </div>
                </div>
            </div>
        </LayoutWrapper>
    );
}
