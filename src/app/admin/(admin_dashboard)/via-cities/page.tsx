"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    ChevronLeft,
    Loader2,
    Route,
    ArrowRight,
    MapPinned
} from "lucide-react";
import Link from "next/link";
import { getRoutesAction } from "@/app/actions/adminActions";
import { toast } from "sonner";

export default function AdminViaCitiesPage() {
    const [loading, setLoading] = useState(false);
    const [viaCitiesData, setViaCitiesData] = useState<any[]>([]);

    useEffect(() => {
        fetchViaCities();
    }, []);

    const fetchViaCities = async () => {
        setLoading(true);
        const res = await getRoutesAction();
        if (res.success && res.data) {
            // Process routes to extract via cities info
            const processed = res.data.filter((route: any) => route.via_cities && route.via_cities.length > 0);
            setViaCitiesData(processed);
        } else {
            toast.error("Failed to fetch via cities data");
        }
        setLoading(false);
    };

    return (
        <div className="p-8">
            <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
                <div>
                    <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
                        <ChevronLeft className="h-4 w-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Route className="h-8 w-8 text-primary" />
                        Via Cities
                    </h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto">
                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        </div>
                    ) : viaCitiesData.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl">
                            <p className="text-muted-foreground">No via cities configured in any routes yet.</p>
                            <Button variant="link" className="mt-2" asChild>
                                <Link href="/admin/routes">Manage Routes</Link>
                            </Button>
                        </div>
                    ) : viaCitiesData.map((route) => (
                        <Card key={route.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/30 border-b pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    {route.from_city?.name} <ArrowRight className="h-4 w-4" /> {route.to_city?.name}
                                    <Badge variant="outline" className="ml-auto">{route.via_cities.length} Via Cities</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex flex-wrap gap-3">
                                    {route.via_cities.map((via: any, idx: number) => (
                                        <div key={via.id} className="flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-lg px-4 py-2">
                                            <span className="text-xs font-bold text-primary bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center">
                                                {idx + 1}
                                            </span>
                                            <span className="font-medium">{via.city?.name}</span>
                                            <MapPinned className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href="/admin/routes" className="text-primary hover:text-primary/80">
                                            Edit Route
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    );
}
