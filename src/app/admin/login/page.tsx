"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bus, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminLoginAction } from "@/app/actions/userActions";
import { useAuth } from "@/store/useAuth";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { user, setAuth } = useAuth();

    useEffect(() => {
        if (user?.role === "ADMIN") {
            router.push("/admin");
        }
    }, [user, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await adminLoginAction(email, password);
            if (res.success && res.data) {
                setAuth(res.data as any, res.token || "");
                toast.success("Welcome back, Admin!");
                router.push("/admin");
            } else {
                toast.error(res.error || "Invalid admin credentials");
            }
        } catch (error) {
            toast.error("An error occurred during login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
                        <Bus className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Admin Terminal</CardTitle>
                    <CardDescription>Sriram Bus Operations Management</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Admin Email</Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@srirambus.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full h-12" disabled={loading}>
                            {loading ? "Verifying..." : "Access Dashboard"}
                            {!loading && <Lock className="ml-2 h-4 w-4" />}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
