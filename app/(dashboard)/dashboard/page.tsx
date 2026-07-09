"use client";

/**
 * ============================================================================
 * PÁGINA DO DASHBOARD
 * ============================================================================
 *
 * Página inicial do sistema após login. Todos os números vêm de
 * GET /api/dashboard (calculados no servidor a partir de alunos e
 * lançamentos reais — ver lib/db/dashboard.ts e PLANO_DASHBOARD.md).
 *
 * O bloco financeiro chega `null` para quem não tem a permissão
 * "financeiro" — o RoleGate esconde na tela, mas quem manda é o servidor.
 */

import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Activity,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { PageHeader } from "@/components/layout";
import { RoleGate } from "@/components/auth/role-gate";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  AlertaDashboard,
  DashboardResumo,
  PontoMatriculas,
} from "@/types/dashboard";

/**
 * Interface para cards de métricas.
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  /** Atraso da animação de entrada (ms) para efeito escalonado */
  delay?: number;
}

/**
 * Card de métrica individual.
 */
function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  delay = 0,
}: MetricCardProps) {
  return (
    <Card className="rise" style={{ animationDelay: `${delay}ms` }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <span className="rounded-md bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        <div className="font-display text-3xl font-bold tracking-tight tabular-nums">
          {value}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="mt-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                trend.isPositive
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.isPositive ? "+" : ""}
              {trend.value}% vs mês anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Variação percentual real vs mês anterior. Sem base de comparação
 * (mês anterior zerado), a etiqueta some em vez de inventar número.
 */
function calcularTendencia(
  atual: number,
  anterior: number
): MetricCardProps["trend"] {
  if (anterior <= 0) return undefined;
  const pct = Math.round(((atual - anterior) / anterior) * 100);
  return { value: Math.abs(pct), isPositive: pct >= 0 };
}

const chartConfig = {
  matriculas: {
    label: "Matrículas",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

/**
 * Gráfico de matrículas dos últimos 6 meses (pela data de matrícula).
 * O mês atual (última barra) é destacado com o acento volt.
 */
function MatriculasChart({ dados }: { dados: PontoMatriculas[] }) {
  return (
    <Card className="rise lg:col-span-2" style={{ animationDelay: "240ms" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Matrículas por Mês
        </CardTitle>
        <CardDescription>
          Novas matrículas nos últimos 6 meses — mês atual em destaque
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-44 sm:h-56 w-full">
          <BarChart data={dados} margin={{ left: -20 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={48} allowDecimals={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="matriculas" radius={[6, 6, 0, 0]}>
              {dados.map((entry, index) => (
                <Cell
                  key={`${entry.mes}-${index}`}
                  fill={
                    index === dados.length - 1
                      ? "var(--chart-2)"
                      : "var(--chart-1)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Lista de alertas/pendências — só alertas com dado real por trás
 * (inadimplentes, vencimentos de hoje e dos próximos 7 dias).
 */
function AlertsList({ alertas }: { alertas: AlertaDashboard[] }) {
  const priorityColors: Record<AlertaDashboard["prioridade"], string> = {
    alta: "border-l-destructive bg-destructive/5",
    media: "border-l-warning bg-warning/5",
    baixa: "border-l-primary bg-primary/5",
  };

  return (
    <Card className="rise" style={{ animationDelay: "300ms" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          Alertas
        </CardTitle>
        <CardDescription>Itens que requerem atenção</CardDescription>
      </CardHeader>
      <CardContent>
        {alertas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum alerta no momento.
          </p>
        ) : (
          <div className="space-y-3">
            {alertas.map((alerta, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-r-md border-l-4 py-2.5 pl-3 pr-2 text-sm",
                  priorityColors[alerta.prioridade]
                )}
              >
                {alerta.mensagem}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setResumo(data.resumo);
      });
  }, []);

  const financeiro = resumo?.financeiro ?? null;

  return (
    <>
      <PageHeader title="Dashboard" description="Visão geral do sistema" />

      {/* ============ MÉTRICAS PRINCIPAIS ============ */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Alunos"
          value={resumo ? resumo.totalAlunosAtivos : "—"}
          description="Alunos ativos"
          icon={Users}
          delay={0}
        />
        <MetricCard
          title="Novos este Mês"
          value={resumo ? resumo.novosNoMes : "—"}
          description="Matrículas realizadas"
          icon={UserPlus}
          trend={
            resumo
              ? calcularTendencia(resumo.novosNoMes, resumo.novosNoMesAnterior)
              : undefined
          }
          delay={60}
        />

        {/* Métricas financeiras - apenas quem tem permissão */}
        <RoleGate recurso="financeiro">
          <MetricCard
            title="Receita Mensal"
            value={financeiro ? formatCurrency(financeiro.receitaMes) : "—"}
            description="Faturamento do mês atual"
            icon={DollarSign}
            trend={
              financeiro
                ? calcularTendencia(
                    financeiro.receitaMes,
                    financeiro.receitaMesAnterior
                  )
                : undefined
            }
            delay={120}
          />
          <MetricCard
            title="Em dia"
            value={resumo ? `${resumo.percentualEmDia}%` : "—"}
            description="Alunos com pagamento em dia"
            icon={TrendingUp}
            delay={180}
          />
        </RoleGate>
      </div>

      {/* ============ MATRÍCULAS + ALERTAS ============ */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <MatriculasChart dados={resumo?.matriculasPorMes ?? []} />
        <AlertsList alertas={resumo?.alertas ?? []} />
      </div>

      {/* ============ RESUMO FINANCEIRO ============ */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Resumo financeiro - apenas quem tem permissão */}
        <RoleGate recurso="financeiro">
          <Card className="rise" style={{ animationDelay: "420ms" }}>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
              <CardDescription>Visão consolidada do mês atual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-success/10 p-4">
                  <p className="text-sm text-muted-foreground">Recebido</p>
                  <p className="font-display text-xl font-bold tabular-nums text-success">
                    {financeiro ? formatCurrency(financeiro.receitaMes) : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-warning/10 p-4">
                  <p className="text-sm text-muted-foreground">A Receber</p>
                  <p className="font-display text-xl font-bold tabular-nums text-warning">
                    {financeiro ? formatCurrency(financeiro.aReceber) : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </RoleGate>
      </div>
    </>
  );
}
