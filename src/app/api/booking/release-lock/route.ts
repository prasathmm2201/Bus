import { NextResponse } from "next/server";
import { bookingService } from "@/services/bookingService";

export async function POST(req: Request) {
    try {
        const { lockToken } = await req.json();
        if (!lockToken) {
            return NextResponse.json({ success: false, error: "Missing lockToken" }, { status: 400 });
        }

        await bookingService.releaseSeats(lockToken);
        return NextResponse.json({ success: true, message: "Seats released" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
