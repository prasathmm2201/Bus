"use client";

import { useAuth } from "@/store/useAuth";
import { useRouter } from "next/navigation";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Wallet, Smartphone, ShieldCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PaymentPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handlePayment = () => {
        setLoading(true);
        // Simulate Razorpay Payment
        setTimeout(() => {
            toast.success("Payment Received! Confirming your ticket...");
            setTimeout(() => {
                router.push("/confirmation/BOOK123456");
                setLoading(false);
            }, 1500);
        }, 2000);
    };

    return (
        <LayoutWrapper>
            <div className="container mx-auto px-4 py-12">
                <div className="mx-auto max-w-2xl space-y-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold">Secure Payment</h1>
                        <p className="text-muted-foreground">Select your preferred payment method</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Card className="cursor-pointer border-2 border-primary/20 hover:border-primary transition-all p-2">
                            <CardContent className="flex items-center gap-4 py-4">
                                <div className="bg-primary/10 p-3 rounded-full">
                                    <Smartphone className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-bold">UPI</h4>
                                    <p className="text-xs text-muted-foreground">Google Pay, PhonePe, Paytm</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="cursor-pointer border-2 border-transparent hover:border-primary transition-all p-2">
                            <CardContent className="flex items-center gap-4 py-4">
                                <div className="bg-muted p-3 rounded-full">
                                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <h4 className="font-bold">Cards</h4>
                                    <p className="text-xs text-muted-foreground">Credit / Debit Cards</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-muted/10">
                        <CardContent className="py-6 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                                <span className="text-sm font-medium">100% Secure Transaction</span>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Total to Pay</p>
                                <p className="text-2xl font-bold text-primary">₹1200</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        className="w-full h-14 text-lg font-bold shadow-xl"
                        onClick={handlePayment}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing Payment...
                            </>
                        ) : (
                            "Pay Now"
                        )}
                    </Button>
                </div>
            </div>
        </LayoutWrapper>
    );
}
