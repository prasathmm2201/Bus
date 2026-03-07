"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createCouponAction, getUsersForCouponAction } from "@/app/actions/adminActions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CouponCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CouponCreateDialog({ open, onOpenChange, onSuccess }: CouponCreateDialogProps) {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        user_id: "",
        description: "",
        discount_type: "PERCENTAGE" as "FLAT" | "PERCENTAGE",
        discount_value: "",
        min_order_value: "0",
        max_discount: "",
        expiry_days: "30",
        usage_limit: "1"
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            fetchUsers();
        }
    }, [open]);

    const fetchUsers = async () => {
        try {
            const result = await getUsersForCouponAction();
            if (result.success && result.data) {
                setUsers(result.data);
            }
        } catch (error) {
            toast.error("Failed to load users");
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.user_id) newErrors.user_id = "Please select a user";
        if (!formData.discount_value || Number(formData.discount_value) <= 0) {
            newErrors.discount_value = "Discount value must be greater than 0";
        }
        if (formData.discount_type === "PERCENTAGE" && Number(formData.discount_value) > 100) {
            newErrors.discount_value = "Percentage cannot exceed 100%";
        }
        if (!formData.expiry_days || Number(formData.expiry_days) <= 0) {
            newErrors.expiry_days = "Expiry days must be greater than 0";
        }
        if (Number(formData.min_order_value) < 0) {
            newErrors.min_order_value = "Min order value cannot be negative";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);
        try {
            const result = await createCouponAction({
                user_id: formData.user_id,
                description: formData.description || undefined,
                discount_type: formData.discount_type,
                discount_value: Number(formData.discount_value),
                min_order_value: Number(formData.min_order_value),
                max_discount: formData.max_discount ? Number(formData.max_discount) : undefined,
                expiry_days: Number(formData.expiry_days),
                usage_limit: Number(formData.usage_limit)
            });

            if (result.success && result.data) {
                toast.success(`Coupon created successfully! Code: ${result.data.code}`);
                onSuccess();
                onOpenChange(false);
                // Reset form
                setFormData({
                    user_id: "",
                    description: "",
                    discount_type: "PERCENTAGE",
                    discount_value: "",
                    min_order_value: "0",
                    max_discount: "",
                    expiry_days: "30",
                    usage_limit: "1"
                });
            } else {
                toast.error(result.error || "Failed to create coupon");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const selectedUser = users.find(u => u.id === formData.user_id);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Coupon</DialogTitle>
                    <DialogDescription>
                        Create a user-specific coupon with custom discount and expiry settings
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* User Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="user_id">Select User *</Label>
                        <Select value={formData.user_id} onValueChange={(value) => setFormData({ ...formData, user_id: value })}>
                            <SelectTrigger className={errors.user_id ? "border-destructive" : ""}>
                                <SelectValue placeholder="Choose a user..." />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name || user.email} {user.mobile_no && `(${user.mobile_no})`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.user_id && <p className="text-sm text-destructive">{errors.user_id}</p>}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="e.g., Welcome offer for new users"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={2}
                        />
                    </div>

                    {/* Discount Configuration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="discount_type">Discount Type *</Label>
                            <Select
                                value={formData.discount_type}
                                onValueChange={(value: "FLAT" | "PERCENTAGE") => setFormData({ ...formData, discount_type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                    <SelectItem value="FLAT">Flat Amount (₹)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="discount_value">
                                Discount Value * {formData.discount_type === "PERCENTAGE" ? "(%)" : "(₹)"}
                            </Label>
                            <Input
                                id="discount_value"
                                type="number"
                                placeholder={formData.discount_type === "PERCENTAGE" ? "e.g., 20" : "e.g., 100"}
                                value={formData.discount_value}
                                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                className={errors.discount_value ? "border-destructive" : ""}
                            />
                            {errors.discount_value && <p className="text-sm text-destructive">{errors.discount_value}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="min_order_value">Min Order Value (₹)</Label>
                            <Input
                                id="min_order_value"
                                type="number"
                                placeholder="e.g., 500"
                                value={formData.min_order_value}
                                onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                                className={errors.min_order_value ? "border-destructive" : ""}
                            />
                            {errors.min_order_value && <p className="text-sm text-destructive">{errors.min_order_value}</p>}
                        </div>

                        {formData.discount_type === "PERCENTAGE" && (
                            <div className="space-y-2">
                                <Label htmlFor="max_discount">Max Discount (₹)</Label>
                                <Input
                                    id="max_discount"
                                    type="number"
                                    placeholder="e.g., 200"
                                    value={formData.max_discount}
                                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">Cap the maximum discount amount</p>
                            </div>
                        )}
                    </div>

                    {/* Expiry Configuration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="expiry_days">Expiry (Days) *</Label>
                            <Input
                                id="expiry_days"
                                type="number"
                                placeholder="e.g., 30"
                                value={formData.expiry_days}
                                onChange={(e) => setFormData({ ...formData, expiry_days: e.target.value })}
                                className={errors.expiry_days ? "border-destructive" : ""}
                            />
                            {errors.expiry_days && <p className="text-sm text-destructive">{errors.expiry_days}</p>}
                            {formData.expiry_days && Number(formData.expiry_days) > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Expires on: {new Date(Date.now() + Number(formData.expiry_days) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="usage_limit">Usage Limit</Label>
                            <Input
                                id="usage_limit"
                                type="number"
                                placeholder="e.g., 1"
                                value={formData.usage_limit}
                                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">How many times user can use this coupon</p>
                        </div>
                    </div>

                    {/* Preview */}
                    {selectedUser && formData.discount_value && (
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm font-semibold mb-2">Preview:</p>
                            <p className="text-xs text-muted-foreground">
                                {selectedUser.name || selectedUser.email} will receive a coupon for{" "}
                                <span className="font-bold text-primary">
                                    {formData.discount_type === "PERCENTAGE"
                                        ? `${formData.discount_value}% OFF`
                                        : `₹${formData.discount_value} OFF`}
                                </span>
                                {formData.min_order_value && Number(formData.min_order_value) > 0 && (
                                    <> on orders above ₹{formData.min_order_value}</>
                                )}
                                , valid for {formData.expiry_days} days.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Coupon
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
