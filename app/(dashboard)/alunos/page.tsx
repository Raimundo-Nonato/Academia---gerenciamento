/**
 * ============================================================================
 * PÁGINA DE ALUNOS - LISTAGEM PRINCIPAL
 * ============================================================================
 *
 * Página principal do módulo de gestão de alunos.
 *
 * FUNCIONALIDADES:
 * - Listagem com busca e filtros (debounce 300ms)
 * - Paginação (25 itens por página)
 * - Seleção múltipla com ações em lote (suspender, exportar CSV)
 * - Ficha do aluno em sheet lateral
 * - Cadastro via modal wizard (3 passos) — novo aluno entra na lista
 * - Suspensão com confirmação — atualiza o status de verdade
 * - Estados: loading, vazio, erro
 *
 * PRÓXIMOS PASSOS (TODO):
 * - Integrar com API real (substituir estado local por fetch)
 * - Implementar busca server-side para melhor performance
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { addMonths, format } from "date-fns";
import { useAlunos } from "@/contexts/alunos-context";
import { Plus, Download, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlunosFiltros,
  AlunosTabela,
  AlunosPaginacao,
  AlunoFicha,
  NovoAlunoModal,
} from "@/components/alunos";
import {
  Aluno,
  FiltrosAluno,
  NovoAlunoData,
} from "@/types/aluno";

// ============ DADOS ============
// Os dados mock agora vivem em AlunosContext (contexts/alunos-context.tsx)
// e são compartilhados com o módulo Financeiro.

/**
 * Lista mock de personais para filtros e cadastro.
 */
const MOCK_PERSONAIS = [
  { id: "p1", nome: "Carlos Trainer" },
  { id: "p2", nome: "Ana Personal" },
  { id: "p3", nome: "Bruno Coach" },
];

/**
 * Configuração de paginação.
 * TIP: 25 itens é um bom balanço entre usabilidade e performance.
 */
const ITENS_POR_PAGINA = 25;

/**
 * Gera e baixa um CSV dos alunos informados.
 * Usa ; como separador e BOM UTF-8 para abrir corretamente no Excel pt-BR.
 */
