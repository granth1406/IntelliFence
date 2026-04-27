import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { AuthShell } from "@/components/AuthShell";
import { Field } from "@/components/Field";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — IntelliFence" },
      { name: "description", content: "Sign in to your IntelliFence account." },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values.email, values.password);
      toast.success("Welcome back!");
      navigate({ to: "/profile" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to your dashboard">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Field
          label="Email"
          icon={<Mail className="h-4 w-4" />}
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Field
          label="Password"
          icon={<Lock className="h-4 w-4" />}
          type={showPwd ? "text" : "password"}
          placeholder="••••••••"
          error={errors.password?.message}
          rightSlot={
            <button type="button" onClick={() => setShowPwd((v) => !v)} className="text-muted-foreground hover:text-foreground">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          {...register("password")}
        />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
            <input type="checkbox" className="rounded border-border bg-input" /> Remember me
          </label>
          <a href="#" className="text-primary hover:underline">Forgot?</a>
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"} <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link to="/signup" className="text-primary font-medium hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}
