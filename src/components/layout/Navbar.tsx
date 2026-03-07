"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bus, User, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/store/useAuth";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/userActions";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isMenuOpen]);

    useEffect(() => {
        const syncAuth = async () => {
            if (user) {
                try {
                    const res = await fetch("/api/auth/me");
                    if (!res.ok) {
                        logout();
                        router.refresh();
                    }
                } catch (error) {
                    console.error("Auth sync failed", error);
                }
            }
        };
        syncAuth();
    }, [user, logout, router]);

    const handleLogout = async () => {
        await logoutAction();
        logout();
        router.push("/login");
        router.refresh(); // Refresh to update server-side session checks
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center space-x-2">
                    <span className="text-xl font-bold tracking-tight text-foreground">
                        VSR <span className="text-primary">Travels</span>
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex md:items-center md:space-x-6">
                    <Link href="/my-bookings" className="text-sm font-medium transition-colors hover:text-primary">
                        My Bookings
                    </Link>
                    {user ? (
                        <div className="flex items-center gap-4">
                            {/* <span className="text-sm font-medium">Hi, {user.name}</span> */}
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/login">
                                <User className="mr-2 h-4 w-4" />
                                Login
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="flex md:hidden">
                    <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)}>
                        <Menu className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            {/* Mobile Sidebar Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden"
                        />

                        {/* Sidebar */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 z-[101] h-full w-[280px] bg-white p-6 shadow-2xl md:hidden"
                        >
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between mb-8">
                                    <span className="text-xl font-bold tracking-tight">
                                        VSR <span className="text-primary">Travels</span>
                                    </span>
                                    <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                                        <X className="h-6 w-6" />
                                    </Button>
                                </div>

                                <div className="flex flex-col space-y-6">
                                    <Link
                                        href="/search"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-lg font-semibold transition-colors hover:text-primary flex items-center gap-3"
                                    >
                                        <Bus className="h-5 w-5" /> Search Buses
                                    </Link>
                                    <Link
                                        href="/my-bookings"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-lg font-semibold transition-colors hover:text-primary flex items-center gap-3"
                                    >
                                        <User className="h-5 w-5" /> My Bookings
                                    </Link>

                                    <div className="pt-6 border-t border-gray-100">
                                        {user ? (
                                            <div className="space-y-4">
                                                <div className="p-4 bg-gray-50 rounded-2xl">
                                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Logged in as</p>
                                                    <p className="font-bold text-gray-900">{user.name}</p>
                                                </div>
                                                <Button
                                                    variant="destructive"
                                                    className="w-full h-12 rounded-xl font-bold italic"
                                                    onClick={() => {
                                                        handleLogout();
                                                        setIsMenuOpen(false);
                                                    }}
                                                >
                                                    Logout
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="default"
                                                className="w-full h-12 rounded-xl font-bold"
                                                asChild
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <Link href="/login">
                                                    <User className="mr-2 h-4 w-4" />
                                                    Login / Signup
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-auto pt-8 text-center">
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em]">
                                        Premium Travel Experience
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </nav>
    );
}
