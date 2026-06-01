"use client";

/**
 * ============================================================================
 * PÁGINA DE AGENDA
 * ============================================================================
 * 
 * Gerenciamento de agenda da academia.
 * 
 * FUNCIONALIDADES PLANEJADAS:
 * - Visualização em calendário
 * - Agendamento de aulas
 * - Reserva de avaliações
 * - Controle de horários
 * 
 * TODO: Implementar calendário interativo
 * TODO: Integrar com sistema de notificações
 */

import { Plus, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// TODO: Substituir por dados da API
const MOCK_EVENTOS = [
  { id: "1", hora: "06:00", titulo: "Musculação - Turma A", tipo: "aula", instrutor: "Carlos" },
  { id: "2", hora: "07:00", titulo: "Spinning", tipo: "aula", instrutor: "Ana" },
  { id: "3", hora: "08:00", titulo: "Avaliação - João", tipo: "avaliacao", instrutor: "Pedro" },
  { id: "4", hora: "09:00", titulo: "Funcional", tipo: "aula", instrutor: "Maria" },
  { id: "5", hora: "10:00", titulo: "Personal - Cliente VIP", tipo: "personal", instrutor: "Carlos" },
  { id: "6", hora: "14:00", titulo: "Pilates", tipo: "aula", instrutor: "Ana" },
  { id: "7", hora: "16:00", titulo: "Musculação - Turma B", tipo: "aula", instrutor: "Pedro" },
  { id: "8", hora: "18:00", titulo: "CrossFit", tipo: "aula", instrutor: "Carlos" },
];

const tipoColors: Record<string, string> = {
  aula: "bg-primary/10 text-primary",
  avaliacao: "bg-amber-500/10 text-amber-600",
  personal: "bg-purple-500/10 text-purple-600",
  manutencao: "bg-muted text-muted-foreground",
};

export default function AgendaPage() {
  // TODO: Implementar navegação de datas
  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Gerencie a programação da academia"
        action={{
          label: "Novo Agendamento",
          icon: Plus,
          onClick: () => {
            console.log("Criar agendamento");
          },
        }}
      />

      {/* ============ NAVEGAÇÃO DE DATA ============ */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="text-lg font-semibold capitalize">{dataAtual}</p>
            </div>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ============ GRADE DE HORÁRIOS ============ */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Manhã */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manhã</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_EVENTOS.filter(e => parseInt(e.hora) < 12).map((evento) => (
              <div
                key={evento.id}
                className="flex items-center gap-4 p-3 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground min-w-[60px]">
                  <Clock className="h-4 w-4" />
                  {evento.hora}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{evento.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    Instrutor: {evento.instrutor}
                  </p>
                </div>
                <Badge variant="secondary" className={tipoColors[evento.tipo]}>
                  {evento.tipo}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tarde/Noite */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tarde / Noite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_EVENTOS.filter(e => parseInt(e.hora) >= 12).map((evento) => (
              <div
                key={evento.id}
                className="flex items-center gap-4 p-3 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground min-w-[60px]">
                  <Clock className="h-4 w-4" />
                  {evento.hora}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{evento.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    Instrutor: {evento.instrutor}
                  </p>
                </div>
                <Badge variant="secondary" className={tipoColors[evento.tipo]}>
                  {evento.tipo}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ============ LEGENDA ============ */}
      <Card className="mt-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary/50" />
              <span className="text-sm text-muted-foreground">Aula em Grupo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500/50" />
              <span className="text-sm text-muted-foreground">Avaliação</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500/50" />
              <span className="text-sm text-muted-foreground">Personal</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
