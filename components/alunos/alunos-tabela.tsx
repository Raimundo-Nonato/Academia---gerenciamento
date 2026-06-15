/**
 * ============================================================================
 * COMPONENTE: TABELA DE ALUNOS
 * ============================================================================
 * 
 * Tabela principal da listagem de alunos com:
 * - Seleção múltipla via checkbox
 * - Badges coloridos de status
 * - Destaque de vencimento próximo
 * - Ações por linha (dropdown)
 * - Estados de loading/vazio/erro
 * 
 * TIP: A tabela usa o padrão de composição do shadcn/ui.
 * Os estados vazios devem sempre oferecer uma ação ao usuário.
 */

"use client";

import { useState, useMemo } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MoreVertical,
  Eye,
  Pencil,
  UserX,
  Mail,
  Phone,
  AlertCircle,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Aluno, STATUS_ALUNO_CONFIG } from "@/types/aluno";

/**
 * Props do componente de tabela.
 */
interface AlunosTabelaProps {
  /** Lista de alunos a exibir */
  alunos: Aluno[];
  /** Estado de carregamento */
  isLoading?: boolean;
  /** Erro ao carregar */
  error?: string | null;
  /** Callback para tentar novamente após erro */
  onRetry?: () => void;
  /** Callback ao clicar em uma linha (abre ficha) */
  onAlunoClick: (aluno: Aluno) => void;
  /** Callback para editar aluno */
  onEdit: (aluno: Aluno) => void;
  /** Callback para suspender aluno */
  onSuspender: (aluno: Aluno) => void;
  /** Callback para criar novo aluno (estado vazio) */
  onNovoAluno: () => void;
  /** IDs dos alunos selecionados */
  selectedIds: string[];
  /** Callback quando seleção muda */
  onSelectionChange: (ids: string[]) => void;
}

/**
 * Retorna as iniciais do nome para o avatar.
 * Ex: "João Silva" -> "JS"
 */
function getInitials(nome: string): string {
  return nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Verifica se o vencimento está próximo (< 5 dias).
 */
function isVencimentoProximo(data: string): boolean {
  const dias = differenceInDays(parseISO(data), new Date());
  return dias >= 0 && dias < 5;
}

/**
 * Verifica se já venceu.
 */
function isVencido(data: string): boolean {
  return differenceInDays(parseISO(data), new Date()) < 0;
}

/**
 * Formata data para exibição.
 */
function formatDate(data: string): string {
  return format(parseISO(data), "dd/MM/yyyy", { locale: ptBR });
}

/**
 * Skeleton de loading para a tabela.
 * Exibe 7 linhas conforme especificado.
 */
function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Skeleton className="h-4 w-4" />
          </TableHead>
          <TableHead>
            <Skeleton className="h-4 w-20" />
          </TableHead>
          <TableHead>
            <Skeleton className="h-4 w-16" />
          </TableHead>
          <TableHead>
            <Skeleton className="h-4 w-12" />
          </TableHead>
          <TableHead>
            <Skeleton className="h-4 w-16" />
          </TableHead>
          <TableHead>
            <Skeleton className="h-4 w-20" />
          </TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 7 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <Skeleton className="h-4 w-4" />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-8" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * Estado vazio quando não há alunos.
 */
function EmptyState({ onNovoAluno }: { onNovoAluno: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Ilustração simples usando ícone */}
      <div className="mb-4 rounded-full bg-muted p-4">
        <UserPlus className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Nenhum aluno encontrado</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        Não encontramos alunos com os filtros aplicados. Tente ajustar os filtros ou cadastre um novo aluno.
      </p>
      <Button onClick={onNovoAluno}>
        <UserPlus className="h-4 w-4 mr-2" />
        Cadastrar primeiro aluno
      </Button>
    </div>
  );
}

/**
 * Estado de erro com opção de tentar novamente.
 */
