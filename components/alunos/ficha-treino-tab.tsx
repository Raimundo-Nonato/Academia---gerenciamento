/**
 * ============================================================================
 * COMPONENTE: ABA DE FICHAS DE TREINO
 * ============================================================================
 *
 * Gerencia a criação, edição e visualização das fichas de treino de um aluno.
 *
 * FUNCIONALIDADES:
 * - Visualizar ficha de treino atual organizada por categorias musculares
 * - Criar nova ficha ou editar a existente
 * - Adicionar/remover exercícios por categoria
 * - Gerar PDF da ficha para envio ao aluno
 *
 * ESTRUTURA:
 * - Modo visualização: exibe cards por categoria com exercícios e detalhes
 * - Modo edição: formulário inline com adição/remoção dinâmica de exercícios
 *
 * TIP: O PDF é gerado via window.print() com estilos específicos para impressão.
 */

"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Trash2,
  Edit3,
  FileDown,
  Save,
  X,
  Dumbbell,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Aluno,
  FichaTreino,
  CategoriaExercicio,
  Exercicio,
  CATEGORIAS_MUSCULARES,
  CategoriaMuscullar,
} from "@/types/aluno";

// ============ MOCK DA FICHA COMPLETA ============
// TODO: Substituir por chamada à API

const MOCK_FICHA_COMPLETA: FichaTreino = {
  id: "f1",
  nome: "Ficha A — Hipertrofia",
  descricao: "Treino de hipertrofia com foco em volume",
  ativa: true,
  criadaEm: "2024-01-01",
  atualizadaEm: "2024-01-20",
  personalNome: "Carlos Trainer",
  categorias: [
    {
      categoria: "Peito",
      exercicios: [
        {
          id: "e1",
          nome: "Supino Reto com Barra",
          series: 4,
          repeticoes: "10-12",
          observacoes: "Controlar descida em 3s",
        },
        {
          id: "e2",
          nome: "Crucifixo Inclinado",
          series: 3,
          repeticoes: "12",
        },
      ],
    },
    {
      categoria: "Costas",
      exercicios: [
        {
          id: "e3",
          nome: "Puxada Frontal",
          series: 4,
          repeticoes: "10",
          observacoes: "Pegada pronada, aberta",
        },
        {
          id: "e4",
          nome: "Remada Curvada",
          series: 3,
          repeticoes: "10-12",
        },
      ],
    },
    {
      categoria: "Ombro",
      exercicios: [
        {
          id: "e5",
          nome: "Desenvolvimento com Halteres",
          series: 4,
          repeticoes: "12",
        },
      ],
    },
    {
      categoria: "Abdômen",
      exercicios: [
        {
          id: "e6",
          nome: "Abdominal Infra",
          series: 3,
          repeticoes: "20",
        },
      ],
    },
  ],
};

// ============ TIPOS INTERNOS ============

interface FichaTreinoTabProps {
  aluno: Aluno;
}

// ============ FUNÇÕES UTILITÁRIAS ============

