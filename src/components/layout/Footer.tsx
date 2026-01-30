import Link from "next/link";
import { Bus, Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
    return (
        <footer className="w-full border-t bg-muted/30 py-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div className="flex flex-col space-y-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <Bus className="h-6 w-6 text-primary" />
                            <span className="text-lg font-bold">Sriram Bus</span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            Experience the best bus booking service in India. Premium, fast, and reliable.
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-semibold">About</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-primary">Contact Us</Link></li>
                            <li><Link href="/terms" className="hover:text-primary">Terms & Conditions</Link></li>
                            <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-semibold">Popular Routes</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>Bangalore to Hyderabad</li>
                            <li>Hyderabad to Bangalore</li>
                            <li>Pune to Mumbai</li>
                            <li>Mumbai to Pune</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-semibold">Follow Us</h4>
                        <div className="flex space-x-4">
                            <Facebook className="h-5 w-5 cursor-pointer hover:text-primary" />
                            <Twitter className="h-5 w-5 cursor-pointer hover:text-primary" />
                            <Instagram className="h-5 w-5 cursor-pointer hover:text-primary" />
                        </div>
                    </div>
                </div>

                <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} Sriram Bus. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
