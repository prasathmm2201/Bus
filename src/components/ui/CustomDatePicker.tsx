"use client";

import { useState, useRef, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays, isBefore, startOfToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface CustomDatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    minDate?: string; // YYYY-MM-DD
    label?: string;
}

export default function CustomDatePicker({ value, onChange, minDate, label = "Date of Journey" }: CustomDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [popoverCoords, setPopoverCoords] = useState({ top: 0, left: 0 });

    useEffect(() => {
        setMounted(true);
    }, []);

    const parseLocalDate = (dateStr: string) => {
        if (!dateStr) return new Date();
        const [y, m, d] = dateStr.split("-").map(Number);
        return new Date(y, m - 1, d);
    };

    const selectedDate = value ? parseLocalDate(value) : null;
    const today = startOfToday();
    const minDateObj = minDate ? parseLocalDate(minDate) : today;
    const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

    // Update popover position when opening
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // We want the popover to appear below the input
            setPopoverCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX
            });
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                // Check if click was inside the portal
                const portalElement = document.getElementById('datepicker-portal');
                if (portalElement && portalElement.contains(event.target as Node)) return;
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const daysInMonth = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth)),
        end: endOfWeek(endOfMonth(currentMonth)),
    });

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const handleDateSelect = (date: Date) => {
        if (isBefore(date, minDateObj) && !isSameDay(date, minDateObj)) return;
        onChange(format(date, "yyyy-MM-dd"));
        setIsOpen(false);
    };

    const setQuickDate = (days: number) => {
        const date = addDays(today, days);
        onChange(format(date, "yyyy-MM-dd"));
        setIsOpen(false);
    };

    const getDaySuffix = (day: number) => {
        if (day > 3 && day < 21) return "th";
        switch (day % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    };

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return "Select Date";
        const date = parseLocalDate(dateStr);
        const day = date.getDate();
        return `${day}${getDaySuffix(day)} ${format(date, "MMMM, yyyy")}`;
    };

    const calendarContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    id="datepicker-portal"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    style={{
                        position: 'absolute',
                        top: `${popoverCoords.top + 8}px`, // Slight offset
                        left: `${popoverCoords.left}px`,
                        zIndex: 9999
                    }}
                    className="w-[320px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-slate-100 overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 flex items-center justify-between border-b border-slate-50">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                            disabled={isBefore(startOfMonth(currentMonth), startOfToday())}
                        >
                            <ChevronLeft className="h-5 w-5 text-slate-400" />
                        </button>
                        <h4 className="font-bold text-slate-700">
                            {format(currentMonth, "MMMM yyyy")}
                        </h4>
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="p-4">
                        <div className="grid grid-cols-7 mb-2 text-center">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <div key={day} className="text-[10px] font-black text-slate-300 uppercase tracking-widest py-2">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {daysInMonth.map((day, idx) => {
                                const isSelected = selectedDate && isSameDay(day, selectedDate);
                                const isToday = isSameDay(day, today);
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const isDisabled = isBefore(day, minDateObj) && !isSameDay(day, minDateObj);

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => handleDateSelect(day)}
                                        className={cn(
                                            "h-10 w-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all relative",
                                            !isCurrentMonth && "text-slate-200",
                                            isCurrentMonth && !isDisabled && !isSelected && "text-slate-600 hover:bg-teal-50 hover:text-teal-600",
                                            isDisabled && "text-slate-100 cursor-not-allowed",
                                            isSelected && "bg-teal-600 text-white shadow-lg shadow-teal-200",
                                            isToday && !isSelected && "after:content-[''] after:absolute after:bottom-1.5 after:h-1 after:w-1 after:bg-teal-600 after:rounded-full"
                                        )}
                                    >
                                        {format(day, "d")}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50/50 p-4 flex items-center justify-between border-t border-slate-50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Journey Date</p>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-[10px] font-bold text-teal-600 uppercase hover:underline"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="relative w-full" ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="cursor-pointer group"
            >
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-0.5">{label}</p>
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            {formatDisplayDate(value)}
                        </h3>
                    </div>
                    <div className="flex gap-1.5 ml-auto">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setQuickDate(0); }}
                            className={cn(
                                "text-[9px] font-black uppercase px-2 py-1 rounded-md transition-all",
                                isSameDay(selectedDate || new Date(), today) ? "bg-teal-600 text-white shadow-md shadow-teal-200" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                            )}
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setQuickDate(1); }}
                            className={cn(
                                "text-[9px] font-black uppercase px-2 py-1 rounded-md transition-all",
                                isSameDay(selectedDate || new Date(), addDays(today, 1)) ? "bg-teal-600 text-white shadow-md shadow-teal-200" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                            )}
                        >
                            Tomorrow
                        </button>
                    </div>
                </div>
            </div>

            {mounted && createPortal(calendarContent, document.body)}
        </div>
    );
}
