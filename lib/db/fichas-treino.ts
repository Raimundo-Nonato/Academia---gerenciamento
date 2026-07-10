import { randomUUID } from "node:crypto";
import { db } from "./client";
import type {
  DiaTreino,
  ExercicioTreino,
  FichaTreino,
  GrupoMuscularTreino,
} from "@/types/aluno";

interface FichaRow {
  id: string;
  nome: string;
  descricao: string | null;
  ativa: number;
  personal_nome: string | null;
  aluno_id: string;
  criado_em: string;
  atualizada_em: string;
}

interface DiaRow {
  id: string;
  nome: string;
}

interface GrupoRow {
  id: string;
  nome: string;
}

interface ExercicioRow {
  id: string;
  nome: string;
  series: string;
  repeticoes: string;
  carga: string;
  descanso: string;
  observacoes: string | null;
}

const SELECT_FICHA_BASE = `SELECT * FROM fichas_treino f`;

function montarExercicio(row: ExercicioRow): ExercicioTreino {
  return {
    id: row.id,
    nome: row.nome,
    series: row.series,
    repeticoes: row.repeticoes,
    carga: row.carga,
    descanso: row.descanso,
    observacoes: row.observacoes ?? undefined,
  };
}

function montarGrupo(row: GrupoRow): GrupoMuscularTreino {
  const exercicios = db
    .prepare(
      "SELECT * FROM exercicios_treino WHERE grupo_id = ? ORDER BY ordem"
    )
    .all(row.id) as ExercicioRow[];
  return { id: row.id, nome: row.nome, exercicios: exercicios.map(montarExercicio) };
}

function montarDia(row: DiaRow): DiaTreino {
  const grupos = db
    .prepare(
      "SELECT * FROM grupos_musculares_treino WHERE dia_id = ? ORDER BY ordem"
    )
    .all(row.id) as GrupoRow[];
  return { id: row.id, nome: row.nome, grupos: grupos.map(montarGrupo) };
}

function montarFicha(row: FichaRow): FichaTreino {
  const dias = db
    .prepare("SELECT * FROM dias_treino WHERE ficha_id = ? ORDER BY ordem")
    .all(row.id) as DiaRow[];

  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao ?? undefined,
    ativa: row.ativa === 1,
    criadaEm: row.criado_em,
    atualizadaEm: row.atualizada_em,
    personalNome: row.personal_nome ?? undefined,
    dias: dias.map(montarDia),
  };
}

export function listarFichasPorAluno(alunoId: string): FichaTreino[] {
  const rows = db
    .prepare(`${SELECT_FICHA_BASE} WHERE f.aluno_id = ? ORDER BY f.criado_em`)
    .all(alunoId) as FichaRow[];
  return rows.map(montarFicha);
}

function buscarLinhaPorId(id: string): FichaRow | undefined {
  return db.prepare(`${SELECT_FICHA_BASE} WHERE f.id = ?`).get(id) as
    | FichaRow
    | undefined;
}

export function buscarFichaPorId(id: string): FichaTreino | undefined {
  const row = buscarLinhaPorId(id);
  return row ? montarFicha(row) : undefined;
}

interface CriarFichaInput {
  nome: string;
  descricao?: string;
  personalNome?: string | null;
}

/** Cria uma ficha nova, vazia (sem dias) — o personal preenche o resto no editor. */
export function criarFicha(alunoId: string, dados: CriarFichaInput): FichaTreino {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO fichas_treino (id, nome, descricao, personal_nome, aluno_id)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, dados.nome, dados.descricao || null, dados.personalNome || null, alunoId);

  return buscarFichaPorId(id)!;
}

interface SubstituirFichaInput {
  nome: string;
  descricao?: string;
  ativa: boolean;
  personalNome?: string | null;
  dias: DiaTreino[];
}

/**
 * Substitui a ficha inteira (dados + hierarquia completa de dias/grupos/
 * exercícios) numa transação só. O editor manda sempre a árvore completa a
 * cada alteração, então a forma mais simples e correta de sincronizar é
 * apagar os filhos antigos e regravar os atuais — sem precisar comparar
 * item a item o que mudou.
 */
export function substituirFicha(
  id: string,
  dados: SubstituirFichaInput
): FichaTreino | undefined {
  if (!buscarLinhaPorId(id)) return undefined;

  const transacao = db.transaction(() => {
    db.prepare(
      `UPDATE fichas_treino SET
        nome = ?, descricao = ?, ativa = ?, personal_nome = ?, atualizada_em = datetime('now')
       WHERE id = ?`
    ).run(
      dados.nome,
      dados.descricao || null,
      dados.ativa ? 1 : 0,
      dados.personalNome || null,
      id
    );

    db.prepare("DELETE FROM dias_treino WHERE ficha_id = ?").run(id);

    const inserirDia = db.prepare(
      "INSERT INTO dias_treino (id, ficha_id, nome, ordem) VALUES (?, ?, ?, ?)"
    );
    const inserirGrupo = db.prepare(
      "INSERT INTO grupos_musculares_treino (id, dia_id, nome, ordem) VALUES (?, ?, ?, ?)"
    );
    const inserirExercicio = db.prepare(
      `INSERT INTO exercicios_treino
        (id, grupo_id, nome, series, repeticoes, carga, descanso, observacoes, ordem)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    dados.dias.forEach((dia, diaIndex) => {
      inserirDia.run(dia.id, id, dia.nome, diaIndex);

      dia.grupos.forEach((grupo, grupoIndex) => {
        inserirGrupo.run(grupo.id, dia.id, grupo.nome, grupoIndex);

        grupo.exercicios.forEach((exercicio, exercicioIndex) => {
          inserirExercicio.run(
            exercicio.id,
            grupo.id,
            exercicio.nome,
            exercicio.series,
            exercicio.repeticoes,
            exercicio.carga,
            exercicio.descanso,
            exercicio.observacoes || null,
            exercicioIndex
          );
        });
      });
    });
  });
  transacao();

  return buscarFichaPorId(id);
}

/** Apaga a ficha — dias/grupos/exercícios somem junto (ON DELETE CASCADE). */
export function apagarFicha(id: string): void {
  db.prepare("DELETE FROM fichas_treino WHERE id = ?").run(id);
}
