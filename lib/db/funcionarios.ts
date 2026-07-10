import { randomUUID } from "node:crypto";
import { db } from "./client";
import type { Funcionario } from "@/types/funcionario";

interface FuncionarioRow {
  id: string;
  nome: string;
  financeiro: number;
  criado_em: string;
}

function paraFuncionario(row: FuncionarioRow): Funcionario {
  return {
    id: row.id,
    nome: row.nome,
    financeiro: row.financeiro === 1,
    criadoEm: row.criado_em,
  };
}

function buscarLinhaPorId(id: string): FuncionarioRow | undefined {
  return db.prepare("SELECT * FROM funcionarios WHERE id = ?").get(id) as
    | FuncionarioRow
    | undefined;
}

export function listarFuncionarios(): Funcionario[] {
  const rows = db
    .prepare("SELECT * FROM funcionarios ORDER BY criado_em")
    .all() as FuncionarioRow[];
  return rows.map(paraFuncionario);
}

export function criarFuncionario(nome: string): Funcionario {
  const id = randomUUID();
  db.prepare("INSERT INTO funcionarios (id, nome) VALUES (?, ?)").run(id, nome);
  return paraFuncionario(buscarLinhaPorId(id)!);
}

interface AtualizarFuncionarioInput {
  nome?: string;
  financeiro?: boolean;
}

export function atualizarFuncionario(
  id: string,
  dados: AtualizarFuncionarioInput
): Funcionario | undefined {
  const atual = buscarLinhaPorId(id);
  if (!atual) return undefined;

  const financeiro =
    dados.financeiro !== undefined ? (dados.financeiro ? 1 : 0) : atual.financeiro;

  db.prepare("UPDATE funcionarios SET nome = ?, financeiro = ? WHERE id = ?").run(
    dados.nome ?? atual.nome,
    financeiro,
    id
  );

  return paraFuncionario(buscarLinhaPorId(id)!);
}

export function apagarFuncionario(id: string): void {
  db.prepare("DELETE FROM funcionarios WHERE id = ?").run(id);
}
