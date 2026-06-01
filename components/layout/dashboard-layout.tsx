"use client";

/**
 * ============================================================================
 * COMPONENTE DASHBOARD LAYOUT
 * ============================================================================
 * 
 * Layout principal do sistema de gestão.
 * Combina Sidebar, Topbar e área de conteúdo.
 * 
 * ESTRUTURA:
 * ┌────────────────────────────────────────────────────┐
 * │ [SESSION EXPIRING BANNER - slot opcional]         │
 * ├──────────┬─────────────────────────────────────────┤
 * │          │  TOPBAR (breadcrumb, notif, avatar)    │
 * │          ├─────────────────────────────────────────┤
 * │ SIDEBAR  │                                         │
 * │          │  CONTEÚDO                               │
 * │          │  (children)                             │
 * │          │                                         │
 * └──────────┴─────────────────────────────────────────┘
 * 
 * TIP: A sidebar colapsa de 240px para 64px, e o conteúdo
 * ajusta seu margin-left automaticamente.
 */

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SessionExpiringBanner } from "@/components/layout/session-expiring-banner";

interface DashboardLayoutProps {
  children: ReactNode;
  /** Contagem de notificações para o topbar */
  notificationCount?: number;
  /** Callback ao clicar em notificações */
  onNotificationClick?: () => void;
  /** Se deve mostrar banner de sessão expirando */
  showSessionBanner?: boolean;
  /** Minutos restantes da sessão */
  sessionMinutesRemaining?: number;
  /** Callback para renovar sessão */
  onRenewSession?: () => void;
}

export function DashboardLayout({
  children,
  notificationCount = 0,
  onNotificationClick,
  showSessionBanner = false,
  sessionMinutesRemaining = 5,
  onRenewSession,
}: DashboardLayoutProps) {
  // Estado de colapso da sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // Estado local do banner (pode ser dispensado pelo usuário)
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* ============ BANNER DE SESSÃO EXPIRANDO ============ */}
      <SessionExpiringBanner
        isVisible={showSessionBanner && !isBannerDismissed}
        minutesRemaining={sessionMinutesRemaining}
        onDismiss={() => setIsBannerDismissed(true)}
        onRenewSession={onRenewSession}
      />

      {/* ============ SIDEBAR ============ */}
      <Sidebar onCollapsedChange={setIsSidebarCollapsed} />

      {/* ============ CONTEÚDO PRINCIPAL ============ */}
      <div
        className={cn(
          // Transição suave ao colapsar sidebar
          "transition-all duration-300",
          // Ajusta margin baseado no estado da sidebar
          isSidebarCollapsed ? "ml-16" : "ml-60"
        )}
      >
        {/* Topbar */}
        <Topbar
          notificationCount={notificationCount}
          onNotificationClick={onNotificationClick}
        />

        {/* Área de conteúdo com padding generoso */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
