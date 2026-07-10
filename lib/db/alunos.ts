import { randomUUID } from "node:crypto";
import { db } from "./client";
import {
  calcularStatusAluno,
  registrarPagamentoAluno,
  type Aluno,
  type AlunoDetalhes,
  type NovoAlunoData,
} from "@/types/aluno";

interface AlunoRow {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  data_matricula: string;
  status: string;
  proximo_vencimento: string;
  personal_nome: string | null;
  cpf: string | null;
  data_nascimento: string | null;
  endereco_logradouro: string | null;
  endereco_numero: string | null;
  endereco_complemento: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_estado: string | null;
  endereco_cep: string | null;
  observacoes_medicas: string | null;
  contato_emergencia_nome: string | null;
  contato_emergencia_telefone: string | null;
  contato_emergencia_parentesco: string | null;
}

const SELECT_BASE = `SELECT * FROM alunos a`;

function paraAluno(row: AlunoRow): Aluno {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    dataMatricula: row.data_matricula,
    // Recalcula o status ao ler, com a mesma regra usada quando o sistema
    // era só mock — nunca duas versões dessa lógica.
    status: calcularStatusAluno({
      status: row.status as Aluno["status"],
      proximoVencimento: row.proximo_vencimento,
    }),
    proximoVencimento: row.proximo_vencimento,
    personalNome: row.personal_nome,
  };
}

function paraAlunoDetalhes(row: AlunoRow): AlunoDetalhes {
  return {
    ...paraAluno(row),
    cpf: row.cpf ?? undefined,
    dataNascimento: row.data_nascimento ?? "",
    endereco: row.endereco_logradouro
      ? {
          logradouro: row.endereco_logradouro,
          numero: row.endereco_numero ?? "",
          complemento: row.endereco_complemento ?? undefined,
          bairro: row.endereco_bairro ?? "",
          cidade: row.endereco_cidade ?? "",
          estado: row.endereco_estado ?? "",
          cep: row.endereco_cep ?? "",
        }
      : undefined,
    observacoesMedicas: row.observacoes_medicas ?? undefined,
    contatoEmergencia: row.contato_emergencia_nome
      ? {
          nome: row.contato_emergencia_nome,
          telefone: row.contato_emergencia_telefone ?? "",
          parentesco: row.contato_emergencia_parentesco ?? "",
        }
      : undefined,
  };
}

export function listarAlunos(): Aluno[] {
  const rows = db
    .prepare(`${SELECT_BASE} ORDER BY a.created_at DESC`)
    .all() as AlunoRow[];
  return rows.map(paraAluno);
}

function buscarLinhaPorId(id: string): AlunoRow | undefined {
  return db.prepare(`${SELECT_BASE} WHERE a.id = ?`).get(id) as
    | AlunoRow
    | undefined;
}

export function buscarAlunoPorId(id: string): Aluno | undefined {
  const row = buscarLinhaPorId(id);
  return row ? paraAluno(row) : undefined;
}

/** Ficha completa (com campos sensíveis) — a máscara acontece na API, não aqui. */
export function obterAlunoDetalhes(id: string): AlunoDetalhes | undefined {
  const row = buscarLinhaPorId(id);
  return row ? paraAlunoDetalhes(row) : undefined;
}

/** Cadastra um novo aluno. Mensalidade padrão: vencimento em 1 mês. */
export function criarAluno(data: NovoAlunoData): Aluno {
  const id = randomUUID();
  const inicio = new Date(`${data.dataInicio}T12:00:00`);
  const vencimento = new Date(inicio);
  vencimento.setMonth(vencimento.getMonth() + 1);

  db.prepare(
    `INSERT INTO alunos (
      id, nome, email, telefone, data_matricula, status, proximo_vencimento,
      personal_nome, cpf, data_nascimento, observacoes_medicas
    ) VALUES (?, ?, ?, ?, ?, 'ativo', ?, ?, ?, ?, ?)`
  ).run(
    id,
    data.nome,
    data.email,
    data.telefone || "",
    data.dataInicio,
    vencimento.toISOString().slice(0, 10),
    data.personalNome || null,
    data.cpf || null,
    data.dataNascimento,
    data.observacoesMedicas || null
  );

  return paraAluno(buscarLinhaPorId(id)!);
}

