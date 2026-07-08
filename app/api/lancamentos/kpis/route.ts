import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth/guard";
import { obterResumoFinanceiro } from "@/lib/db/lancamentos";

export async function GET() {
  const { erro } = await requireAccess("financeiro");
  if (erro) return erro;

  return NextResponse.json(obterResumoFinanceiro());
}
