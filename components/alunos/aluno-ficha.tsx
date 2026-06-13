/**
 * ============================================================================
 * COMPONENTE: FICHA DO ALUNO (Sheet Lateral)
 * ============================================================================
 * 
 * Exibe detalhes completos do aluno em um drawer lateral.
 * 
 * ABAS:
 * 1. Dados Pessoais - Informações básicas e contato
 * 2. Plano & Financeiro - Histórico de pagamentos (gerente+)
 * 3. Treinos - Fichas de treino e check-ins
 * 
 * SEGURANÇA:
 * - CPF é mascarado por padrão
 * - Apenas ADMIN pode ver CPF completo
 * - Aba financeira protegida por RoleGate (minLevel=60)
 * 
 * TIP: Observações médicas são dados sensíveis (LGPD).
 * Exiba sempre um aviso ao lado do campo.
 */

"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Dumbbell,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleGate, useHasPermission } from "@/components/auth/role-gate";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/types/auth";
import {
  Aluno,
  AlunoDetalhes,
  Pagamento,
  FichaTreino,
  STATUS_ALUNO_CONFIG,
} from "@/types/aluno";

/**
 * Props do componente de ficha.
 */
interface AlunoFichaProps {
  /** Aluno básico (para exibição rápida) */
  aluno: Aluno | null;
  /** Se o sheet está aberto */
  open: boolean;
  /** Callback para fechar */
  onOpenChange: (open: boolean) => void;
}

// ============ DADOS MOCK ============
// TODO: Substituir por chamadas à API

const MOCK_DETALHES: AlunoDetalhes = {
  id: "1",
  nome: "João Silva",
  email: "joao@email.com",
  telefone: "(11) 99999-1111",
  dataMatricula: "2023-06-15",
  plano: "Mensal",
  status: "ativo",
  proximoVencimento: "2024-02-15",
  personalId: "p1",
  personalNome: "Carlos Trainer",
  cpf: "123.456.789-00",
  dataNascimento: "1990-05-20",
  endereco: {
    logradouro: "Rua das Flores",
    numero: "123",
    complemento: "Apto 45",
    bairro: "Centro",
    cidade: "São Paulo",
    estado: "SP",
    cep: "01234-567",
  },
  observacoesMedicas: "Histórico de lesão no joelho esquerdo. Evitar exercícios de alto impacto.",
  contatoEmergencia: {
    nome: "Maria Silva",
    telefone: "(11) 98888-0000",
    parentesco: "Mãe",
  },
};

const MOCK_PAGAMENTOS: Pagamento[] = [
  { id: "pg1", alunoId: "1", data: "2024-01-15", valor: 150, status: "pago", metodoPagamento: "pix" },
  { id: "pg2", alunoId: "1", data: "2023-12-15", valor: 150, status: "pago", metodoPagamento: "cartao_credito" },
  { id: "pg3", alunoId: "1", data: "2023-11-15", valor: 150, status: "pago", metodoPagamento: "pix" },
  { id: "pg4", alunoId: "1", data: "2023-10-15", valor: 150, status: "pago", metodoPagamento: "boleto" },
  { id: "pg5", alunoId: "1", data: "2023-09-15", valor: 150, status: "estornado", metodoPagamento: "cartao_credito" },
];

const MOCK_FICHAS: FichaTreino[] = [
  { id: "f1", nome: "Treino A - Superior", descricao: "Peito, Ombro e Tríceps", ativa: true, criadaEm: "2024-01-01", atualizadaEm: "2024-01-20", personalNome: "Carlos Trainer" },
  { id: "f2", nome: "Treino B - Inferior", descricao: "Pernas e Glúteos", ativa: true, criadaEm: "2024-01-01", atualizadaEm: "2024-01-15", personalNome: "Carlos Trainer" },
  { id: "f3", nome: "Treino C - Costas", descricao: "Costas e Bíceps", ativa: false, criadaEm: "2023-10-01", atualizadaEm: "2023-12-01", personalNome: "Ana Personal" },
];

/**
 * Formata data para exibição.
 */
function formatDate(data: string): string {
  return format(parseISO(data), "dd/MM/yyyy", { locale: ptBR });
}

/**
 * Formata valor monetário.
 */
