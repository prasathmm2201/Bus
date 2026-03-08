import { Suspense } from "react";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import SearchScreen from "@/screens/Search/SearchScreen";

export default function SearchPage() {
    return (
        <LayoutWrapper>
            <Suspense fallback={
                <div className="container mx-auto px-4 py-8 animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg mb-8"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="h-64 bg-gray-200 rounded-lg"></div>
                        <div className="md:col-span-3 space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            }>
                <SearchScreen />
            </Suspense>
        </LayoutWrapper>
    );
}
