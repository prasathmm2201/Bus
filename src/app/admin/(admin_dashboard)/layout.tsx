import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-muted/20">
            {/* Shared Sidebar */}
            <div className="hidden md:block">
                <AdminSidebar />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
