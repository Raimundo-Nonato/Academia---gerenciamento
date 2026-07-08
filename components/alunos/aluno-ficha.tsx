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

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Dumbbell,
  Eye,
  EyeOff,
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
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
import { FichaTreinoEditor } from "@/components/alunos/ficha-treino-editor";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/types/auth";
import {
  Aluno,
  AlunoDetalhes,
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
// TODO: Substituir por chamadas à API (fichas de treino — fase futura)

const MOCK_FICHAS: FichaTreino[] = [
  {
    id: "f1",
    nome: "Treino A - Superior",
    descricao: "Foco em peito, ombro e tríceps",
    ativa: true,
    criadaEm: "2024-01-01",
    atualizadaEm: "2024-01-20",
    personalNome: "Carlos Trainer",
    dias: [
      {
        id: "d1",
        nome: "Treino A",
        grupos: [
          {
            id: "g1",
            nome: "Peito",
            exercicios: [
              {
                id: "e1",
                nome: "Supino reto com barra",
                series: "4",
                repeticoes: "10",
                carga: "40kg",
                descanso: "60s",
                observacoes: "Manter cotovelos a 45°",
              },
              {
                id: "e2",
                nome: "Crucifixo com halteres",
                series: "3",
                repeticoes: "12",
                carga: "12kg",
                descanso: "45s",
              },
            ],
          },
          {
            id: "g2",
            nome: "Tríceps",
            exercicios: [
              {
                id: "e3",
                nome: "Tríceps corda",
                series: "3",
                repeticoes: "12",
                carga: "20kg",
                descanso: "45s",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "f2",
    nome: "Treino B - Inferior",
    descricao: "Pernas e glúteos",
    ativa: true,
    criadaEm: "2024-01-01",
    atualizadaEm: "2024-01-15",
    personalNome: "Carlos Trainer",
    dias: [
      {
        id: "d2",
        nome: "Treino B",
        grupos: [
          {
            id: "g3",
            nome: "Pernas",
            exercicios: [
              {
                id: "e4",
                nome: "Leg press",
                series: "4",
                repeticoes: "12",
                carga: "120kg",
                descanso: "90s",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "f3",
    nome: "Treino C - Costas",
    descricao: "Costas e bíceps",
    ativa: false,
    criadaEm: "2023-10-01",
    atualizadaEm: "2023-12-01",
    personalNome: "Ana Personal",
    dias: [],
  },
];

/**
 * Formata data para exibição.
 */
function formatDate(data: string): string {
  return format(parseISO(data), "dd/MM/yyyy", { locale: ptBR });
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


export function AlunoFicha({ aluno, open, onOpenChange }: AlunoFichaProps) {
  const { user } = useAuth();
  const [showCPF, setShowCPF] = useState(false);
  const [fichas, setFichas] = useState<FichaTreino[]>(MOCK_FICHAS);
  const [fichaAbertaId, setFichaAbertaId] = useState<string | null>(null);
  const [detalhes, setDetalhes] = useState<AlunoDetalhes | null>(null);

  // Busca a ficha completa (com campos sensíveis já mascarados pelo
  // servidor conforme o papel do usuário) sempre que o sheet abre para
  // um aluno diferente.
  useEffect(() => {
    if (!aluno || !open) return;

    let cancelado = false;
    setDetalhes(null);

    fetch(`/api/alunos/${aluno.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelado && data) setDetalhes(data.aluno);
      });

    return () => {
      cancelado = true;
    };
  }, [aluno, open]);

  // Verifica se usuário é admin para ver CPF completo
  const isAdmin = user?.role === UserRole.ADMIN;
  const podeVerCPF = isAdmin && showCPF;

  if (!aluno) return null;

  function atualizarFicha(fichaAtualizada: FichaTreino) {
    setFichas((prev) =>
      prev.map((f) => (f.id === fichaAtualizada.id ? fichaAtualizada : f))
    );
  }

  function adicionarFicha() {
    const novaFicha: FichaTreino = {
      id: `f-${Date.now()}`,
      nome: "Nova Ficha de Treino",
      descricao: "",
      ativa: true,
      criadaEm: new Date().toISOString().slice(0, 10),
      atualizadaEm: new Date().toISOString().slice(0, 10),
      personalNome: aluno?.personalNome ?? undefined,
      dias: [],
    };
    setFichas((prev) => [...prev, novaFicha]);
    setFichaAbertaId(novaFicha.id);
  }

  function excluirFicha(fichaId: string) {
    setFichas((prev) => prev.filter((f) => f.id !== fichaId));
    if (fichaAbertaId === fichaId) setFichaAbertaId(null);
  }

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
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* ============ ABAS ============ */}
        {/* px-6: alinha o conteúdo das abas com o padding do header */}
        <Tabs defaultValue="dados" className="px-6 pb-8">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="treinos">Treinos</TabsTrigger>
          </TabsList>

          {/* ============ ABA: DADOS PESSOAIS ============ */}
          <TabsContent value="dados" className="space-y-6 mt-6">
            {!detalhes ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <>
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
                      <span>
                        CPF:{" "}
                        {!detalhes.cpf
                          ? "Não informado"
                          : podeVerCPF
                            ? detalhes.cpf
                            : maskCPF(detalhes.cpf)}
                      </span>
                    </div>
                    {/* Botão de revelar CPF só para admin, quando há CPF cadastrado */}
                    {isAdmin && detalhes.cpf && (
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

                {/* Endereço — opcional: não é coletado no cadastro rápido */}
                {detalhes.endereco && (
                  <>
                    <Separator />
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
                  </>
                )}

                {/* Observações médicas - DADO SENSÍVEL */}
                {detalhes.observacoesMedicas && (
                  <>
                    <Separator />
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
                  </>
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
              </>
            )}
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
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Fichas de Treino
                </h3>
                <Button size="sm" variant="outline" onClick={adicionarFicha}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Nova ficha
                </Button>
              </div>
              <div className="grid gap-3">
                {fichas.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma ficha de treino cadastrada.
                  </p>
                )}
                {fichas.map((ficha) => {
                  const aberta = fichaAbertaId === ficha.id;
                  return (
                    <Card key={ficha.id} className={ficha.ativa ? "" : "opacity-60"}>
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            className="flex items-start gap-3 text-left flex-1 min-w-0"
                            onClick={() => setFichaAbertaId(aberta ? null : ficha.id)}
                          >
                            <div className="p-2 bg-primary/10 rounded-md">
                              <Dumbbell className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{ficha.nome}</p>
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
                          </button>
                          <div className="flex items-center gap-1 shrink-0">
                            {aberta ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => excluirFicha(ficha.id)}
                              aria-label="Excluir ficha de treino"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {aberta && (
                          <FichaTreinoEditor
                            ficha={ficha}
                            nomeAluno={aluno.nome}
                            onChange={atualizarFicha}
                          />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
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
