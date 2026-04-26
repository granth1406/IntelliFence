import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <div className="relative h-9 w-9 rounded-xl bg-gradient-primary shadow-glow flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2 L20 7 L20 17 L12 22 L4 17 L4 7 Z" strokeLinejoin="round" />
          <path d="M12 2 L12 22 M4 7 L20 17 M20 7 L4 17" strokeLinejoin="round" opacity="0.5" />
        </svg>
      </div>
      <span className="font-display text-xl font-bold tracking-tight">
        IntelliFence
      </span>
    </Link>
  );
}
