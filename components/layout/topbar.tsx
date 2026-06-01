"use client";

/**
 * ============================================================================
 * COMPONENTE TOPBAR
 * ============================================================================
 * 
 * Barra superior contendo:
 * - Breadcrumb dinâmico
 * - Notificações com badge
 * - Avatar com dropdown
 * - Status do sistema (online/offline)
 * 
 * TIP: O breadcrumb é gerado automaticamente baseado na rota atual.
 * Para customizar labels, ajuste o mapeamento em ROUTE_LABELS.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, User, LogOut, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
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
  funcionarios: "Funcionários",
  financeiro: "Financeiro",
  agenda: "Agenda",
  relatorios: "Relatórios",
  configuracoes: "Configurações",
  novo: "Novo",
  editar: "Editar",
  detalhes: "Detalhes",
};

interface TopbarProps {
  /** Contagem de notificações não lidas */
  notificationCount?: number;
  /** Callback ao clicar em notificações */
  onNotificationClick?: () => void;
}

export function Topbar({ 
  notificationCount = 0, 
  onNotificationClick 
}: TopbarProps) {
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

    // Verifica estado inicial
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
   * 
   * Ex: /alunos/123/editar -> ["Dashboard", "Alunos", "123", "Editar"]
   */
  const generateBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    
    // Sempre começa com Dashboard
    const items = [{ label: "Dashboard", href: "/dashboard" }];
    
    let currentPath = "";
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Pula "dashboard" se for o primeiro segmento
      if (segment === "dashboard" && index === 0) return;
      
      // Usa label mapeada ou capitaliza o segmento
      const label = ROUTE_LABELS[segment.toLowerCase()] || 
        segment.charAt(0).toUpperCase() + segment.slice(1);
      
      items.push({
        label,
        href: currentPath,
      });
    });

    return items;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Obtém iniciais do usuário para o avatar fallback
  const userInitials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-6">
      {/* ============ BREADCRUMB ============ */}
      <Breadcrumb>
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

      {/* ============ AÇÕES DO HEADER ============ */}
      <div className="flex items-center gap-4">
        {/* Indicador de status online/offline */}
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            isOnline 
              ? "bg-emerald-500/10 text-emerald-600" 
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

        {/* Botão de notificações */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={onNotificationClick}
          aria-label={`${notificationCount} notificações não lidas`}
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1.5 text-xs"
            >
              {notificationCount > 99 ? "99+" : notificationCount}
            </Badge>
          )}
        </Button>

        {/* Dropdown do usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 hover:bg-accent"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
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
