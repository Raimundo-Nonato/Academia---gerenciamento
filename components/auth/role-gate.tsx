"use client";

/**
 * ============================================================================
 * COMPONENTE ROLE GATE
 * ============================================================================
 *
 * Controle de acesso por área (recurso). Remove elementos do DOM se o
 * usuário não tem permissão — não esconde só com CSS, evitando vazar dado
 * sensível no HTML.
 *
 * IMPORTANTE: isto é conforto de UX (esconder botão na hora, sem esperar o
 * servidor). A permissão de verdade é sempre conferida de novo no servidor
 * (lib/auth/guard.ts) — mesmo que alguém force essa parte do cliente.
 *
 * USO:
 * ```tsx
 * <RoleGate recurso="financeiro">
 *   <MenuFinanceiro />
 * </RoleGate>
 * ```
 */

import type { ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";

interface RoleGateProps {
  /** Conteúdo a ser renderizado se autorizado */
  children: ReactNode;
  /** Área exigida (ver lib/route-permissions.ts) */
  recurso: string;
  /** Conteúdo alternativo se não autorizado (opcional) */
  fallback?: ReactNode;
}

/**
 * Componente que condiciona renderização com base no que o ADMIN liberou
 * para o papel do usuário logado.
 */
export function RoleGate({ children, recurso, fallback = null }: RoleGateProps) {
  const { user, permissions } = useAuth();

  if (!user) {
    return fallback;
  }

  // "configuracoes" nunca aparece no mapa de permissões (não é configurável)
  // — precisa da mesma trava explícita usada no AccessGuard: só ADMIN passa.
  if (recurso === "configuracoes") {
    return user.role === "ADMIN" ? children : fallback;
  }

  // ADMIN sempre tem acesso total, não passa pela tabela de permissões.
  if (user.role === "ADMIN") {
    return children;
  }

  if (permissions[recurso] === false) {
    return fallback;
  }

  return children;
}

/**
 * Hook utilitário para verificar permissões programaticamente.
 *
 * USO:
 * ```tsx
 * const podeAcessarFinanceiro = useHasPermission("financeiro");
 * ```
 */
export function useHasPermission(recurso: string): boolean {
  const { user, permissions } = useAuth();

  if (!user) return false;
  if (recurso === "configuracoes") return user.role === "ADMIN";
  if (user.role === "ADMIN") return true;

  return permissions[recurso] !== false;
}
