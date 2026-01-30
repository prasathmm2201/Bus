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
    Loader2,
    Pencil,
    Globe,
    Search
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
import Link from "next/link";
import { getCitiesAction, createCityAction, updateCityAction, deleteCityAction } from "@/app/actions/adminActions";
import { toast } from "sonner";

export default function AdminCitiesPage() {
    const [loading, setLoading] = useState(false);
    const [cities, setCities] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Form State
    const [cityName, setCityName] = useState("");
    const [stateName, setStateName] = useState("");
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        fetchCities();
    }, []);

    const fetchCities = async () => {
        setLoading(true);
        const res = await getCitiesAction();
        if (res.success && res.data) {
            setCities(res.data);
        } else {
            toast.error("Failed to list cities");
        }
        setLoading(false);
    };

    const resetForm = () => {
        setCityName("");
        setStateName("");
        setIsActive(true);
        setEditMode(false);
        setEditId(null);
    };

    const handleCreateClick = () => {
        resetForm();
        setDialogOpen(true);
    };

    const handleEditClick = (city: any) => {
        setCityName(city.name);
        setStateName(city.state);
        setIsActive(city.is_active);
        setEditMode(true);
        setEditId(city.id);
        setDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this city?")) return;

        setLoading(true);
        const res = await deleteCityAction(id);
        if (res.success) {
            toast.success("City deleted successfully");
            fetchCities();
        } else {
            toast.error(res.error || "Failed to delete city");
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!cityName || !stateName) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        let res;
        if (editMode && editId) {
            res = await updateCityAction(editId, { name: cityName, state: stateName, is_active: isActive });
        } else {
            res = await createCityAction({ name: cityName, state: stateName });
        }

        if (res.success) {
            toast.success(editMode ? "City updated!" : "City created!");
            setDialogOpen(false);
            fetchCities();
            resetForm();
        } else {
            toast.error(res.error || "Failed to save city");
        }
        setLoading(false);
    };

    const filteredCities = cities.filter(city =>
        city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.state.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8">
            <header className="max-w-5xl mx-auto flex justify-between items-center mb-8">
                <div>
                    <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
                        <ChevronLeft className="h-4 w-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Globe className="h-8 w-8 text-primary" />
                        Manage Cities
                    </h1>
                </div>
                <Button onClick={handleCreateClick}>
                    <Plus className="mr-2 h-4 w-4" /> Add City
                </Button>
            </header>

            <main className="max-w-5xl mx-auto">
                <Card className="overflow-hidden border-none shadow-md">
                    <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xl font-semibold">City List</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search cities or states..."
                                className="pl-9 h-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/20 hover:bg-muted/20">
                                    <TableHead className="w-[80px] font-bold">#</TableHead>
                                    <TableHead className="font-bold">City Name</TableHead>
                                    <TableHead className="font-bold">State</TableHead>
                                    <TableHead className="font-bold">Status</TableHead>
                                    <TableHead className="text-right font-bold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && cities.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <div className="flex items-center justify-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                <span className="ml-2">Loading cities...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredCities.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            {searchQuery ? "No matching cities found." : "No cities found. Add your first city!"}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCities.map((city, index) => (
                                        <TableRow key={city.id} className="hover:bg-muted/10 transition-colors">
                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-primary/5 rounded-lg">
                                                        <MapPin className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <span className="font-semibold">{city.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{city.state}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={city.is_active ? "default" : "secondary"}
                                                    className={city.is_active ? "bg-green-500 hover:bg-green-600" : ""}
                                                >
                                                    {city.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                        onClick={() => handleEditClick(city)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDelete(city.id)}
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
                    </CardContent>
                </Card>
            </main>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            {editMode ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            {editMode ? "Edit City" : "Add New City"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="city" className="font-semibold">City Name</Label>
                            <Input
                                id="city"
                                placeholder="e.g. Bangalore"
                                value={cityName}
                                onChange={(e) => setCityName(e.target.value)}
                                className="h-11"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="state" className="font-semibold">State</Label>
                            <Input
                                id="state"
                                placeholder="e.g. Karnataka"
                                value={stateName}
                                onChange={(e) => setStateName(e.target.value)}
                                className="h-11"
                            />
                        </div>
                        {editMode && (
                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    id="active"
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="rounded border-gray-300 text-primary focus:ring-primary h-5 w-5 cursor-pointer"
                                />
                                <Label htmlFor="active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                    Set as Active
                                </Label>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={loading} className="flex-1">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={loading} className="flex-1">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {editMode ? "Update City" : "Save City"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
