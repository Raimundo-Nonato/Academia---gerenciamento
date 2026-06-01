"use client";

/**
 * ============================================================================
 * COMPONENTE SIDEBAR
 * ============================================================================
 * 
 * Barra lateral de navegação fixa com suporte a:
 * - Colapso/expansão
 * - Controle de permissões via RoleGate
 * - Badge de role do usuário
 * - Logout
 * 
 * ESTRUTURA:
 * ┌─────────────────────┐
 * │  LOGO               │
 * ├─────────────────────┤
 * │  Menu Items         │
 * │  (com RoleGate)     │
 * │                     │
 * ├─────────────────────┤
 * │  Badge Role         │
 * │  Logout Button      │
 * └─────────────────────┘
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCog,
  DollarSign,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RoleGate } from "@/components/auth/role-gate";
import { useAuth } from "@/contexts/auth-context";
import { ROLE_BADGE_COLORS } from "@/types/auth";
import type { NavItem } from "@/types/navigation";

/**
 * Configuração dos itens de navegação.
 * 
 * TIP: Para adicionar novos itens:
 * 1. Adicione o item neste array
 * 2. Defina minLevel se precisar de permissão específica
 * 3. O RoleGate cuida do resto automaticamente
 * 
 * NÍVEIS DE PERMISSÃO:
 * - Sem minLevel: visível para todos
 * - minLevel: 60 = gerente ou superior
 * - minLevel: 80 = apenas admin
 */
const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    // Sem minLevel = visível para todos
  },
  {
    label: "Alunos",
    href: "/alunos",
    icon: Users,
  },
  {
    label: "Funcionários",
    href: "/funcionarios",
    icon: UserCog,
    minLevel: 60, // Apenas gerente ou superior
  },
  {
    label: "Financeiro",
    href: "/financeiro",
    icon: DollarSign,
    minLevel: 60, // Apenas gerente ou superior
  },
  {
    label: "Agenda",
    href: "/agenda",
    icon: Calendar,
  },
  {
    label: "Relatórios",
    href: "/relatorios",
    icon: BarChart3,
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    minLevel: 80, // Apenas admin
  },
];

interface SidebarProps {
  /** Callback quando sidebar colapsa/expande */
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ onCollapsedChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  /**
   * Alterna estado de colapso da sidebar.
   * Notifica o componente pai se callback fornecido.
   */
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapsedChange?.(newState);
  };

  // Cores do badge baseadas no role do usuário
  const badgeColors = user ? ROLE_BADGE_COLORS[user.role] : null;

  return (
    <aside
      className={cn(
        // Base styles
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        // Largura baseada no estado de colapso
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* ============ HEADER COM LOGO ============ */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-sidebar-foreground">
              {/* TODO: Substituir pelo nome real da academia */}
              FitPro
            </span>
          </Link>
        )}
        
        {isCollapsed && (
          <Link href="/dashboard" className="mx-auto">
            <Dumbbell className="h-6 w-6 text-primary" />
          </Link>
        )}
      </div>

      {/* ============ BOTÃO DE COLAPSO ============ */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleCollapse}
        className="absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar shadow-md hover:bg-sidebar-accent"
        aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* ============ MENU DE NAVEGAÇÃO ============ */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          /**
           * Renderiza o item de menu.
           * Se minLevel definido, envolve com RoleGate.
           */
          const menuItem = (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    // Base styles
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    // Estado normal
                    "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    // Estado ativo
                    isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                    // Centraliza quando colapsado
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-inherit")} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </TooltipTrigger>
              {/* Tooltip só aparece quando colapsado */}
              {isCollapsed && (
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
      </nav>

      {/* ============ FOOTER COM BADGE E LOGOUT ============ */}
      <div className="border-t border-sidebar-border p-3">
        {/* Badge do role do usuário */}
        {user && badgeColors && (
          <div
            className={cn(
              "mb-3 rounded-md px-3 py-2 text-center text-xs font-bold tracking-wider",
              badgeColors.bg,
              badgeColors.text,
              isCollapsed && "px-1"
            )}
          >
            {isCollapsed ? user.role.charAt(0) : user.role}
          </div>
        )}

        {/* Botão de logout */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={logout}
              className={cn(
                "w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive",
                isCollapsed && "justify-center px-2"
              )}
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span>Sair</span>}
            </Button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">Sair</TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
}
