"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    Plus,
    Save,
    Trash2,
    ChevronLeft,
    Navigation,
    ArrowRight,
    Search,
    Loader2,
    X
} from "lucide-react";
import Link from "next/link";
import { getCitiesAction, getRoutesAction, createRouteAction, updateRouteAction, deleteRouteAction, getCityWithPointsAction } from "@/app/actions/adminActions";
import { toast } from "sonner";
import { TimePicker12h } from "@/components/ui/TimePicker12h";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function AdminRoutesPage() {
    const [view, setView] = useState<"list" | "create">("list");
    const [loading, setLoading] = useState(false);
    const [cities, setCities] = useState<{ id: string, name: string }[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);

    // UI State
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Form State for Via Cities with detailed info
    const [newRoute, setNewRoute] = useState<{
        from: string;
        to: string;
        distance: number;
        via_cities: { id: string, name: string, arrival_time: string, is_next_day: boolean, is_pickup: boolean }[];
        boarding_points: { id: string, name: string, city_id: string, time: string, is_next_day: boolean }[];
        dropping_points: { id: string, name: string, city_id: string, time: string, is_next_day: boolean }[];
    }>({
        from: "",
        to: "",
        distance: 0,
        via_cities: [],
        boarding_points: [],
        dropping_points: []
    });

    // Temp state for adding points
    const [currentPointCity, setCurrentPointCity] = useState<string | null>(null);
    const [availablePoints, setAvailablePoints] = useState<{ id: string, name: string }[]>([]);
    const [pointType, setPointType] = useState<"boarding" | "dropping">("boarding");
    const [pointDialogOpen, setPointDialogOpen] = useState(false);
    const [selectedPointId, setSelectedPointId] = useState("");
    const [pointTime, setPointTime] = useState("12:00 PM");
    const [pointIsNextDay, setPointIsNextDay] = useState(false);

    // Delete Dialog State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        const [citiesRes, routesRes] = await Promise.all([
            getCitiesAction(),
            getRoutesAction()
        ]);

        if (citiesRes.success && citiesRes.data) {
            setCities(citiesRes.data);
        }

        if (routesRes.success && routesRes.data) {
            setRoutes(routesRes.data);
        } else {
            toast.error("Failed to fetch routes");
        }
        setLoading(false);
    };

    const fetchRoutes = async () => {
        const res = await getRoutesAction();
        if (res.success && res.data) {
            setRoutes(res.data);
        }
    };

    const handleSave = async () => {
        if (!newRoute.from || !newRoute.to || !newRoute.distance) {
            toast.error("Please fill all mandatory fields");
            return;
        }

        if (newRoute.from === newRoute.to) {
            toast.error("Departure and arrival cities cannot be same");
            return;
        }

        setLoading(true);

        const payload = {
            from_city_id: newRoute.from,
            to_city_id: newRoute.to,
            distance_km: newRoute.distance,
            via_cities: newRoute.via_cities.map(v => ({ id: v.id, arrival_time: v.arrival_time, is_next_day: v.is_next_day })),
            boarding_points: newRoute.boarding_points.map(bp => ({ id: bp.id, time: bp.time, is_next_day: bp.is_next_day })),
            dropping_points: newRoute.dropping_points.map(dp => ({ id: dp.id, time: dp.time, is_next_day: dp.is_next_day }))
        };

        let res;
        if (editMode && editId) {
            res = await updateRouteAction(editId, payload);
        } else {
            res = await createRouteAction(payload);
        }

        if (res.success) {
            toast.success(editMode ? "Route updated successfully" : "Route created successfully");
            setEditMode(false);
            setEditId(null);
            setView("list");
            fetchRoutes();
        } else {
            toast.error(res.error || "Failed to save route");
        }
        setLoading(false);
    };

    const handleEditClick = (route: any) => {
        setNewRoute({
            from: route.from_city_id,
            to: route.to_city_id,
            distance: route.distance_km,
            via_cities: route.via_cities ? route.via_cities.map((v: any) => ({
                id: v.city_id,
                name: v.city?.name || "Unknown",
                arrival_time: v.arrival_time || "",
                is_next_day: v.is_next_day || false,
                is_pickup: v.is_pickup !== false
            })) : [],
            boarding_points: route.boarding_points ? route.boarding_points.map((b: any) => ({
                id: b.boarding_point_id,
                name: b.boarding_point?.name || "Unknown",
                city_id: b.boarding_point?.city_id,
                time: b.time || "",
                is_next_day: b.is_next_day || false
            })) : [],
            dropping_points: route.dropping_points ? route.dropping_points.map((d: any) => ({
                id: d.dropping_point_id,
                name: d.dropping_point?.name || "Unknown",
                city_id: d.dropping_point?.city_id,
                time: d.time || "",
                is_next_day: d.is_next_day || false
            })) : []
        });
        setEditMode(true);
        setEditId(route.id);
        setView("create");
    };

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        const res = await deleteRouteAction(deleteId);
        if (res.success) {
            toast.success("Route deleted successfully");
            fetchRoutes();
        } else {
            toast.error(res.error || "Failed to delete route");
        }
        setDeleteDialogOpen(false);
        setDeleteId(null);
    };

    const openPointsDialog = async (cityId: string, type: "boarding" | "dropping") => {
        setCurrentPointCity(cityId);
        setPointType(type);
        setLoading(true);
        const res = await getCityWithPointsAction(cityId);
        if (res.success && res.data) {
            setAvailablePoints(res.data.boarding_points);
        }
        setLoading(false);
        setPointTime("12:00 PM");
        setPointIsNextDay(false);
        setPointDialogOpen(true);
    };

    const addPoint = () => {
        if (!selectedPointId || !currentPointCity) return;
        const point = availablePoints.find(p => p.id === selectedPointId);
        if (!point) return;

        const newPoint = {
            id: point.id,
            name: point.name,
            city_id: currentPointCity,
            time: pointTime,
            is_next_day: pointIsNextDay
        };

        if (pointType === "boarding") {
            if (newRoute.boarding_points.some(bp => bp.id === point.id)) return;
            setNewRoute({ ...newRoute, boarding_points: [...newRoute.boarding_points, newPoint] });
        } else {
            if (newRoute.dropping_points.some(dp => dp.id === point.id)) return;
            setNewRoute({ ...newRoute, dropping_points: [...newRoute.dropping_points, newPoint] });
        }
        setPointDialogOpen(false);
        setSelectedPointId("");
    };

    const removePoint = (id: string, type: "boarding" | "dropping") => {
        if (type === "boarding") {
            setNewRoute({ ...newRoute, boarding_points: newRoute.boarding_points.filter(p => p.id !== id) });
        } else {
            setNewRoute({ ...newRoute, dropping_points: newRoute.dropping_points.filter(p => p.id !== id) });
        }
    };

    const addViaCity = (cityId: string) => {
        if (!cityId || newRoute.via_cities.some(v => v.id === cityId)) return;
        const city = cities.find(c => c.id === cityId);
        if (!city) return;
        setNewRoute({
            ...newRoute,
            via_cities: [...newRoute.via_cities, { id: city.id, name: city.name, arrival_time: "12:00 PM", is_next_day: false, is_pickup: true }]
        });
    };

    const removeViaCity = (id: string) => {
        setNewRoute({
            ...newRoute,
            via_cities: newRoute.via_cities.filter(v => v.id !== id),
            // Also remove associated points for safety (optional but cleaner)
            boarding_points: newRoute.boarding_points.filter(p => p.city_id !== id),
            dropping_points: newRoute.dropping_points.filter(p => p.city_id !== id)
        });
    };

    const updateViaTime = (id: string, time: string) => {
        setNewRoute({
            ...newRoute,
            via_cities: newRoute.via_cities.map(v => v.id === id ? { ...v, arrival_time: time } : v)
        });
    };

    const toggleViaNextDay = (id: string) => {
        setNewRoute(prev => ({
            ...prev,
            via_cities: prev.via_cities.map(v => v.id === id ? { ...v, is_next_day: !v.is_next_day } : v)
        }));
    };

    const toggleViaPickup = (id: string) => {
        setNewRoute(prev => ({
            ...prev,
            via_cities: prev.via_cities.map(v => v.id === id ? { ...v, is_pickup: v.is_pickup === undefined ? false : !v.is_pickup } : v)
        }));
    };

    return (
        <div className="p-8">
            <header className="max-w-5xl mx-auto flex justify-between items-center mb-8">
                <div>
                    {view === "create" ? (
                        <button onClick={() => setView("list")} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
                            <ChevronLeft className="h-4 w-4" /> Back to Routes
                        </button>
                    ) : (
                        <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
                            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
                        </Link>
                    )}
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Navigation className="h-8 w-8 text-primary" />
                        Manage Routes
                    </h1>
                </div>
                {view === "list" && (
                    <Button onClick={() => {
                        setNewRoute({ from: "", to: "", distance: 0, via_cities: [], boarding_points: [], dropping_points: [] });
                        setEditMode(false);
                        setView("create");
                    }}>
                        <Plus className="mr-2 h-4 w-4" /> Add New Route
                    </Button>
                )}
            </header>

            <main className="max-w-5xl mx-auto">
                {view === "list" ? (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                            <CardTitle className="text-xl">Available Routes</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search cities..." className="pl-9 h-9" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {loading && routes.length === 0 ? (
                                    <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
                                ) : routes.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">No routes found.</div>
                                ) : (
                                    routes.map((route) => (
                                        <div key={route.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-muted/30 transition-colors gap-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-primary/10 rounded-lg text-primary"><MapPin className="h-5 w-5" /></div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-xl">{route.from_city?.name}</span>
                                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-bold text-xl">{route.to_city?.name}</span>
                                                    </div>
                                                    <Badge variant="secondary" className="font-mono">{route.distance_km} KM</Badge>
                                                </div>
                                                <div className="flex gap-2 flex-wrap pl-12">
                                                    {route.via_cities?.map((v: any, i: number) => (
                                                        <Badge key={i} variant="outline" className="text-xs">
                                                            Stop {i + 1}: {v.city?.name} ({v.arrival_time}) {v.is_next_day && <span className="ml-1 text-[8px] bg-primary text-white px-1 rounded-sm">+1D</span>}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pl-12 md:pl-0">
                                                <Button size="sm" variant="outline" onClick={() => handleEditClick(route)}>Edit</Button>
                                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteClick(route.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Main Route Details</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label>From City</Label>
                                    <select className="w-full h-10 rounded-md border border-input px-3" value={newRoute.from} onChange={(e) => setNewRoute({ ...newRoute, from: e.target.value })}>
                                        <option value="">Select City</option>
                                        {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>To City</Label>
                                    <select className="w-full h-10 rounded-md border border-input px-3" value={newRoute.to} onChange={(e) => setNewRoute({ ...newRoute, to: e.target.value })}>
                                        <option value="">Select City</option>
                                        {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Distance (KM)</Label>
                                    <Input type="number" value={newRoute.distance} onChange={(e) => setNewRoute({ ...newRoute, distance: Number(e.target.value) })} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Start City Stops */}
                        <Card className="border-l-4 border-l-green-500">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">Departure Stop: {cities.find(c => c.id === newRoute.from)?.name || "Select From City"}</CardTitle>
                                <Button size="sm" disabled={!newRoute.from} onClick={() => openPointsDialog(newRoute.from, "boarding")}><Plus className="h-4 w-4 mr-1" /> Boarding Point</Button>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {newRoute.boarding_points.filter(p => p.city_id === newRoute.from).map(p => (
                                        <Badge key={p.id} variant="secondary" className="h-8 pl-3 pr-1">
                                            {p.name} <span className="ml-2 font-mono text-primary">{p.time}</span>
                                            {p.is_next_day && <span className="ml-1 text-[8px] bg-primary text-white px-1 rounded-sm">+1D</span>}
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1" onClick={() => removePoint(p.id, "boarding")}><X className="h-3 w-3" /></Button>
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Via Cities List */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">Intermediate Stops (Via Cities)</h3>
                                <div className="flex gap-2 w-64">
                                    <select className="flex-1 h-9 rounded-md border border-input text-sm" onChange={(e) => { addViaCity(e.target.value); e.target.value = ""; }}>
                                        <option value="">Add Via City...</option>
                                        {cities.filter(c => c.id !== newRoute.from && c.id !== newRoute.to && !newRoute.via_cities.some(v => v.id === c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {newRoute.via_cities.map((via, idx) => (
                                <Card key={via.id} className="border-l-4 border-l-blue-500">
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <Badge className="h-6 w-6 rounded-full flex items-center justify-center p-0">Stop {idx + 1}</Badge>
                                                <span className="font-bold text-lg">{via.name}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Label className="whitespace-nowrap">Arrival Time</Label>
                                                    <TimePicker12h value={via.arrival_time} onChange={(val) => updateViaTime(via.id, val)} />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant={via.is_pickup !== false ? "default" : "outline"}
                                                    size="xs"
                                                    className={cn("h-7 px-2 text-[9px]", via.is_pickup !== false ? "bg-green-600 hover:bg-green-700" : "")}
                                                    onClick={() => toggleViaPickup(via.id)}
                                                >
                                                    {via.is_pickup !== false ? "PICKUP ON" : "PICKUP OFF"}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={via.is_next_day ? "default" : "outline"}
                                                    size="xs"
                                                    className={cn("h-7 px-2 text-[9px]", via.is_next_day ? "bg-primary" : "")}
                                                    onClick={() => toggleViaNextDay(via.id)}
                                                >
                                                    {via.is_next_day ? "+1 DAY" : "SAME DAY"}
                                                </Button>
                                                <Button size="sm" variant="ghost" className="text-destructive h-8 w-8 p-0" onClick={() => removeViaCity(via.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs uppercase text-muted-foreground font-bold italic">Boarding Points (Pick Up)</Label>
                                                    <Button variant="outline" size="xs" className="h-6 text-[10px]" onClick={() => openPointsDialog(via.id, "boarding")}>ADD</Button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {newRoute.boarding_points.filter(p => p.city_id === via.id).map(p => (
                                                        <Badge key={p.id} variant="outline" className="text-[10px] h-6 pl-2 pr-1">
                                                            {p.name} <span className="ml-1 text-primary">{p.time}</span>
                                                            {p.is_next_day && <span className="ml-1 text-[8px] bg-primary text-white px-1 rounded-sm">+1D</span>}
                                                            <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1" onClick={() => removePoint(p.id, "boarding")}><X className="h-2 w-2" /></Button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2 border-l pl-4">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs uppercase text-muted-foreground font-bold italic">Dropping Points (Drop)</Label>
                                                    <Button variant="outline" size="xs" className="h-6 text-[10px]" onClick={() => openPointsDialog(via.id, "dropping")}>ADD</Button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {newRoute.dropping_points.filter(p => p.city_id === via.id).map(p => (
                                                        <Badge key={p.id} variant="outline" className="text-[10px] h-6 pl-2 pr-1">
                                                            {p.name} <span className="ml-1 text-primary">{p.time}</span>
                                                            {p.is_next_day && <span className="ml-1 text-[8px] bg-primary text-white px-1 rounded-sm">+1D</span>}
                                                            <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1" onClick={() => removePoint(p.id, "dropping")}><X className="h-2 w-2" /></Button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* End City Stop */}
                        <Card className="border-l-4 border-l-red-500">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">Final Destination: {cities.find(c => c.id === newRoute.to)?.name || "Select To City"}</CardTitle>
                                <Button size="sm" disabled={!newRoute.to} onClick={() => openPointsDialog(newRoute.to, "dropping")}><Plus className="h-4 w-4 mr-1" /> Dropping Point</Button>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {newRoute.dropping_points.filter(p => p.city_id === newRoute.to).map(p => (
                                        <Badge key={p.id} variant="secondary" className="h-8 pl-3 pr-1">
                                            {p.name} <span className="ml-2 font-mono text-primary">{p.time}</span>
                                            {p.is_next_day && <span className="ml-1 text-[8px] bg-primary text-white px-1 rounded-sm">+1D</span>}
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1" onClick={() => removePoint(p.id, "dropping")}><X className="h-3 w-3" /></Button>
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-background sticky bottom-0 py-6 border-t z-10 flex gap-4">
                            <Button className="flex-1 h-14 text-lg font-bold" onClick={handleSave} disabled={loading}>
                                {loading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Save className="h-6 w-6 mr-2" />}
                                {editMode ? "Save Route Changes" : "Create Complete Route"}
                            </Button>
                            <Button variant="ghost" className="h-14 px-8" onClick={() => setView("list")}>Cancel</Button>
                        </div>
                    </div>
                )}
            </main>

            {/* Point Selection Dialog */}
            <Dialog open={pointDialogOpen} onOpenChange={setPointDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add {pointType === "boarding" ? "Boarding" : "Dropping"} Point</DialogTitle>
                        <DialogDescription>
                            Select a point from {cities.find(c => c.id === currentPointCity)?.name} and set the time.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Point</Label>
                            <select className="w-full h-10 rounded-md border border-input px-3" value={selectedPointId} onChange={(e) => setSelectedPointId(e.target.value)}>
                                <option value="">Choose Point...</option>
                                {availablePoints.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Time</Label>
                            <div className="flex items-center gap-4">
                                <TimePicker12h value={pointTime} onChange={setPointTime} />
                                <Button
                                    type="button"
                                    variant={pointIsNextDay ? "default" : "outline"}
                                    size="sm"
                                    className={cn("h-10 px-4", pointIsNextDay ? "bg-primary" : "")}
                                    onClick={() => setPointIsNextDay(!pointIsNextDay)}
                                >
                                    {pointIsNextDay ? "+1 DAY" : "SAME DAY"}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setPointDialogOpen(false)}>Cancel</Button>
                        <Button onClick={addPoint}>Add Point</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Route</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this route? This will affect schedules using this route.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete Route</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
