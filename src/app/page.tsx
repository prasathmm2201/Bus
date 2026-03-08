import LayoutWrapper from "@/components/layout/LayoutWrapper";
import HomeHero from "@/screens/Home/HomeHero";
import SearchForm from "@/screens/Home/SearchForm";
import OffersSection from "@/screens/Home/OffersSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, TrendingUp, Star, ShieldCheck } from "lucide-react";
import { getPopularRoutes, getBusImages } from "@/services/busService";
import BusImageSlider from "@/screens/Home/BusImageSlider";

export const dynamic = "force-dynamic";

export default async function Home() {
  const popularRoutes = await getPopularRoutes();
  const busImages = await getBusImages();

  return (
    <LayoutWrapper>
      <HomeHero />
      <div className="container mx-auto px-4">
        <SearchForm />
        {/* <OffersSection /> */}

        {/* <section className="mt-20 mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-teal-600" />
                Popular Routes
              </h2>
              <div className="h-1.5 w-12 bg-teal-600 rounded-full mt-2" />
            </div>
            <Button variant="ghost" className="text-teal-600 font-bold hover:bg-teal-50">
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {popularRoutes.length > 0 ? (
              popularRoutes.map((route, i) => (
                <div key={route.id} className="group cursor-pointer bg-white rounded-[2rem] border border-slate-100 p-6 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:shadow-slate-300/40 transition-all duration-500 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 bg-teal-50 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-colors duration-500">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-black text-slate-800">₹{route.price}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">
                    {route.from} to {route.to}
                  </h3>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Daily Scheduled</p>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center text-slate-400 font-medium py-12 border-2 border-dashed border-slate-100 rounded-[2rem]">
                Exploring more routes for you...
              </div>
            )}
          </div>
        </section> */}

        <section className="mb-32">
          <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10">
              <div className="flex-1">
                <h2 className="mb-8 text-4xl md:text-5xl font-black text-white leading-tight">
                  Why choose <br />
                  <span className="text-teal-400 tracking-tighter">VSR Travels?</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <Star className="h-6 w-6 text-teal-400" />
                    </div>
                    <h4 className="text-lg font-bold text-white">Premium Fleet</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">Certified AC and Sleeper buses for a comfort journey.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6 text-teal-400" />
                    </div>
                    <h4 className="text-lg font-bold text-white">Safe Travels</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">Gender-locking for female travelers and live tracking.</p>
                  </div>
                </div>

                <Button className="mt-12 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl px-8 h-12 font-bold shadow-lg shadow-teal-500/20">
                  Learn More
                </Button>
              </div>

              <div className="flex-1 w-full lg:max-w-md">
                <div className="relative p-2 bg-gradient-to-br from-teal-500 to-indigo-500 rounded-[2.5rem] shadow-2xl">
                  <div className="rounded-[2rem] overflow-hidden bg-slate-800">
                    <BusImageSlider images={busImages} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </LayoutWrapper>
  );
}