/** Gera um ID temporário para novos itens (mock). */
function generateId(): string {
  return `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Retorna ícone/cor por categoria muscular. */
function getCategoriaColor(categoria: CategoriaMuscullar): string {
  const colors: Record<CategoriaMuscullar, string> = {
    Peito: "text-rose-600 bg-rose-500/10",
    Costas: "text-blue-600 bg-blue-500/10",
    Ombro: "text-purple-600 bg-purple-500/10",
    "Bíceps": "text-emerald-600 bg-emerald-500/10",
    "Tríceps": "text-orange-600 bg-orange-500/10",
    Perna: "text-cyan-600 bg-cyan-500/10",
    "Abdômen": "text-yellow-600 bg-yellow-500/10",
    Cardio: "text-pink-600 bg-pink-500/10",
  };
  return colors[categoria] ?? "text-muted-foreground bg-muted";
}

// ============ SUBCOMPONENTE: LINHA DE EXERCÍCIO (MODO EDIÇÃO) ============

interface ExercicioRowProps {
  exercicio: Exercicio;
  onUpdate: (updated: Exercicio) => void;
  onRemove: () => void;
}

function ExercicioRow({ exercicio, onUpdate, onRemove }: ExercicioRowProps) {
  return (
    <div className="grid grid-cols-[1fr_72px_80px_auto] gap-2 items-start">
      {/* Nome */}
      <Input
        value={exercicio.nome}
        onChange={(e) => onUpdate({ ...exercicio, nome: e.target.value })}
        placeholder="Nome do exercício"
        className="h-8 text-sm"
      />
      {/* Séries */}
      <Input
        type="number"
        min={1}
        value={exercicio.series}
        onChange={(e) =>
          onUpdate({ ...exercicio, series: Number(e.target.value) || 1 })
        }
        placeholder="Séries"
        className="h-8 text-sm text-center"
      />
      {/* Repetições */}
      <Input
        value={exercicio.repeticoes}
        onChange={(e) => onUpdate({ ...exercicio, repeticoes: e.target.value })}
        placeholder="Reps"
        className="h-8 text-sm text-center"
      />
      {/* Remover */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={onRemove}
        aria-label="Remover exercício"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      {/* Observações (ocupa linha inteira) */}
      <div className="col-span-4">
        <Input
          value={exercicio.observacoes ?? ""}
          onChange={(e) =>
            onUpdate({ ...exercicio, observacoes: e.target.value || undefined })
          }
          placeholder="Observações (opcional)"
          className="h-7 text-xs text-muted-foreground"
        />
      </div>
    </div>
  );
}

// ============ SUBCOMPONENTE: BLOCO DE CATEGORIA (MODO EDIÇÃO) ============

interface CategoriaEditorProps {
  categoriaExercicio: CategoriaExercicio;
  onUpdate: (updated: CategoriaExercicio) => void;
  onRemoveCategoria: () => void;
}

function CategoriaEditor({
  categoriaExercicio,
  onUpdate,
  onRemoveCategoria,
}: CategoriaEditorProps) {
  const colorClass = getCategoriaColor(categoriaExercicio.categoria);

  function addExercicio() {
    const novo: Exercicio = {
      id: generateId(),
      nome: "",
      series: 3,
      repeticoes: "12",
    };
    onUpdate({
      ...categoriaExercicio,
      exercicios: [...categoriaExercicio.exercicios, novo],
    });
  }

  function updateExercicio(index: number, updated: Exercicio) {
    const exercicios = [...categoriaExercicio.exercicios];
    exercicios[index] = updated;
    onUpdate({ ...categoriaExercicio, exercicios });
  }

  function removeExercicio(index: number) {
    const exercicios = categoriaExercicio.exercicios.filter((_, i) => i !== index);
    onUpdate({ ...categoriaExercicio, exercicios });
  }

  return (
    <Card className="border border-border/60">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
              {categoriaExercicio.categoria}
            </span>
            <span className="text-xs text-muted-foreground">
              {categoriaExercicio.exercicios.length} exercício(s)
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onRemoveCategoria}
            aria-label={`Remover categoria ${categoriaExercicio.categoria}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Cabeçalho das colunas */}
        <div className="grid grid-cols-[1fr_72px_80px_auto] gap-2 text-xs text-muted-foreground px-0.5">
          <span>Exercício</span>
          <span className="text-center">Séries</span>
          <span className="text-center">Reps</span>
          <span className="w-8" />
        </div>

        {/* Exercícios */}
        {categoriaExercicio.exercicios.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            Nenhum exercício. Adicione abaixo.
          </p>
        ) : (
          <div className="space-y-3">
            {categoriaExercicio.exercicios.map((ex, idx) => (
              <ExercicioRow
                key={ex.id}
                exercicio={ex}
                onUpdate={(updated) => updateExercicio(idx, updated)}
                onRemove={() => removeExercicio(idx)}
              />
            ))}
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-xs border border-dashed"
          onClick={addExercicio}
        >
          <Plus className="h-3 w-3 mr-1" />
          Adicionar exercício
        </Button>
      </CardContent>
    </Card>
  );
}

// ============ SUBCOMPONENTE: BLOCO DE CATEGORIA (MODO VISUALIZAÇÃO) ============

interface CategoriaViewProps {
  categoriaExercicio: CategoriaExercicio;
}

