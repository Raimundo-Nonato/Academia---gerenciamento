import { NextRequest, NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth/guard";
import { registrarPagamentoEAtualizarAluno } from "@/lib/db/alunos";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Registra um pagamento do aluno: avança o vencimento e grava o lançamento
 * financeiro correspondente numa transação só (ver lib/db/alunos.ts).
 * É uma ação financeira — exige a mesma permissão de "financeiro".
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { erro } = await requireAccess("financeiro");
  if (erro) return erro;

  const { id } = await params;
  const { valor, descricao, formaPagamento, data } = await request.json();

  if (!valor || !descricao || !formaPagamento) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const resultado = registrarPagamentoEAtualizarAluno(id, {
    valor,
    descricao,
    formaPagamento,
    data,
  });

  if (!resultado) {
    return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
  }

  return NextResponse.json(resultado);
}
