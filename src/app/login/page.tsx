"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bus, ArrowRight, Phone, ShieldCheck, RefreshCcw, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/store/useAuth";
import Link from "next/link";
import { sendOtpAction, verifyOtpAction } from "@/app/actions/userActions";

export default function LoginPage() {
    const [step, setStep] = useState<"mobile" | "otp">("mobile");
    const [mobileNo, setMobileNo] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const router = useRouter();
    const { user, setAuth } = useAuth();

    useEffect(() => {
        if (user) {
            router.push("/");
        }
    }, [user, router]);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mobileNo.length < 10) {
            toast.error("Please enter a valid mobile number");
            return;
        }

        setLoading(true);
        try {
            const res = await sendOtpAction(mobileNo);
            if (res.success) {
                toast.success("OTP sent successfully!");
                setStep("otp");
                setTimer(60);
                const interval = setInterval(() => {
                    setTimer((prev) => {
                        if (prev <= 1) {
                            clearInterval(interval);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                toast.error(res.error || "Failed to send OTP");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCode.length !== 4 && otpCode.length !== 6) {
            toast.error("Please enter a valid OTP");
            return;
        }

        setLoading(true);
        try {
            const res = await verifyOtpAction(mobileNo, otpCode);
            if (res.success && res.data) {
                setAuth(
                    {
                        id: res.data.id,
                        name: res.data.name || "User",
                        email: res.data.email || "",
                        role: res.data.role
                    },
                    res.token || ""
                );
                toast.success("Successfully logged in!");
                router.push("/");
            } else {
                toast.error(res.error || "Invalid OTP");
            }
        } catch (error: any) {
            toast.error("An error occurred during verification");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden">
                <div className="bg-primary p-8 text-white relative">
                    <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                    <Link href="/" className="inline-flex items-center text-white/80 hover:text-white mb-6 text-sm transition-colors">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Home
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <Bus className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                    </div>
                    <CardDescription className="text-white/80">Login to manage your bookings and profile</CardDescription>
                </div>

                <CardContent className="p-8 pt-10">
                    <div className="mb-8 flex justify-center">
                        <div className="bg-slate-100 p-1 rounded-lg flex w-full">
                            <button className="flex-1 py-2 px-4 rounded-md bg-white shadow-sm text-sm font-semibold text-primary">
                                User Login
                            </button>
                            <Link href="/admin/login" className="flex-1 py-2 px-4 text-sm font-medium text-slate-500 hover:text-primary transition-colors text-center">
                                Admin Access
                            </Link>
                        </div>
                    </div>

                    {step === "mobile" ? (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="mobile" className="text-sm font-semibold text-slate-700">Mobile Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                                    <div className="absolute left-9 top-3.5 text-slate-600 font-medium text-sm">
                                        +91
                                    </div>
                                    <Input
                                        id="mobile"
                                        type="tel"
                                        placeholder="Enter 10 digit number"
                                        className="pl-20 h-12 border-slate-200 focus:border-primary focus:ring-primary text-base"
                                        value={mobileNo}
                                        onChange={(e) => setMobileNo(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" disabled={loading}>
                                {loading ? (
                                    <RefreshCcw className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Get Verification Code
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="space-y-4 text-center">
                                <div>
                                    <Label htmlFor="otp" className="text-sm font-semibold text-slate-700">Enter Verification Code</Label>
                                    <p className="text-xs text-slate-500 mt-1">
                                        OTP sent to <span className="font-bold text-slate-700">+91 {mobileNo}</span>
                                    </p>
                                </div>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="••••"
                                        className="h-12 border-slate-200 focus:border-primary focus:ring-primary text-center tracking-[1em] text-xl font-bold"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-between items-center text-sm pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep("mobile")}
                                        className="text-primary hover:underline font-medium"
                                    >
                                        Edit Number
                                    </button>
                                    {timer > 0 ? (
                                        <span className="text-slate-400">Resend in {timer}s</span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            className="text-primary hover:underline font-medium"
                                        >
                                            Resend OTP
                                        </button>
                                    )}
                                </div>
                            </div>
                            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" disabled={loading}>
                                {loading ? "Verifying..." : "Secure Login"}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
