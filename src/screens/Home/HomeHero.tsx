import { Button } from "@/components/ui/button";
import { ShieldCheck, Zap, Watch } from "lucide-react";

export default function HomeHero() {
    return (
        <div className="relative bg-primary py-24 text-white">
            <div className="container mx-auto px-4 text-center">
                <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl">
                    India's Fastest Bus <span className="text-secondary">Booking Platform</span>
                </h1>
                <p className="mx-auto mb-12 max-w-2xl text-lg text-white/80">
                    Book AC, Sleeper, and Luxury buses with Sriram Bus. Experience premium travel with real-time tracking and gender-safe seating.
                </p>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="flex items-center justify-center space-x-3">
                        <ShieldCheck className="h-6 w-6 text-secondary" />
                        <span className="text-sm font-medium uppercase tracking-wider">100% Safe Payments</span>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                        <Zap className="h-6 w-6 text-secondary" />
                        <span className="text-sm font-medium uppercase tracking-wider">Instant Confirmation</span>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                        <Watch className="h-6 w-6 text-secondary" />
                        <span className="text-sm font-medium uppercase tracking-wider">24/7 Support</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
