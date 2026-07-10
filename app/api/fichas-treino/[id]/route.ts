import { NextRequest, NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth/guard";
import { apagarFicha, substituirFicha } from "@/lib/db/fichas-treino";

interface Params {
  params: Promise<{ id: string }>;
}

/** Substitui a ficha inteira — o editor sempre manda a árvore completa atual. */
export async function PUT(request: NextRequest, { params }: Params) {
  const { erro } = await requireAccess("alunos");
  if (erro) return erro;

  const { id } = await params;
  const dados = await request.json();

  if (!dados.nome || !Array.isArray(dados.dias)) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const ficha = substituirFicha(id, dados);
  if (!ficha) {
    return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ ficha });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { erro } = await requireAccess("alunos");
  if (erro) return erro;

  const { id } = await params;
  apagarFicha(id);
  return NextResponse.json({ ok: true });
}
