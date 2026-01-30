"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TimePicker12hProps {
    value: string; // Format: "HH:MM AM/PM"
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

export function TimePicker12h({ value, onChange, disabled, className }: TimePicker12hProps) {
    const [hour, setHour] = useState("12");
    const [minute, setMinute] = useState("00");
    const [period, setPeriod] = useState("AM");

    // Initialize internal state from value prop
    useEffect(() => {
        if (value) {
            const match = value.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
            if (match) {
                let h = match[1].padStart(2, '0');
                setHour(h);
                setMinute(match[2]);
                setPeriod(match[3].toUpperCase());
            }
        }
    }, [value]);

    const updateTime = (h: string, m: string, p: string) => {
        onChange(`${h}:${m} ${p}`);
    };

    const handleHourChange = (newHour: string) => {
        setHour(newHour);
        updateTime(newHour, minute, period);
    };

    const handleMinuteChange = (newMinute: string) => {
        setMinute(newMinute);
        updateTime(hour, newMinute, period);
    };

    const handlePeriodChange = (newPeriod: string) => {
        setPeriod(newPeriod);
        updateTime(hour, minute, newPeriod);
    };

    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    return (
        <div className={cn("flex items-center gap-1 select-none", className)}>
            <div className="flex items-center bg-background border rounded-md px-1 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <select
                    disabled={disabled}
                    value={hour}
                    onChange={(e) => handleHourChange(e.target.value)}
                    className="bg-transparent border-none py-2 px-1 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 appearance-none text-center w-8"
                >
                    {hours.map((h) => (
                        <option key={h} value={h}>{h}</option>
                    ))}
                </select>
                <span className="text-muted-foreground font-medium">:</span>
                <select
                    disabled={disabled}
                    value={minute}
                    onChange={(e) => handleMinuteChange(e.target.value)}
                    className="bg-transparent border-none py-2 px-1 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 appearance-none text-center w-8"
                >
                    {minutes.map((m) => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            </div>

            <div className="flex border rounded-md overflow-hidden h-10 ml-1">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handlePeriodChange("AM")}
                    className={cn(
                        "px-3 text-[10px] font-bold transition-all uppercase",
                        period === "AM"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                >
                    AM
                </button>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handlePeriodChange("PM")}
                    className={cn(
                        "px-3 text-[10px] font-bold border-l transition-all uppercase",
                        period === "PM"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                >
                    PM
                </button>
            </div>
        </div>
    );
}
