import { NextRequest, NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth/guard";
import { sanitizeAlunoDetalhesForRole } from "@/lib/alunos/mask";
import { apagarAluno, atualizarAluno, obterAlunoDetalhes, suspenderAluno } from "@/lib/db/alunos";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { usuario, erro } = await requireAccess("alunos");
  if (erro) return erro;

  const { id } = await params;
  const detalhes = obterAlunoDetalhes(id);
  if (!detalhes) {
    return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    aluno: sanitizeAlunoDetalhesForRole(detalhes, usuario.role),
  });
}

/**
 * Atualiza dados de contato do aluno. Caso especial: `{ status: "suspenso" }`
 * passa pela rotina dedicada de suspensão — as demais transições de status
 * (ativo/inadimplente) são sempre calculadas automaticamente
 * (calcularStatusAluno), nunca escritas direto por aqui.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { erro } = await requireAccess("alunos");
  if (erro) return erro;

  const { id } = await params;
  const dados = await request.json();

  const aluno =
    dados.status === "suspenso" ? suspenderAluno(id) : atualizarAluno(id, dados);

  if (!aluno) {
    return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ aluno });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { erro } = await requireAccess("alunos");
  if (erro) return erro;

  const { id } = await params;
  apagarAluno(id);
  return NextResponse.json({ ok: true });
}
