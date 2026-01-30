"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bus, User, Menu } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center space-x-2">
                    <Bus className="h-8 w-8 text-primary" />
                    <span className="text-xl font-bold tracking-tight text-foreground">
                        Sriram <span className="text-primary">Bus</span>
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex md:items-center md:space-x-6">
                    <Link href="/search" className="text-sm font-medium transition-colors hover:text-primary">
                        Search
                    </Link>
                    <Link href="/my-bookings" className="text-sm font-medium transition-colors hover:text-primary">
                        My Bookings
                    </Link>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/login">
                            <User className="mr-2 h-4 w-4" />
                            Login
                        </Link>
                    </Button>
                </div>

                {/* Mobile Menu Button */}
                <div className="flex md:hidden">
                    <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <Menu className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="border-b bg-background p-4 md:hidden">
                    <div className="flex flex-col space-y-4">
                        <Link href="/search" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium transition-colors hover:text-primary">
                            Search
                        </Link>
                        <Link href="/my-bookings" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium transition-colors hover:text-primary">
                            My Bookings
                        </Link>
                        <Button variant="outline" className="w-full" asChild onClick={() => setIsMenuOpen(false)}>
                            <Link href="/login">
                                <User className="mr-2 h-4 w-4" />
                                Login
                            </Link>
                        </Button>
                    </div>
                </div>
            )}
        </nav>
    );
}
