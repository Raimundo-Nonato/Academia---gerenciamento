import { NextRequest, NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth/guard";
import {
  RECURSOS_CONFIGURAVEIS,
  definirPermissao,
  listarTodasPermissoes,
} from "@/lib/db/permissoes";

/**
 * Lista o estado atual de todas as combinações papel x recurso.
 * Só o ADMIN acessa — "configuracoes" é sempre exclusivo dele
 * (ver lib/auth/guard.ts).
 */
export async function GET() {
  const { erro } = await requireAccess("configuracoes");
  if (erro) return erro;

  return NextResponse.json({
    recursos: RECURSOS_CONFIGURAVEIS,
    permissoes: listarTodasPermissoes(),
  });
}

/**
 * Liga/desliga uma permissão. Recusa qualquer recurso fora da lista
 * configurável (ex: "configuracoes") mesmo que alguém tente forçar pela API.
 */
export async function PATCH(request: NextRequest) {
  const { erro } = await requireAccess("configuracoes");
  if (erro) return erro;

  const { role, recurso, permitido } = await request.json();

  if (role !== "GERENTE" && role !== "RECEPCIONISTA") {
    return NextResponse.json({ error: "Papel inválido" }, { status: 400 });
  }

  try {
    definirPermissao(role, recurso, Boolean(permitido));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  return NextResponse.json({ permissoes: listarTodasPermissoes() });
}