function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 rounded-full bg-destructive/10 p-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Falha ao carregar alunos</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Ocorreu um erro ao buscar os dados. Por favor, tente novamente.
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function AlunosTabela({
  alunos,
  isLoading = false,
  error = null,
  onRetry,
  onAlunoClick,
  onEdit,
  onSuspender,
  onNovoAluno,
  selectedIds,
  onSelectionChange,
}: AlunosTabelaProps) {
  // Estado para dialog de confirmação de suspensão
  const [alunoParaSuspender, setAlunoParaSuspender] = useState<Aluno | null>(null);

  /**
   * Verifica se todos os alunos visíveis estão selecionados.
   */
  const allSelected = useMemo(() => {
    return alunos.length > 0 && alunos.every((a) => selectedIds.includes(a.id));
  }, [alunos, selectedIds]);

  /**
   * Verifica se alguns (mas não todos) estão selecionados.
   */
  const someSelected = useMemo(() => {
    return selectedIds.length > 0 && !allSelected;
  }, [selectedIds, allSelected]);

  /**
   * Toggle seleção de todos.
   */
  const toggleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(alunos.map((a) => a.id));
    }
  };

  /**
   * Toggle seleção individual.
   */
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  /**
   * Confirma suspensão do aluno.
   */
  const confirmarSuspensao = () => {
    if (alunoParaSuspender) {
      onSuspender(alunoParaSuspender);
      setAlunoParaSuspender(null);
    }
  };

  // ============ ESTADOS ESPECIAIS ============

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (error) {
    return <ErrorState onRetry={onRetry} />;
  }

  if (alunos.length === 0) {
    return <EmptyState onNovoAluno={onNovoAluno} />;
  }

  // ============ TABELA PRINCIPAL ============

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {/* Checkbox de seleção geral */}
            <TableHead className="w-12">
              <Checkbox
                checked={someSelected ? "indeterminate" : allSelected}
                onCheckedChange={toggleSelectAll}
                aria-label="Selecionar todos"
              />
            </TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Próx. Vencimento</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alunos.map((aluno) => {
            const vencimentoProximo = isVencimentoProximo(aluno.proximoVencimento);
            const vencido = isVencido(aluno.proximoVencimento);

            return (
              <TableRow
                key={aluno.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onAlunoClick(aluno)}
              >
                {/* Checkbox individual */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.includes(aluno.id)}
                    onCheckedChange={() => toggleSelect(aluno.id)}
                    aria-label={`Selecionar ${aluno.nome}`}
                  />
                </TableCell>

                {/* Nome com avatar */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {getInitials(aluno.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{aluno.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {aluno.personalNome ? `Personal: ${aluno.personalNome}` : "Sem personal"}
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* Contato */}
                <TableCell>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate max-w-[200px]">{aluno.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      {aluno.telefone}
                    </div>
                  </div>
                </TableCell>

                {/* Status com badge colorido */}
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`${STATUS_ALUNO_CONFIG[aluno.status].bgClass} ${STATUS_ALUNO_CONFIG[aluno.status].textClass}`}
                  >
                    {STATUS_ALUNO_CONFIG[aluno.status].label}
                  </Badge>
                </TableCell>

                {/* Vencimento com destaque condicional */}
                <TableCell>
                  <span
                    className={`text-sm ${
                      vencido
                        ? "text-destructive font-medium"
                        : vencimentoProximo
                          ? "text-amber-600 font-medium"
                          : ""
                    }`}
                  >
                    {formatDate(aluno.proximoVencimento)}
                    {vencido && " (Vencido)"}
                    {vencimentoProximo && !vencido && " (Em breve)"}
                  </span>
                </TableCell>

                {/* Menu de ações */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Abrir menu de ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onAlunoClick(aluno)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver ficha
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(aluno)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setAlunoParaSuspender(aluno)}
                        className="text-destructive focus:text-destructive"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Suspender
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* ============ DIALOG DE CONFIRMAÇÃO ============ */}
      <AlertDialog
        open={!!alunoParaSuspender}
        onOpenChange={(open) => !open && setAlunoParaSuspender(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspender aluno?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a suspender o aluno{" "}
              <strong>{alunoParaSuspender?.nome}</strong>. O aluno não poderá
              acessar a academia até que a suspensão seja removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarSuspensao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Suspender
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
