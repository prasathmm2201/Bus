"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Ticket, Edit, Ban, TrendingUp } from "lucide-react";
import { getCouponsAction, deactivateCouponAction } from "@/app/actions/adminActions";
import { toast } from "sonner";
import { CouponCreateDialog } from "@/components/admin/CouponCreateDialog";
import { CouponEditDialog } from "@/components/admin/CouponEditDialog";
import { format } from "date-fns";

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "expired">("all");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const result = await getCouponsAction({
                search: search || undefined,
                status: statusFilter,
                limit: 20,
                offset: (pagination.page - 1) * 20
            });

            if (result.success && result.data) {
                setCoupons(result.data.coupons);
                setPagination({
                    page: result.data.page,
                    totalPages: result.data.totalPages,
                    total: result.data.total
                });
            } else {
                toast.error(result.error || "Failed to fetch coupons");
            }
        } catch (error) {
            toast.error("An error occurred while fetching coupons");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, [statusFilter, pagination.page]);

    const handleSearch = () => {
        setPagination({ ...pagination, page: 1 });
        fetchCoupons();
    };

    const handleDeactivate = async (id: string) => {
        if (!confirm("Are you sure you want to deactivate this coupon?")) return;

        try {
            const result = await deactivateCouponAction(id);
            if (result.success) {
                toast.success("Coupon deactivated successfully");
                fetchCoupons();
            } else {
                toast.error(result.error || "Failed to deactivate coupon");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleEdit = (coupon: any) => {
        setSelectedCoupon(coupon);
        setEditDialogOpen(true);
    };

    const getStatusBadge = (coupon: any) => {
        if (!coupon.is_active) {
            return <Badge variant="secondary">Inactive</Badge>;
        }
        if (coupon.is_expired) {
            return <Badge variant="destructive">Expired</Badge>;
        }
        return <Badge className="bg-emerald-500">Active</Badge>;
    };

    return (
        <div className="p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Coupon Management</h1>
                    <p className="text-muted-foreground mt-1">Create and manage user-specific coupons</p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)} className="shadow-lg">
                    <Plus className="mr-2 h-4 w-4" /> Create Coupon
                </Button>
            </header>

            {/* Filters */}
            <Card className="mb-6 border-none shadow-sm">
                <CardContent className="p-6">
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">Search by Code</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter coupon code..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                />
                                <Button onClick={handleSearch} variant="secondary">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="w-48">
                            <label className="text-sm font-medium mb-2 block">Status</label>
                            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Coupons Table */}
            <Card className="border-none shadow-sm">
                <CardHeader className="bg-muted/30">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Ticket className="h-5 w-5" />
                        Coupons ({pagination.total})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-12 text-center text-muted-foreground">Loading coupons...</div>
                    ) : coupons.length > 0 ? (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Discount</TableHead>
                                        <TableHead>Min Order</TableHead>
                                        <TableHead>Valid Until</TableHead>
                                        <TableHead>Usage</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {coupons.map((coupon) => (
                                        <TableRow key={coupon.id}>
                                            <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{coupon.user?.name || "N/A"}</p>
                                                    <p className="text-xs text-muted-foreground">{coupon.user?.email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {coupon.discount_type === "PERCENTAGE" ? (
                                                    <span className="font-semibold text-primary">{coupon.discount_value}% OFF</span>
                                                ) : (
                                                    <span className="font-semibold text-primary">₹{coupon.discount_value} OFF</span>
                                                )}
                                                {coupon.max_discount && (
                                                    <p className="text-xs text-muted-foreground">Max: ₹{coupon.max_discount}</p>
                                                )}
                                            </TableCell>
                                            <TableCell>₹{coupon.min_order_value}</TableCell>
                                            <TableCell>
                                                {coupon.valid_until ? (
                                                    <span className={coupon.is_expired ? "text-destructive" : ""}>
                                                        {format(new Date(coupon.valid_until), "MMM dd, yyyy")}
                                                    </span>
                                                ) : (
                                                    "No expiry"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-sm">{coupon.usage_count}/{coupon.usage_limit || "∞"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(coupon)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(coupon)}
                                                        disabled={!coupon.can_edit}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeactivate(coupon.id)}
                                                        disabled={!coupon.is_active}
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="p-4 border-t flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                            disabled={pagination.page === 1}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                            disabled={pagination.page === pagination.totalPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-12 text-center">
                            <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">No coupons found</p>
                            <Button onClick={() => setCreateDialogOpen(true)} variant="outline" className="mt-4">
                                <Plus className="mr-2 h-4 w-4" /> Create Your First Coupon
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <CouponCreateDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={fetchCoupons}
            />
            {selectedCoupon && (
                <CouponEditDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    coupon={selectedCoupon}
                    onSuccess={fetchCoupons}
                />
            )}
        </div>
    );
}
