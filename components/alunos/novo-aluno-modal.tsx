/**
 * ============================================================================
 * COMPONENTE: MODAL DE CADASTRO DE ALUNO (Wizard)
 * ============================================================================
 *
 * Formulário de cadastro em 3 passos:
 * 1. Dados Básicos - Nome, email, data de nascimento
 * 2. Pagamento - Forma de pagamento (PIX/Dinheiro), data início, personal
 * 3. Confirmação - Revisão dos dados antes de salvar
 *
 * MENSALIDADE PADRÃO:
 * - 1º mês: R$ 50,00
 * - A partir do 2º mês: R$ 65,00/mês
 *
 * VALIDAÇÃO:
 * - Zod schema em cada passo
 * - Não avança sem validar
 * - Botão "Salvar" desabilitado até passo final
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Banknote,
  QrCode,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MetodoPagamentoCadastro, NovoAlunoData, MENSALIDADE_PADRAO } from "@/types/aluno";

// ============ SCHEMAS DE VALIDAÇÃO (Zod) ============

/**
 * Schema do Passo 1 - Dados Básicos.
 * Campos obrigatórios: nome, email, data de nascimento.
 */
const dadosBasicosSchema = z.object({
  nome: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo"),
  email: z.string().email("Email inválido"),
  dataNascimento: z.string().min(1, "Data de nascimento obrigatória"),
  telefone: z
    .string()
    .regex(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/, "Formato: (11) 99999-9999")
    .optional()
    .or(z.literal("")),
  cpf: z
    .string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "Formato: 000.000.000-00")
    .optional()
    .or(z.literal("")),
});

/**
 * Schema do Passo 2 - Pagamento.
 */
const planoSchema = z.object({
  dataInicio: z.string().min(1, "Data de início obrigatória"),
  metodoPagamento: z.enum(["pix", "dinheiro"], {
    required_error: "Selecione a forma de pagamento",
  }),
  personalId: z.string().optional(),
  observacoesMedicas: z.string().optional(),
});

type DadosBasicosForm = z.infer<typeof dadosBasicosSchema>;
type PlanoForm = z.infer<typeof planoSchema>;

/**
 * Props do componente.
 */
interface NovoAlunoModalProps {
  /** Se o modal está aberto */
  open: boolean;
  /** Callback para fechar */
  onOpenChange: (open: boolean) => void;
  /** Callback ao salvar com sucesso */
  onSave: (data: NovoAlunoData) => Promise<void>;
  /** Lista de personais disponíveis */
  personais: Array<{ id: string; nome: string }>;
}

/**
 * Configuração dos passos do wizard.
 */
const PASSOS = [
  { numero: 1, titulo: "Dados Básicos", icon: User },
  { numero: 2, titulo: "Pagamento", icon: Banknote },
  { numero: 3, titulo: "Confirmação", icon: ClipboardCheck },
];

