import { Button } from "./ui/button";
import { Brain, Menu, X } from "lucide-react";
import { useState } from "react";

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigation = (page: string) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button 
            onClick={() => handleNavigation("home")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl text-foreground">PansGPT</span>
          </button>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            <button 
              onClick={() => handleNavigation("home")}
              className={`transition-colors ${
                currentPage === "home" 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              Home
            </button>
            <button 
              onClick={() => handleNavigation("about")}
              className={`transition-colors ${
                currentPage === "about" 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              About
            </button>
            <button 
              onClick={() => handleNavigation("download")}
              className={`transition-colors ${
                currentPage === "download" 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              Download
            </button>
            <button 
              onClick={() => handleNavigation("contact")}
              className={`transition-colors ${
                currentPage === "contact" 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              Contact
            </button>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              className="hidden md:inline-flex"
              onClick={() => window.open('https://chat.pansgpt.com', '_blank')}
            >
              Go to Chat
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => handleNavigation("download")}
            >
              Get Started Free
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-border space-y-2">
            <button 
              onClick={() => handleNavigation("home")}
              className={`block py-2 w-full text-left transition-colors ${
                currentPage === "home" 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              Home
            </button>
            <button 
              onClick={() => handleNavigation("about")}
              className={`block py-2 w-full text-left transition-colors ${
                currentPage === "about" 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              About
            </button>
            <button 
              onClick={() => handleNavigation("download")}
              className={`block py-2 w-full text-left transition-colors ${
                currentPage === "download" 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              Download
            </button>
            <button 
              onClick={() => handleNavigation("contact")}
              className={`block py-2 w-full text-left transition-colors ${
                currentPage === "contact" 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              Contact
            </button>
            <div className="pt-2">
              <Button 
                variant="outline" 
                className="w-full mb-2"
                onClick={() => window.open('https://chat.pansgpt.com', '_blank')}
              >
                Go to Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
