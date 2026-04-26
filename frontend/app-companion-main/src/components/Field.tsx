import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ReactNode;
  error?: string;
  rightSlot?: ReactNode;
};

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, icon, error, rightSlot, className, ...props }, ref) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <div
        className={`relative flex items-center rounded-lg border bg-input/50 transition-smooth focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30 ${
          error ? "border-destructive" : "border-border"
        }`}
      >
        {icon && <span className="pl-3 text-muted-foreground">{icon}</span>}
        <input
          ref={ref}
          className={`flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60 ${
            className ?? ""
          }`}
          {...props}
        />
        {rightSlot && <span className="pr-3">{rightSlot}</span>}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
);
Field.displayName = "Field";
