"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, Hotel, Loader2 } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Sign in failed");
        return;
      }

      // Redirect to dashboard on success
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-3 sm:p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,color-mix(in_oklab,var(--accent)_45%,transparent)_0%,transparent_38%),radial-gradient(circle_at_82%_88%,color-mix(in_oklab,var(--primary)_30%,transparent)_0%,transparent_40%)]" />
      <div className="w-full max-w-md">
        <div className="motion-reveal mb-6 text-center sm:mb-8">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-border/70 bg-[color:var(--surface-2)] text-primary shadow-[var(--shadow-soft)]">
            <Hotel className="h-6 w-6" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-strong sm:text-3xl">e-Hotels</h1>
          <p className="mt-1 text-sm text-muted-foreground">Management and Booking System</p>
        </div>

        <Card className="surface-strong motion-reveal border-border/80 bg-[color:var(--surface-1)]/95">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl text-strong">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the platform
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-1">
            <form onSubmit={handleSignIn} className="space-y-4">
              {error && (
                <div className="state-panel state-error flex items-start gap-3 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">Sign In Failed</p>
                    <p className="text-xs text-red-600/90 dark:text-red-200">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-strong">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="border-border/80 bg-[color:var(--surface-2)]/90 text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-strong">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="border-border/80 bg-[color:var(--surface-2)]/90 text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full shadow-[var(--shadow-soft)] transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </span>
                ) : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 rounded-lg border border-border/70 bg-[color:var(--surface-2)]/80 p-3">
              <p className="mb-2 text-xs font-semibold text-strong">Demo Credentials:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>
                  <strong className="text-strong">Customer:</strong> customer@example.com / password123
                </div>
                <div>
                  <strong className="text-strong">Employee:</strong> employee@example.com / password123
                </div>
                <div>
                  <strong className="text-strong">Admin:</strong> admin@example.com / password123
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          e-Hotels © 2026 | CSI 2132 Final Project
        </p>
      </div>
    </div>
  );
}
