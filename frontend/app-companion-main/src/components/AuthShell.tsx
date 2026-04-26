import { Logo } from "@/components/Logo";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <header className="px-6 py-5">
        <Logo />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-primary opacity-30 blur-2xl rounded-2xl" />
            <div className="relative glass rounded-2xl p-8 sm:p-10 shadow-elegant">
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
              <div className="mt-8">{children}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
