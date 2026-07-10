"use client";

/**
 * ============================================================================
 * PÁGINA DE CONFIGURAÇÕES
 * ============================================================================
 *
 * Exclusiva do ADMIN (ver lib/route-permissions.ts e components/auth/*).
 * Acessada pelo dropdown do usuário na topbar (não pela sidebar).
 */

import { PageHeader } from "@/components/layout/page-header";
import { PainelAdmin } from "@/components/configuracoes/painel-admin";

export default function ConfiguracoesPage() {
  return (
    <>
      <PageHeader
        title="Configurações"
        description="Controle o que cada papel pode acessar no sistema"
      />
      <PainelAdmin />
    </>
  );
}
