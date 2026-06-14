/**
 * ============================================================================
 * COMPONENTE: EDITOR DE FICHA DE TREINO
 * ============================================================================
 *
 * Editor totalmente personalizável pelo personal trainer.
 *
 * HIERARQUIA:
 * Ficha de Treino -> Dia/Treino -> Grupo Muscular -> Exercícios
 *
 * REGRAS:
 * - Sem categorias, divisões ou modelos pré-definidos.
 * - Todos os nomes (dia, grupo muscular, exercício) são livres.
 * - Cada exercício possui: nome, séries, repetições, carga, descanso
 *   e observações — todos editáveis.
 * - Permite gerar PDF mantendo a mesma organização criada pelo personal.
 */

"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileDown,
  Dumbbell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  DiaTreino,
  ExercicioTreino,
  FichaTreino,
  GrupoMuscularTreino,
} from "@/types/aluno";
import { gerarPDFFichaTreino } from "@/lib/ficha-treino-pdf";

interface FichaTreinoEditorProps {
  /** Ficha de treino a ser editada */
  ficha: FichaTreino;
  /** Nome do aluno (usado no PDF) */
  nomeAluno: string;
  /** Callback chamado sempre que a ficha é alterada */
  onChange: (ficha: FichaTreino) => void;
}

/**
 * Gera um ID simples para novos itens (uso local/mock).
 */
function gerarId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function novoExercicio(): ExercicioTreino {
  return {
    id: gerarId(),
    nome: "",
    series: "",
    repeticoes: "",
    carga: "",
    descanso: "",
    observacoes: "",
  };
}

function novoGrupo(): GrupoMuscularTreino {
  return {
    id: gerarId(),
    nome: "",
    exercicios: [novoExercicio()],
  };
}

function novoDia(): DiaTreino {
  return {
    id: gerarId(),
    nome: "",
    grupos: [novoGrupo()],
  };
}

