import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Passenger {
    seatId: string;
    seatNumber: string;
    name: string;
    age: string;
    gender: "male" | "female" | "other";
}

interface BookingState {
    busId: string | null;
    scheduleId: string | null;
    routeId: string | null;

    fromCity: string;
    toCity: string;
    date: Date | null;

    boardingPoint: string | null;
    droppingPoint: string | null;
    boardingTime: string | null;
    droppingTime: string | null;

    selectedSeatIds: string[];
    passengers: Passenger[];

    busName: string;
    busType: string;
    totalAmount: number;

    lockToken: string | null;
    lockExpiry: string | null;

    setBookingDetails: (details: Partial<BookingState>) => void;
    clearBooking: () => void;
}

export const useBookingStore = create<BookingState>()(
    persist(
        (set) => ({
            busId: null,
            scheduleId: null,
            routeId: null,
            fromCity: "",
            toCity: "",
            date: null,
            boardingPoint: null,
            droppingPoint: null,
            boardingTime: null,
            droppingTime: null,
            selectedSeatIds: [],
            passengers: [],
            busName: "",
            busType: "",
            totalAmount: 0,
            lockToken: null,
            lockExpiry: null,

            setBookingDetails: (details) => set((state) => ({ ...state, ...details })),
            clearBooking: () => set({
                busId: null,
                scheduleId: null,
                routeId: null,
                fromCity: "",
                toCity: "",
                date: null,
                boardingPoint: null,
                droppingPoint: null,
                boardingTime: null,
                droppingTime: null,
                selectedSeatIds: [],
                passengers: [],
                busName: "",
                busType: "",
                totalAmount: 0,
                lockToken: null,
                lockExpiry: null,
            }),
        }),
        {
            name: "booking-storage",
        }
    )
);
