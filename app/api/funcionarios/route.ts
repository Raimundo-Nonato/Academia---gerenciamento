import { NextRequest, NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth/guard";
import { criarFuncionario, listarFuncionarios } from "@/lib/db/funcionarios";

export async function GET() {
  const { erro } = await requireAccess("configuracoes");
  if (erro) return erro;

  return NextResponse.json({ funcionarios: listarFuncionarios() });
}

export async function POST(request: NextRequest) {
  const { erro } = await requireAccess("configuracoes");
  if (erro) return erro;

  const data = await request.json();
  if (!data.nome) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const funcionario = criarFuncionario(data.nome);
  return NextResponse.json({ funcionario }, { status: 201 });
}
