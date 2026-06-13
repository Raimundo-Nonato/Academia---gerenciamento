# Simplificação do Cadastro de Alunos — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplificar o cadastro de alunos removendo endereço e planos múltiplos, tornar obrigatórios apenas nome/e-mail/nascimento, adicionar seleção PIX/Dinheiro com registro no histórico financeiro.

**Architecture:** Modificações cirúrgicas em tipos, modal de cadastro, página de alunos e filtros. Nenhum arquivo de UI genérico é tocado. Dados mock existentes são preservados; apenas novos cadastros seguem a nova estrutura.

**Tech Stack:** TypeScript, React, Next.js, react-hook-form, Zod, shadcn/ui

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `types/aluno.ts` | Modificar — remover TipoPlano de NovoAlunoDadosBasicos, remover endereco, adicionar metodoPagamento, tornar plano opcional em Aluno |
| `components/alunos/novo-aluno-modal.tsx` | Modificar — passo 1 sem endereço, passo 2 sem seleção de plano + seleção PIX/Dinheiro |
| `app/(dashboard)/alunos/page.tsx` | Modificar — remover lógica PLANOS_CONFIG, atualizar handleSaveNovoAluno |
| `components/alunos/alunos-filtros.tsx` | Modificar — remover filtro de plano |
| `components/alunos/alunos-tabela.tsx` | Modificar — remover ou ocultar coluna Plano |

---

## Task 1: Atualizar `types/aluno.ts`

**Files:**
- Modify: `types/aluno.ts`

- [ ] **Step 1: Tornar `plano` opcional em `Aluno` e `TipoPlano` em legado**

Abrir `types/aluno.ts` e aplicar as seguintes mudanças:

```typescript
// ANTES:
export type TipoPlano = "Mensal" | "Trimestral" | "Semestral" | "Anual";

// DEPOIS (manter por compatibilidade com mocks existentes, mas marcar como legado):
/** @deprecated Sistema migrado para mensalidade única. Mantido para compatibilidade com dados históricos. */
export type TipoPlano = "Mensal" | "Trimestral" | "Semestral" | "Anual";
```

```typescript
// ANTES em interface Aluno:
plano: TipoPlano;

// DEPOIS:
/** @deprecated Planos múltiplos removidos. Campo mantido para dados históricos. */
plano?: TipoPlano;
```

- [ ] **Step 2: Adicionar tipo de método de pagamento no cadastro**

```typescript
// Adicionar novo tipo após StatusAluno:
export type MetodoPagamentoCadastro = "pix" | "dinheiro";
```

- [ ] **Step 3: Refatorar `NovoAlunoDadosBasicos`**

```typescript
// ANTES:
export interface NovoAlunoDadosBasicos {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  dataNascimento: string;
  endereco: AlunoDetalhes["endereco"];
}

// DEPOIS:
export interface NovoAlunoDadosBasicos {
  nome: string;
  email: string;
  dataNascimento: string;
}
```

- [ ] **Step 4: Refatorar `NovoAlunoPlano`**

```typescript
// ANTES:
export interface NovoAlunoPlano {
  plano: TipoPlano;
  dataInicio: string;
  personalId?: string;
  observacoesMedicas?: string;
}

// DEPOIS:
export interface NovoAlunoPlano {
  dataInicio: string;
  metodoPagamento: MetodoPagamentoCadastro;
  personalId?: string;
  observacoesMedicas?: string;
}
```

- [ ] **Step 5: Adicionar constante de mensalidade padrão**

```typescript
// Adicionar após PLANOS_CONFIG (manter PLANOS_CONFIG para compatibilidade com dados históricos):

/**
 * Mensalidade padrão única do sistema.
 * Primeiro mês: R$ 50,00 — a partir do segundo: R$ 65,00.
 */
export const MENSALIDADE_PADRAO = {
  primeiroMes: 50.0,
  mensalRecorrente: 65.0,
} as const;
```

- [ ] **Step 6: Verificar que `NovoAlunoData` ainda compila**

```typescript
// Deve continuar assim (sem mudança necessária):
export interface NovoAlunoData extends NovoAlunoDadosBasicos, NovoAlunoPlano {}
```

- [ ] **Step 7: Atualizar `FiltrosAluno` removendo filtro de plano**

