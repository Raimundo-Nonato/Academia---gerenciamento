"use client";

/**
 * ============================================================================
 * COMPONENTE DASHBOARD LAYOUT
 * ============================================================================
 *
 * Layout principal do sistema de gestão.
 * Combina Sidebar, Topbar e área de conteúdo.
 *
 * ESTRUTURA (desktop):
 * ┌────────────────────────────────────────────────────┐
 * │ [SESSION EXPIRING BANNER - slot opcional]          │
 * ├──────────┬─────────────────────────────────────────┤
 * │          │  TOPBAR (breadcrumb, tema, notif)       │
 * │          ├─────────────────────────────────────────┤
 * │ SIDEBAR  │  CONTEÚDO (children)                    │
 * └──────────┴─────────────────────────────────────────┘
 *
 * RESPONSIVIDADE:
 * - lg+: sidebar fixa (colapsável 240px ↔ 64px), conteúdo com margem
 * - <lg: sidebar vira drawer (Sheet) aberto pelo botão de menu da topbar
 */

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sidebar, SidebarContent } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SessionExpiringBanner } from "@/components/layout/session-expiring-banner";
import { AccessGuard } from "@/components/auth/access-guard";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: ReactNode;
  /** Se deve mostrar banner de sessão expirando */
  showSessionBanner?: boolean;
  /** Minutos restantes da sessão */
  sessionMinutesRemaining?: number;
  /** Callback para renovar sessão */
  onRenewSession?: () => void;
}

export function DashboardLayout({
  children,
  showSessionBanner = false,
  sessionMinutesRemaining = 5,
  onRenewSession,
}: DashboardLayoutProps) {
  // Estado de colapso da sidebar (desktop)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // Drawer da sidebar (mobile)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  // Estado local do banner (pode ser dispensado pelo usuário)
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Skip link: primeiro elemento focável, melhora navegação por teclado */}
      <a
        href="#conteudo-principal"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>

      {/* ============ BANNER DE SESSÃO EXPIRANDO ============ */}
      <SessionExpiringBanner
        isVisible={showSessionBanner && !isBannerDismissed}
        minutesRemaining={sessionMinutesRemaining}
        onDismiss={() => setIsBannerDismissed(true)}
        onRenewSession={onRenewSession}
      />

      {/* ============ SIDEBAR DESKTOP (lg+) ============ */}
      <Sidebar onCollapsedChange={setIsSidebarCollapsed} />

      {/* ============ SIDEBAR MOBILE (drawer) ============ */}
      <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-72 border-sidebar-border bg-sidebar p-0 [&>button]:text-sidebar-foreground"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Menu de navegação</SheetTitle>
          </SheetHeader>
          <SidebarContent onNavigate={() => setIsMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* ============ CONTEÚDO PRINCIPAL ============ */}
      <div
        className={cn(
          "transition-all duration-300",
          // Sem margem no mobile; margem conforme sidebar no desktop
          isSidebarCollapsed ? "lg:ml-16" : "lg:ml-60"
        )}
      >
        <Topbar onMenuClick={() => setIsMobileNavOpen(true)} />

        <main
          id="conteudo-principal"
          className="mx-auto max-w-[1440px] p-4 md:p-6 lg:p-8"
        >
          {/* Bloqueia páginas inteiras conforme o nível exigido pela rota */}
          <AccessGuard>{children}</AccessGuard>
        </main>
      </div>
    </div>
  );
}
