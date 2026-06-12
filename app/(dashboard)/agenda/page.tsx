"use client";

/**
 * ============================================================================
 * PÁGINA DE AGENDA
 * ============================================================================
 *
 * Gerenciamento de agenda da academia.
 *
 * FUNCIONALIDADES:
 * - Navegação por dia (anterior / hoje / próximo)
 * - Grade de horários dividida em Manhã e Tarde/Noite
 * - Novo agendamento via dialog (entra na grade do dia selecionado)
 *
 * TODO: Substituir estado local por API
 * TODO: Visualização semanal/mensal
 */

import { useMemo, useState } from "react";
import { addDays, format, isSameDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight, Clock, CalendarX2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";

type TipoEvento = "aula" | "avaliacao" | "personal" | "manutencao";

interface Evento {
  id: string;
  /** Data do evento (ISO YYYY-MM-DD) */
  data: string;
  hora: string;
  titulo: string;
  tipo: TipoEvento;
  instrutor: string;
}

const TIPO_EVENTO_CONFIG: Record<TipoEvento, { label: string; className: string }> = {
  aula: { label: "Aula", className: "bg-primary/10 text-primary" },
  avaliacao: { label: "Avaliação", className: "bg-warning/10 text-warning" },
  personal: { label: "Personal", className: "bg-chart-4/10 text-chart-4" },
  manutencao: { label: "Manutenção", className: "bg-muted text-muted-foreground" },
};

const INSTRUTORES = ["Carlos", "Ana", "Pedro", "Maria"];

const HORARIOS = Array.from({ length: 17 }, (_, i) => {
  const hora = i + 6; // 06:00 às 22:00
  return `${String(hora).padStart(2, "0")}:00`;
});

const hojeISO = () => format(new Date(), "yyyy-MM-dd");

// TODO: Substituir por dados da API
const MOCK_EVENTOS: Evento[] = [
  { id: "1", data: hojeISO(), hora: "06:00", titulo: "Musculação - Turma A", tipo: "aula", instrutor: "Carlos" },
  { id: "2", data: hojeISO(), hora: "07:00", titulo: "Spinning", tipo: "aula", instrutor: "Ana" },
  { id: "3", data: hojeISO(), hora: "08:00", titulo: "Avaliação - João", tipo: "avaliacao", instrutor: "Pedro" },
  { id: "4", data: hojeISO(), hora: "09:00", titulo: "Funcional", tipo: "aula", instrutor: "Maria" },
  { id: "5", data: hojeISO(), hora: "10:00", titulo: "Personal - Cliente VIP", tipo: "personal", instrutor: "Carlos" },
  { id: "6", data: hojeISO(), hora: "14:00", titulo: "Pilates", tipo: "aula", instrutor: "Ana" },
  { id: "7", data: hojeISO(), hora: "16:00", titulo: "Musculação - Turma B", tipo: "aula", instrutor: "Pedro" },
  { id: "8", data: hojeISO(), hora: "18:00", titulo: "CrossFit", tipo: "aula", instrutor: "Carlos" },
  {
    id: "9",
    data: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    hora: "07:00",
    titulo: "Spinning",
    tipo: "aula",
    instrutor: "Ana",
  },
];

/**
 * Card de um evento na grade de horários.
 */
function EventoCard({ evento }: { evento: Evento }) {
  const config = TIPO_EVENTO_CONFIG[evento.tipo];

  return (
    <div className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:border-primary/50">
      <div className="flex min-w-[60px] items-center gap-2 text-sm font-medium text-muted-foreground tabular-nums">
        <Clock className="h-4 w-4" />
        {evento.hora}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{evento.titulo}</p>
        <p className="text-xs text-muted-foreground">
          Instrutor: {evento.instrutor}
        </p>
      </div>
      <Badge variant="secondary" className={cn("shrink-0", config.className)}>
        {config.label}
      </Badge>
    </div>
  );
}

/**
 * Lista de eventos de um período (Manhã ou Tarde/Noite).
 */
function PeriodoCard({
  titulo,
  eventos,
  delay,
}: {
  titulo: string;
  eventos: Evento[];
  delay?: number;
}) {
  return (
    <Card className="rise" style={{ animationDelay: `${delay ?? 0}ms` }}>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {eventos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <CalendarX2 className="h-6 w-6" />
            Nenhum evento neste período
          </div>
        ) : (
          eventos.map((evento) => <EventoCard key={evento.id} evento={evento} />)
        )}
      </CardContent>
    </Card>
  );
}

