import LayoutWrapper from "@/components/layout/LayoutWrapper";
import HomeHero from "@/screens/Home/HomeHero";
import SearchForm from "@/screens/Home/SearchForm";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, TrendingUp, Star } from "lucide-react";

export default function Home() {
  return (
    <LayoutWrapper>
      <HomeHero />
      <div className="container mx-auto px-4">
        <SearchForm />

        <section className="mt-12 mb-24">
          <h2 className="mb-8 text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Popular Routes
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { from: "Bangalore", to: "Hyderabad", price: "899" },
              { from: "Mumbai", to: "Pune", price: "499" },
              { from: "Chennai", to: "Bangalore", price: "799" },
            ].map((route, i) => (
              <Card key={i} className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg">
                <CardContent className="p-0">
                  <div className="bg-muted p-4 flex justify-between items-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="font-semibold">{route.from} to {route.to}</span>
                    </div>
                    <span className="text-sm font-bold">From ₹{route.price}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-24 rounded-2xl bg-muted/30 p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="mb-4 text-3xl font-bold">Why choose Sriram Bus?</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/20 p-2 rounded-lg mt-1">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Premium Fleet</h4>
                    <p className="text-sm text-muted-foreground">Certified AC and Sleeper buses for a comfort journey.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/20 p-2 rounded-lg mt-1">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Gender-Lock Seating</h4>
                    <p className="text-sm text-muted-foreground">Safe seating options with adjacent gender locking for female travelers.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="relative h-[300px] w-full max-w-[400px] bg-primary/10 rounded-2xl flex items-center justify-center overflow-hidden">
                <div className="text-primary font-bold text-lg">Bus Image Placeholder</div>
                {/* I will use generate_image tool later for better visuals if needed */}
              </div>
            </div>
          </div>
        </section>
      </div>
    </LayoutWrapper>
  );
}
