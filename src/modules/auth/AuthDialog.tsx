import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/store/useAuth";
import { toast } from "sonner";
import { sendOtpAction, verifyOtpAction } from "@/app/actions/userActions";
import { Phone, ShieldCheck, ArrowRight, RefreshCcw } from "lucide-react";

interface AuthDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AuthDialog({ isOpen, onClose, onSuccess }: AuthDialogProps) {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"mobile" | "otp">("mobile");
    const [mobileNo, setMobileNo] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [timer, setTimer] = useState(0);

    const { setAuth } = useAuth();

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
                // Start a simple timer
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
                    res.token || "token-placeholder"
                );
                toast.success("Logged in successfully!");
                onSuccess?.();
                onClose();
            } else {
                toast.error(res.error || "Invalid OTP");
            }
        } catch (error) {
            toast.error("An error occurred during verification");
        } finally {
            setLoading(false);
        }
    };

    const resetFlow = () => {
        setStep("mobile");
        setOtpCode("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-primary p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <DialogTitle className="text-2xl font-bold mb-2">Unlock the best of Sriram Bus</DialogTitle>
                        <DialogDescription className="text-white/80">
                            Join us to manage your bookings and get exclusive offers.
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-8 bg-white">
                    {step === "mobile" ? (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="mobile" className="text-sm font-medium text-slate-700">Mobile Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <div className="absolute left-10 top-3 text-slate-600 font-medium">
                                        +91
                                    </div>
                                    <Input
                                        id="mobile"
                                        type="tel"
                                        placeholder="Enter 10 digit number"
                                        className="pl-20 h-11 border-slate-200 focus:border-primary focus:ring-primary"
                                        value={mobileNo}
                                        onChange={(e) => setMobileNo(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2">
                                    By continuing, you agree to our Terms of Service and Privacy Policy.
                                </p>
                            </div>

                            <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" disabled={loading}>
                                {loading ? (
                                    <RefreshCcw className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                    <>
                                        Get OTP
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="space-y-2 text-center">
                                <Label htmlFor="otp" className="text-sm font-medium text-slate-700">Verification Code</Label>
                                <p className="text-xs text-slate-500 mb-4">
                                    We've sent a 4-digit code to <span className="font-bold text-slate-700">+91 {mobileNo}</span>
                                </p>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="Enter OTP"
                                        className="pl-11 h-11 border-slate-200 focus:border-primary focus:ring-primary text-center tracking-[1em] font-bold text-lg"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-between items-center mt-4">
                                    <button
                                        type="button"
                                        onClick={resetFlow}
                                        className="text-xs text-primary font-medium hover:underline"
                                    >
                                        Change Number
                                    </button>
                                    {timer > 0 ? (
                                        <span className="text-xs text-slate-400">Resend in {timer}s</span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            className="text-xs text-primary font-medium hover:underline"
                                        >
                                            Resend OTP
                                        </button>
                                    )}
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" disabled={loading}>
                                {loading ? "Verifying..." : "Verify & Login"}
                            </Button>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
