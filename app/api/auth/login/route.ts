import { NextRequest, NextResponse } from "next/server";
import { criarSessao } from "@/lib/auth/session";
import { montarPermissoes } from "@/lib/db/permissoes";
import { buscarUsuarioPorEmail, conferirSenha } from "@/lib/db/users";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Informe e-mail e senha" }, { status: 400 });
  }

  const usuario = buscarUsuarioPorEmail(email);
  if (!usuario || !conferirSenha(usuario, password)) {
    return NextResponse.json({ error: "E-mail ou senha inválidos" }, { status: 401 });
  }

  await criarSessao(usuario.id);

  return NextResponse.json({
    user: {
      id: usuario.id,
      name: usuario.name,
      email: usuario.email,
      role: usuario.role,
    },
    permissions: montarPermissoes(usuario.role),
  });
}
