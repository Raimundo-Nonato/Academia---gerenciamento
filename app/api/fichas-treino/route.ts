import { NextRequest, NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth/guard";
import { criarFicha, listarFichasPorAluno } from "@/lib/db/fichas-treino";

export async function GET(request: NextRequest) {
  const { erro } = await requireAccess("alunos");
  if (erro) return erro;

  const alunoId = request.nextUrl.searchParams.get("alunoId");
  if (!alunoId) {
    return NextResponse.json({ error: "alunoId é obrigatório" }, { status: 400 });
  }

  return NextResponse.json({ fichas: listarFichasPorAluno(alunoId) });
}

export async function POST(request: NextRequest) {
  const { erro } = await requireAccess("alunos");
  if (erro) return erro;

  const data = await request.json();
  if (!data.alunoId || !data.nome) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const ficha = criarFicha(data.alunoId, data);
  return NextResponse.json({ ficha }, { status: 201 });
}
