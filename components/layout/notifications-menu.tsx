"use client";

/**
 * ============================================================================
 * COMPONENTE: MENU DE NOTIFICAÇÕES
 * ============================================================================
 *
 * Sino de notificações da topbar com painel dropdown.
 *
 * FUNCIONALIDADES:
 * - Badge com contagem de não lidas
 * - Painel com lista de notificações (ícone por tipo, hora relativa)
 * - Clicar em uma notificação marca como lida
 * - "Marcar todas como lidas"
 *
 * TODO: Substituir MOCK_NOTIFICACOES por dados da API / websocket
 */

import { useState } from "react";
import {
  Bell,
  CheckCheck,
  CircleDollarSign,
  ClipboardList,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TipoNotificacao = "financeiro" | "avaliacao" | "estoque";

interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  descricao: string;
  hora: string;
  lida: boolean;
}

// TODO: Substituir por dados da API
const MOCK_NOTIFICACOES: Notificacao[] = [
  {
    id: "n1",
    tipo: "financeiro",
    titulo: "5 mensalidades vencem hoje",
    descricao: "Envie lembrete de pagamento para os alunos.",
    hora: "08:12",
    lida: false,
  },
  {
    id: "n2",
    tipo: "avaliacao",
    titulo: "3 avaliações físicas pendentes",
    descricao: "Agendamentos aguardando confirmação de instrutor.",
    hora: "07:40",
    lida: false,
  },
  {
    id: "n3",
    tipo: "estoque",
    titulo: "Estoque de suplementos baixo",
    descricao: "Whey e creatina abaixo do mínimo definido.",
    hora: "Ontem",
    lida: false,
  },
];

const TIPO_CONFIG: Record<
  TipoNotificacao,
  { icon: React.ElementType; className: string }
> = {
  financeiro: { icon: CircleDollarSign, className: "bg-warning/10 text-warning" },
  avaliacao: { icon: ClipboardList, className: "bg-primary/10 text-primary" },
  estoque: { icon: Package, className: "bg-destructive/10 text-destructive" },
};

export function NotificationsMenu() {
  const [notificacoes, setNotificacoes] = useState(MOCK_NOTIFICACOES);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const marcarComoLida = (id: string) => {
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
  };

  const marcarTodasComoLidas = () => {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notificações: ${naoLidas} não lidas`}
        >
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1.5 text-xs"
            >
              {naoLidas > 99 ? "99+" : naoLidas}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {naoLidas > 0 && (
            <button
              onClick={marcarTodasComoLidas}
              className="flex items-center gap-1 text-xs font-normal text-primary hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas como lidas
            </button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {notificacoes.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Nenhuma notificação.
          </p>
        ) : (
          notificacoes.map((notificacao) => {
            const config = TIPO_CONFIG[notificacao.tipo];
            const Icon = config.icon;

            return (
              <DropdownMenuItem
                key={notificacao.id}
                onClick={() => marcarComoLida(notificacao.id)}
                className={cn(
                  "flex cursor-pointer items-start gap-3 py-2.5",
                  notificacao.lida && "opacity-55"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                    config.className
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {notificacao.titulo}
                    </span>
                    {!notificacao.lida && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-primary"
                        aria-label="Não lida"
                      />
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {notificacao.descricao}
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground/70">
                    {notificacao.hora}
                  </span>
                </span>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
