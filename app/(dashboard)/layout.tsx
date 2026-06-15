"use client";

/**
 * ============================================================================
 * LAYOUT DO DASHBOARD
 * ============================================================================
 *
 * Layout compartilhado por todas as páginas do dashboard.
 *
 * AuthProvider e TooltipProvider são providos globalmente em app/layout.tsx.
 * Este layout cuida apenas da composição visual (DashboardLayout) e da
 * proteção de sessão: usuários não autenticados são redirecionados para
 * a tela de login.
 */

import { type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { useAuth } from "@/contexts/auth-context";
import { AlunosProvider } from "@/contexts/alunos-context";
import { Spinner } from "@/components/ui/spinner";

interface DashboardLayoutWrapperProps {
  children: ReactNode;
}

export default function DashboardLayoutWrapper({
  children,
}: DashboardLayoutWrapperProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (!isAuthenticated) {
    // Evita flash de conteúdo protegido enquanto redireciona
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <AlunosProvider>
      <DashboardLayout
        // TODO: Conectar com verificação real de sessão
        showSessionBanner={false}
        sessionMinutesRemaining={5}
        onRenewSession={() => {
          // TODO: Chamar API para renovar token
          console.log("Renovar sessão");
        }}
      >
        {children}
      </DashboardLayout>
    </AlunosProvider>
  );
}
