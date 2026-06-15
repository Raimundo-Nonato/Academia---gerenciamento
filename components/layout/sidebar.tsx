"use client";

/**
 * ============================================================================
 * COMPONENTE SIDEBAR
 * ============================================================================
 *
 * Barra lateral de navegação com:
 * - Colapso/expansão (apenas desktop)
 * - Seções de menu agrupadas (Operação / Gestão / Sistema)
 * - Indicador "volt" no item ativo
 * - Controle de permissões via RoleGate
 * - Card do usuário com avatar e badge de role
 * - Logout
 *
 * RESPONSIVIDADE:
 * - Desktop (lg+): <Sidebar /> fixa à esquerda
 * - Mobile: o conteúdo (<SidebarContent />) é reutilizado dentro de um
 *   Sheet (drawer) controlado pelo DashboardLayout
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RoleGate } from "@/components/auth/role-gate";
import { useAuth } from "@/contexts/auth-context";
import { ROLE_BADGE_COLORS } from "@/types/auth";
import type { NavItem } from "@/types/navigation";

/**
 * Seções de navegação.
 *
 * TIP: Para adicionar novos itens:
 * 1. Adicione o item na seção adequada
 * 2. Defina minLevel se precisar de permissão específica
 * 3. O RoleGate cuida do resto automaticamente
 *
 * NÍVEIS DE PERMISSÃO:
 * - Sem minLevel: visível para todos
 * - minLevel: 60 = gerente ou superior
 * - minLevel: 80 = apenas admin
 */
const NAV_SECTIONS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Operação",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Alunos", href: "/alunos", icon: Users },
      { label: "Financeiro", href: "/financeiro", icon: DollarSign, minLevel: 60 },
    ],
  },
];

interface SidebarContentProps {
  /** Modo compacto (apenas ícones) — usado no desktop colapsado */
  collapsed?: boolean;
  /** Callback ao navegar (mobile: fecha o drawer) */
  onNavigate?: () => void;
}

/**
 * Conteúdo da sidebar (logo, navegação e rodapé com usuário).
 * Reutilizado pela versão desktop fixa e pelo drawer mobile.
 */
export function SidebarContent({ collapsed = false, onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const badgeColors = user ? ROLE_BADGE_COLORS[user.role] : null;

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* ============ HEADER COM LOGO ============ */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-sidebar-border px-4",
          collapsed && "justify-center px-2"
        )}
      >
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5"
          aria-label="wenvefit - ir para o dashboard"
        >
          {/* Logo da marca — colapsa para ícone halter quando collapsed */}
          {collapsed ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-volt text-volt-foreground">
              <Dumbbell className="h-4 w-4" />
            </span>
          ) : (
            <Image
              src="/wenvefit-logo-marca.png"
              alt="Wenvefit"
              width={140}
              height={56}
              className="h-auto w-32"
              priority
            />
          )}
        </Link>
      </div>

      {/* ============ MENU DE NAVEGAÇÃO ============ */}
      <nav className="flex-1 overflow-y-auto p-3" aria-label="Menu principal">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-2">
            {/* Label da seção (ou divisor quando colapsado) */}
            {collapsed ? (
              <div className="mx-2 my-3 border-t border-sidebar-border" aria-hidden />
            ) : (
              <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/40">
                {section.label}
              </p>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                const menuItem = (
                  <Tooltip key={item.href} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                          isActive &&
                            "bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent",
                          collapsed && "justify-center px-2"
                        )}
                      >
                        {/* Indicador volt do item ativo */}
                        {isActive && (
                          <span
                            className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-volt"
                            aria-hidden
                          />
                        )}
                        <Icon
                          className={cn("h-5 w-5 shrink-0", isActive && "text-volt")}
                        />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );

                // Se item requer permissão, envolve com RoleGate
                if (item.minLevel !== undefined) {
                  return (
                    <RoleGate key={item.href} minLevel={item.minLevel}>
                      {menuItem}
                    </RoleGate>
                  );
                }

                return menuItem;
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ============ FOOTER: USUÁRIO + LOGOUT ============ */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        {user && (
          <div
            className={cn(
              "mb-2 flex items-center gap-3 rounded-lg bg-sidebar-accent/60 p-2.5",
              collapsed && "justify-center p-1.5"
            )}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-volt/15 text-xs font-semibold text-volt">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">
                  {user.name}
                </p>
                {badgeColors && (
                  <span
                    className={cn(
                      "mt-0.5 inline-block rounded px-1.5 py-px text-[10px] font-bold tracking-wider",
                      badgeColors.bg,
                      badgeColors.text
                    )}
                  >
                    {user.role}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={logout}
              className={cn(
                "w-full justify-start gap-3 text-sidebar-foreground/65 hover:bg-destructive/10 hover:text-destructive",
                collapsed && "justify-center px-2"
              )}
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && <span>Sair</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Sair</TooltipContent>}
        </Tooltip>
      </div>
    </div>
  );
}

interface SidebarProps {
  /** Callback quando sidebar colapsa/expande */
  onCollapsedChange?: (collapsed: boolean) => void;
}

/**
 * Sidebar fixa de desktop (lg+). No mobile, o DashboardLayout
 * renderiza o SidebarContent dentro de um Sheet.
 */
export function Sidebar({ onCollapsedChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapsedChange?.(newState);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 lg:flex",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Botão de colapso (borda direita) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleCollapse}
        className="absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md hover:bg-sidebar-accent hover:text-sidebar-foreground"
        aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      <SidebarContent collapsed={isCollapsed} />
    </aside>
  );
}
