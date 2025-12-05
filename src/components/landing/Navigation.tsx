"use client";

import { Button } from "../ui/button";
import { Brain, Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-20 h-20 relative">
              <Image
                src="/uploads/Logo 2.png"
                alt="PansGPT Logo"
                fill
                className="object-contain"
              />
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/download" className="text-muted-foreground hover:text-primary transition-colors">
              Download
            </Link>
            <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">
              FAQ
            </Link>
            <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
              Contact
            </Link>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button 
                variant="ghost" 
                className="hidden md:inline-flex text-white"
              >
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Get Started
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-border space-y-2">
            <Link href="/" className="block py-2 text-muted-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link href="/about" className="block py-2 text-muted-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              About
            </Link>
            <Link href="/download" className="block py-2 text-muted-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Download
            </Link>
            <Link href="/faq" className="block py-2 text-muted-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              FAQ
            </Link>
            <Link href="/contact" className="block py-2 text-muted-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Contact
            </Link>
            <div className="pt-2">
              <Link href="/login">
                <Button variant="outline" className="w-full mb-2 text-white" onClick={() => setMobileMenuOpen(false)}>
                  Log In
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
