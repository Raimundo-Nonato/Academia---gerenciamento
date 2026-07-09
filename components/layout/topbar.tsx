"use client";

/**
 * ============================================================================
 * COMPONENTE TOPBAR
 * ============================================================================
 *
 * Barra superior contendo:
 * - Botão de menu (mobile, abre o drawer da sidebar)
 * - Breadcrumb dinâmico (md+)
 * - Indicador online/offline
 * - Toggle de tema claro/escuro
 * - Notificações com badge
 * - Avatar com dropdown (perfil, logout)
 *
 * TIP: O breadcrumb é gerado automaticamente baseado na rota atual.
 * Para customizar labels, ajuste o mapeamento em ROUTE_LABELS.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ChevronDown,
  User,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  Menu,
  Sun,
  Moon,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { UserRole } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { useAuth } from "@/contexts/auth-context";

/**
 * Mapeamento de rotas para labels legíveis.
 *
 * TIP: Adicione novas rotas aqui para customizar o breadcrumb.
 * Rotas não mapeadas usarão o slug capitalizado.
 */
const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  alunos: "Alunos",
  financeiro: "Financeiro",
  perfil: "Meu Perfil",
  configuracoes: "Configurações",
  novo: "Novo",
  editar: "Editar",
  detalhes: "Detalhes",
};

/**
 * Toggle de tema claro/escuro.
 * Renderiza um placeholder estável até montar para evitar
 * divergência de hidratação (o tema só é conhecido no cliente).
 */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={
        mounted
          ? isDark
            ? "Mudar para tema claro"
            : "Mudar para tema escuro"
          : "Alternar tema"
      }
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )
      ) : (
        <Moon className="h-5 w-5 opacity-0" />
      )}
    </Button>
  );
}

interface TopbarProps {
  /** Callback do botão de menu (mobile) */
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(true);

  /**
   * Monitora status de conexão do navegador.
   * Atualiza indicador online/offline em tempo real.
   */
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  /**
   * Gera itens do breadcrumb a partir da rota atual.
   * Ex: /alunos/123/editar -> ["Dashboard", "Alunos", "123", "Editar"]
   */
  const generateBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    const items = [{ label: "Dashboard", href: "/dashboard" }];

    let currentPath = "";

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      if (segment === "dashboard" && index === 0) return;

      const label =
        ROUTE_LABELS[segment.toLowerCase()] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);

      items.push({ label, href: currentPath });
    });

    return items;
  };

  const breadcrumbs = generateBreadcrumbs();
  const userInitials = user ? getInitials(user.name) : "??";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {/* Botão de menu - apenas mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* ============ BREADCRUMB (md+) ============ */}
        <Breadcrumb className="hidden md:block">
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <span key={item.href} className="inline-flex items-center gap-1.5">
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-medium">
                        {item.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link
                          href={item.href}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {item.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </span>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Título curto no mobile (breadcrumb escondido) */}
        <span className="truncate font-display text-sm font-semibold md:hidden">
          {breadcrumbs[breadcrumbs.length - 1]?.label}
        </span>
      </div>

      {/* ============ AÇÕES DO HEADER ============ */}
      <div className="flex shrink-0 items-center gap-1.5 md:gap-3">
        {/* Indicador de status online/offline */}
        <div
          className={cn(
            "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:flex",
            isOnline
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          )}
        >
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Toggle de tema */}
        <ThemeToggle />

        {/* Painel de notificações */}
        <NotificationsMenu />

        {/* Dropdown do usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 hover:bg-accent"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline-block">
                {user?.name}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/perfil" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </Link>
            </DropdownMenuItem>

            {user?.role === UserRole.ADMIN && (
              <DropdownMenuItem asChild>
                <Link href="/configuracoes" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
