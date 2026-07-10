import { NextRequest, NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth/guard";
import { sanitizeAlunoDetalhesForRole } from "@/lib/alunos/mask";
import {
  apagarAluno,
  atualizarAluno,
  cancelarAluno,
  obterAlunoDetalhes,
  suspenderAluno,
} from "@/lib/db/alunos";

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
 * Atualiza dados de contato do aluno. Casos especiais: `{ status: "suspenso" }`
 * e `{ status: "cancelado" }` passam pelas rotinas dedicadas — as demais
 * transições de status (ativo/inadimplente) são sempre calculadas
 * automaticamente (calcularStatusAluno), nunca escritas direto por aqui.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { erro } = await requireAccess("alunos");
  if (erro) return erro;

  const { id } = await params;
  const dados = await request.json();

  try {
    const aluno =
      dados.status === "suspenso"
        ? suspenderAluno(id)
        : dados.status === "cancelado"
          ? cancelarAluno(id)
          : atualizarAluno(id, dados);

    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ aluno });
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

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { erro } = await requireAccess("alunos");
  if (erro) return erro;

  const { id } = await params;
  apagarAluno(id);
  return NextResponse.json({ ok: true });
}
