import { NextResponse } from "next/server";
import { bookingService } from "@/services/bookingService";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        if (process.env.NODE_ENV === "development") {
            return NextResponse.json({
                success: true,
                message: "Cron disabled in development",
                count: 0
            });
        }
        const result = await bookingService.cleanupExpiredLocks();
        return NextResponse.json({
            success: true,
            message: "Expired locks cleaned up",
            count: result.count
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
