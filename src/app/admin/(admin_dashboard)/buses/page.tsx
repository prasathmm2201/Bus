"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Bus,
    Plus,
    Save,
    Trash2,
    Layout,
    ChevronLeft,
    Settings2,
    CheckCircle2,
    Loader2,
    DollarSign,
    X,
    Pencil,
    Upload,
    Image as ImageIcon
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getBusesAction, createBusAction, updateBusAction, deleteBusAction } from "@/app/actions/adminActions";
import { toast } from "sonner";
import { BusType, SeatType, Deck, SeatLayout } from "@prisma/client";

interface TemplateSeat {
    seat_number: string;
    type: SeatType;
    deck: Deck;
    row: number;
    col: number;
    price?: number;
}

export default function AdminBusesPage() {
    const [view, setView] = useState<"list" | "create">("list");
    const [loading, setLoading] = useState(false);
    const [buses, setBuses] = useState<any[]>([]);

    // Form State
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [busName, setBusName] = useState("");
    const [busType, setBusType] = useState<BusType>("NON_AC");
    const [hasSleeper, setHasSleeper] = useState(false);
    const [hasSeater, setHasSeater] = useState(true);
    const [activeDeck, setActiveDeck] = useState<Deck>("LOWER");
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

    // Layout Config
    const [rowCount, setRowCount] = useState(10);
    const [colCount, setColCount] = useState(5);
    const [seats, setSeats] = useState<TemplateSeat[]>([]);

    // Pricing Modal State
    const [pricingSeat, setPricingSeat] = useState<TemplateSeat | null>(null);
    const [tempPrice, setTempPrice] = useState<string>("");
    const [tempSeatNumber, setTempSeatNumber] = useState("");
    const [bulkPriceDialogOpen, setBulkPriceDialogOpen] = useState(false);
    const [bulkPrice, setBulkPrice] = useState("");
    const [targetSeatNumbers, setTargetSeatNumbers] = useState("");
    const [seatPrefix, setSeatPrefix] = useState<string>("");

    useEffect(() => {
        if (view === "list") {
            fetchBuses();
        }
    }, [view]);

    const fetchBuses = async () => {
        setLoading(true);
        const res = await getBusesAction();
        if (res.success && res.data) {
            setBuses(res.data);
        } else {
            toast.error("Failed to list buses");
        }
        setLoading(false);
    };

    const resetForm = () => {
        setBusName("");
        setBusType("NON_AC");
        setHasSleeper(false);
        setHasSeater(true);
        setSeats([]);
        setRowCount(10);
        setColCount(5);
        setEditMode(false);
        setEditId(null);
        setImageFiles([]);
        setImagePreviews([]);
        setExistingImageUrls([]);
    };

    const handleCreateClick = () => {
        resetForm();
        setView("create");
    };

    const handleEditClick = (bus: any) => {
        setBusName(bus.name);
        setBusType(bus.type);
        setHasSleeper(bus.is_sleeper);
        setHasSeater(bus.is_seater);

        // Find max row and col to set grid size
        let maxRow = 0;
        let maxCol = 0;
        const busSeats = bus.template_seats.map((s: any) => {
            if (s.row > maxRow) maxRow = s.row;
            if (s.col > maxCol) maxCol = s.col;
            return {
                seat_number: s.seat_number,
                type: s.type,
                deck: s.deck,
                row: s.row,
                col: s.col,
                price: s.price ? Number(s.price) : undefined
            };
        });

        setRowCount(Math.max(10, maxRow)); // Minimum 10
        setColCount(Math.max(5, maxCol));  // Minimum 5
        setSeats(busSeats);

        setEditMode(true);
        setEditId(bus.id);
        setExistingImageUrls(bus.images || []);
        setImagePreviews(bus.images || []);
        setView("create");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this bus?")) return;

        const res = await deleteBusAction(id);
        if (res.success) {
            toast.success("Bus deleted successfully");
            fetchBuses();
        } else {
            toast.error(res.error || "Failed to delete bus");
        }
    };

    const handleSave = async () => {
        if (!busName || seats.length === 0) {
            toast.error("Please enter bus name and define seats");
            return;
        }

        // Strict Validation: Every seat must have a number and a price
        for (const seat of seats) {
            if (!seat.seat_number || seat.seat_number.trim() === "") {
                toast.error("All seats must have a seat number");
                return;
            }
            if (seat.price === undefined || seat.price === null || seat.price <= 0) {
                toast.error(`Please set a valid price for seat ${seat.seat_number}`);
                return;
            }
        }

        setLoading(true);

        const busData = {
            name: busName,
            type: busType,
            is_ac: busType === "AC",
            is_sleeper: hasSleeper,
            is_seater: hasSeater,
            seat_layout: hasSleeper && hasSeater ? "MIXED" : hasSleeper ? "SLEEPER" : "TWO_BY_ONE",
            total_seats: seats.length,
            seats: seats.map(s => ({
                seat_number: s.seat_number,
                type: s.type,
                deck: s.deck,
                row: s.row,
                col: s.col,
                price: s.price
            }))
        };

        // Use FormData for file upload
        const formData = new FormData();
        formData.append("data", JSON.stringify(busData));
        imageFiles.forEach(file => {
            formData.append("images", file);
        });
        existingImageUrls.forEach(url => {
            formData.append("existingImages", url);
        });

        let res;
        if (editMode && editId) {
            res = await updateBusAction(editId, formData);
        } else {
            res = await createBusAction(formData);
        }

        if (res.success) {
            toast.success(editMode ? "Bus updated!" : "Bus created!");
            setView("list");
            resetForm();
        } else {
            toast.error(res.error || "Failed to save bus");
        }
        setLoading(false);
    };

    // Layout Logic
    const handleSeatInteraction = (row: number, col: number) => {
        const existingIdx = seats.findIndex(s => s.row === row && s.col === col && s.deck === activeDeck);
        const newSeats = [...seats];

        if (existingIdx === -1) {
            // NONE -> SEATER
            const countOnDeck = seats.filter(s => s.deck === activeDeck).length;
            const prefix = seatPrefix || (activeDeck === "LOWER" ? "L" : "U");
            const seatNo = `${prefix}${countOnDeck + 1}`;
            newSeats.push({
                seat_number: seatNo,
                type: "SEATER",
                deck: activeDeck,
                row,
                col
            });
            setSeats(newSeats);
        } else {
            const seat = newSeats[existingIdx];
            if (seat.type === "SEATER") {
                // SEATER -> SLEEPER
                seat.type = "SLEEPER";
                setSeats(newSeats);
            } else {
                // SLEEPER -> NONE (Remove)
                newSeats.splice(existingIdx, 1);
                setSeats(newSeats);
            }
        }
    };

    const handleUpdateSeat = () => {
        if (!pricingSeat) return;
        const newSeats = [...seats];
        const idx = newSeats.findIndex(s => s.row === pricingSeat.row && s.col === pricingSeat.col && s.deck === pricingSeat.deck);
        if (idx !== -1) {
            newSeats[idx].price = tempPrice ? Number(tempPrice) : undefined;
            newSeats[idx].seat_number = tempSeatNumber || newSeats[idx].seat_number;
            setSeats(newSeats);
            toast.success(`Seat ${newSeats[idx].seat_number} updated`);
        }
        setPricingSeat(null);
    };

    const handleApplyBulkPrice = () => {
        const priceNum = Number(bulkPrice);
        if (isNaN(priceNum)) {
            toast.error("Invalid price");
            return;
        }

        if (!targetSeatNumbers) {
            toast.error("Please enter seat numbers (e.g. L1, L2 or L1-L10)");
            return;
        }

        // Parse target seats
        // Supporting: "L1, L2, L3" or range "L1-L10"
        const targets = targetSeatNumbers.split(",").map(s => s.trim().toUpperCase());
        const targetList: string[] = [];

        targets.forEach(t => {
            if (t.includes("-")) {
                const [start, end] = t.split("-");
                if (start && end) {
                    const prefix = start.match(/^[A-Z]+/)?.[0] || "";
                    const startNum = parseInt(start.match(/\d+/)?.[0] || "0");
                    const endNum = parseInt(end.match(/\d+/)?.[0] || "0");
                    if (startNum && endNum) {
                        for (let i = Math.min(startNum, endNum); i <= Math.max(startNum, endNum); i++) {
                            targetList.push(`${prefix}${i}`);
                        }
                    }
                }
            } else {
                targetList.push(t);
            }
        });

        const newSeats = seats.map(s => {
            if (targetList.includes(s.seat_number.toUpperCase())) {
                return { ...s, price: priceNum };
            }
            return s;
        });

        setSeats(newSeats);
        setBulkPriceDialogOpen(false);
        setBulkPrice("");
        setTargetSeatNumbers("");
        toast.success(`Price ₹${priceNum} applied to specified seats`);
    };


    // SVG Icons for Seats
    const SeaterIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-current">
            <path d="M7 13V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M5 10H7V18C7 19.1046 7.89543 20 9 20H15C16.1046 20 17 19.1046 17 18V10H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M5 14V17C5 18.6569 6.34315 20 8 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M19 14V17C19 18.6569 17.6569 20 16 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );

    const SleeperIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-current">
            <rect x="4" y="2" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
            <line x1="4" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="2" />
            <path d="M8 6H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );

    return (
        <div className="p-8">
            <header className="max-w-6xl mx-auto flex justify-between items-center mb-8">
                <div>
                    {view === "create" ? (
                        <button
                            onClick={() => setView("list")}
                            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2"
                        >
                            <ChevronLeft className="h-4 w-4" /> Back to Buses
                        </button>
                    ) : (
                        <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
                            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
                        </Link>
                    )}
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Bus className="h-8 w-8 text-primary" />
                        Manage Buses
                    </h1>
                </div>
                {view === "list" && (
                    <Button onClick={handleCreateClick}>
                        <Plus className="mr-2 h-4 w-4" /> Add New Bus
                    </Button>
                )}
            </header>

            <main className="max-w-6xl mx-auto">
                {view === "list" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading && buses.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                            </div>
                        ) : buses.map((bus) => (
                            <Card key={bus.id} className="hover:border-primary/50 transition-colors group">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            <Bus className="h-5 w-5" />
                                        </div>
                                        <CardTitle className="text-lg">{bus.name}</CardTitle>
                                    </div>
                                    <Badge variant="outline">Active</Badge>
                                </CardHeader>
                                {bus.images && bus.images.length > 0 && (
                                    <div className="px-6 pb-2">
                                        <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted border">
                                            <img
                                                src={bus.images[0]}
                                                alt={bus.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            {bus.images.length > 1 && (
                                                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                                                    +{bus.images.length - 1} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Type</span>
                                            <span className="font-medium">{bus.type.replace("_", " ")}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Total Seats</span>
                                            <span className="font-medium">{bus.total_seats} Seats</span>
                                        </div>
                                        {bus.schedules && bus.schedules.length > 0 && (
                                            <div className="pt-2">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Active Routes</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {Array.from(new Set(bus.schedules.map((s: any) => `${s.route.from_city} → ${s.route.to_city}`)))
                                                        .slice(0, 3)
                                                        .map((routeStr: any, idx) => (
                                                            <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0">
                                                                {routeStr}
                                                            </Badge>
                                                        ))
                                                    }
                                                    {new Set(bus.schedules.map((s: any) => `${s.route.from_city} → ${s.route.to_city}`)).size > 3 && (
                                                        <span className="text-[10px] text-muted-foreground">+{new Set(bus.schedules.map((s: any) => `${s.route.from_city} → ${s.route.to_city}`)).size - 3} more</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <div className="pt-2 flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditClick(bus)}>
                                                <Settings2 className="mr-2 h-4 w-4" /> Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(bus.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {!loading && buses.length === 0 && (
                            <div className="col-span-full text-center py-12 border-2 border-dashed rounded-xl">
                                <p className="text-muted-foreground">No buses found. Add your first bus!</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Bus Details Form */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{editMode ? "Edit Bus" : "New Bus Details"}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Bus Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g. Sriram Express"
                                            value={busName}
                                            onChange={(e) => setBusName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Bus Configuration</Label>
                                        <RadioGroup value={busType} onValueChange={(v: BusType) => setBusType(v)} className="flex gap-4">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="AC" id="ac" />
                                                <Label htmlFor="ac">AC</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="NON_AC" id="non-ac" />
                                                <Label htmlFor="non-ac">Non-AC</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    <div className="flex gap-4 pt-2">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hasSleeper}
                                                onChange={(e) => setHasSleeper(e.target.checked)}
                                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            Sleeper
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hasSeater}
                                                onChange={(e) => setHasSeater(e.target.checked)}
                                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            Seater
                                        </label>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <Label>Bus Images</Label>
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            {imagePreviews.map((preview, index) => (
                                                <div key={index} className="relative aspect-video rounded-md overflow-hidden border bg-white group">
                                                    <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const newPreviews = [...imagePreviews];
                                                            newPreviews.splice(index, 1);
                                                            setImagePreviews(newPreviews);

                                                            // Also remove from files or existing urls
                                                            if (index < existingImageUrls.length) {
                                                                const newExisting = [...existingImageUrls];
                                                                newExisting.splice(index, 1);
                                                                setExistingImageUrls(newExisting);
                                                            } else {
                                                                const fileIndex = index - existingImageUrls.length;
                                                                const newFiles = [...imageFiles];
                                                                newFiles.splice(fileIndex, 1);
                                                                setImageFiles(newFiles);
                                                            }
                                                        }}
                                                        className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div
                                            className={cn(
                                                "relative border-2 border-dashed rounded-lg p-4 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50",
                                                imagePreviews.length > 0 ? "border-primary/50 bg-primary/5" : "border-muted"
                                            )}
                                            onClick={() => document.getElementById('image-upload')?.click()}
                                        >
                                            <div className="p-3 bg-muted rounded-full">
                                                <Upload className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium">Upload Images</p>
                                                <p className="text-[10px] text-muted-foreground">PNG, JPG up to 5MB (Multiple)</p>
                                            </div>
                                            <input
                                                id="image-upload"
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={(e) => {
                                                    const files = Array.from(e.target.files || []);
                                                    if (files.length > 0) {
                                                        setImageFiles(prev => [...prev, ...files]);
                                                        files.forEach(file => {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                setImagePreviews(prev => [...prev, reader.result as string]);
                                                            };
                                                            reader.readAsDataURL(file);
                                                        });
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm">Summary</CardTitle>
                                    <Badge>{seats.length} Seats Defined</Badge>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full" onClick={handleSave} disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        {editMode ? "Update Bus & Layout" : "Save Bus & Layout"}
                                    </Button>
                                    <Button variant="ghost" className="w-full mt-2" onClick={() => setView("list")}>
                                        Cancel
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Grid Config */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Grid Dimensions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="rows">Rows</Label>
                                            <Input
                                                id="rows"
                                                type="number"
                                                min={5}
                                                max={30}
                                                value={rowCount}
                                                onChange={(e) => setRowCount(parseInt(e.target.value) || 10)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cols">Columns</Label>
                                            <Input
                                                id="cols"
                                                type="number"
                                                min={3}
                                                max={10}
                                                value={colCount}
                                                onChange={(e) => setColCount(parseInt(e.target.value) || 5)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Layout Creator */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <Tabs defaultValue="LOWER" value={activeDeck} onValueChange={(v: any) => setActiveDeck(v)}>
                                    <CardHeader className="flex flex-col sm:flex-row items-center justify-between border-b gap-4">
                                        <CardTitle className="flex items-center gap-2">
                                            <Layout className="h-5 w-5 text-primary" />
                                            Layout Creator
                                            <Badge variant="outline" className="ml-2 font-normal text-xs">
                                                {activeDeck} DECK
                                            </Badge>
                                        </CardTitle>
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                            <div className="flex items-center gap-2 h-9 border rounded-md px-3 bg-muted/20">
                                                <Label className="text-[10px] font-bold uppercase tracking-tighter opacity-70">Prefix</Label>
                                                <input
                                                    className="w-12 bg-transparent text-sm font-bold focus:outline-none uppercase placeholder:font-normal placeholder:normal-case"
                                                    placeholder={activeDeck === "LOWER" ? "L" : "U"}
                                                    value={seatPrefix}
                                                    onChange={(e) => setSeatPrefix(e.target.value)}
                                                />
                                            </div>
                                            <TabsList>
                                                <TabsTrigger value="LOWER">Lower Deck</TabsTrigger>
                                                <TabsTrigger value="UPPER">Upper Deck</TabsTrigger>
                                            </TabsList>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 select-none">
                                        <div className="mx-auto border-4 border-dashed border-muted rounded-2xl p-6 bg-muted/5 overflow-x-auto">
                                            {/* Driver Cabin Indicator */}
                                            <div className="flex items-center mb-4 border-b pb-2 relative">
                                                <div className="absolute left-1/2 -translate-x-1/2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 text-[10px] font-bold gap-1 border-primary/30 text-primary hover:bg-primary/5 shadow-sm"
                                                        onClick={() => setBulkPriceDialogOpen(true)}
                                                    >
                                                        <Plus className="h-3 w-3" /> Price
                                                    </Button>
                                                </div>
                                                <div className="ml-auto bg-muted text-muted-foreground text-[10px] font-bold px-2 py-1 rounded">DRIVER CABIN</div>
                                            </div>

                                            <div
                                                className="grid gap-3 mx-auto"
                                                style={{
                                                    gridTemplateColumns: `repeat(${colCount}, minmax(40px, 1fr))`,
                                                    maxWidth: `${colCount * 60}px`
                                                }}
                                            >
                                                {Array.from({ length: rowCount * colCount }).map((_, i) => {
                                                    const r = Math.floor(i / colCount) + 1; // 1-indexed rows for display if needed
                                                    const c = (i % colCount) + 1;
                                                    const existingSeatIndex = seats.findIndex(s => s.row === r && s.col === c && s.deck === activeDeck);
                                                    const existingSeat = seats[existingSeatIndex];

                                                    return (
                                                        <div
                                                            key={i}
                                                            onClick={() => handleSeatInteraction(r, c)}
                                                            onContextMenu={(e) => e.preventDefault()}
                                                            className={cn(
                                                                "aspect-square flex items-center justify-center rounded-lg border-2 transition-all cursor-pointer relative group",
                                                                existingSeatIndex === -1
                                                                    ? "border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5"
                                                                    : "border-primary bg-primary/10 shadow-sm"
                                                            )}
                                                            title={existingSeat ? `Seat: ${existingSeat.seat_number} (${existingSeat.type})\nPrice: ₹${existingSeat.price || "Default"}\nClick: Set Price\nShift+Click: Toggle Type\nRight Click: Remove` : "Click to add seat"}
                                                        >
                                                            {existingSeat ? (
                                                                <div className="flex flex-col items-center justify-center w-full h-full p-1.5">
                                                                    <div className="w-full h-full text-primary">
                                                                        {existingSeat.type === "SEATER" ? <SeaterIcon /> : <SleeperIcon />}
                                                                    </div>

                                                                    {/* Edit Icon Overlay */}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setPricingSeat(existingSeat);
                                                                            setTempPrice(existingSeat.price?.toString() || "");
                                                                            setTempSeatNumber(existingSeat.seat_number);
                                                                        }}
                                                                        className="absolute -top-1 -left-1 bg-white border border-primary text-primary p-0.5 rounded-md shadow-sm hover:bg-primary hover:text-white transition-colors z-30"
                                                                    >
                                                                        <Pencil className="h-2.5 w-2.5" />
                                                                    </button>

                                                                    {existingSeat.price && (
                                                                        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[8px] px-1 rounded-full border border-white">
                                                                            ₹{existingSeat.price}
                                                                        </span>
                                                                    )}
                                                                    <span className="absolute bottom-0 right-0 bg-primary text-primary-foreground text-[9px] px-1 rounded-tl leading-tight">
                                                                        {existingSeat.seat_number}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <Plus className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary/50" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="mt-6 flex justify-center gap-8 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 text-primary"><SeaterIcon /></div>
                                                <span>Seater</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 text-primary"><SleeperIcon /></div>
                                                <span>Sleeper</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-primary font-medium">
                                                <CheckCircle2 className="h-4 w-4" />
                                                <span>Click: Cycle Type / Deselect • <Pencil className="h-3 w-3 inline mr-1" />: Edit Seat</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Tabs>
                            </Card>
                        </div>
                    </div>
                )}
            </main>

            <Dialog open={!!pricingSeat} onOpenChange={(open) => !open && setPricingSeat(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Seat: {pricingSeat?.seat_number}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Seat Number (Manual)</Label>
                            <Input
                                placeholder="e.g. L1, 1A, Driver"
                                value={tempSeatNumber}
                                onChange={(e) => setTempSeatNumber(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Seat Price (₹)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    placeholder="Leave empty for default"
                                    className="pl-9"
                                    value={tempPrice}
                                    onKeyDown={(e) => {
                                        if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                                    }}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                            setTempPrice(val);
                                        }
                                    }}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">If not set, this seat will use the base price defined in the schedule.</p>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-start">
                        <Button type="button" onClick={handleUpdateSeat} className="w-full">
                            Update Seat Configuration
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={bulkPriceDialogOpen} onOpenChange={setBulkPriceDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Apply Price to Specific Seats</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Price to Apply (₹)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    placeholder="e.g. 850"
                                    className="pl-9"
                                    value={bulkPrice}
                                    onKeyDown={(e) => {
                                        if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                                    }}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                            setBulkPrice(val);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Target Seat Numbers</Label>
                            <Input
                                placeholder="e.g. L1, L2, L5-L10"
                                value={targetSeatNumbers}
                                onChange={(e) => setTargetSeatNumbers(e.target.value)}
                            />
                            <p className="text-[10px] text-muted-foreground">Comma separated. Supports ranges with hyphen (e.g. L1-L10).</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" onClick={handleApplyBulkPrice} className="w-full">
                            Apply Price to Specified Seats
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
