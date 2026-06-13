"use client";

/**
 * ============================================================================
 * PÁGINA RAIZ - REDIRECIONAMENTO
 * ============================================================================
 *
 * Redireciona para /dashboard se autenticado, ou /login caso contrário.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Spinner } from "@/components/ui/spinner";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    router.replace(isAuthenticated ? "/dashboard" : "/login");
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Spinner className="h-6 w-6" />
    </div>
  );
}