export function FichaTreinoEditor({ ficha, nomeAluno, onChange }: FichaTreinoEditorProps) {
  const [diasAbertos, setDiasAbertos] = useState<Record<string, boolean>>(
    () => Object.fromEntries(ficha.dias.map((dia) => [dia.id, true]))
  );
  const [gruposAbertos, setGruposAbertos] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        ficha.dias.flatMap((dia) => dia.grupos.map((grupo) => [grupo.id, true]))
      )
  );

  function atualizarFicha(dias: DiaTreino[]) {
    onChange({ ...ficha, dias, atualizadaEm: new Date().toISOString().slice(0, 10) });
  }

  // ============ DIAS DE TREINO ============

  function adicionarDia() {
    const dia = novoDia();
    setDiasAbertos((prev) => ({ ...prev, [dia.id]: true }));
    setGruposAbertos((prev) => ({
      ...prev,
      [dia.grupos[0].id]: true,
    }));
    atualizarFicha([...ficha.dias, dia]);
  }

  function editarNomeDia(diaId: string, nome: string) {
    atualizarFicha(
      ficha.dias.map((dia) => (dia.id === diaId ? { ...dia, nome } : dia))
    );
  }

  function excluirDia(diaId: string) {
    atualizarFicha(ficha.dias.filter((dia) => dia.id !== diaId));
  }

  function toggleDia(diaId: string) {
    setDiasAbertos((prev) => ({ ...prev, [diaId]: !prev[diaId] }));
  }

  // ============ GRUPOS MUSCULARES ============

  function adicionarGrupo(diaId: string) {
    const grupo = novoGrupo();
    setGruposAbertos((prev) => ({ ...prev, [grupo.id]: true }));
    atualizarFicha(
      ficha.dias.map((dia) =>
        dia.id === diaId ? { ...dia, grupos: [...dia.grupos, grupo] } : dia
      )
    );
  }

  function editarNomeGrupo(diaId: string, grupoId: string, nome: string) {
    atualizarFicha(
      ficha.dias.map((dia) =>
        dia.id === diaId
          ? {
              ...dia,
              grupos: dia.grupos.map((grupo) =>
                grupo.id === grupoId ? { ...grupo, nome } : grupo
              ),
            }
          : dia
      )
    );
  }

  function excluirGrupo(diaId: string, grupoId: string) {
    atualizarFicha(
      ficha.dias.map((dia) =>
        dia.id === diaId
          ? { ...dia, grupos: dia.grupos.filter((grupo) => grupo.id !== grupoId) }
          : dia
      )
    );
  }

  function toggleGrupo(grupoId: string) {
    setGruposAbertos((prev) => ({ ...prev, [grupoId]: !prev[grupoId] }));
  }

  // ============ EXERCÍCIOS ============

  function adicionarExercicio(diaId: string, grupoId: string) {
    atualizarFicha(
      ficha.dias.map((dia) =>
        dia.id === diaId
          ? {
              ...dia,
              grupos: dia.grupos.map((grupo) =>
                grupo.id === grupoId
                  ? { ...grupo, exercicios: [...grupo.exercicios, novoExercicio()] }
                  : grupo
              ),
            }
          : dia
      )
    );
  }

  function editarExercicio(
    diaId: string,
    grupoId: string,
    exercicioId: string,
    campo: keyof ExercicioTreino,
    valor: string
  ) {
    atualizarFicha(
      ficha.dias.map((dia) =>
        dia.id === diaId
          ? {
              ...dia,
              grupos: dia.grupos.map((grupo) =>
                grupo.id === grupoId
                  ? {
                      ...grupo,
                      exercicios: grupo.exercicios.map((exercicio) =>
                        exercicio.id === exercicioId
                          ? { ...exercicio, [campo]: valor }
                          : exercicio
                      ),
                    }
                  : grupo
              ),
            }
          : dia
      )
    );
  }

  function excluirExercicio(diaId: string, grupoId: string, exercicioId: string) {
    atualizarFicha(
      ficha.dias.map((dia) =>
        dia.id === diaId
          ? {
              ...dia,
              grupos: dia.grupos.map((grupo) =>
                grupo.id === grupoId
                  ? {
                      ...grupo,
                      exercicios: grupo.exercicios.filter(
                        (exercicio) => exercicio.id !== exercicioId
                      ),
                    }
                  : grupo
              ),
            }
          : dia
      )
    );
  }

  function handleGerarPDF() {
    gerarPDFFichaTreino(ficha, nomeAluno);
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho da ficha + ações gerais */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <Input
            value={ficha.nome}
            onChange={(e) => onChange({ ...ficha, nome: e.target.value })}
            placeholder="Nome da ficha de treino"
            className="text-sm font-medium"
          />
        </div>
        <Button size="sm" variant="outline" onClick={handleGerarPDF} className="shrink-0">
          <FileDown className="h-4 w-4 mr-1.5" />
          Gerar PDF
        </Button>
      </div>

      <Textarea
        value={ficha.descricao ?? ""}
        onChange={(e) => onChange({ ...ficha, descricao: e.target.value })}
        placeholder="Descrição / observações gerais da ficha (opcional)"
        className="text-sm min-h-[60px]"
      />

      {/* Dias de treino */}
      <div className="space-y-3">
        {ficha.dias.map((dia) => (
          <Card key={dia.id}>
            <CardContent className="p-3 space-y-3">
              {/* Cabeçalho do dia */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleDia(dia.id)}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  aria-label={diasAbertos[dia.id] ? "Recolher dia" : "Expandir dia"}
                >
                  {diasAbertos[dia.id] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <Input
                  value={dia.nome}
                  onChange={(e) => editarNomeDia(dia.id, e.target.value)}
                  placeholder="Nome do dia de treino (ex: Treino A)"
                  className="font-medium"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => excluirDia(dia.id)}
                  aria-label="Excluir dia de treino"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Grupos musculares do dia */}
              {diasAbertos[dia.id] && (
                <div className="pl-6 space-y-3">
                  {dia.grupos.map((grupo) => (
                    <div key={grupo.id} className="border rounded-md p-3 space-y-3">
                      {/* Cabeçalho do grupo muscular */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleGrupo(grupo.id)}
                          className="text-muted-foreground hover:text-foreground shrink-0"
                          aria-label={
                            gruposAbertos[grupo.id] ? "Recolher grupo" : "Expandir grupo"
                          }
                        >
                          {gruposAbertos[grupo.id] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <Dumbbell className="h-4 w-4 text-primary shrink-0" />
                        <Input
                          value={grupo.nome}
                          onChange={(e) =>
                            editarNomeGrupo(dia.id, grupo.id, e.target.value)
                          }
                          placeholder="Nome do grupo muscular (ex: Peito)"
                          className="text-sm"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => excluirGrupo(dia.id, grupo.id)}
                          aria-label="Excluir grupo muscular"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Exercícios do grupo */}
                      {gruposAbertos[grupo.id] && (
                        <div className="space-y-3">
                          {grupo.exercicios.map((exercicio) => (
                            <div
                              key={exercicio.id}
                              className="rounded-md bg-muted/40 p-3 space-y-2"
                            >
                              <div className="flex items-center gap-2">
                                <Input
                                  value={exercicio.nome}
                                  onChange={(e) =>
                                    editarExercicio(
                                      dia.id,
                                      grupo.id,
                                      exercicio.id,
                                      "nome",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Nome do exercício"
                                  className="text-sm"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="shrink-0 text-muted-foreground hover:text-destructive"
                                  onClick={() =>
                                    excluirExercicio(dia.id, grupo.id, exercicio.id)
                                  }
                                  aria-label="Excluir exercício"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <Input
                                  value={exercicio.series}
                                  onChange={(e) =>
                                    editarExercicio(
                                      dia.id,
                                      grupo.id,
                                      exercicio.id,
                                      "series",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Séries"
                                  className="text-sm"
                                />
                                <Input
                                  value={exercicio.repeticoes}
                                  onChange={(e) =>
                                    editarExercicio(
                                      dia.id,
                                      grupo.id,
                                      exercicio.id,
                                      "repeticoes",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Repetições"
                                  className="text-sm"
                                />
                                <Input
                                  value={exercicio.carga}
                                  onChange={(e) =>
                                    editarExercicio(
                                      dia.id,
                                      grupo.id,
                                      exercicio.id,
                                      "carga",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Carga"
                                  className="text-sm"
                                />
                                <Input
                                  value={exercicio.descanso}
                                  onChange={(e) =>
                                    editarExercicio(
                                      dia.id,
                                      grupo.id,
                                      exercicio.id,
                                      "descanso",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Descanso"
                                  className="text-sm"
                                />
                              </div>

                              <Textarea
                                value={exercicio.observacoes ?? ""}
                                onChange={(e) =>
                                  editarExercicio(
                                    dia.id,
                                    grupo.id,
                                    exercicio.id,
                                    "observacoes",
                                    e.target.value
                                  )
                                }
                                placeholder="Observações (opcional)"
                                className="text-sm min-h-[40px]"
                              />
                            </div>
                          ))}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => adicionarExercicio(dia.id, grupo.id)}
                            className="text-muted-foreground"
                          >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Adicionar exercício
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  <Button size="sm" variant="outline" onClick={() => adicionarGrupo(dia.id)}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Adicionar grupo muscular
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button size="sm" variant="outline" onClick={adicionarDia} className="w-full">
        <Plus className="h-4 w-4 mr-1.5" />
        Adicionar dia de treino
      </Button>
    </div>
  );
}
