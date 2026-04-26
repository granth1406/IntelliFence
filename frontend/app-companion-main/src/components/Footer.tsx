import { Link } from "@tanstack/react-router";
import { Github, Twitter, Linkedin } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="relative border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              The modern platform for teams that move fast. Beautifully designed, ridiculously powerful.
            </p>
            <div className="flex gap-3 mt-6">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="h-9 w-9 rounded-lg glass flex items-center justify-center hover:bg-secondary transition-smooth">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground">Features</Link></li>
              <li><Link to="/location" className="hover:text-foreground">Location</Link></li>
              <li><Link to="/profile" className="hover:text-foreground">Profile</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#about" className="hover:text-foreground">About</a></li>
              <li><a href="#" className="hover:text-foreground">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} IntelliFence. Public safety, in real time.</p>
          <p>Built for the modern web.</p>
        </div>
      </div>
    </footer>
  );
}
