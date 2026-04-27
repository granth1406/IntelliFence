import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { AuthShell } from "@/components/AuthShell";
import { Field } from "@/components/Field";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — IntelliFence" },
      { name: "description", content: "Sign up for a free IntelliFence account in seconds." },
    ],
  }),
  component: SignupPage,
});

// Strong password rules: 8+ chars, upper, lower, number
const schema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/\d/, "Must contain a number"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });
type FormValues = z.infer<typeof schema>;

function SignupPage() {
  const { signup } = useApp();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });
  const pwd = watch("password") ?? "";
  const checks = [
    { label: "8+ characters", ok: pwd.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(pwd) },
    { label: "Lowercase letter", ok: /[a-z]/.test(pwd) },
    { label: "Number", ok: /\d/.test(pwd) },
  ];

  const onSubmit = async (values: FormValues) => {
    try {
      await signup(values.name, values.email, values.password);
      toast.success("Account created. Welcome aboard!");
      navigate({ to: "/profile" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Join IntelliFence and help keep your community safe">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Field label="Full name" icon={<User className="h-4 w-4" />} placeholder="Ada Lovelace" error={errors.name?.message} {...register("name")} />
        <Field label="Email" icon={<Mail className="h-4 w-4" />} type="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
        <Field label="Password" icon={<Lock className="h-4 w-4" />} type="password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />

        {pwd.length > 0 && (
          <ul className="grid grid-cols-2 gap-1.5 text-xs">
            {checks.map((c) => (
              <li key={c.label} className={`flex items-center gap-1.5 ${c.ok ? "text-success" : "text-muted-foreground"}`}>
                <CheckCircle2 className={`h-3.5 w-3.5 ${c.ok ? "opacity-100" : "opacity-40"}`} /> {c.label}
              </li>
            ))}
          </ul>
        )}

        <Field label="Confirm password" icon={<Lock className="h-4 w-4" />} type="password" placeholder="••••••••" error={errors.confirm?.message} {...register("confirm")} />

        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create account"} <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