function formatCurrency(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

/**
 * Mascara CPF para exibição.
 */
function maskCPF(cpf: string): string {
  return "***.***.***-" + cpf.slice(-2);
}

/**
 * Retorna iniciais do nome.
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
 * Ícone e cor do status de pagamento.
 */
function getStatusPagamentoConfig(status: Pagamento["status"]) {
  switch (status) {
    case "pago":
      return { icon: CheckCircle, className: "text-emerald-600" };
    case "pendente":
      return { icon: Clock, className: "text-amber-600" };
    case "cancelado":
    case "estornado":
      return { icon: XCircle, className: "text-red-600" };
  }
}

/**
 * Label do método de pagamento.
 */
function getMetodoPagamentoLabel(metodo: Pagamento["metodoPagamento"]): string {
  const labels: Record<Pagamento["metodoPagamento"], string> = {
    pix: "PIX",
    cartao_credito: "Cartão de Crédito",
    cartao_debito: "Cartão de Débito",
    dinheiro: "Dinheiro",
    boleto: "Boleto",
  };
  return labels[metodo];
}

export function AlunoFicha({ aluno, open, onOpenChange }: AlunoFichaProps) {
  const { user } = useAuth();
  const [showCPF, setShowCPF] = useState(false);
  const canAccessFinance = useHasPermission(60);

  // Usa dados mock enquanto API não está implementada
  // TODO: Buscar detalhes completos via API quando aluno mudar
  const detalhes = MOCK_DETALHES;
  const pagamentos = MOCK_PAGAMENTOS;
  const fichas = MOCK_FICHAS;

  // Verifica se usuário é admin para ver CPF completo
  const isAdmin = user?.role === UserRole.ADMIN;
  const podeVerCPF = isAdmin && showCPF;

  if (!aluno) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-4 px-6 pb-2 pt-6">
          {/* Header com avatar e info básica */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {getInitials(aluno.nome)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl">{aluno.nome}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={`${STATUS_ALUNO_CONFIG[aluno.status].bgClass} ${STATUS_ALUNO_CONFIG[aluno.status].textClass}`}
                >
                  {STATUS_ALUNO_CONFIG[aluno.status].label}
                </Badge>
                <span className="text-muted-foreground">•</span>
                <span>{aluno.plano}</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* ============ ABAS ============ */}
        {/* px-6: alinha o conteúdo das abas com o padding do header */}
        <Tabs defaultValue="dados" className="px-6 pb-8">
          <TabsList className={`w-full grid ${canAccessFinance ? "grid-cols-3" : "grid-cols-2"}`}>
            <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
            {/* Aba Financeiro só aparece para gerente+ */}
            <RoleGate minLevel={60} fallback={null}>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            </RoleGate>
            <TabsTrigger value="treinos">Treinos</TabsTrigger>
          </TabsList>

          {/* ============ ABA: DADOS PESSOAIS ============ */}
          <TabsContent value="dados" className="space-y-6 mt-6">
            {/* Informações de contato */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Contato</h3>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{aluno.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{aluno.telefone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Nascimento: {formatDate(detalhes.dataNascimento)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* CPF com proteção */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Documentos</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>CPF: {podeVerCPF ? detalhes.cpf : maskCPF(detalhes.cpf)}</span>
                </div>
                {/* Botão de revelar CPF só para admin */}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCPF(!showCPF)}
                  >
                    {showCPF ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Endereço</h3>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p>
                    {detalhes.endereco.logradouro}, {detalhes.endereco.numero}
                    {detalhes.endereco.complemento && ` - ${detalhes.endereco.complemento}`}
                  </p>
                  <p>
                    {detalhes.endereco.bairro}, {detalhes.endereco.cidade} - {detalhes.endereco.estado}
                  </p>
                  <p className="text-muted-foreground">CEP: {detalhes.endereco.cep}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Observações médicas - DADO SENSÍVEL */}
            {detalhes.observacoesMedicas && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Observações Médicas
                  </h3>
                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Dado Sensível
                  </Badge>
                </div>
                <p className="text-sm bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-900">
                  {detalhes.observacoesMedicas}
                </p>
              </div>
            )}

            {/* Contato de emergência */}
            {detalhes.contatoEmergencia && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Contato de Emergência
                  </h3>
                  <div className="text-sm">
                    <p className="font-medium">{detalhes.contatoEmergencia.nome}</p>
                    <p className="text-muted-foreground">
                      {detalhes.contatoEmergencia.parentesco} • {detalhes.contatoEmergencia.telefone}
                    </p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* ============ ABA: FINANCEIRO (GERENTE+) ============ */}
          <TabsContent value="financeiro" className="space-y-6 mt-6">
            {/* Resumo do plano */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Plano Atual
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tipo</p>
                  <p className="font-medium">{aluno.plano}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor</p>
                  <p className="font-medium">{formatCurrency(150)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Início</p>
                  <p className="font-medium">{formatDate(aluno.dataMatricula)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Próx. Vencimento</p>
                  <p className="font-medium">{formatDate(aluno.proximoVencimento)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Histórico de pagamentos */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Histórico de Pagamentos
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Método</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagamentos.map((pagamento) => {
                    const statusConfig = getStatusPagamentoConfig(pagamento.status);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <TableRow key={pagamento.id}>
                        <TableCell>{formatDate(pagamento.data)}</TableCell>
                        <TableCell>{formatCurrency(pagamento.valor)}</TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1.5 ${statusConfig.className}`}>
                            <StatusIcon className="h-4 w-4" />
                            <span className="capitalize">{pagamento.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {getMetodoPagamentoLabel(pagamento.metodoPagamento)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ============ ABA: TREINOS ============ */}
          <TabsContent value="treinos" className="space-y-6 mt-6">
            {/* Personal responsável */}
            {aluno.personalNome && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(aluno.personalNome)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Personal Trainer</p>
                  <p className="text-sm text-muted-foreground">{aluno.personalNome}</p>
                </div>
              </div>
            )}

            {/* Fichas de treino */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Fichas de Treino
              </h3>
              <div className="grid gap-3">
                {fichas.map((ficha) => (
                  <Card
                    key={ficha.id}
                    className={ficha.ativa ? "" : "opacity-60"}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-md">
                            <Dumbbell className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{ficha.nome}</p>
                              {ficha.ativa ? (
                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                                  Ativa
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Inativa</Badge>
                              )}
                            </div>
                            {ficha.descricao && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {ficha.descricao}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Atualizada em {formatDate(ficha.atualizadaEm)}
                              {ficha.personalNome && ` • ${ficha.personalNome}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Último check-in */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Último check-in</p>
              <p className="font-medium">Hoje às 07:45</p>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
