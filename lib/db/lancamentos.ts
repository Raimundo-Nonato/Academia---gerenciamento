import { randomUUID } from "node:crypto";
import {
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { db } from "./client";
import type {
  Categoria,
  FormaPagamento,
  Lancamento,
  ResumoFinanceiro,
} from "@/types/lancamento";

interface LancamentoRow {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  forma_pagamento: string;
  aluno_id: string | null;
  criado_em: string;
}

function paraLancamento(row: LancamentoRow): Lancamento {
  return {
    id: row.id,
    descricao: row.descricao,
    valor: row.valor,
    data: row.data,
    categoria: row.categoria as Categoria,
    formaPagamento: row.forma_pagamento as FormaPagamento,
    criadoEm: row.criado_em,
  };
}

export function listarLancamentos(): Lancamento[] {
  const rows = db
    .prepare("SELECT * FROM lancamentos ORDER BY data DESC, criado_em DESC")
    .all() as LancamentoRow[];
  return rows.map(paraLancamento);
}

interface LancamentoInput {
  descricao: string;
  valor: number;
  data: string;
  categoria: Categoria;
  formaPagamento: FormaPagamento;
}

export function criarLancamento(dados: LancamentoInput): Lancamento {
  const id = randomUUID();

  db.prepare(
    `INSERT INTO lancamentos (id, descricao, valor, data, categoria, forma_pagamento)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, dados.descricao, dados.valor, dados.data, dados.categoria, dados.formaPagamento);

  return paraLancamento(
    db.prepare("SELECT * FROM lancamentos WHERE id = ?").get(id) as LancamentoRow
  );
}

export function atualizarLancamento(
  id: string,
  dados: Partial<LancamentoInput>
): Lancamento | undefined {
  const atual = db.prepare("SELECT * FROM lancamentos WHERE id = ?").get(id) as
    | LancamentoRow
    | undefined;
  if (!atual) return undefined;

  db.prepare(
    `UPDATE lancamentos SET descricao = ?, valor = ?, data = ?, categoria = ?, forma_pagamento = ?
     WHERE id = ?`
  ).run(
    dados.descricao ?? atual.descricao,
    dados.valor ?? atual.valor,
    dados.data ?? atual.data,
    dados.categoria ?? atual.categoria,
    dados.formaPagamento ?? atual.forma_pagamento,
    id
  );

  return paraLancamento(
    db.prepare("SELECT * FROM lancamentos WHERE id = ?").get(id) as LancamentoRow
  );
}

export function apagarLancamento(id: string): void {
  db.prepare("DELETE FROM lancamentos WHERE id = ?").run(id);
}

/**
 * Totais gerais e evolução dos últimos 6 meses — calculados a cada leitura
 * (sem guardar totais prontos, que poderiam ficar desatualizados). Mesma
 * regra que já existia na tela (mensalidade soma receita, estorno reduz
 * receita, despesa é despesa), só que agora roda no servidor.
 */
export function obterResumoFinanceiro(): ResumoFinanceiro {
  const todos = listarLancamentos();

  let totalMensalidades = 0;
  let totalDespesas = 0;
  let totalEstornos = 0;

  for (const l of todos) {
    if (l.categoria === "mensalidade") totalMensalidades += l.valor;
    else if (l.categoria === "despesa") totalDespesas += l.valor;
    else if (l.categoria === "estorno") totalEstornos += l.valor;
  }

  const saldo = totalMensalidades - totalEstornos - totalDespesas;

  const evolucaoFinanceira = Array.from({ length: 6 }, (_, index) => {
    const mes = subMonths(new Date(), 5 - index);
    const inicio = startOfMonth(mes);
    const fim = endOfMonth(mes);

    let receitas = 0;
    let despesas = 0;

    for (const l of todos) {
      const data = parseISO(l.data);
      if (!isWithinInterval(data, { start: inicio, end: fim })) continue;
      if (l.categoria === "mensalidade") receitas += l.valor;
      else if (l.categoria === "estorno") receitas -= l.valor;
      else if (l.categoria === "despesa") despesas += l.valor;
    }

    return {
      mes: format(mes, "MMM", { locale: ptBR }),
      receitas: Math.max(0, receitas),
      despesas,
    };
  });

  return { totalMensalidades, totalDespesas, totalEstornos, saldo, evolucaoFinanceira };
}
