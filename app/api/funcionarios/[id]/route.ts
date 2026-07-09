import { NextRequest, NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth/guard";
import { apagarFuncionario, atualizarFuncionario } from "@/lib/db/funcionarios";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { erro } = await requireAccess("configuracoes");
  if (erro) return erro;

  const { id } = await params;
  const dados = await request.json();
  const funcionario = atualizarFuncionario(id, dados);

  if (!funcionario) {
    return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ funcionario });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { erro } = await requireAccess("configuracoes");
  if (erro) return erro;

  const { id } = await params;
  apagarFuncionario(id);
  return NextResponse.json({ ok: true });
}
