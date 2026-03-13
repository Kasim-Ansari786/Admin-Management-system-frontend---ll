import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 w-full py-4 bg-background border-t border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2">
          {/* Left - Company Name */}
          <div className="flex flex-col items-center md:items-start">
            <p className="text-sm font-semibold text-foreground">
              One-Admin | Admin Management System (SaaS)
            </p>
          </div>

          {/* Center - Copyright */}
          <div className="flex items-center">
            <p className="text-xs text-muted-foreground">
              © All Rights Reserved | 2026 - 2028
            </p>
          </div>

          {/* Right - Credit Info */}
          <div className="flex items-center text-sm text-muted-foreground">
            <span>Made in India with</span>
            <Heart className="h-4 w-4 mx-1 text-destructive fill-current" />
            <span className="font-bold text-foreground ml-1">
              Comdata Innovation Pvt Ltd.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;