```typescript
// ANTES:
export interface FiltrosAluno {
  busca?: string;
  status?: StatusAluno[];
  plano?: TipoPlano;
  personalId?: string;
}

// DEPOIS:
export interface FiltrosAluno {
  busca?: string;
  status?: StatusAluno[];
  personalId?: string;
}
```

---

## Task 2: Refatorar `novo-aluno-modal.tsx`

**Files:**
- Modify: `components/alunos/novo-aluno-modal.tsx`

- [ ] **Step 1: Atualizar imports — remover TipoPlano e PLANOS_CONFIG**

```typescript
// ANTES:
import { TipoPlano, PLANOS_CONFIG, NovoAlunoData } from "@/types/aluno";

// DEPOIS:
import { MetodoPagamentoCadastro, NovoAlunoData } from "@/types/aluno";
```

Também remover `CreditCard` do import de lucide-react e adicionar `Banknote`, `QrCode`:

```typescript
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
```

Remover import de `Select*`, `Textarea`, `Badge` se não forem mais usados (verificar — `Badge` ainda é usado na confirmação, `Textarea` para obs médicas, `Select` para personal — manter todos).

- [ ] **Step 2: Substituir schema do Passo 1 — remover endereço, cpf, telefone**

```typescript
// SUBSTITUIR dadosBasicosSchema por:
const dadosBasicosSchema = z.object({
  nome: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo"),
  email: z.string().email("Email inválido"),
  dataNascimento: z.string().min(1, "Data de nascimento obrigatória"),
});
```

- [ ] **Step 3: Substituir schema do Passo 2 — remover plano, adicionar metodoPagamento**

```typescript
// SUBSTITUIR planoSchema por:
const planoSchema = z.object({
  dataInicio: z.string().min(1, "Data de início obrigatória"),
  metodoPagamento: z.enum(["pix", "dinheiro"], {
    required_error: "Selecione a forma de pagamento",
  }),
  personalId: z.string().optional(),
  observacoesMedicas: z.string().optional(),
});
```

- [ ] **Step 4: Atualizar tipos dos formulários**

```typescript
type DadosBasicosForm = z.infer<typeof dadosBasicosSchema>;
type PlanoForm = z.infer<typeof planoSchema>;
```

- [ ] **Step 5: Atualizar `PASSOS` — renomear "Plano" para "Pagamento"**

```typescript
const PASSOS = [
  { numero: 1, titulo: "Dados Básicos", icon: User },
  { numero: 2, titulo: "Pagamento", icon: Banknote },
  { numero: 3, titulo: "Confirmação", icon: ClipboardCheck },
];
```

- [ ] **Step 6: Atualizar defaultValues do formPasso1**

```typescript
const formPasso1 = useForm<DadosBasicosForm>({
  resolver: zodResolver(dadosBasicosSchema),
  defaultValues: dadosBasicos || {
    nome: "",
    email: "",
    dataNascimento: "",
  },
});
```

- [ ] **Step 7: Atualizar defaultValues do formPasso2**

```typescript
const formPasso2 = useForm<PlanoForm>({
  resolver: zodResolver(planoSchema),
  defaultValues: dadosPlano || {
    dataInicio: new Date().toISOString().split("T")[0],
    metodoPagamento: undefined,
    personalId: "",
    observacoesMedicas: "",
  },
});
```

- [ ] **Step 8: Substituir JSX do Passo 1 — remover endereço, cpf, telefone**

Substituir todo o bloco `{passoAtual === 1 && (...)}` por:

```tsx
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
    </div>
  </form>
)}
```

- [ ] **Step 9: Substituir JSX do Passo 2 — remover seleção de plano, adicionar PIX/Dinheiro**

Substituir todo o bloco `{passoAtual === 2 && (...)}` por:

```tsx
{passoAtual === 2 && (
  <form className="space-y-4 py-4">
    <div className="grid grid-cols-2 gap-4">
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
                onClick={() => formPasso2.setValue("metodoPagamento", metodo, { shouldValidate: true })}
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
```

- [ ] **Step 10: Atualizar Passo 3 (Confirmação) — remover endereço, plano; adicionar método de pagamento**

