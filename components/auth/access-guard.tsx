"use client";

/**
 * ============================================================================
 * COMPONENTE ACCESS GUARD
 * ============================================================================
 *
 * Protege ROTAS inteiras com base no nível do usuário.
 *
 * Diferença para o RoleGate:
 * - RoleGate esconde TRECHOS de UI (seções, menus) dentro de uma página.
 * - AccessGuard bloqueia a PÁGINA inteira quando acessada por URL direta.
 *
 * Sem ele, um recepcionista poderia abrir /financeiro pela URL e ver tudo,
 * já que a sidebar só esconde o link — não impede a navegação.
 *
 * O nível exigido por rota vem de lib/route-permissions.ts.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { ROLE_LEVELS } from "@/types/auth";
import { getRouteMinLevel } from "@/lib/route-permissions";

/**
 * Tela exibida quando o usuário não tem permissão para a rota atual.
 */
function AccessDenied({ minLevel }: { minLevel: number }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-5 rounded-full bg-destructive/10 p-5">
        <ShieldAlert className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Acesso restrito
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Você não tem permissão para acessar esta área. É necessário um nível de
        acesso igual ou superior a{" "}
        <span className="font-semibold text-foreground">{minLevel}</span>. Fale
        com um administrador caso precise de acesso.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Link>
      </Button>
    </div>
  );
}

interface AccessGuardProps {
  children: ReactNode;
}

/**
 * Envolve o conteúdo das páginas e decide se renderiza ou bloqueia,
 * comparando o nível do usuário com o exigido pela rota atual.
 */
export function AccessGuard({ children }: AccessGuardProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const minLevel = getRouteMinLevel(pathname);

  // Rota pública: libera direto.
  if (minLevel === 0) {
    return <>{children}</>;
  }

  const userLevel = user ? ROLE_LEVELS[user.role] ?? 0 : 0;

  if (userLevel >= minLevel) {
    return <>{children}</>;
  }

  return <AccessDenied minLevel={minLevel} />;
}
