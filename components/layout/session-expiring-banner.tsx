"use client";

/**
 * ============================================================================
 * COMPONENTE SESSION EXPIRING BANNER
 * ============================================================================
 * 
 * Banner de aviso de sessão expirando.
 * Exibe alerta quando a sessão está prestes a expirar.
 * 
 * TIP: Integre com o sistema de autenticação real para
 * detectar expiração baseada no tempo do token.
 * 
 * TODO: Implementar lógica real de verificação de sessão
 * TODO: Adicionar botão para renovar sessão
 */

import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SessionExpiringBannerProps {
  /** Se o banner está visível */
  isVisible: boolean;
  /** Minutos restantes da sessão */
  minutesRemaining?: number;
  /** Callback para fechar o banner */
  onDismiss: () => void;
  /** Callback para renovar sessão */
  onRenewSession?: () => void;
}

export function SessionExpiringBanner({
  isVisible,
  minutesRemaining = 5,
  onDismiss,
  onRenewSession,
}: SessionExpiringBannerProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed left-0 right-0 top-0 z-50 flex items-center justify-between gap-4 bg-amber-500 px-4 py-2 text-amber-950",
        // Ajusta posição considerando a sidebar
        "md:left-60"
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">
          Sua sessão expira em {minutesRemaining} minutos.
        </span>
      </div>

      <div className="flex items-center gap-2">
        {onRenewSession && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onRenewSession}
            className="h-7 bg-amber-100 text-amber-900 hover:bg-amber-200"
          >
            Renovar Sessão
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="h-7 w-7 hover:bg-amber-400"
          aria-label="Fechar aviso"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
