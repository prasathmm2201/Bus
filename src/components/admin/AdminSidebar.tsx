"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Bus,
    Navigation,
    CalendarClock,
    LogOut,
    Bus as BusIcon,
    Globe,
    MapPinned,
    MapPin,
    Building2,
    Route
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { logoutAction } from "@/app/actions/userActions";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Cities", href: "/admin/cities", icon: Globe },
    { name: "Boarding Points", href: "/admin/boarding-points", icon: Building2 },
    { name: "Dropping Points", href: "/admin/dropping-points", icon: MapPin },
    { name: "Manage Buses", href: "/admin/buses", icon: Bus },
    { name: "Routes", href: "/admin/routes", icon: Navigation },
    { name: "Schedules", href: "/admin/schedules", icon: CalendarClock }
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

    const handleLogout = async () => {
        await logoutAction();
        setLogoutDialogOpen(false);
        router.push("/admin/login");
        router.refresh();
    };

    return (
        <aside className="w-64 border-r bg-background flex flex-col min-h-screen sticky top-0">
            <div className="p-6 border-b">
                <Link href="/admin" className="text-xl font-bold text-primary flex items-center gap-2">
                    <BusIcon className="h-6 w-6" />
                    Sriram Admin
                </Link>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t">
                <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive gap-3 px-4"
                        >
                            <LogOut className="h-5 w-5" />
                            Logout
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Confirm Logout</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to log out from the admin panel?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex gap-2 sm:gap-0">
                            <Button variant="ghost" onClick={() => setLogoutDialogOpen(false)} className="flex-1 sm:flex-none">
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleLogout} className="flex-1 sm:flex-none">
                                Yes, Logout
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </aside>
    );
}
