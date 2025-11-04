import { Brain } from "lucide-react";

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="py-12 px-4 border-t border-border bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <span className="text-foreground">PansGPT</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Your personalized pharmacy tutor, built specifically for University of Jos students.
            </p>
          </div>
          
          <div>
            <h4 className="text-foreground mb-4">Product</h4>
            <div className="space-y-2">
              <button 
                onClick={() => onNavigate("home")} 
                className="block text-muted-foreground hover:text-primary text-sm transition-colors text-left"
              >
                Home
              </button>
              <button 
                onClick={() => onNavigate("about")} 
                className="block text-muted-foreground hover:text-primary text-sm transition-colors text-left"
              >
                About Us
              </button>
              <button 
                onClick={() => onNavigate("download")} 
                className="block text-muted-foreground hover:text-primary text-sm transition-colors text-left"
              >
                Download
              </button>
              <button 
                onClick={() => onNavigate("contact")} 
                className="block text-muted-foreground hover:text-primary text-sm transition-colors text-left"
              >
                Contact Us
              </button>
            </div>
          </div>
          
          <div>
            <h4 className="text-foreground mb-4">Legal</h4>
            <div className="space-y-2">
              <button 
                onClick={() => onNavigate("terms")} 
                className="block text-muted-foreground hover:text-primary text-sm transition-colors text-left"
              >
                Terms of Service
              </button>
              <a href="#" className="block text-muted-foreground hover:text-primary text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="block text-muted-foreground hover:text-primary text-sm transition-colors">Cookie Policy</a>
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
