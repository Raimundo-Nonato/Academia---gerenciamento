import { NextRequest, NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth/guard";
import { criarLancamento, listarLancamentos } from "@/lib/db/lancamentos";

export async function GET() {
  const { erro } = await requireAccess("financeiro");
  if (erro) return erro;

  return NextResponse.json({ lancamentos: listarLancamentos() });
}

export async function POST(request: NextRequest) {
  const { erro } = await requireAccess("financeiro");
  if (erro) return erro;

  const dados = await request.json();

  if (!dados.descricao || !dados.valor || !dados.data || !dados.categoria || !dados.formaPagamento) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const lancamento = criarLancamento(dados);
  return NextResponse.json({ lancamento }, { status: 201 });
}
