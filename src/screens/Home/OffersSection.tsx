"use client";

import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Ticket, Gift, Users, Heart } from "lucide-react";

const offers = [
    {
        id: 1,
        title: "EARLY",
        description: "Get upto 20% OFF on early bookings!",
        code: "EARLY20",
        category: "Special Offer",
        color: "from-purple-600 to-indigo-600",
        icon: <Clock className="h-6 w-6 text-white" />,
        image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: 2,
        title: "GROUP",
        description: "Get upto 15% OFF on Group Bookings!",
        code: "GROUP15",
        category: "Zingbus",
        color: "from-teal-600 to-emerald-600",
        icon: <Users className="h-6 w-6 text-white" />,
        image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: 3,
        title: "WOMAN",
        description: "Enjoy 10% OFF with code WOMAN!",
        code: "WOMAN10",
        category: "Valuebus",
        color: "from-pink-600 to-rose-600",
        icon: <Heart className="h-6 w-6 text-white" />,
        image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: 4,
        title: "FLAT 100",
        description: "Flat ₹100 cashback on UPI payments.",
        code: "UPI100",
        category: "Payment Offer",
        color: "from-blue-600 to-sky-600",
        icon: <Gift className="h-6 w-6 text-white" />,
        image: "https://images.unsplash.com/photo-1557223562-6c77ef16210f?auto=format&fit=crop&q=80&w=400"
    }
];

import { Clock } from "lucide-react";

export default function OffersSection() {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <section className="mt-12 mb-24">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Offers for You</h2>
                    <div className="h-1.5 w-12 bg-teal-600 rounded-full mt-2" />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-slate-50 border border-slate-100 hover:bg-teal-50 hover:text-teal-600 transition-all"
                        onClick={() => scroll('left')}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-slate-50 border border-slate-100 hover:bg-teal-50 hover:text-teal-600 transition-all"
                        onClick={() => scroll('right')}
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x"
                style={{ scrollbarWidth: 'none' }}
            >
                {offers.map((offer) => (
                    <Card
                        key={offer.id}
                        className="min-w-[300px] md:min-w-[380px] group cursor-pointer overflow-hidden border-none shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-500 rounded-[2rem] snap-start"
                    >
                        <CardContent className="p-0">
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={offer.image}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    alt={offer.title}
                                />
                                <div className={cn("absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent", offer.color + " opacity-20")} />
                                <div className="absolute top-4 left-4">
                                    <span className="bg-white/95 backdrop-blur-sm text-teal-600 text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm">
                                        {offer.category}
                                    </span>
                                </div>
                                <div className="absolute bottom-4 left-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-xl bg-gradient-to-br shadow-lg", offer.color)}>
                                            {offer.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-black text-xl italic tracking-tight">{offer.title}</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-white">
                                <p className="text-slate-500 font-medium mb-4 line-clamp-2">
                                    {offer.description}
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="inline-flex items-center gap-2 border-2 border-dashed border-teal-100 bg-teal-50/50 px-4 py-2 rounded-xl">
                                        <Ticket className="h-4 w-4 text-teal-600" />
                                        <span className="text-xs font-black tracking-widest text-teal-700 uppercase">{offer.code}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-teal-600 font-bold hover:bg-teal-50 group">
                                        Copy <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
}

import { cn } from "@/lib/utils";