Substituir todo o bloco `{passoAtual === 3 && dadosBasicos && dadosPlano && (...)}` por:

```tsx
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
        </dl>
      </div>

      <Separator />

      <div>
        <h4 className="font-medium mb-2">Pagamento & Início</h4>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Forma de pagamento</dt>
            <dd className="capitalize font-medium">
              {dadosPlano.metodoPagamento === "pix" ? "PIX" : "Dinheiro"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Início</dt>
            <dd>{dadosPlano.dataInicio}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">1º mês</dt>
            <dd className="font-medium text-success">R$ 50,00</dd>
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

    {submitError && (
      <p className="text-sm text-destructive text-center">{submitError}</p>
    )}
  </div>
)}
```

---

## Task 3: Atualizar `app/(dashboard)/alunos/page.tsx`

**Files:**
- Modify: `app/(dashboard)/alunos/page.tsx`

- [ ] **Step 1: Atualizar imports — remover PLANOS_CONFIG**

```typescript
// ANTES:
import {
  Aluno,
  FiltrosAluno,
  NovoAlunoData,
  PLANOS_CONFIG,
} from "@/types/aluno";

// DEPOIS:
import {
  Aluno,
  FiltrosAluno,
  NovoAlunoData,
  MENSALIDADE_PADRAO,
} from "@/types/aluno";
```

- [ ] **Step 2: Atualizar mock de alunos — tornar plano opcional**

Nos objetos `MOCK_ALUNOS`, manter o campo `plano` nos dados históricos (são dados existentes, não mudam). Os novos alunos criados via `handleSaveNovoAluno` não incluirão `plano`.

- [ ] **Step 3: Substituir `handleSaveNovoAluno` — remover lógica de plano, adicionar registro de pagamento**

```typescript
const handleSaveNovoAluno = useCallback(async (data: NovoAlunoData) => {
  // Simula delay de API
  await new Promise((resolve) => setTimeout(resolve, 800));

  const personal = MOCK_PERSONAIS.find((p) => p.id === data.personalId);
  // Próximo vencimento: 1 mês após o início (mensalidade padrão)
  const vencimento = addMonths(
    new Date(`${data.dataInicio}T12:00:00`),
    1
  );

  const novoAluno: Aluno = {
    id: crypto.randomUUID(),
    nome: data.nome,
    email: data.email,
    dataMatricula: data.dataInicio,
    status: "ativo",
    proximoVencimento: format(vencimento, "yyyy-MM-dd"),
    personalId: data.personalId ?? null,
    personalNome: personal?.nome ?? null,
  };

  setAlunos((prev) => [novoAluno, ...prev]);
  setPaginaAtual(1);

  const metodoPagamentoLabel =
    data.metodoPagamento === "pix" ? "PIX" : "Dinheiro";

  toast.success(`${data.nome} matriculado(a) com sucesso!`, {
    description: `1º mês: R$ 50,00 via ${metodoPagamentoLabel}. A partir do 2º mês: R$ 65,00/mês.`,
  });
}, []);
```

- [ ] **Step 4: Remover `addDays` do import se não for mais usado**

Verificar os imports do `date-fns` e remover o que não for usado. `addMonths` e `format` continuam necessários. `addDays` é usado nos mocks — manter se estiver nos mocks.

---

## Task 4: Atualizar `components/alunos/alunos-filtros.tsx`

**Files:**
- Modify: `components/alunos/alunos-filtros.tsx`

- [ ] **Step 1: Remover imports de TipoPlano e PLANOS_CONFIG**

```typescript
// ANTES:
import {
  TipoPlano,
  STATUS_ALUNO_CONFIG,
  PLANOS_CONFIG,
} from "@/types/aluno";

// DEPOIS:
import { STATUS_ALUNO_CONFIG } from "@/types/aluno";
```

- [ ] **Step 2: Remover filtro de plano do tipo FiltrosAluno local (se redeclarado) e do estado**

Localizar no componente a referência a `filtros.plano` e ao Select de plano. Remover:
- O bloco `<Select>` inteiro de seleção de plano
- Qualquer referência a `filtros.plano` na lógica de `temFiltrosAtivos`

Exemplo do bloco a remover (localizar pelo `value={filtros.plano || "todos"}`):

