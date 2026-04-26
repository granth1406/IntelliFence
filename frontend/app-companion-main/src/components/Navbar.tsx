import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, MapPin, User as UserIcon, LogOut } from "lucide-react";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/profile", label: "Profile" },
  { to: "/location", label: "Location" },
] as const;

export function Navbar() {
  const { isAuthenticated, user, logout } = useApp();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="absolute inset-0 glass border-b border-border" />
      <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Logo />

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                  active ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden sm:flex h-10 w-10 rounded-full bg-gradient-primary items-center justify-center hover:shadow-glow transition-smooth">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-transparent text-primary-foreground font-semibold">
                        {user?.name?.[0]?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass w-56">
                  <div className="px-2 py-2">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer"><UserIcon className="h-4 w-4 mr-2" /> Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/location" className="cursor-pointer"><MapPin className="h-4 w-4 mr-2" /> Location</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button variant="hero" asChild>
                <Link to="/signup">Get started</Link>
              </Button>
            </div>
          )}

          <button
            className="md:hidden h-10 w-10 rounded-lg glass flex items-center justify-center"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden glass border-b border-border px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 rounded-lg text-sm font-medium hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
          {!isAuthenticated && (
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" asChild className="flex-1"><Link to="/login">Sign in</Link></Button>
              <Button variant="hero" asChild className="flex-1"><Link to="/signup">Sign up</Link></Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
