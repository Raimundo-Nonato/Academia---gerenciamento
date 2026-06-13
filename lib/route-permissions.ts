/**
 * ============================================================================
 * PERMISSÕES POR ROTA
 * ============================================================================
 *
 * Fonte única de verdade para o nível mínimo exigido por cada rota.
 * Usado pelo AccessGuard para bloquear acesso direto via URL — o RoleGate
 * da sidebar apenas esconde os links, mas não protege a rota em si.
 *
 * Mantenha sincronizado com os `minLevel` da sidebar (NAV_SECTIONS).
 */

/**
 * Nível mínimo por prefixo de rota.
 * Rotas não listadas são liberadas para qualquer usuário autenticado.
 */
export const ROUTE_MIN_LEVEL: Record<string, number> = {
  "/financeiro": 60, // Gerente+
};

/**
 * Retorna o nível mínimo exigido para acessar um caminho.
 * Faz match por prefixo (ex: /financeiro/123 -> exige nível de /financeiro).
 *
 * @param pathname - rota atual (ex: usePathname())
 * @returns nível mínimo necessário (0 se a rota for pública)
 */
export function getRouteMinLevel(pathname: string): number {
  const match = Object.keys(ROUTE_MIN_LEVEL).find(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`)
  );
  return match ? ROUTE_MIN_LEVEL[match] : 0;
}
