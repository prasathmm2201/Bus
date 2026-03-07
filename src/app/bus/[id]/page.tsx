import { Suspense } from "react";
import BusDetailsScreen from "@/screens/BusDetails/BusDetailsScreen";
import { Loader2 } from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";

export default function BusDetailsPage() {
    return (
        <AuthGuard>
            <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }>
                <BusDetailsScreen />
            </Suspense>
        </AuthGuard>
    );
}
