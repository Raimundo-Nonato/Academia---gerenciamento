import { NextRequest, NextResponse } from "next/server";
import { obterUsuarioLogado } from "@/lib/auth/session";
import { montarPermissoes } from "@/lib/db/permissoes";
import { atualizarPerfil } from "@/lib/db/users";

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

export async function PATCH(request: NextRequest) {
  const usuario = await obterUsuarioLogado();
  if (!usuario) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { name, email } = await request.json();
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Nome e e-mail não podem ficar vazios" }, { status: 400 });
  }

  try {
    const atualizado = atualizarPerfil(usuario.id, name.trim(), email.trim());
    return NextResponse.json({
      user: { id: atualizado.id, name: atualizado.name, email: atualizado.email, role: atualizado.role },
    });
  } catch (err: any) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return NextResponse.json({ error: "Já existe um usuário cadastrado com esse e-mail" }, { status: 409 });
    }
    throw err;
  }
}
