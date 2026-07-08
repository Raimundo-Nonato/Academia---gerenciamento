/**
 * ============================================================================
 * TIPOS DE NAVEGAÇÃO
 * ============================================================================
 * 
 * Define a estrutura dos itens de menu e navegação do sistema.
 * Suporta permissões baseadas em roles e ícones Lucide.
 */

import type { LucideIcon } from "lucide-react";

/**
 * Item de navegação do menu.
 * 
 * @property label - Texto exibido no menu
 * @property href - Rota de destino
 * @property icon - Componente de ícone Lucide
 * @property recurso - Área controlada pela tela de Configurações (opcional)
 * @property badge - Texto ou número para badge (opcional)
 *
 * TIP: Se recurso não for definido, o item é visível para todos os logados.
 */
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Área (ver lib/route-permissions.ts) exigida para visualizar este item */
  recurso?: string;
  /** Badge opcional (ex: contagem de notificações) */
  badge?: string | number;
}

/**
 * Item de breadcrumb para navegação hierárquica.
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Props para o header de página.
 */
export interface PageHeaderProps {
  /** Título da página */
  title: string;
  /** Descrição opcional */
  description?: string;
  /** Ação primária (botão no canto direito) */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}