function exportarCSV(alunos: Aluno[]) {
  const cabecalho = [
    "Nome",
    "Email",
    "Telefone",
    "Plano",
    "Status",
    "Matricula",
    "Proximo Vencimento",
    "Personal",
  ];

  const linhas = alunos.map((a) =>
    [
      a.nome,
      a.email,
      a.telefone,
      a.plano,
      a.status,
      a.dataMatricula,
      a.proximoVencimento,
      a.personalNome ?? "",
    ]
      .map((campo) => `"${String(campo).replaceAll('"', '""')}"`)
      .join(";")
  );

  const csv = "﻿" + [cabecalho.join(";"), ...linhas].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `alunos-${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AlunosPage() {
  // ============ ESTADOS ============

  // Lista de alunos vinda do contexto global (compartilhada com o Financeiro)
  const { alunos, setAlunos } = useAlunos();

  // Estado de loading/erro (simula chamada à API)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros aplicados
  const [filtros, setFiltros] = useState<FiltrosAluno>({});

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Seleção de alunos
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Ficha do aluno (sheet lateral)
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [fichaAberta, setFichaAberta] = useState(false);

  // Modal de novo aluno
  const [modalNovoAlunoAberto, setModalNovoAlunoAberto] = useState(false);

  // ============ FILTRAGEM (client-side para demo) ============

  /**
   * Aplica filtros nos dados.
   *
   * IMPORTANTE: Em produção, fazer filtragem no backend
   * para melhor performance com grandes volumes de dados.
   */
  const alunosFiltrados = useMemo(() => {
    return alunos.filter((aluno) => {
      // Filtro de busca (nome ou email)
      if (filtros.busca) {
        const termo = filtros.busca.toLowerCase();
        const matchNome = aluno.nome.toLowerCase().includes(termo);
        const matchEmail = aluno.email.toLowerCase().includes(termo);
        if (!matchNome && !matchEmail) return false;
      }

      // Filtro de status (múltiplos)
      if (filtros.status && filtros.status.length > 0) {
        if (!filtros.status.includes(aluno.status)) return false;
      }

      // Filtro de personal
      if (filtros.personalId) {
        if (filtros.personalId === "sem_personal") {
          if (aluno.personalId !== null) return false;
        } else {
          if (aluno.personalId !== filtros.personalId) return false;
        }
      }

      return true;
    });
  }, [alunos, filtros]);

  // ============ PAGINAÇÃO ============

  const totalPaginas = Math.ceil(alunosFiltrados.length / ITENS_POR_PAGINA);

  /**
   * Alunos da página atual.
   */
  const alunosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    return alunosFiltrados.slice(inicio, fim);
  }, [alunosFiltrados, paginaAtual]);

  // ============ HANDLERS ============

  /**
   * Atualiza filtros e reseta para página 1.
   */
  const handleFiltrosChange = useCallback((novosFiltros: FiltrosAluno) => {
    setFiltros(novosFiltros);
    setPaginaAtual(1); // Volta para primeira página ao filtrar
    setSelectedIds([]); // Limpa seleção ao filtrar
  }, []);

  /**
   * Abre ficha do aluno.
   */
  const handleAlunoClick = useCallback((aluno: Aluno) => {
    setAlunoSelecionado(aluno);
    setFichaAberta(true);
  }, []);

  /**
   * Edita aluno (abre ficha em modo edição).
   * TODO: Implementar modo de edição na ficha.
   */
  const handleEdit = useCallback((aluno: Aluno) => {
    setAlunoSelecionado(aluno);
    setFichaAberta(true);
  }, []);

  /**
   * Suspende um aluno — atualiza o status na lista.
   * TODO: Chamar API para persistir mudança.
   */
  const handleSuspender = useCallback((aluno: Aluno) => {
    setAlunos((prev) =>
      prev.map((a) => (a.id === aluno.id ? { ...a, status: "suspenso" } : a))
    );
    toast.success(`${aluno.nome} foi suspenso(a)`, {
      description: "O acesso à academia ficará bloqueado até a reativação.",
    });
  }, []);

  /**
   * Suspende todos os alunos selecionados (ação em lote).
   * TODO: Chamar API em lote.
   */
  const handleSuspenderSelecionados = useCallback(() => {
    setAlunos((prev) =>
      prev.map((a) =>
        selectedIds.includes(a.id) ? { ...a, status: "suspenso" } : a
      )
    );
    toast.success(`${selectedIds.length} aluno(s) suspenso(s)`);
    setSelectedIds([]);
  }, [selectedIds]);

  /**
   * Exporta os alunos selecionados (ou todos os filtrados) para CSV.
   */
  const handleExportarCSV = useCallback(() => {
    const paraExportar =
      selectedIds.length > 0
        ? alunosFiltrados.filter((a) => selectedIds.includes(a.id))
        : alunosFiltrados;

    exportarCSV(paraExportar);
    toast.success(`CSV exportado com ${paraExportar.length} aluno(s)`);
  }, [alunosFiltrados, selectedIds]);

  /**
   * Tenta recarregar dados após erro.
   */
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    // Simula chamada à API
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  /**
   * Salva novo aluno — entra no topo da lista.
   * Registra método de pagamento e aplica mensalidade padrão.
   * TODO: Chamar API POST /alunos.
   */
  const handleSaveNovoAluno = useCallback(async (data: NovoAlunoData) => {
    // Simula delay de API
    await new Promise((resolve) => setTimeout(resolve, 800));

    const personal = MOCK_PERSONAIS.find((p) => p.id === data.personalId);
    // Próximo vencimento: 1 mês após o início (mensalidade padrão)
    const vencimento = addMonths(
      new Date(`${data.dataInicio}T12:00:00`),
      1
    );

    const novoAluno: Aluno = {
      id: crypto.randomUUID(),
      nome: data.nome,
      email: data.email,
      telefone: data.telefone || "",
      dataMatricula: data.dataInicio,
      status: "ativo",
      proximoVencimento: format(vencimento, "yyyy-MM-dd"),
      personalId: data.personalId ?? null,
      personalNome: personal?.nome ?? null,
    };

    setAlunos((prev) => [novoAluno, ...prev]);
    setPaginaAtual(1);

    toast.success(`${data.nome} matriculado(a) com sucesso!`);
  }, []);

  // ============ RENDER ============

  return (
    <>
      {/* Header da página com botão de ação */}
      <PageHeader
        title="Alunos"
        description="Gerencie os alunos cadastrados na academia"
        action={{
          label: "Novo Aluno",
          icon: Plus,
          onClick: () => setModalNovoAlunoAberto(true),
        }}
      />

      {/* ============ CARD DE FILTROS ============ */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <AlunosFiltros
            filtros={filtros}
            onFiltrosChange={handleFiltrosChange}
            totalAlunos={alunos.length}
            alunosExibidos={alunosFiltrados.length}
            personais={MOCK_PERSONAIS}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* ============ TABELA DE ALUNOS ============ */}
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <AlunosTabela
            alunos={alunosPaginados}
            isLoading={isLoading}
            error={error}
            onRetry={handleRetry}
            onAlunoClick={handleAlunoClick}
            onEdit={handleEdit}
            onSuspender={handleSuspender}
            onNovoAluno={() => setModalNovoAlunoAberto(true)}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </CardContent>
      </Card>

      {/* ============ PAGINAÇÃO ============ */}
      {alunosFiltrados.length > 0 && (
        <AlunosPaginacao
          paginaAtual={paginaAtual}
          totalPaginas={totalPaginas}
          totalItens={alunosFiltrados.length}
          itensPorPagina={ITENS_POR_PAGINA}
          onPaginaChange={setPaginaAtual}
        />
      )}

      {/* ============ BARRA DE AÇÕES EM LOTE ============ */}
      {selectedIds.length > 0 && (
        <div className="rise fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-card py-2 pl-4 pr-2 shadow-lg">
          <span className="whitespace-nowrap text-sm font-medium tabular-nums">
            {selectedIds.length} selecionado(s)
          </span>
          <span className="h-5 w-px bg-border" aria-hidden />
          <Button variant="ghost" size="sm" onClick={handleExportarCSV}>
            <Download className="mr-1.5 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSuspenderSelecionados}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <UserX className="mr-1.5 h-4 w-4" />
            Suspender
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedIds([])}
            className="h-8 w-8 rounded-full"
            aria-label="Limpar seleção"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ============ FICHA DO ALUNO (Sheet) ============ */}
      <AlunoFicha
        aluno={alunoSelecionado}
        open={fichaAberta}
        onOpenChange={setFichaAberta}
      />

      {/* ============ MODAL NOVO ALUNO ============ */}
      <NovoAlunoModal
        open={modalNovoAlunoAberto}
        onOpenChange={setModalNovoAlunoAberto}
        onSave={handleSaveNovoAluno}
        personais={MOCK_PERSONAIS}
      />
    </>
  );
}