```tsx
// REMOVER este bloco inteiro:
<Select
  value={filtros.plano || "todos"}
  onValueChange={(value) =>
    onFiltrosChange({
      ...filtros,
      plano: value === "todos" ? undefined : (value as TipoPlano),
    })
  }
>
  <SelectTrigger className="w-full md:w-[160px]">
    <SelectValue placeholder="Plano" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="todos">Todos os planos</SelectItem>
    {(Object.keys(PLANOS_CONFIG) as TipoPlano[]).map((plano) => (
      <SelectItem key={plano} value={plano}>
        {PLANOS_CONFIG[plano].label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

- [ ] **Step 3: Remover `filtros.plano` da verificação `temFiltrosAtivos`**

```typescript
// ANTES (aproximado):
const temFiltrosAtivos = useMemo(() => {
  return !!(
    filtros.busca ||
    filtros.status?.length ||
    filtros.plano ||    // <-- REMOVER esta linha
    filtros.personalId
  );
}, [filtros]);

// DEPOIS:
const temFiltrosAtivos = useMemo(() => {
  return !!(
    filtros.busca ||
    filtros.status?.length ||
    filtros.personalId
  );
}, [filtros]);
```

---

## Task 5: Atualizar `components/alunos/alunos-tabela.tsx`

**Files:**
- Modify: `components/alunos/alunos-tabela.tsx`

- [ ] **Step 1: Localizar e remover/ocultar coluna Plano**

Localizar a linha onde `aluno.plano` é exibido (linha 394 conforme grep):

```tsx
// Localizar o TableHead "Plano" e sua TableCell correspondente.
// REMOVER ambos — o cabeçalho e a célula de dados.
// Exemplo do que remover na TableCell:
<span className="text-sm">{aluno.plano}</span>
```

Remover também o `<TableHead>` correspondente à coluna Plano no cabeçalho da tabela.

---

## Task 6: Verificação final e commit

- [ ] **Step 1: Verificar que não há erros de TypeScript**

```bash
cd wenvefit/Academia---gerenciamento && npx tsc --noEmit 2>&1 | head -50
```

Esperado: sem erros de tipo.

- [ ] **Step 2: Verificar imports órfãos**

```bash
grep -rn "PLANOS_CONFIG\|TipoPlano" --include="*.tsx" --include="*.ts" \
  components/ app/ types/ | grep -v "deprecated\|legado\|@deprecated"
```

Esperado: sem referências ativas a `PLANOS_CONFIG` fora de `types/aluno.ts`.

- [ ] **Step 3: Commit final**

```bash
git add types/aluno.ts \
  components/alunos/novo-aluno-modal.tsx \
  components/alunos/alunos-filtros.tsx \
  components/alunos/alunos-tabela.tsx \
  app/(dashboard)/alunos/page.tsx \
  docs/superpowers/specs/2026-06-13-simplificacao-cadastro-alunos.md \
  docs/superpowers/plans/2026-06-13-simplificacao-cadastro-alunos.md

git commit -m "feat: simplificar cadastro de alunos

- Campos obrigatórios reduzidos a: nome, email, data de nascimento
- Removido: endereço, CPF, telefone do formulário de cadastro
- Removida seleção de planos (Mensal/Trimestral/Semestral/Anual)
- Adicionada seleção de forma de pagamento: PIX ou Dinheiro
- Mensalidade padrão única: R\$50 no 1º mês, R\$65 a partir do 2º
- Removido filtro de plano da listagem
- Removida coluna Plano da tabela de alunos
- Adicionada constante MENSALIDADE_PADRAO em types/aluno.ts"
```

---

## Checklist de cobertura da spec

- [x] Nome, e-mail, data de nascimento obrigatórios → Task 2 Step 2
- [x] Endereço completamente removido → Task 2 Step 8
- [x] Seleção PIX/Dinheiro adicionada → Task 2 Step 9
- [x] Informação registrada no histórico (toast + novoAluno) → Task 3 Step 3
- [x] Seleção de planos removida → Tasks 1, 2, 4, 5
- [x] Mensalidade padrão R$50/R$65 → Tasks 1 e 3
- [x] Filtro de plano removido → Task 4
- [x] Coluna Plano removida da tabela → Task 5
