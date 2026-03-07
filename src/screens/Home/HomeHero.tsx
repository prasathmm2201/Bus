import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default function HomeHero() {
    return (
        <div className="relative overflow-hidden bg-[#4F46E5] py-20 lg:py-28">
            {/* Background Gradient & Mesh */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#0D9488] opacity-90" />
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_100%)]" />

            <div className="container relative mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-bold uppercase tracking-widest border border-white/20 mb-6">
                            <Zap className="h-3 w-3 text-[#14B8A6]" />
                            Welcome to the <span className="text-[#14B8A6]">EV</span>olution
                        </div>

                        <h1 className="mb-6 text-4xl font-black tracking-tight text-white md:text-5xl lg:text-7xl leading-[1.1]">
                            Introducing <span className="text-[#14B8A6]">VSR</span>
                        </h1>

                        <p className="mb-10 max-w-xl text-lg text-white/80 font-medium leading-relaxed">
                            Experience the future of travel with India's most trusted
                            bus ticket booking platform. Zero emissions, maximum comfort.
                        </p>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                                <span className="text-2xl font-bold text-white">1M+</span>
                                <span className="text-[10px] text-white/60 uppercase font-black leading-tight">Happy<br />Travelers</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                                <span className="text-2xl font-bold text-white">500+</span>
                                <span className="text-[10px] text-white/60 uppercase font-black leading-tight">Daily<br />Routes</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 relative w-full max-w-2xl">
                        {/* Bus Image Overlay */}
                        {/* <div className="relative z-10 animate-in fade-in slide-in-from-right-10 duration-1000">
                            <img
                                src="/premium_electric_bus_hero.png"
                                alt="Premium Electric Bus"
                                className="w-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform -scale-x-100"
                            />
                        </div> */}

                        {/* Accent Lightning Bolt Decor */}
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 opacity-20 hidden lg:block">
                            <Zap className="h-64 w-64 text-white rotate-12" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
