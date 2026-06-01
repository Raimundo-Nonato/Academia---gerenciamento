"use client";

/**
 * ============================================================================
 * PÁGINA DO DASHBOARD
 * ============================================================================
 * 
 * Página inicial do sistema após login.
 * Exibe métricas principais e resumo de atividades.
 * 
 * TODO: Integrar com API real para dados dinâmicos
 * TODO: Adicionar gráficos de evolução
 * TODO: Implementar filtros por período
 */

import {
  Users,
  UserPlus,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout";
import { RoleGate } from "@/components/auth/role-gate";

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
}

/**
 * Card de métrica individual.
 */
function MetricCard({ title, value, description, icon: Icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${
            trend.isPositive ? "text-emerald-600" : "text-destructive"
          }`}>
            <TrendingUp className={`h-3 w-3 ${!trend.isPositive && "rotate-180"}`} />
            <span>{trend.isPositive ? "+" : ""}{trend.value}% vs mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Lista de próximas atividades/agendamentos.
 */
function UpcomingActivities() {
  // TODO: Substituir por dados da API
  const activities = [
    { time: "09:00", title: "Avaliação Física - João Silva", type: "avaliacao" },
    { time: "10:30", title: "Reunião Equipe", type: "reuniao" },
    { time: "14:00", title: "Treino Experimental - Maria", type: "treino" },
    { time: "16:00", title: "Manutenção Equipamentos", type: "manutencao" },
  ];

  const typeColors: Record<string, string> = {
    avaliacao: "bg-blue-500/10 text-blue-600",
    reuniao: "bg-purple-500/10 text-purple-600",
    treino: "bg-emerald-500/10 text-emerald-600",
    manutencao: "bg-amber-500/10 text-amber-600",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Agenda de Hoje
        </CardTitle>
        <CardDescription>Próximas atividades programadas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[60px]">
                <Clock className="h-3 w-3" />
                {activity.time}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.title}</p>
              </div>
              <Badge variant="secondary" className={typeColors[activity.type]}>
                {activity.type}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Lista de alertas/pendências.
 */
function AlertsList() {
  // TODO: Substituir por dados da API
  const alerts = [
    { message: "5 mensalidades vencem hoje", priority: "high" },
    { message: "3 alunos com avaliação pendente", priority: "medium" },
    { message: "Estoque de suplementos baixo", priority: "low" },
  ];

  const priorityColors: Record<string, string> = {
    high: "border-l-destructive",
    medium: "border-l-amber-500",
    low: "border-l-blue-500",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Alertas
        </CardTitle>
        <CardDescription>Itens que requerem atenção</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`border-l-4 pl-3 py-2 text-sm ${priorityColors[alert.priority]}`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema"
      />

      {/* ============ MÉTRICAS PRINCIPAIS ============ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          title="Total de Alunos"
          value={247}
          description="Alunos ativos"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Novos este Mês"
          value={18}
          description="Matrículas realizadas"
          icon={UserPlus}
          trend={{ value: 8, isPositive: true }}
        />
        
        {/* Métricas financeiras - apenas gerente+ */}
        <RoleGate minLevel={60}>
          <MetricCard
            title="Receita Mensal"
            value="R$ 45.230"
            description="Faturamento atual"
            icon={DollarSign}
            trend={{ value: 5, isPositive: true }}
          />
          <MetricCard
            title="Taxa de Retenção"
            value="94%"
            description="Renovações/Total"
            icon={TrendingUp}
            trend={{ value: 2, isPositive: true }}
          />
        </RoleGate>
      </div>

      {/* ============ GRID DE CONTEÚDO ============ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingActivities />
        
        {/* Alertas - todos podem ver */}
        <AlertsList />
      </div>

      {/* ============ SEÇÃO FINANCEIRA - APENAS GERENTE+ ============ */}
      <RoleGate minLevel={60}>
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
              <CardDescription>
                Visão consolidada do mês atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-emerald-500/10">
                  <p className="text-sm text-muted-foreground">Recebido</p>
                  <p className="text-xl font-bold text-emerald-600">R$ 38.450</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/10">
                  <p className="text-sm text-muted-foreground">A Receber</p>
                  <p className="text-xl font-bold text-amber-600">R$ 6.780</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10">
                  <p className="text-sm text-muted-foreground">Em Atraso</p>
                  <p className="text-xl font-bold text-destructive">R$ 2.340</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </RoleGate>
    </>
  );
}
