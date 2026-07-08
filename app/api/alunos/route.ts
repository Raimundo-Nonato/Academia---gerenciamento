import { NextRequest, NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth/guard";
import { criarAluno, listarAlunos } from "@/lib/db/alunos";

export async function GET() {
  const { erro } = await requireAccess("alunos");
  if (erro) return erro;

  return NextResponse.json({ alunos: listarAlunos() });
}

export async function POST(request: NextRequest) {
  const { erro } = await requireAccess("alunos");
  if (erro) return erro;

  const data = await request.json();

  if (!data.nome || !data.email || !data.dataNascimento || !data.dataInicio) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const aluno = criarAluno(data);
  return NextResponse.json({ aluno }, { status: 201 });
}
