"use client";

/**
 * ============================================================================
 * COMPONENTE PAGE HEADER
 * ============================================================================
 * 
 * Cabeçalho padrão para páginas internas.
 * Exibe título, descrição opcional e botão de ação primária.
 * 
 * USO:
 * ```tsx
 * <PageHeader
 *   title="Alunos"
 *   description="Gerencie os alunos cadastrados"
 *   action={{
 *     label: "Novo Aluno",
 *     onClick: () => router.push("/alunos/novo"),
 *     icon: Plus
 *   }}
 * />
 * ```
 */

import { Button } from "@/components/ui/button";
import type { PageHeaderProps } from "@/types/navigation";

export function PageHeader({ title, description, action }: PageHeaderProps) {
  const ActionIcon = action?.icon;

  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Título e descrição */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {/* Botão de ação primária */}
      {action && (
        <Button onClick={action.onClick} className="shrink-0">
          {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}
