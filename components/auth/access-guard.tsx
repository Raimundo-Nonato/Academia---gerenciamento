"use client";

/**
 * ============================================================================
 * COMPONENTE ACCESS GUARD
 * ============================================================================
 *
 * Protege ROTAS inteiras com base no que o ADMIN liberou para o papel do
 * usuário logado.
 *
 * Diferença para o RoleGate:
 * - RoleGate esconde TRECHOS de UI (seções, menus) dentro de uma página.
 * - AccessGuard bloqueia a PÁGINA inteira quando acessada por URL direta.
 *
 * Sem ele, alguém poderia abrir /financeiro pela URL e ver tudo, já que a
 * sidebar só esconde o link — não impede a navegação.
 *
 * O recurso de cada rota vem de lib/route-permissions.ts. Assim como o
 * RoleGate, isto é só conforto de UX: o servidor confere de novo (e de
 * verdade) em cada chamada de API, via lib/auth/guard.ts.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { getRouteResource } from "@/lib/route-permissions";

/**
 * Tela exibida quando o usuário não tem permissão para a rota atual.
 */
function AccessDenied() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-5 rounded-full bg-destructive/10 p-5">
        <ShieldAlert className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Acesso restrito
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Você não tem permissão para acessar esta área. Fale com um
        administrador caso precise de acesso.
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
 * consultando o que o ADMIN liberou para o papel do usuário atual.
 */
export function AccessGuard({ children }: AccessGuardProps) {
  const pathname = usePathname();
  const { user, permissions } = useAuth();

  const recurso = getRouteResource(pathname);

  // Rota pública (não listada): libera direto para qualquer logado.
  if (recurso === null) {
    return <>{children}</>;
  }

  // "configuracoes" é sempre exclusivo do ADMIN — trava também aqui no
  // cliente, além do servidor (lib/auth/guard.ts).
  if (recurso === "configuracoes") {
    return user?.role === "ADMIN" ? <>{children}</> : <AccessDenied />;
  }

  if (user?.role === "ADMIN") {
    return <>{children}</>;
  }

  if (permissions[recurso] === false) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
