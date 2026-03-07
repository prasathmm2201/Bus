"use client";

import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { updateCouponAction } from "@/app/actions/adminActions";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CouponEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    coupon: any;
    onSuccess: () => void;
}

export function CouponEditDialog({ open, onOpenChange, coupon, onSuccess }: CouponEditDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: coupon.description || "",
        expiry_days: "",
        is_active: coupon.is_active
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const canEditExpiry = coupon.usage_count === 0;

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (formData.expiry_days && Number(formData.expiry_days) <= 0) {
            newErrors.expiry_days = "Expiry days must be greater than 0";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);
        try {
            const updateData: any = {
                description: formData.description || undefined,
                is_active: formData.is_active
            };

            if (formData.expiry_days && canEditExpiry) {
                updateData.expiry_days = Number(formData.expiry_days);
            }

            const result = await updateCouponAction(coupon.id, updateData);

            if (result.success) {
                toast.success("Coupon updated successfully");
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(result.error || "Failed to update coupon");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Edit Coupon</DialogTitle>
                    <DialogDescription>
                        Update coupon details. Code and user cannot be changed after creation.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Read-only Information */}
                    <div className="space-y-4 p-4 bg-muted rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs text-muted-foreground">Coupon Code</Label>
                                <p className="font-mono font-bold text-lg">{coupon.code}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">User</Label>
                                <p className="font-medium">{coupon.user?.name || coupon.user?.email}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs text-muted-foreground">Discount</Label>
                                <p className="font-semibold text-primary">
                                    {coupon.discount_type === "PERCENTAGE"
                                        ? `${coupon.discount_value}% OFF`
                                        : `₹${coupon.discount_value} OFF`}
                                </p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Usage</Label>
                                <p className="font-medium">{coupon.usage_count}/{coupon.usage_limit || "∞"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Warning if coupon has been used */}
                    {coupon.usage_count > 0 && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                This coupon has been used {coupon.usage_count} time(s). Expiry date cannot be modified.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Editable Fields */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="e.g., Welcome offer for new users"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={2}
                        />
                    </div>

                    {canEditExpiry && (
                        <div className="space-y-2">
                            <Label htmlFor="expiry_days">Update Expiry (Days)</Label>
                            <Input
                                id="expiry_days"
                                type="number"
                                placeholder="Leave empty to keep current expiry"
                                value={formData.expiry_days}
                                onChange={(e) => setFormData({ ...formData, expiry_days: e.target.value })}
                                className={errors.expiry_days ? "border-destructive" : ""}
                            />
                            {errors.expiry_days && <p className="text-sm text-destructive">{errors.expiry_days}</p>}
                            {formData.expiry_days && Number(formData.expiry_days) > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    New expiry: {new Date(Date.now() + Number(formData.expiry_days) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                </p>
                            )}
                            {coupon.valid_until && (
                                <p className="text-xs text-muted-foreground">
                                    Current expiry: {new Date(coupon.valid_until).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <Label htmlFor="is_active" className="text-base">Active Status</Label>
                            <p className="text-sm text-muted-foreground">Enable or disable this coupon</p>
                        </div>
                        <Switch
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Coupon
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
