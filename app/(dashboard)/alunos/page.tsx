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
 * - Seleção múltipla para ações em lote
 * - Ficha do aluno em sheet lateral
 * - Cadastro via modal wizard (3 passos)
 * - Estados: loading, vazio, erro
 * 
 * PRÓXIMOS PASSOS (TODO):
 * - Integrar com API real (substituir MOCK_DATA)
 * - Implementar ações em lote
 * - Adicionar exportação para Excel/CSV
 * - Implementar busca server-side para melhor performance
 * 
 * TIP: Em produção, mova a lógica de estado para um hook customizado
 * (ex: useAlunos) para separar concerns e facilitar testes.
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlunosFiltros,
  AlunosTabela,
  AlunosPaginacao,
  AlunoFicha,
  NovoAlunoModal,
} from "@/components/alunos";
import { Aluno, FiltrosAluno, NovoAlunoData } from "@/types/aluno";

// ============ DADOS MOCK ============
// TODO: Substituir por chamadas à API

/**
 * Dados mock de alunos para desenvolvimento.
 * Em produção, buscar via API com paginação server-side.
 */
const MOCK_ALUNOS: Aluno[] = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    nome: "João Silva",
    email: "joao.silva@email.com",
    telefone: "(11) 99999-1111",
    dataMatricula: "2023-06-15",
    plano: "Mensal",
    status: "ativo",
    proximoVencimento: "2024-02-15",
    personalId: "p1",
    personalNome: "Carlos Trainer",
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    nome: "Maria Santos",
    email: "maria.santos@email.com",
    telefone: "(11) 99999-2222",
    dataMatricula: "2023-08-20",
    plano: "Trimestral",
    status: "ativo",
    proximoVencimento: "2024-03-20",
    personalId: null,
    personalNome: null,
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-345678901234",
    nome: "Pedro Oliveira",
    email: "pedro.oliveira@email.com",
    telefone: "(11) 99999-3333",
    dataMatricula: "2023-01-10",
    plano: "Anual",
    status: "ativo",
    proximoVencimento: "2024-12-10",
    personalId: "p2",
    personalNome: "Ana Personal",
  },
  {
    id: "d4e5f6a7-b8c9-0123-defa-456789012345",
    nome: "Ana Costa",
    email: "ana.costa@email.com",
    telefone: "(11) 99999-4444",
    dataMatricula: "2023-05-05",
    plano: "Mensal",
    status: "inadimplente",
    proximoVencimento: "2024-01-05",
    personalId: null,
    personalNome: null,
  },
  {
    id: "e5f6a7b8-c9d0-1234-efab-567890123456",
    nome: "Carlos Ferreira",
    email: "carlos.ferreira@email.com",
    telefone: "(11) 99999-5555",
    dataMatricula: "2023-07-30",
    plano: "Semestral",
    status: "ativo",
    proximoVencimento: "2024-06-30",
    personalId: "p1",
    personalNome: "Carlos Trainer",
  },
  {
    id: "f6a7b8c9-d0e1-2345-fabc-678901234567",
    nome: "Juliana Lima",
    email: "juliana.lima@email.com",
    telefone: "(11) 99999-6666",
    dataMatricula: "2022-11-15",
    plano: "Anual",
    status: "suspenso",
    proximoVencimento: "2024-11-15",
    personalId: "p2",
    personalNome: "Ana Personal",
  },
  {
    id: "a7b8c9d0-e1f2-3456-abcd-789012345678",
    nome: "Roberto Almeida",
    email: "roberto.almeida@email.com",
    telefone: "(11) 99999-7777",
    dataMatricula: "2023-09-01",
    plano: "Mensal",
    status: "ativo",
    proximoVencimento: "2024-02-01",
    personalId: null,
    personalNome: null,
  },
  {
    id: "b8c9d0e1-f2a3-4567-bcde-890123456789",
    nome: "Fernanda Souza",
    email: "fernanda.souza@email.com",
    telefone: "(11) 99999-8888",
    dataMatricula: "2023-03-10",
    plano: "Trimestral",
    status: "ativo",
    proximoVencimento: "2024-03-10",
    personalId: "p1",
    personalNome: "Carlos Trainer",
  },
  {
    id: "c9d0e1f2-a3b4-5678-cdef-901234567890",
    nome: "Lucas Martins",
    email: "lucas.martins@email.com",
    telefone: "(11) 99999-9999",
    dataMatricula: "2023-04-22",
    plano: "Mensal",
    status: "cancelado",
    proximoVencimento: "2023-12-22",
    personalId: null,
    personalNome: null,
  },
  {
    id: "d0e1f2a3-b4c5-6789-defa-012345678901",
    nome: "Beatriz Rocha",
    email: "beatriz.rocha@email.com",
    telefone: "(11) 98888-0000",
    dataMatricula: "2023-10-05",
    plano: "Semestral",
    status: "ativo",
    proximoVencimento: "2024-04-05",
    personalId: "p2",
    personalNome: "Ana Personal",
  },
];

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

export default function AlunosPage() {
  // ============ ESTADOS ============

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
   * Aplica filtros nos dados mock.
   * 
   * IMPORTANTE: Em produção, fazer filtragem no backend
   * para melhor performance com grandes volumes de dados.
   */
  const alunosFiltrados = useMemo(() => {
    return MOCK_ALUNOS.filter((aluno) => {
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

      // Filtro de plano
      if (filtros.plano && aluno.plano !== filtros.plano) {
        return false;
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
  }, [filtros]);

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
    // Por enquanto, apenas abre a ficha
    setAlunoSelecionado(aluno);
    setFichaAberta(true);
    // TODO: Passar prop de modo edição para AlunoFicha
  }, []);

  /**
   * Suspende aluno.
   * TODO: Chamar API para persistir mudança.
   */
  const handleSuspender = useCallback((aluno: Aluno) => {
    // TODO: Chamar API
    console.log("Suspender aluno:", aluno.id);
    // Simulação de feedback
    alert(`Aluno ${aluno.nome} suspenso com sucesso!`);
  }, []);

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
   * Salva novo aluno.
   * TODO: Chamar API para persistir.
   */
  const handleSaveNovoAluno = useCallback(async (data: NovoAlunoData) => {
    // Simula delay de API
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // TODO: Chamar API POST /alunos
    console.log("Novo aluno:", data);
    
    // Em produção, recarregar lista após sucesso
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
            totalAlunos={MOCK_ALUNOS.length}
            alunosExibidos={alunosFiltrados.length}
            personais={MOCK_PERSONAIS}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* ============ TABELA DE ALUNOS ============ */}
      <Card>
        <CardContent className="p-0">
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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {selectedIds.length} aluno(s) selecionado(s)
          </span>
          {/* TODO: Implementar ações em lote */}
          <button
            onClick={() => setSelectedIds([])}
            className="text-sm text-primary hover:underline"
          >
            Limpar seleção
          </button>
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
