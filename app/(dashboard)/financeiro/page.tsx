"use client";

/**
 * ============================================================================
 * PÁGINA FINANCEIRA
 * ============================================================================
 *
 * Gestão financeira da academia com lançamentos manuais.
 *
 * ACESSO: Apenas gerentes e administradores (minLevel: 60)
 *
 * FUNCIONALIDADES:
 * - Cadastro manual de lançamentos (Mensalidade, Despesa, Estorno)
 * - KPIs calculados dinamicamente dos lançamentos
 * - Gráfico de evolução Receitas vs Despesas (6 meses) alimentado pelos lançamentos
 * - Lista de lançamentos com edição e exclusão
 */

import { useState, useMemo } from "react";
import { format, subMonths, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  X,
  Check,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useAlunos } from "@/contexts/alunos-context";
import { toast } from "sonner";

// ============ TIPOS ============

type Categoria = "mensalidade" | "despesa" | "estorno";
type FormaPagamento = "pix" | "dinheiro";

interface Lancamento {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: Categoria;
  formaPagamento: FormaPagamento;
  criadoEm: string;
  emailAluno?: string;
}

// ============ CONSTANTES ============

const categoriaConfig: Record<Categoria, { label: string; badgeClass: string; icon: React.ElementType; valorClass: string }> = {
  mensalidade: {
    label: "Mensalidade",
    badgeClass: "bg-success/10 text-success",
    icon: ArrowUpRight,
    valorClass: "text-success",
  },
  despesa: {
    label: "Despesa",
    badgeClass: "bg-destructive/10 text-destructive",
    icon: ArrowDownRight,
    valorClass: "text-destructive",
  },
  estorno: {
    label: "Estorno",
    badgeClass: "bg-warning/10 text-warning",
    icon: RefreshCw,
    valorClass: "text-warning",
  },
};

const formaPagamentoConfig: Record<FormaPagamento, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
};

