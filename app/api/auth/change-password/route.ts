import { NextRequest, NextResponse } from "next/server";
import { destruirOutrasSessoes, obterUsuarioLogado } from "@/lib/auth/session";
import { atualizarSenha, buscarUsuarioPorId, conferirSenha } from "@/lib/db/users";

export async function POST(request: NextRequest) {
  const usuarioLogado = await obterUsuarioLogado();
  if (!usuarioLogado) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const usuario = buscarUsuarioPorId(usuarioLogado.id);
  if (!usuario || !conferirSenha(usuario, currentPassword)) {
    return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
  }

  atualizarSenha(usuario.id, newPassword);
  await destruirOutrasSessoes(usuario.id);
  return NextResponse.json({ ok: true });
}
