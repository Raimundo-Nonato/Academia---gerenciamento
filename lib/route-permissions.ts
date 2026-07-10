/**
 * ============================================================================
 * PERMISSÕES POR ROTA
 * ============================================================================
 *
 * Mapeia cada rota para o "recurso" (área) que ela representa. O que cada
 * papel pode ou não acessar é decidido em tempo real, pelo ADMIN, na tela de
 * Configurações — não é mais um número fixo aqui no código.
 *
 * "configuracoes" é um caso especial: sempre exclusivo do ADMIN, tanto aqui
 * (cliente, via AccessGuard) quanto no servidor (lib/auth/guard.ts). Nunca
 * aparece como algo configurável.
 *
 * Rotas não listadas são liberadas para qualquer usuário autenticado.
 */
export const ROUTE_RESOURCE: Record<string, string> = {
  "/financeiro": "financeiro",
  "/configuracoes": "configuracoes",
};

/**
 * Retorna o recurso associado a um caminho, ou null se a rota for pública
 * (liberada para qualquer usuário autenticado). Faz match por prefixo
 * (ex: /financeiro/123 -> recurso "financeiro").
 *
 * @param pathname - rota atual (ex: usePathname())
 */
export function getRouteResource(pathname: string): string | null {
  const match = Object.keys(ROUTE_RESOURCE).find(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`)
  );
  return match ? ROUTE_RESOURCE[match] : null;
}
