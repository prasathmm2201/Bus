"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BusImageSliderProps {
    images: { url: string; alt: string }[];
}

export default function BusImageSlider({ images }: BusImageSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (images.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 5000); // Change image every 5 seconds

        return () => clearInterval(interval);
    }, [images.length]);

    if (!images || images.length === 0) {
        return (
            <div className="relative h-[300px] w-full max-w-[400px] bg-primary/10 rounded-2xl flex items-center justify-center overflow-hidden">
                <div className="text-primary font-bold text-lg">Premium Comfort</div>
            </div>
        );
    }

    return (
        <div className="relative h-[300px] w-full max-w-[400px] overflow-hidden rounded-2xl shadow-xl">
            {images.map((image, index) => (
                <div
                    key={index}
                    className={cn(
                        "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                        index === currentIndex ? "opacity-100" : "opacity-0"
                    )}
                >
                    <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        className="object-cover"
                        priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                        <p className="font-bold text-lg drop-shadow-md">{image.alt}</p>
                    </div>
                </div>
            ))}

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                {images.map((_, idx) => (
                    <button
                        key={idx}
                        className={cn(
                            "h-2 w-2 rounded-full transition-all",
                            idx === currentIndex ? "bg-white w-4" : "bg-white/50 hover:bg-white/80"
                        )}
                        onClick={() => setCurrentIndex(idx)}
                    />
                ))}
            </div>
        </div>
    );
}
