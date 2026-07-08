import { NextResponse } from "next/server";
import { obterUsuarioLogado } from "@/lib/auth/session";
import { montarPermissoes } from "@/lib/db/permissoes";

export async function GET() {
  const usuario = await obterUsuarioLogado();
  if (!usuario) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  return NextResponse.json({
    user: usuario,
    permissions: montarPermissoes(usuario.role),
  });
}
