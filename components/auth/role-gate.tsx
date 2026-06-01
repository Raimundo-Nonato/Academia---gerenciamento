"use client";

/**
 * ============================================================================
 * COMPONENTE ROLE GATE
 * ============================================================================
 * 
 * Controle de acesso baseado em roles.
 * Remove elementos do DOM se o usuário não tem permissão suficiente.
 * 
 * IMPORTANTE: Este componente NÃO esconde com CSS - ele remove do DOM.
 * Isso evita vazamento de informações sensíveis no HTML.
 * 
 * USO:
 * ```tsx
 * <RoleGate minLevel={60}>
 *   <MenuFinanceiro />
 * </RoleGate>
 * ```
 * 
 * TIP: Use os níveis definidos em ROLE_LEVELS (auth.ts):
 * - 30: RECEPCIONISTA
 * - 60: GERENTE
 * - 80+: ADMIN
 */

import type { ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ROLE_LEVELS } from "@/types/auth";

interface RoleGateProps {
  /** Conteúdo a ser renderizado se autorizado */
  children: ReactNode;
  /** Nível mínimo de permissão necessário */
  minLevel: number;
  /** Conteúdo alternativo se não autorizado (opcional) */
  fallback?: ReactNode;
}

/**
 * Componente que condiciona renderização baseada no nível do usuário.
 * 
 * @param minLevel - Nível numérico mínimo necessário
 * @param children - Conteúdo renderizado se autorizado
 * @param fallback - Conteúdo alternativo (opcional, padrão: null)
 * 
 * COMPORTAMENTO:
 * - Se usuário não autenticado: retorna fallback
 * - Se nível do usuário >= minLevel: renderiza children
 * - Caso contrário: retorna fallback
 */
export function RoleGate({ 
  children, 
  minLevel, 
  fallback = null 
}: RoleGateProps) {
  const { user } = useAuth();

  // Sem usuário = sem permissão
  if (!user) {
    return fallback;
  }

  // Obtém o nível numérico do role do usuário
  const userLevel = ROLE_LEVELS[user.role] ?? 0;

  // Verifica se tem permissão suficiente
  if (userLevel >= minLevel) {
    return children;
  }

  // Sem permissão - retorna fallback (null por padrão)
  return fallback;
}

/**
 * Hook utilitário para verificar permissões programaticamente.
 * 
 * USO:
 * ```tsx
 * const canAccessFinance = useHasPermission(60);
 * ```
 */
export function useHasPermission(minLevel: number): boolean {
  const { user } = useAuth();
  
  if (!user) return false;
  
  const userLevel = ROLE_LEVELS[user.role] ?? 0;
  return userLevel >= minLevel;
}
