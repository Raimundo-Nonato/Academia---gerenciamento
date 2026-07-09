import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth/guard";
import { montarPermissoes } from "@/lib/db/permissoes";
import { obterResumoDashboard } from "@/lib/db/dashboard";

/**
 * Resumo completo do Dashboard numa chamada só.
 *
 * "dashboard" não é um recurso configurável — como toda rota não listada,
 * fica liberada para qualquer usuário logado. O bloco financeiro, porém, é
 * removido da resposta para quem não tem a permissão "financeiro": mesmo
 * modelo do CPF mascarado — a tela esconde, mas quem manda é o servidor.
 */
export async function GET() {
  const { usuario, erro } = await requireAccess("dashboard");
  if (erro) return erro;

  const resumo = obterResumoDashboard();
  const podeFinanceiro =
    montarPermissoes(usuario.role)["financeiro"] !== false;

  return NextResponse.json({
    resumo: podeFinanceiro ? resumo : { ...resumo, financeiro: null },
  });
}