export default function AgendaPage() {
  // Dia selecionado na navegação
  const [dataSelecionada, setDataSelecionada] = useState(() => new Date());
  // Eventos (estado local enquanto não há API)
  const [eventos, setEventos] = useState<Evento[]>(MOCK_EVENTOS);

  // Dialog de novo agendamento
  const [dialogAberto, setDialogAberto] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaHora, setNovaHora] = useState("08:00");
  const [novoTipo, setNovoTipo] = useState<TipoEvento>("aula");
  const [novoInstrutor, setNovoInstrutor] = useState(INSTRUTORES[0]);

  const dataFormatada = format(dataSelecionada, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const ehHoje = isSameDay(dataSelecionada, new Date());

  /** Eventos do dia selecionado, ordenados por hora. */
  const eventosDoDia = useMemo(() => {
    const dataISO = format(dataSelecionada, "yyyy-MM-dd");
    return eventos
      .filter((e) => e.data === dataISO)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }, [eventos, dataSelecionada]);

  const eventosManha = eventosDoDia.filter((e) => parseInt(e.hora) < 12);
  const eventosTarde = eventosDoDia.filter((e) => parseInt(e.hora) >= 12);

  /**
   * Cria novo agendamento no dia selecionado.
   * TODO: Chamar API POST /agendamentos
   */
  const handleCriarAgendamento = () => {
    if (!novoTitulo.trim()) {
      toast.error("Informe um título para o agendamento.");
      return;
    }

    const novoEvento: Evento = {
      id: crypto.randomUUID(),
      data: format(dataSelecionada, "yyyy-MM-dd"),
      hora: novaHora,
      titulo: novoTitulo.trim(),
      tipo: novoTipo,
      instrutor: novoInstrutor,
    };

    setEventos((prev) => [...prev, novoEvento]);
    setDialogAberto(false);
    setNovoTitulo("");
    toast.success("Agendamento criado!", {
      description: `${novoEvento.titulo} — ${format(dataSelecionada, "dd/MM")} às ${novaHora}.`,
    });
  };

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Gerencie a programação da academia"
        action={{
          label: "Novo Agendamento",
          icon: Plus,
          onClick: () => setDialogAberto(true),
        }}
      />

      {/* ============ NAVEGAÇÃO DE DATA ============ */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDataSelecionada((d) => subDays(d, 1))}
              aria-label="Dia anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <p className="font-display text-lg font-semibold capitalize">
                {dataFormatada}
              </p>
              {!ehHoje && (
                <button
                  onClick={() => setDataSelecionada(new Date())}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Voltar para hoje
                </button>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setDataSelecionada((d) => addDays(d, 1))}
              aria-label="Próximo dia"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ============ GRADE DE HORÁRIOS ============ */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PeriodoCard titulo="Manhã" eventos={eventosManha} />
        <PeriodoCard titulo="Tarde / Noite" eventos={eventosTarde} delay={80} />
      </div>

      {/* ============ LEGENDA ============ */}
      <Card className="mt-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {(Object.keys(TIPO_EVENTO_CONFIG) as TipoEvento[]).map((tipo) => (
              <div key={tipo} className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-3 w-3 rounded-full",
                    TIPO_EVENTO_CONFIG[tipo].className.split(" ")[0]
                  )}
                  aria-hidden
                />
                <span className="text-sm text-muted-foreground">
                  {TIPO_EVENTO_CONFIG[tipo].label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ============ DIALOG: NOVO AGENDAMENTO ============ */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>
              Agendar para {format(dataSelecionada, "dd/MM/yyyy")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="agendamento-titulo">Título</Label>
              <Input
                id="agendamento-titulo"
                placeholder="Ex: Spinning - Turma B"
                value={novoTitulo}
                onChange={(e) => setNovoTitulo(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horário</Label>
                <Select value={novaHora} onValueChange={setNovaHora}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HORARIOS.map((hora) => (
                      <SelectItem key={hora} value={hora}>
                        {hora}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={novoTipo}
                  onValueChange={(v) => setNovoTipo(v as TipoEvento)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TIPO_EVENTO_CONFIG) as TipoEvento[]).map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {TIPO_EVENTO_CONFIG[tipo].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Instrutor</Label>
              <Select value={novoInstrutor} onValueChange={setNovoInstrutor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSTRUTORES.map((instrutor) => (
                    <SelectItem key={instrutor} value={instrutor}>
                      {instrutor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarAgendamento}>
              <Plus className="mr-2 h-4 w-4" />
              Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