interface AtualizarAlunoInput {
  nome?: string;
  email?: string;
  telefone?: string;
  personalNome?: string | null;
}

/** Atualiza dados básicos de contato do aluno. */
export function atualizarAluno(
  id: string,
  dados: AtualizarAlunoInput
): Aluno | undefined {
  const atual = buscarLinhaPorId(id);
  if (!atual) return undefined;

  db.prepare(
    `UPDATE alunos SET
      nome = ?, email = ?, telefone = ?, personal_nome = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    dados.nome ?? atual.nome,
    dados.email ?? atual.email,
    dados.telefone ?? atual.telefone,
    dados.personalNome !== undefined ? dados.personalNome : atual.personal_nome,
    id
  );

  return buscarAlunoPorId(id);
}

/** Suspende o aluno (bloqueia acesso até reativação manual). */
export function suspenderAluno(id: string): Aluno | undefined {
  db.prepare(
    "UPDATE alunos SET status = 'suspenso', updated_at = datetime('now') WHERE id = ?"
  ).run(id);
  return buscarAlunoPorId(id);
}

/** Cancela a matrícula do aluno (definitivo — diferente de suspender). */
export function cancelarAluno(id: string): Aluno | undefined {
  db.prepare(
    "UPDATE alunos SET status = 'cancelado', updated_at = datetime('now') WHERE id = ?"
  ).run(id);
  return buscarAlunoPorId(id);
}

export function apagarAluno(id: string): void {
  db.prepare("DELETE FROM alunos WHERE id = ?").run(id);
}

interface RegistrarPagamentoInput {
  valor: number;
  descricao: string;
  formaPagamento: "pix" | "dinheiro";
  /** Data ISO (yyyy-mm-dd) do pagamento; padrão: hoje. */
  data?: string;
}

/**
 * Registra um pagamento: avança o vencimento do aluno em 1 mês (reaproveitando
 * a mesma regra de types/aluno.ts) e grava o lançamento financeiro
 * correspondente — os dois na mesma transação, ou nenhum dos dois.
 *
 * Usada tanto pela rota dedicada de pagamento (Fase 3) quanto pelo
 * lançamento de mensalidade em Financeiro (Fase 4) — uma função só, para
 * nunca existir duas versões dessa regra.
 */
export function registrarPagamentoEAtualizarAluno(
  alunoId: string,
  opcoes: RegistrarPagamentoInput
): { aluno: Aluno; lancamentoId: string } | undefined {
  const alunoAtual = buscarAlunoPorId(alunoId);
  if (!alunoAtual) return undefined;

  const dataPagamento = opcoes.data
    ? new Date(`${opcoes.data}T12:00:00`)
    : new Date();
  const atualizado = registrarPagamentoAluno(alunoAtual, dataPagamento);
  const lancamentoId = randomUUID();
  const dataLancamento =
    opcoes.data ?? dataPagamento.toISOString().slice(0, 10);

  const transacao = db.transaction(() => {
    db.prepare(
      "UPDATE alunos SET status = ?, proximo_vencimento = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(atualizado.status, atualizado.proximoVencimento, alunoId);

    db.prepare(
      `INSERT INTO lancamentos (id, descricao, valor, data, categoria, forma_pagamento, aluno_id)
       VALUES (?, ?, ?, ?, 'mensalidade', ?, ?)`
    ).run(
      lancamentoId,
      opcoes.descricao,
      opcoes.valor,
      dataLancamento,
      opcoes.formaPagamento,
      alunoId
    );
  });
  transacao();

  return { aluno: atualizado, lancamentoId };
}
