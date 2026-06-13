"use client";

/**
 * ============================================================================
 * LAYOUT DO DASHBOARD
 * ============================================================================
 * 
 * Layout compartilhado por todas as páginas do dashboard.
 * Inclui AuthProvider e TooltipProvider necessários.
 * 
 * ESTRUTURA DE PROVIDERS:
 * AuthProvider → TooltipProvider → DashboardLayout → children
 * 
 * TIP: Novos providers globais devem ser adicionados aqui,
 * envolvendo o DashboardLayout.
 */

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { DashboardLayout } from "@/components/layout";

interface DashboardLayoutWrapperProps {
  children: ReactNode;
}

export default function DashboardLayoutWrapper({
  children,
}: DashboardLayoutWrapperProps) {
  return (
    <AuthProvider>
      <TooltipProvider>
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
      </TooltipProvider>
    </AuthProvider>
  );
}
