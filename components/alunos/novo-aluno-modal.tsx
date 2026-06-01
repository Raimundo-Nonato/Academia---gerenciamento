/**
 * ============================================================================
 * COMPONENTE: MODAL DE CADASTRO DE ALUNO (Wizard)
 * ============================================================================
 * 
 * Formulário de cadastro em 3 passos:
 * 1. Dados Básicos - Nome, email, telefone, CPF, nascimento, endereço
 * 2. Plano - Tipo de plano, data início, personal, obs. médicas
 * 3. Confirmação - Revisão dos dados antes de salvar
 * 
 * VALIDAÇÃO:
 * - Zod schema em cada passo
 * - Não avança sem validar
 * - Botão "Salvar" desabilitado até passo final
 * 
 * TIP: Use react-hook-form + zod para validação robusta.
 * Sempre valide também no backend!
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
  CreditCard,
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
import { Badge } from "@/components/ui/badge";
import { TipoPlano, PLANOS_CONFIG, NovoAlunoData } from "@/types/aluno";

// ============ SCHEMAS DE VALIDAÇÃO (Zod) ============

/**
 * Schema do Passo 1 - Dados Básicos.
 * 
 * TIP: Regex de CPF valida apenas formato, não dígitos verificadores.
 * Implemente validação completa de CPF no backend.
 */
const dadosBasicosSchema = z.object({
  nome: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo"),
  email: z.string().email("Email inválido"),
  telefone: z
    .string()
    .min(10, "Telefone inválido")
    .regex(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/, "Formato: (11) 99999-9999"),
  cpf: z
    .string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "Formato: 000.000.000-00"),
  dataNascimento: z.string().min(1, "Data de nascimento obrigatória"),
  endereco: z.object({
    cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
    logradouro: z.string().min(3, "Logradouro obrigatório"),
    numero: z.string().min(1, "Número obrigatório"),
    complemento: z.string().optional(),
    bairro: z.string().min(2, "Bairro obrigatório"),
    cidade: z.string().min(2, "Cidade obrigatória"),
    estado: z.string().length(2, "Use sigla do estado (ex: SP)"),
  }),
});

/**
 * Schema do Passo 2 - Plano.
 */
const planoSchema = z.object({
  plano: z.enum(["Mensal", "Trimestral", "Semestral", "Anual"]),
  dataInicio: z.string().min(1, "Data de início obrigatória"),
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
  { numero: 2, titulo: "Plano", icon: CreditCard },
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
      telefone: "",
      cpf: "",
      dataNascimento: "",
      endereco: {
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
      },
    },
  });

  // Form do Passo 2
  const formPasso2 = useForm<PlanoForm>({
    resolver: zodResolver(planoSchema),
    defaultValues: dadosPlano || {
      plano: "Mensal",
      dataInicio: new Date().toISOString().split("T")[0],
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

              <div>
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

              <div>
                <Label htmlFor="telefone">Telefone *</Label>
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
                <Label htmlFor="cpf">CPF *</Label>
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

              <div>
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
            </div>

            <Separator />

            <h4 className="font-medium">Endereço</h4>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  {...formPasso1.register("endereco.cep")}
                  placeholder="00000-000"
                />
                {formPasso1.formState.errors.endereco?.cep && (
                  <p className="text-sm text-destructive mt-1">
                    {formPasso1.formState.errors.endereco.cep.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="logradouro">Logradouro *</Label>
                <Input
                  id="logradouro"
                  {...formPasso1.register("endereco.logradouro")}
                  placeholder="Rua, Avenida, etc."
                />
                {formPasso1.formState.errors.endereco?.logradouro && (
                  <p className="text-sm text-destructive mt-1">
                    {formPasso1.formState.errors.endereco.logradouro.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="numero">Número *</Label>
                <Input
                  id="numero"
                  {...formPasso1.register("endereco.numero")}
                  placeholder="123"
                />
                {formPasso1.formState.errors.endereco?.numero && (
                  <p className="text-sm text-destructive mt-1">
                    {formPasso1.formState.errors.endereco.numero.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  {...formPasso1.register("endereco.complemento")}
                  placeholder="Apto, Bloco, etc."
                />
              </div>

              <div>
                <Label htmlFor="bairro">Bairro *</Label>
                <Input
                  id="bairro"
                  {...formPasso1.register("endereco.bairro")}
                  placeholder="Centro"
                />
                {formPasso1.formState.errors.endereco?.bairro && (
                  <p className="text-sm text-destructive mt-1">
                    {formPasso1.formState.errors.endereco.bairro.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  {...formPasso1.register("endereco.cidade")}
                  placeholder="São Paulo"
                />
                {formPasso1.formState.errors.endereco?.cidade && (
                  <p className="text-sm text-destructive mt-1">
                    {formPasso1.formState.errors.endereco.cidade.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="estado">Estado *</Label>
                <Input
                  id="estado"
                  {...formPasso1.register("endereco.estado")}
                  placeholder="SP"
                  maxLength={2}
                />
                {formPasso1.formState.errors.endereco?.estado && (
                  <p className="text-sm text-destructive mt-1">
                    {formPasso1.formState.errors.endereco.estado.message}
                  </p>
                )}
              </div>
            </div>
          </form>
        )}

        {/* ============ PASSO 2: PLANO ============ */}
        {passoAtual === 2 && (
          <form className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plano">Plano *</Label>
                <Select
                  value={formPasso2.watch("plano")}
                  onValueChange={(v) => formPasso2.setValue("plano", v as TipoPlano)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PLANOS_CONFIG) as TipoPlano[]).map((plano) => (
                      <SelectItem key={plano} value={plano}>
                        {PLANOS_CONFIG[plano].label} ({PLANOS_CONFIG[plano].meses} meses)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formPasso2.formState.errors.plano && (
                  <p className="text-sm text-destructive mt-1">
                    {formPasso2.formState.errors.plano.message}
                  </p>
                )}
              </div>

              <div>
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
                  <div>
                    <dt className="text-muted-foreground">Nome</dt>
                    <dd>{dadosBasicos.nome}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd>{dadosBasicos.email}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Telefone</dt>
                    <dd>{dadosBasicos.telefone}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">CPF</dt>
                    <dd>{dadosBasicos.cpf}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Nascimento</dt>
                    <dd>{dadosBasicos.dataNascimento}</dd>
                  </div>
                </dl>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Endereço</h4>
                <p className="text-sm">
                  {dadosBasicos.endereco.logradouro}, {dadosBasicos.endereco.numero}
                  {dadosBasicos.endereco.complemento && ` - ${dadosBasicos.endereco.complemento}`}
                  <br />
                  {dadosBasicos.endereco.bairro}, {dadosBasicos.endereco.cidade} -{" "}
                  {dadosBasicos.endereco.estado}
                  <br />
                  CEP: {dadosBasicos.endereco.cep}
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Plano</h4>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Tipo</dt>
                    <dd>
                      <Badge variant="secondary">{dadosPlano.plano}</Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Início</dt>
                    <dd>{dadosPlano.dataInicio}</dd>
                  </div>
                  {dadosPlano.personalId && (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Personal</dt>
                      <dd>
                        {personais.find((p) => p.id === dadosPlano.personalId)?.nome ||
                          "Não selecionado"}
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
