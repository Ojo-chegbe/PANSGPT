import { Brain } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="py-12 px-6 sm:px-8 lg:px-12 border-t border-border bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 relative">
                <Image
                  src="/uploads/Logo.png"
                  alt="PansGPT Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-foreground font-bold">PansGPT</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Your personalized pharmacy tutor, built specifically for University of Jos students.
            </p>
          </div>
          
          <div>
            <h4 className="text-foreground mb-4">Product</h4>
            <div className="space-y-2">
              <Link href="/" className="block text-muted-foreground hover:text-primary text-sm transition-colors">
                Home
              </Link>
              <Link href="/about" className="block text-muted-foreground hover:text-primary text-sm transition-colors">
                About
              </Link>
              <Link href="/download" className="block text-muted-foreground hover:text-primary text-sm transition-colors">
                Download
              </Link>
              <Link href="/faq" className="block text-muted-foreground hover:text-primary text-sm transition-colors">
                FAQ
              </Link>
            </div>
          </div>
          
          <div>
            <h4 className="text-foreground mb-4">Legal</h4>
            <div className="space-y-2">
              <Link href="/terms" className="block text-muted-foreground hover:text-primary text-sm transition-colors">Terms of Service</Link>
              <a href="#" className="block text-muted-foreground hover:text-primary text-sm transition-colors">Privacy Policy</a>
            </div>
          </div>
          
          <div>
            <h4 className="text-foreground mb-4">Support</h4>
            <div className="space-y-2">
              <Link href="/contact" className="block text-muted-foreground hover:text-primary text-sm transition-colors">Contact Us</Link>
              <Link href="/faq" className="block text-muted-foreground hover:text-primary text-sm transition-colors">FAQ</Link>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border text-center text-muted-foreground text-sm">
          <p>© 2025 PansGPT. Built with ❤️ for University of Jos Pharmacy Students.</p>
        </div>
      </div>
    </footer>
  );
}