export function NovoAlunoModal({
  open,
  onOpenChange,
  onSave,
  personais,
}: NovoAlunoModalProps) {
  // Estado do wizard
  const [passoAtual, setPassoAtual] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Estado para armazenar dados entre passos
  const [dadosBasicos, setDadosBasicos] = useState<DadosBasicosForm | null>(null);
  const [dadosPlano, setDadosPlano] = useState<PlanoForm | null>(null);

  // Form do Passo 1
  const formPasso1 = useForm<DadosBasicosForm>({
    resolver: zodResolver(dadosBasicosSchema),
    defaultValues: dadosBasicos || {
      nome: "",
      email: "",
      dataNascimento: "",
      telefone: "",
      cpf: "",
    },
  });

  // Form do Passo 2
  const formPasso2 = useForm<PlanoForm>({
    resolver: zodResolver(planoSchema),
    defaultValues: dadosPlano || {
      dataInicio: new Date().toISOString().split("T")[0],
      metodoPagamento: undefined,
      personalId: "",
      observacoesMedicas: "",
    },
  });

  /**
   * Avança para próximo passo após validar.
   */
  const avancarPasso = async () => {
    if (passoAtual === 1) {
      const isValid = await formPasso1.trigger();
      if (isValid) {
        setDadosBasicos(formPasso1.getValues());
        setPassoAtual(2);
      }
    } else if (passoAtual === 2) {
      const isValid = await formPasso2.trigger();
      if (isValid) {
        setDadosPlano(formPasso2.getValues());
        setPassoAtual(3);
      }
    }
  };

  /**
   * Volta para passo anterior.
   */
  const voltarPasso = () => {
    if (passoAtual > 1) {
      setPassoAtual(passoAtual - 1);
    }
  };

  /**
   * Submete o formulário completo.
   */
  const handleSubmit = async () => {
    if (!dadosBasicos || !dadosPlano) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSave({
        ...dadosBasicos,
        ...dadosPlano,
      });

      // Reseta e fecha
      resetForm();
      onOpenChange(false);
    } catch {
      setSubmitError("Erro ao cadastrar aluno. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reseta todo o formulário.
   */
  const resetForm = () => {
    setPassoAtual(1);
    setDadosBasicos(null);
    setDadosPlano(null);
    formPasso1.reset();
    formPasso2.reset();
    setSubmitError(null);
  };

  /**
   * Fecha modal e reseta.
   */
  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Aluno</DialogTitle>
          <DialogDescription>
            Preencha os dados para cadastrar um novo aluno na academia.
          </DialogDescription>
        </DialogHeader>

        {/* ============ INDICADOR DE PASSOS ============ */}
        <div className="flex items-center justify-center gap-2 py-4">
          {PASSOS.map((passo, index) => {
            const Icon = passo.icon;
            const isActive = passo.numero === passoAtual;
            const isCompleted = passo.numero < passoAtual;

            return (
              <div key={passo.numero} className="flex items-center">
                {/* Conector */}
                {index > 0 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      isCompleted ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}

                {/* Círculo do passo */}
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCompleted
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Título do passo atual */}
        <p className="text-center text-sm text-muted-foreground mb-4">
          Passo {passoAtual} de 3: {PASSOS[passoAtual - 1].titulo}
        </p>

        <Separator />

        {/* ============ PASSO 1: DADOS BÁSICOS ============ */}
        {passoAtual === 1 && (
          <form className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input
                  id="nome"
                  {...formPasso1.register("nome")}
                  placeholder="João da Silva"
                />
                {formPasso1.formState.errors.nome && (
                  <p className="text-sm text-destructive mt-1">
                    {formPasso1.formState.errors.nome.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...formPasso1.register("email")}
                  placeholder="joao@email.com"
                />
                {formPasso1.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {formPasso1.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="dataNascimento">Data de nascimento *</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  {...formPasso1.register("dataNascimento")}
                />
                {formPasso1.formState.errors.dataNascimento && (
                  <p className="text-sm text-destructive mt-1">
                    {formPasso1.formState.errors.dataNascimento.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  {...formPasso1.register("telefone")}
                  placeholder="(11) 99999-9999"
                />
                {formPasso1.formState.errors.telefone && (
                  <p className="text-sm text-destructive mt-1">
                    {formPasso1.formState.errors.telefone.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  {...formPasso1.register("cpf")}
                  placeholder="000.000.000-00"
                />
                {formPasso1.formState.errors.cpf && (
                  <p className="text-sm text-destructive mt-1">
                    {formPasso1.formState.errors.cpf.message}
                  </p>
                )}
              </div>
            </div>
          </form>
        )}

        {/* ============ PASSO 2: PAGAMENTO ============ */}
        {passoAtual === 2 && (
          <form className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Mensalidade informativa */}
              <div className="col-span-2 rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium mb-1">Mensalidade padrão</p>
                <p className="text-muted-foreground">
                  1º mês: <span className="font-medium text-foreground">R$ {MENSALIDADE_PADRAO.primeiroMes.toFixed(2).replace(".", ",")}</span>
                  {" · "}
                  A partir do 2º mês: <span className="font-medium text-foreground">R$ {MENSALIDADE_PADRAO.mensalRecorrente.toFixed(2).replace(".", ",")}/mês</span>
                </p>
              </div>

              {/* Seleção de forma de pagamento */}
              <div className="col-span-2">
                <Label>Forma de pagamento da mensalidade *</Label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {(["pix", "dinheiro"] as const).map((metodo) => {
                    const isSelected = formPasso2.watch("metodoPagamento") === metodo;
                    const Icon = metodo === "pix" ? QrCode : Banknote;
                    const label = metodo === "pix" ? "PIX" : "Dinheiro";
                    return (
                      <button
                        key={metodo}
                        type="button"
                        onClick={() =>
                          formPasso2.setValue("metodoPagamento", metodo, {
                            shouldValidate: true,
                          })
                        }
                        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-colors cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-muted hover:border-muted-foreground/50"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="font-medium text-sm">{label}</span>
                      </button>
                    );
                  })}
                </div>
                {formPasso2.formState.errors.metodoPagamento && (
                  <p className="text-sm text-destructive mt-1">
                    {formPasso2.formState.errors.metodoPagamento.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="dataInicio">Data de início *</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  {...formPasso2.register("dataInicio")}
                />
                {formPasso2.formState.errors.dataInicio && (
                  <p className="text-sm text-destructive mt-1">
                    {formPasso2.formState.errors.dataInicio.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="personalId">Personal Trainer (opcional)</Label>
                <Select
                  value={formPasso2.watch("personalId") || "sem_personal"}
                  onValueChange={(v) =>
                    formPasso2.setValue("personalId", v === "sem_personal" ? "" : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um personal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem_personal">Sem personal</SelectItem>
                    {personais.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="observacoesMedicas">
                  Observações médicas (opcional)
                </Label>
                <Textarea
                  id="observacoesMedicas"
                  {...formPasso2.register("observacoesMedicas")}
                  placeholder="Informe restrições médicas, lesões, alergias, etc."
                  rows={3}
                />
                <p className="text-xs text-amber-600 mt-1">
                  Dados sensíveis protegidos pela LGPD
                </p>
              </div>
            </div>
          </form>
        )}

        {/* ============ PASSO 3: CONFIRMAÇÃO ============ */}
        {passoAtual === 3 && dadosBasicos && dadosPlano && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4 space-y-4">
              <div>
                <h4 className="font-medium mb-2">Dados Pessoais</h4>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Nome</dt>
                    <dd>{dadosBasicos.nome}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Email</dt>
                    <dd>{dadosBasicos.email}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Nascimento</dt>
                    <dd>{dadosBasicos.dataNascimento}</dd>
                  </div>
                  {dadosBasicos.telefone && (
                    <div>
                      <dt className="text-muted-foreground">Telefone</dt>
                      <dd>{dadosBasicos.telefone}</dd>
                    </div>
                  )}
                  {dadosBasicos.cpf && (
                    <div>
                      <dt className="text-muted-foreground">CPF</dt>
                      <dd>{dadosBasicos.cpf}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Pagamento & Início</h4>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Forma de pagamento</dt>
                    <dd className="font-medium">
                      {dadosPlano.metodoPagamento === "pix" ? "PIX" : "Dinheiro"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Início</dt>
                    <dd>{dadosPlano.dataInicio}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">1º mês</dt>
                    <dd className="font-medium text-green-600">R$ 50,00</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">A partir do 2º mês</dt>
                    <dd className="font-medium">R$ 65,00/mês</dd>
                  </div>
                  {dadosPlano.personalId && (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Personal</dt>
                      <dd>
                        {personais.find((p) => p.id === dadosPlano.personalId)?.nome ||
                          "Não encontrado"}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {dadosPlano.observacoesMedicas && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Observações Médicas</h4>
                    <p className="text-sm text-muted-foreground">
                      {dadosPlano.observacoesMedicas}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Erro de submit */}
            {submitError && (
              <p className="text-sm text-destructive text-center">{submitError}</p>
            )}
          </div>
        )}

        <Separator />

        {/* ============ BOTÕES DE NAVEGAÇÃO ============ */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={voltarPasso}
            disabled={passoAtual === 1 || isSubmitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          {passoAtual < 3 ? (
            <Button type="button" onClick={avancarPasso}>
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Cadastrar Aluno
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
