/**
 * ============================================================================
 * PÁGINA RAIZ - REDIRECIONAMENTO
 * ============================================================================
 * 
 * Redireciona automaticamente para o dashboard.
 * 
 * TIP: Em produção, redirecionar para /login se não autenticado.
 * TODO: Implementar verificação de autenticação
 */

import { redirect } from "next/navigation";

export default function HomePage() {
  // TODO: Verificar se usuário está autenticado
  // Se não, redirecionar para /login
  redirect("/dashboard");
}
