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

  if (Number.isNaN(new Date(data.dataInicio).getTime())) {
    return NextResponse.json({ error: "Data de início inválida" }, { status: 400 });
  }

  try {
    const aluno = criarAluno(data);
    return NextResponse.json({ aluno }, { status: 201 });
  } catch (err: any) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return NextResponse.json(
        { error: "Já existe um aluno cadastrado com esse e-mail" },
        { status: 409 }
      );
    }
    throw err;
  }
}
