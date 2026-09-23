import { LumoLogo } from "@/components/layout/lumo-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-canvas relative flex min-h-svh flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle
          size="icon"
          className="rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm"
        />
      </div>
      <div className="animate-fade-up mb-10 space-y-3 text-center">
        <div className="flex justify-center">
          <LumoLogo href="/login" size="lg" />
        </div>
        <p className="text-sm text-muted-foreground">
          Colaboração leve para microequipes
        </p>
      </div>
      <div className="animate-fade-up stagger-2 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