const chartConfig = {
  receitas: {
    label: "Receitas",
    color: "var(--chart-2)",
  },
  despesas: {
    label: "Despesas",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

// ============ HELPERS ============

function gerarId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseMoeda(valor: string): number {
  // Suporta "R$ 1.234,56", "1.234,56", "1234.56", "1234,56"
  const limpo = valor
    .replace(/R\$\s*/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : num;
}

function hoje(): string {
  return format(new Date(), "yyyy-MM-dd");
}

// ============ FORM STATE ============

interface FormState {
  descricao: string;
  valor: string;
  data: string;
  categoria: Categoria | "";
  formaPagamento: FormaPagamento | "";
  /** Obrigatório apenas quando categoria === "mensalidade" */
  emailAluno: string;
}

const FORM_VAZIO: FormState = {
  descricao: "",
  valor: "",
  data: hoje(),
  categoria: "",
  formaPagamento: "",
  emailAluno: "",
};

// ============ COMPONENTES AUXILIARES ============

function KpiCard({
  titulo,
  valor,
  subtitulo,
  icon: Icon,
  iconClass,
  valorClass,
  delay = 0,
}: {
  titulo: string;
  valor: string;
  subtitulo?: React.ReactNode;
  icon: React.ElementType;
  iconClass: string;
  valorClass?: string;
  delay?: number;
}) {
  return (
    <Card className="rise" style={{ animationDelay: `${delay}ms` }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {titulo}
        </CardTitle>
        <span className={cn("rounded-md p-2", iconClass)}>
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className={cn("font-display text-2xl font-bold tabular-nums", valorClass)}>
          {valor}
        </p>
        {subtitulo && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitulo}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ============ MODAL DE VISUALIZAÇÃO ============

function ModalVisualizacao({
  lancamento,
  onClose,
}: {
  lancamento: Lancamento | null;
  onClose: () => void;
}) {
  if (!lancamento) return null;
  const cat = categoriaConfig[lancamento.categoria];
  const Icon = cat.icon;
  return (
    <Dialog open={!!lancamento} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhe do Lançamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3">
            <span className={cn("mt-0.5 rounded-md p-2", cat.badgeClass.replace("text-", "bg-").replace("bg-", "bg-opacity-10 text-"))}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">{lancamento.descricao}</p>
              <p className={cn("text-lg font-bold tabular-nums", cat.valorClass)}>
                {lancamento.categoria === "despesa" ? "- " : "+ "}
                {formatCurrency(lancamento.valor)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Data</p>
              <p className="font-medium">{formatDate(lancamento.data)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Categoria</p>
              <Badge variant="secondary" className={cat.badgeClass}>{cat.label}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Forma de Pagamento</p>
              <p className="font-medium">{formaPagamentoConfig[lancamento.formaPagamento]}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cadastrado em</p>
              <p className="font-medium">{formatDate(lancamento.criadoEm.slice(0, 10))}</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ MODAL DE FORMULÁRIO ============

function ModalFormulario({
  aberto,
  titulo,
  form,
  erro,
  onClose,
  onChange,
  onSubmit,
}: {
  aberto: boolean;
  titulo: string;
  form: FormState;
  erro: string;
  onClose: () => void;
  onChange: (campo: keyof FormState, valor: string) => void;
  onSubmit: () => void;
}) {
  const isMensalidade = form.categoria === "mensalidade";

  return (
    <Dialog open={aberto} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para registrar o lançamento.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              placeholder="Ex: Mensalidade João Silva"
              value={form.descricao}
              onChange={(e) => onChange("descricao", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="valor">Valor</Label>
            <Input
              id="valor"
              placeholder="Ex: 150,00"
              value={form.valor}
              onChange={(e) => onChange("valor", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="data">Data</Label>
            <Input
              id="data"
              type="date"
              value={form.data}
              onChange={(e) => onChange("data", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select
              value={form.categoria}
              onValueChange={(v) => onChange("categoria", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensalidade">Mensalidade</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
                <SelectItem value="estorno">Estorno</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isMensalidade && (
            <div className="space-y-1.5">
              <Label htmlFor="emailAluno">
                E-mail do Aluno{" "}
                <span className="text-destructive" aria-hidden>*</span>
              </Label>
              <Input
                id="emailAluno"
                type="email"
                placeholder="aluno@email.com"
                value={form.emailAluno}
                onChange={(e) => onChange("emailAluno", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Deve corresponder a um aluno cadastrado no sistema.
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Forma de Pagamento</Label>
            <Select
              value={form.formaPagamento}
              onValueChange={(v) => onChange("formaPagamento", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-1.5 h-4 w-4" /> Cancelar
          </Button>
          <Button onClick={onSubmit}>
            <Check className="mr-1.5 h-4 w-4" /> Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ MODAL DE CONFIRMAÇÃO ============

function ModalConfirmacao({
  aberto,
  onClose,
  onConfirmar,
}: {
  aberto: boolean;
  onClose: () => void;
  onConfirmar: () => void;
}) {
  return (
    <Dialog open={aberto} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Excluir lançamento?</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. O lançamento será removido permanentemente e os valores serão recalculados.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirmar}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ PÁGINA PRINCIPAL ============

export default function FinanceiroPage() {
  const { buscarAlunoPorEmail, registrarPagamento } = useAlunos();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);

  // Modal: novo lançamento
  const [modalNovo, setModalNovo] = useState(false);
  const [formNovo, setFormNovo] = useState<FormState>(FORM_VAZIO);
  const [erroNovo, setErroNovo] = useState("");

  // Modal: edição
  const [lancamentoEditando, setLancamentoEditando] = useState<Lancamento | null>(null);
  const [formEdicao, setFormEdicao] = useState<FormState>(FORM_VAZIO);
  const [erroEdicao, setErroEdicao] = useState("");

  // Modal: visualização
  const [lancamentoVisualizando, setLancamentoVisualizando] = useState<Lancamento | null>(null);

  // Modal: exclusão
  const [idExcluindo, setIdExcluindo] = useState<string | null>(null);

  // ============ CÁLCULOS ============

  const resumo = useMemo(() => {
    let totalMensalidades = 0;
    let totalDespesas = 0;
    let totalEstornos = 0;

    for (const l of lancamentos) {
      if (l.categoria === "mensalidade") totalMensalidades += l.valor;
      else if (l.categoria === "despesa") totalDespesas += l.valor;
      else if (l.categoria === "estorno") totalEstornos += l.valor;
    }

    // Estornos reduzem as receitas (mensalidades)
    const saldo = totalMensalidades - totalEstornos - totalDespesas;

    return { totalMensalidades, totalDespesas, totalEstornos, saldo };
  }, [lancamentos]);

  // Gráfico: últimos 6 meses
  const evolucaoFinanceira = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const mes = subMonths(new Date(), 5 - index);
      const inicio = startOfMonth(mes);
      const fim = endOfMonth(mes);

      let receitas = 0;
      let despesas = 0;

      for (const l of lancamentos) {
        const data = parseISO(l.data);
        if (!isWithinInterval(data, { start: inicio, end: fim })) continue;
        if (l.categoria === "mensalidade") receitas += l.valor;
        else if (l.categoria === "estorno") receitas -= l.valor; // estorno reduz receita
        else if (l.categoria === "despesa") despesas += l.valor;
      }

      return {
        mes: format(mes, "MMM", { locale: ptBR }),
        receitas: Math.max(0, receitas),
        despesas,
      };
    });
  }, [lancamentos]);

  // ============ HANDLERS ============

  function validarForm(form: FormState): string {
    if (!form.descricao.trim()) return "Informe a descrição.";
    if (!form.valor.trim()) return "Informe o valor.";
    const valor = parseMoeda(form.valor);
    if (valor <= 0) return "Informe um valor válido maior que zero.";
    if (!form.data) return "Informe a data.";
    if (!form.categoria) return "Selecione a categoria.";
    if (!form.formaPagamento) return "Selecione a forma de pagamento.";
    if (form.categoria === "mensalidade" && !form.emailAluno.trim())
      return "Informe o e-mail do aluno para registrar a mensalidade.";
    return "";
  }

  function handleCriar() {
    const erro = validarForm(formNovo);
    if (erro) { setErroNovo(erro); return; }

    // Integração com módulo de Alunos: valida e atualiza ao registrar mensalidade
    if (formNovo.categoria === "mensalidade") {
      const aluno = buscarAlunoPorEmail(formNovo.emailAluno);
      if (!aluno) {
        setErroNovo("E-mail não encontrado. Verifique se o aluno está cadastrado.");
        return;
      }
      const statusAnterior = aluno.status;
      registrarPagamento(formNovo.emailAluno);
      if (statusAnterior === "inadimplente") {
        toast.success(`${aluno.nome} atualizado para Ativo`, {
          description: "O status inadimplente foi removido após o registro da mensalidade.",
        });
      }
    }

    const novo: Lancamento = {
      id: gerarId(),
      descricao: formNovo.descricao.trim(),
      valor: parseMoeda(formNovo.valor),
      data: formNovo.data,
      categoria: formNovo.categoria as Categoria,
      formaPagamento: formNovo.formaPagamento as FormaPagamento,
      criadoEm: new Date().toISOString(),
    };

    setLancamentos((prev) => [novo, ...prev]);
    setModalNovo(false);
    setFormNovo(FORM_VAZIO);
    setErroNovo("");
  }

  function abrirEdicao(lancamento: Lancamento) {
    setLancamentoEditando(lancamento);
    setFormEdicao({
      descricao: lancamento.descricao,
      valor: lancamento.valor.toFixed(2).replace(".", ","),
      data: lancamento.data,
      categoria: lancamento.categoria,
      formaPagamento: lancamento.formaPagamento,
    });
    setErroEdicao("");
  }

  function handleSalvarEdicao() {
    if (!lancamentoEditando) return;
    const erro = validarForm(formEdicao);
    if (erro) { setErroEdicao(erro); return; }

    setLancamentos((prev) =>
      prev.map((l) =>
        l.id === lancamentoEditando.id
          ? {
            ...l,
            descricao: formEdicao.descricao.trim(),
            valor: parseMoeda(formEdicao.valor),
            data: formEdicao.data,
            categoria: formEdicao.categoria as Categoria,
            formaPagamento: formEdicao.formaPagamento as FormaPagamento,
          }
          : l
      )
    );
    setLancamentoEditando(null);
  }

  function handleExcluir() {
    if (!idExcluindo) return;
    setLancamentos((prev) => prev.filter((l) => l.id !== idExcluindo));
    setIdExcluindo(null);
  }

  // ============ RENDER ============

  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Gestão financeira da academia"
        action={{
          label: "Novo Lançamento",
          icon: Plus,
          onClick: () => { setModalNovo(true); setFormNovo(FORM_VAZIO); setErroNovo(""); },
        }}
      />

      {/* ============ RESUMO FINANCEIRO ============ */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="Total de Mensalidades"
          valor={formatCurrency(resumo.totalMensalidades)}
          icon={TrendingUp}
          iconClass="bg-success/10 text-success"
          valorClass="text-success"
        />
        <KpiCard
          titulo="Total de Despesas"
          valor={formatCurrency(resumo.totalDespesas)}
          icon={TrendingDown}
          iconClass="bg-destructive/10 text-destructive"
          valorClass="text-destructive"
          delay={60}
        />
        <KpiCard
          titulo="Total de Estornos"
          valor={formatCurrency(resumo.totalEstornos)}
          icon={RotateCcw}
          iconClass="bg-warning/10 text-warning"
          valorClass="text-warning"
          delay={120}
        />
        <KpiCard
          titulo="Saldo Atual"
          valor={formatCurrency(resumo.saldo)}
          subtitulo="Mensalidades − Estornos − Despesas"
          icon={DollarSign}
          iconClass="bg-primary/10 text-primary"
          valorClass={resumo.saldo >= 0 ? "text-success" : "text-destructive"}
          delay={180}
        />
      </div>

      {/* ============ GRÁFICO DE EVOLUÇÃO ============ */}
      <Card className="rise mb-6" style={{ animationDelay: "240ms" }}>
        <CardHeader>
          <CardTitle>Evolução Financeira</CardTitle>
          <CardDescription>
            Receitas vs Despesas nos últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <AreaChart data={evolucaoFinanceira} margin={{ left: 12 }}>
              <defs>
                <linearGradient id="fillReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-5)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                className="capitalize"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={64}
                tickFormatter={(valor: number) => `${Math.round(valor / 1000)}k`}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 capitalize text-muted-foreground">
                          <span
                            className="h-2.5 w-2.5 rounded-[2px]"
                            style={{ background: item.color }}
                          />
                          {name}
                        </span>
                        <span className="font-medium tabular-nums">
                          {formatCurrency(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                dataKey="receitas"
                type="monotone"
                fill="url(#fillReceitas)"
                stroke="var(--chart-2)"
                strokeWidth={2}
              />
              <Area
                dataKey="despesas"
                type="monotone"
                fill="url(#fillDespesas)"
                stroke="var(--chart-5)"
                strokeWidth={2}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ============ LISTA DE LANÇAMENTOS ============ */}
      <Card className="rise" style={{ animationDelay: "320ms" }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lançamentos</CardTitle>
            <CardDescription>
              {lancamentos.length === 0
                ? "Nenhum lançamento cadastrado"
                : `${lancamentos.length} lançamento${lancamentos.length !== 1 ? "s" : ""} registrado${lancamentos.length !== 1 ? "s" : ""}`}
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => { setModalNovo(true); setFormNovo(FORM_VAZIO); setErroNovo(""); }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {lancamentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <DollarSign className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">Nenhum lançamento ainda.</p>
              <p className="text-xs">Clique em &ldquo;Novo Lançamento&rdquo; para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lancamentos.map((lancamento) => {
                    const cat = categoriaConfig[lancamento.categoria];
                    const Icon = cat.icon;
                    return (
                      <TableRow key={lancamento.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-4 w-4 shrink-0", cat.valorClass)} />
                            <span className="font-medium">{lancamento.descricao}</span>
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {formatDate(lancamento.data)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cat.badgeClass}>
                            {cat.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formaPagamentoConfig[lancamento.formaPagamento]}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-semibold tabular-nums",
                            cat.valorClass
                          )}
                        >
                          {lancamento.categoria === "despesa" ? "− " : "+ "}
                          {formatCurrency(lancamento.valor)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Visualizar"
                              onClick={() => setLancamentoVisualizando(lancamento)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Editar"
                              onClick={() => abrirEdicao(lancamento)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title="Excluir"
                              onClick={() => setIdExcluindo(lancamento.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============ MODAIS ============ */}

      {/* Novo lançamento */}
      <ModalFormulario
        aberto={modalNovo}
        titulo="Novo Lançamento"
        form={formNovo}
        erro={erroNovo}
        onClose={() => setModalNovo(false)}
        onChange={(campo, valor) => {
          setFormNovo((prev) => ({ ...prev, [campo]: valor }));
          setErroNovo("");
        }}
        onSubmit={handleCriar}
      />

      {/* Edição */}
      <ModalFormulario
        aberto={!!lancamentoEditando}
        titulo="Editar Lançamento"
        form={formEdicao}
        erro={erroEdicao}
        onClose={() => setLancamentoEditando(null)}
        onChange={(campo, valor) => {
          setFormEdicao((prev) => ({ ...prev, [campo]: valor }));
          setErroEdicao("");
        }}
        onSubmit={handleSalvarEdicao}
      />

      {/* Visualização */}
      <ModalVisualizacao
        lancamento={lancamentoVisualizando}
        onClose={() => setLancamentoVisualizando(null)}
      />

      {/* Confirmação de exclusão */}
      <ModalConfirmacao
        aberto={!!idExcluindo}
        onClose={() => setIdExcluindo(null)}
        onConfirmar={handleExcluir}
      />
    </>
  );
}