function CategoriaView({ categoriaExercicio }: CategoriaViewProps) {
  const [expanded, setExpanded] = useState(true);
  const colorClass = getCategoriaColor(categoriaExercicio.categoria);

  if (categoriaExercicio.exercicios.length === 0) return null;

  return (
    <Card className="border border-border/60">
      <CardHeader
        className="py-3 px-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
              {categoriaExercicio.categoria}
            </span>
            <span className="text-xs text-muted-foreground">
              {categoriaExercicio.exercicios.length} exercício(s)
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="px-4 pb-4">
          <div className="space-y-3">
            {/* Cabeçalho */}
            <div className="grid grid-cols-[1fr_60px_72px] gap-2 text-xs text-muted-foreground pb-1 border-b">
              <span>Exercício</span>
              <span className="text-center">Séries</span>
              <span className="text-center">Reps</span>
            </div>
            {/* Linhas */}
            {categoriaExercicio.exercicios.map((ex) => (
              <div key={ex.id} className="space-y-0.5">
                <div className="grid grid-cols-[1fr_60px_72px] gap-2 items-center text-sm">
                  <span className="font-medium truncate">{ex.nome}</span>
                  <span className="text-center tabular-nums">{ex.series}x</span>
                  <span className="text-center tabular-nums">{ex.repeticoes}</span>
                </div>
                {ex.observacoes && (
                  <p className="text-xs text-muted-foreground pl-0.5">
                    ↳ {ex.observacoes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ============ COMPONENTE PRINCIPAL ============

export function FichaTreinoTab({ aluno }: FichaTreinoTabProps) {
  const [ficha, setFicha] = useState<FichaTreino | null>(MOCK_FICHA_COMPLETA);
  const [modoEdicao, setModoEdicao] = useState(false);

  // Estado de edição (cópia isolada para não mutar o original antes de salvar)
  const [fichaRascunho, setFichaRascunho] = useState<FichaTreino | null>(null);

  // ---- Handlers de edição ----

  function iniciarEdicao() {
    if (!ficha) {
      // Cria ficha nova vazia
      setFichaRascunho({
        id: generateId(),
        nome: "Nova Ficha de Treino",
        ativa: true,
        criadaEm: new Date().toISOString(),
        atualizadaEm: new Date().toISOString(),
        categorias: [],
      });
    } else {
      // Clona para edição
      setFichaRascunho(JSON.parse(JSON.stringify(ficha)));
    }
    setModoEdicao(true);
  }

  function cancelarEdicao() {
    setFichaRascunho(null);
    setModoEdicao(false);
  }

  function salvarFicha() {
    if (!fichaRascunho) return;
    const atualizada: FichaTreino = {
      ...fichaRascunho,
      atualizadaEm: new Date().toISOString(),
    };
    setFicha(atualizada);
    setFichaRascunho(null);
    setModoEdicao(false);
    // TODO: persistir via API
  }

  function adicionarCategoria(categoria: CategoriaMuscullar) {
    if (!fichaRascunho) return;
    // Impede duplicata
    if (fichaRascunho.categorias?.some((c) => c.categoria === categoria)) return;
    setFichaRascunho({
      ...fichaRascunho,
      categorias: [
        ...(fichaRascunho.categorias ?? []),
        { categoria, exercicios: [] },
      ],
    });
  }

  function updateCategoria(index: number, updated: CategoriaExercicio) {
    if (!fichaRascunho) return;
    const categorias = [...(fichaRascunho.categorias ?? [])];
    categorias[index] = updated;
    setFichaRascunho({ ...fichaRascunho, categorias });
  }

  function removeCategoria(index: number) {
    if (!fichaRascunho) return;
    const categorias = (fichaRascunho.categorias ?? []).filter((_, i) => i !== index);
    setFichaRascunho({ ...fichaRascunho, categorias });
  }

  // ---- Geração de PDF ----

  function gerarPDF() {
    if (!ficha) return;
    const dataHoje = format(new Date(), "dd/MM/yyyy", { locale: ptBR });

    const estilos = `
      <style>
        body { font-family: Arial, sans-serif; color: #111; margin: 0; padding: 24px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .meta { font-size: 12px; color: #555; margin-bottom: 20px; }
        .categoria { margin-bottom: 20px; page-break-inside: avoid; }
        .categoria-titulo {
          font-size: 13px; font-weight: bold; text-transform: uppercase;
          letter-spacing: 0.05em; color: #444;
          border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px;
        }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { text-align: left; color: #777; font-weight: normal; padding: 4px 6px; border-bottom: 1px solid #e5e7eb; }
        td { padding: 5px 6px; border-bottom: 1px solid #f3f4f6; }
        .obs { font-size: 11px; color: #777; font-style: italic; }
        @media print { body { padding: 0; } }
      </style>
    `;

    const categoriasHTML = (ficha.categorias ?? [])
      .filter((c) => c.exercicios.length > 0)
      .map(
        (c) => `
        <div class="categoria">
          <div class="categoria-titulo">${c.categoria}</div>
          <table>
            <thead>
              <tr>
                <th>Exercício</th>
                <th>Séries</th>
                <th>Repetições</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              ${c.exercicios
                .map(
                  (ex) => `
                <tr>
                  <td>${ex.nome}</td>
                  <td>${ex.series}x</td>
                  <td>${ex.repeticoes}</td>
                  <td class="obs">${ex.observacoes ?? "—"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Ficha de Treino — ${aluno.nome}</title>
          ${estilos}
        </head>
        <body>
          <h1>Ficha de Treino</h1>
          <div class="meta">
            <strong>Aluno:</strong> ${aluno.nome} &nbsp;|&nbsp;
            <strong>Ficha:</strong> ${ficha.nome} &nbsp;|&nbsp;
            <strong>Gerado em:</strong> ${dataHoje}
            ${ficha.personalNome ? ` &nbsp;|&nbsp; <strong>Personal:</strong> ${ficha.personalNome}` : ""}
          </div>
          ${categoriasHTML}
        </body>
      </html>
    `;

    const janela = window.open("", "_blank");
    if (!janela) return;
    janela.document.write(html);
    janela.document.close();
    janela.focus();
    setTimeout(() => janela.print(), 400);
  }

  // ---- Categorias disponíveis para adicionar (modo edição) ----

  const categoriasUsadas =
    fichaRascunho?.categorias?.map((c) => c.categoria) ?? [];
  const categoriasDisponiveis = CATEGORIAS_MUSCULARES.filter(
    (c) => !categoriasUsadas.includes(c)
  );

  // ============ RENDER: MODO EDIÇÃO ============

  if (modoEdicao && fichaRascunho) {
    return (
      <div className="space-y-5">
        {/* Header de edição */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">
              {ficha ? "Editar Ficha de Treino" : "Nova Ficha de Treino"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Alterações são salvas ao clicar em "Salvar ficha".
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={cancelarEdicao}>
              <X className="h-3.5 w-3.5 mr-1" />
              Cancelar
            </Button>
            <Button size="sm" onClick={salvarFicha}>
              <Save className="h-3.5 w-3.5 mr-1" />
              Salvar ficha
            </Button>
          </div>
        </div>

        {/* Nome da ficha */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Nome da ficha
          </label>
          <Input
            value={fichaRascunho.nome}
            onChange={(e) =>
              setFichaRascunho({ ...fichaRascunho, nome: e.target.value })
            }
            placeholder="Ex: Treino A — Hipertrofia"
            className="h-9"
          />
        </div>

        <Separator />

        {/* Categorias existentes */}
        {(fichaRascunho.categorias ?? []).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground space-y-1">
            <Dumbbell className="h-8 w-8 mx-auto opacity-30" />
            <p className="text-sm">Nenhuma categoria adicionada.</p>
            <p className="text-xs">Use os botões abaixo para começar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fichaRascunho.categorias!.map((cat, idx) => (
              <CategoriaEditor
                key={cat.categoria}
                categoriaExercicio={cat}
                onUpdate={(updated) => updateCategoria(idx, updated)}
                onRemoveCategoria={() => removeCategoria(idx)}
              />
            ))}
          </div>
        )}

        {/* Adicionar categoria */}
        {categoriasDisponiveis.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Adicionar categoria muscular
            </p>
            <div className="flex flex-wrap gap-2">
              {categoriasDisponiveis.map((cat) => (
                <Button
                  key={cat}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => adicionarCategoria(cat)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============ RENDER: MODO VISUALIZAÇÃO ============

  return (
    <div className="space-y-5">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          {ficha ? (
            <>
              <h3 className="text-sm font-semibold">{ficha.nome}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Atualizada em{" "}
                {format(new Date(ficha.atualizadaEm), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
                {ficha.personalNome && ` · ${ficha.personalNome}`}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma ficha cadastrada.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {ficha && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={gerarPDF}
            >
              <FileDown className="h-3.5 w-3.5 mr-1.5" />
              Gerar PDF
            </Button>
          )}
          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={iniciarEdicao}
          >
            {ficha ? (
              <>
                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                Editar ficha
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Criar ficha
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Conteúdo da ficha */}
      {ficha && ficha.categorias && ficha.categorias.length > 0 ? (
        <div className="space-y-3">
          {ficha.categorias.map((cat) => (
            <CategoriaView key={cat.categoria} categoriaExercicio={cat} />
          ))}
        </div>
      ) : (
        ficha && (
          <div className="text-center py-10 text-muted-foreground space-y-2">
            <Dumbbell className="h-8 w-8 mx-auto opacity-30" />
            <p className="text-sm">A ficha não possui exercícios cadastrados.</p>
            <Button variant="outline" size="sm" onClick={iniciarEdicao}>
              <Edit3 className="h-3.5 w-3.5 mr-1.5" />
              Adicionar exercícios
            </Button>
          </div>
        )
      )}

      {!ficha && (
        <div className="text-center py-10 text-muted-foreground space-y-2">
          <Dumbbell className="h-8 w-8 mx-auto opacity-30" />
          <p className="text-sm">Este aluno ainda não tem ficha de treino.</p>
          <Button size="sm" onClick={iniciarEdicao}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Criar ficha de treino
          </Button>
        </div>
      )}
    </div>
  );
}
