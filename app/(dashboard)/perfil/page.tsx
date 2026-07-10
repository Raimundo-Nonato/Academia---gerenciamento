"use client";

/**
 * ============================================================================
 * PÁGINA DE PERFIL DO USUÁRIO
 * ============================================================================
 *
 * Perfil do usuário logado: dados pessoais, papel no sistema e segurança.
 */

import { useState, useEffect } from "react";
import { KeyRound, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { ROLE_BADGE_COLORS, ROLE_LEVELS } from "@/types/auth";
import { cn, getInitials } from "@/lib/utils";

export default function PerfilPage() {
  const { user, changePassword, updateProfile } = useAuth();

  // Formulário controlado (inicializado com os dados do usuário)
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [salvando, setSalvando] = useState(false);

  // ============ TROCA DE SENHA ============
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setNome(user.name);
      setEmail(user.email);
    }
  }, [user]);

  if (!user) return null;

  const badgeColors = ROLE_BADGE_COLORS[user.role];

  /** Salva alterações do perfil (nome/e-mail). */
  const handleSalvar = async () => {
    setSalvando(true);
    const erro = await updateProfile(nome, email);
    setSalvando(false);

    if (erro) {
      toast.error(erro);
      return;
    }
    toast.success("Perfil atualizado com sucesso!");
  };

  const resetPasswordForm = () => {
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
    setPasswordError("");
  };

  /**
   * Valida e aplica a troca de senha (local, válida durante a sessão).
   */
  const handlePasswordChange = async () => {
    setPasswordError("");

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setPasswordError("Preencha todos os campos.");
      return;
    }

    if (novaSenha.length < 3) {
      setPasswordError("A nova senha deve ter pelo menos 3 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setPasswordError("A confirmação não corresponde à nova senha.");
      return;
    }

    setIsChangingPassword(true);

    const success = await changePassword(senhaAtual, novaSenha);
    setIsChangingPassword(false);

    if (!success) {
      setPasswordError("Senha atual incorreta.");
      return;
    }

    toast.success("Senha alterada com sucesso!");
    resetPasswordForm();
    setIsPasswordDialogOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Meu Perfil"
        description="Gerencie suas informações pessoais e de acesso"
      />

      <div className="grid max-w-4xl gap-6 lg:grid-cols-3">
        {/* ============ CARD DE IDENTIDADE ============ */}
        <Card className="rise">
          <CardContent className="flex flex-col items-center pt-8 text-center">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary/10 font-display text-2xl font-bold text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <h2 className="mt-4 font-display text-lg font-bold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <span
              className={cn(
                "mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold tracking-wider",
                badgeColors.bg,
                badgeColors.text
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {user.role}
            </span>
            <p className="mt-2 text-xs text-muted-foreground">
              Nível de acesso: {ROLE_LEVELS[user.role]}
            </p>
          </CardContent>
        </Card>

        {/* ============ DADOS + SEGURANÇA ============ */}
        <Card className="rise lg:col-span-2" style={{ animationDelay: "80ms" }}>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize seus dados de exibição e contato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="perfil-nome">Nome completo</Label>
                <Input
                  id="perfil-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perfil-email">Email</Label>
                <Input
                  id="perfil-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleSalvar} disabled={salvando}>
              <Save className="mr-2 h-4 w-4" />
              {salvando ? "Salvando..." : "Salvar alterações"}
            </Button>

            <Separator />

            <div>
              <h3 className="mb-1 text-sm font-medium">Segurança</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                Recomendamos trocar sua senha periodicamente.
              </p>
              <Dialog
                open={isPasswordDialogOpen}
                onOpenChange={(open) => {
                  setIsPasswordDialogOpen(open);
                  if (!open) resetPasswordForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <KeyRound className="mr-2 h-4 w-4" />
                    Alterar senha
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Alterar senha</DialogTitle>
                    <DialogDescription>
                      Informe sua senha atual e defina uma nova senha. A
                      alteração é válida durante esta sessão.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="senha-atual">Senha atual</Label>
                      <Input
                        id="senha-atual"
                        type="password"
                        autoComplete="current-password"
                        value={senhaAtual}
                        onChange={(e) => setSenhaAtual(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nova-senha">Nova senha</Label>
                      <Input
                        id="nova-senha"
                        type="password"
                        autoComplete="new-password"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmar-senha">
                        Confirmar nova senha
                      </Label>
                      <Input
                        id="confirmar-senha"
                        type="password"
                        autoComplete="new-password"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                      />
                    </div>

                    {passwordError && (
                      <p
                        className="text-sm font-medium text-destructive"
                        role="alert"
                      >
                        {passwordError}
                      </p>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => setIsPasswordDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handlePasswordChange}
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? "Salvando..." : "Salvar nova senha"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
