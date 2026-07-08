import { NextRequest, NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth/guard";
import { apagarLancamento, atualizarLancamento } from "@/lib/db/lancamentos";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { erro } = await requireAccess("financeiro");
  if (erro) return erro;

  const { id } = await params;
  const dados = await request.json();
  const lancamento = atualizarLancamento(id, dados);

  if (!lancamento) {
    return NextResponse.json({ error: "Lançamento não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ lancamento });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { erro } = await requireAccess("financeiro");
  if (erro) return erro;

  const { id } = await params;
  apagarLancamento(id);
  return NextResponse.json({ ok: true });
}
