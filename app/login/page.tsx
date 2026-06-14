"use client";

/**
 * ============================================================================
 * PÁGINA DE LOGIN
 * ============================================================================
 *
 * Porta de entrada do sistema. Validação local (sem backend) para fins
 * de teste, usando a conta:
 *
 *   Usuário: Luciano
 *   Senha:   123
 *
 * A senha pode ser alterada em "Meu Perfil" (válida apenas na sessão atual).
 *
 * TODO: Integrar com backend real de autenticação.
 */

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Pequeno delay para simular requisição
    await new Promise((r) => setTimeout(r, 400));

    const success = login(username.trim(), password);

    if (success) {
      router.replace("/dashboard");
    } else {
      setError("Usuário ou senha inválidos.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Halo de fundo sutil em amarelo (cor da marca) */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px 450px at 50% -10%, oklch(0.85 0.18 95 / 0.18), transparent 60%)",
        }}
        aria-hidden
      />

      <Card className="w-full max-w-sm rise">
        <CardHeader className="items-center text-center">
          <img
            src="/wenvefit-logo.jpeg"
            alt="wenvefit"
            className="mb-2 h-16 w-auto rounded-md"
          />
          <p className="text-sm text-muted-foreground">
            Acesse sua conta para continuar
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username">Usuário</Label>
              <Input
                id="login-username"
                autoComplete="username"
                placeholder="Luciano"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Senha</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm font-medium text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <LogIn className="mr-2 h-4 w-4" />
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Conta de testes: <span className="font-medium">Luciano</span> / senha{" "}
            <span className="font-medium">123</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
