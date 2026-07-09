"use client";

/**
 * ============================================================================
 * COMPONENTE: MENU DE NOTIFICAÇÕES
 * ============================================================================
 *
 * Sino de notificações da topbar com painel dropdown.
 *
 * Mostra os mesmos alertas reais do Dashboard (GET /api/dashboard —
 * inadimplência e mensalidades a vencer), não itens inventados.
 *
 * "Lida" fica no localStorage, pela mensagem do alerta: não é um evento
 * discreto com id (é um total recalculado a cada leitura), então se o
 * número mudar (ex: "1 aluno inadimplente" -> "2 alunos inadimplentes") o
 * alerta volta a contar como não lido — o que é o comportamento certo.
 */

import { useEffect, useState } from "react";
import { AlertTriangle, Bell, CheckCheck, Clock, CircleDollarSign } from "lucide-react";
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
import type { AlertaDashboard } from "@/types/dashboard";

const CHAVE_LIDAS = "wenvefit_alertas_lidos";

const PRIORIDADE_CONFIG: Record<
  AlertaDashboard["prioridade"],
  { icon: React.ElementType; className: string }
> = {
  alta: { icon: AlertTriangle, className: "bg-destructive/10 text-destructive" },
  media: { icon: Clock, className: "bg-warning/10 text-warning" },
  baixa: { icon: CircleDollarSign, className: "bg-primary/10 text-primary" },
};

function carregarLidas(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(CHAVE_LIDAS) ?? "[]"));
  } catch {
    return new Set();
  }
}

export function NotificationsMenu() {
  const [alertas, setAlertas] = useState<AlertaDashboard[]>([]);
  const [lidas, setLidas] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLidas(carregarLidas());

    let cancelado = false;
    fetch("/api/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelado && data) setAlertas(data.resumo.alertas);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  function persistirLidas(novo: Set<string>) {
    setLidas(novo);
    localStorage.setItem(CHAVE_LIDAS, JSON.stringify([...novo]));
  }

  const naoLidas = alertas.filter((a) => !lidas.has(a.mensagem)).length;

  const marcarComoLida = (mensagem: string) => {
    persistirLidas(new Set(lidas).add(mensagem));
  };

  const marcarTodasComoLidas = () => {
    persistirLidas(new Set(alertas.map((a) => a.mensagem)));
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

        {alertas.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Nenhuma notificação.
          </p>
        ) : (
          alertas.map((alerta) => {
            const config = PRIORIDADE_CONFIG[alerta.prioridade];
            const Icon = config.icon;
            const lida = lidas.has(alerta.mensagem);

            return (
              <DropdownMenuItem
                key={alerta.mensagem}
                onClick={() => marcarComoLida(alerta.mensagem)}
                className={cn(
                  "flex cursor-pointer items-start gap-3 py-2.5",
                  lida && "opacity-55"
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
                    <span className="text-sm font-medium">{alerta.mensagem}</span>
                    {!lida && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-primary"
                        aria-label="Não lida"
                      />
                    )}
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
