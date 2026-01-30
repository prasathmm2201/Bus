"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    MapPinned,
    Plus,
    Save,
    Trash2,
    ChevronLeft,
    Loader2,
    Pencil,
    Navigation,
    Building2
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import {
    getBoardingPointsAction,
    createBoardingPointAction,
    updateBoardingPointAction,
    deleteBoardingPointAction,
    getCitiesAction
} from "@/app/actions/adminActions";
import { toast } from "sonner";
import { Search } from "lucide-react";

export default function AdminBoardingPointsPage() {
    const [loading, setLoading] = useState(false);
    const [points, setPoints] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Form State
    const [pointName, setPointName] = useState("");
    const [selectedCityId, setSelectedCityId] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [pointsRes, citiesRes] = await Promise.all([
            getBoardingPointsAction(),
            getCitiesAction()
        ]);

        if (pointsRes.success && pointsRes.data) {
            setPoints(pointsRes.data);
        }
        if (citiesRes.success && citiesRes.data) {
            setCities(citiesRes.data);
        }
        setLoading(false);
    };

    const resetForm = () => {
        setPointName("");
        setSelectedCityId("");
        setEditMode(false);
        setEditId(null);
    };

    const handleCreateClick = () => {
        resetForm();
        setDialogOpen(true);
    };

    const handleEditClick = (point: any) => {
        setPointName(point.name);
        setSelectedCityId(point.city_id);
        setEditMode(true);
        setEditId(point.id);
        setDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this boarding point?")) return;

        setLoading(true);
        const res = await deleteBoardingPointAction(id);
        if (res.success) {
            toast.success("Boarding point deleted successfully");
            fetchData();
        } else {
            toast.error(res.error || "Failed to delete boarding point");
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!pointName || !selectedCityId) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        let res;
        if (editMode && editId) {
            res = await updateBoardingPointAction(editId, { name: pointName, city_id: selectedCityId });
        } else {
            res = await createBoardingPointAction({ name: pointName, city_id: selectedCityId });
        }

        if (res.success) {
            toast.success(editMode ? "Boarding point updated!" : "Boarding point created!");
            setDialogOpen(false);
            fetchData();
            resetForm();
        } else {
            toast.error(res.error || "Failed to save boarding point");
        }
        setLoading(false);
    };

    const filteredPoints = points.filter(point =>
        point.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        point.city?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8">
            <header className="max-w-5xl mx-auto flex justify-between items-center mb-8">
                <div>
                    <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
                        <ChevronLeft className="h-4 w-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <MapPinned className="h-8 w-8 text-primary" />
                        Boarding Points
                    </h1>
                </div>
                <Button onClick={handleCreateClick}>
                    <Plus className="mr-2 h-4 w-4" /> Add Point
                </Button>
            </header>

            <main className="max-w-5xl mx-auto">
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b bg-muted/20">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Navigation className="h-5 w-5 text-primary" />
                            Manage Points
                        </CardTitle>
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or city..."
                                className="pl-9 bg-background h-10 border-muted-foreground/20 focus-visible:ring-primary"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead className="w-[80px] font-bold">#</TableHead>
                                        <TableHead className="font-bold">Point Name</TableHead>
                                        <TableHead className="font-bold">City</TableHead>
                                        <TableHead className="text-right font-bold pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading && points.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                                Loading points...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredPoints.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                                No boarding points found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredPoints.map((point, index) => (
                                            <TableRow key={point.id} className="hover:bg-muted/20 transition-colors">
                                                <TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell>
                                                <TableCell className="font-semibold text-foreground">{point.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{point.city?.name}</span>
                                                        <span className="text-xs text-muted-foreground">{point.city?.state}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(point)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleDelete(point.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </main>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            {editMode ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                            {editMode ? "Edit Point" : "Add New Point"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="city" className="text-sm font-bold text-muted-foreground uppercase tracking-wider">City</Label>
                            <Select value={selectedCityId} onValueChange={setSelectedCityId}>
                                <SelectTrigger className="w-full h-11 border-muted-foreground/30 focus:ring-primary">
                                    <SelectValue placeholder="Select a city" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cities.map((city) => (
                                        <SelectItem key={city.id} value={city.id}>
                                            <div className="flex items-center gap-2 font-medium">
                                                {city.name}
                                                <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                                                    {city.state}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="point" className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Point Name</Label>
                            <Input
                                id="point"
                                placeholder="e.g. Majestic Bus Stand"
                                className="h-11 border-muted-foreground/30 focus-visible:ring-primary font-medium"
                                value={pointName}
                                onChange={(e) => setPointName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="pt-4 border-t gap-2">
                        <Button variant="ghost" className="h-11 px-6" onClick={() => setDialogOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="h-11 px-6 font-bold" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {editMode ? "Save Changes" : "Create Point"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
