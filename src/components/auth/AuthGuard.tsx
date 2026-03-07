"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/useAuth";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const router = useRouter();
    const { logout } = useAuth();

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const response = await fetch("/api/auth/me");
                if (!response.ok) {
                    throw new Error("Invalid token");
                }
                setIsAuthorized(true);
            } catch (error) {
                // Token is invalid, expired, or missing
                logout();
                router.replace("/"); // Redirect to home page
            }
        };

        verifyToken();
    }, [logout, router]);

    // Show loading state while verifying
    if (isAuthorized === null) {
        return (
            <div className="flex min-h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return <>{children}</>;
}
