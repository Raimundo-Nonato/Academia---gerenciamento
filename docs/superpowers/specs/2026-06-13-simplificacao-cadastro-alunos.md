# Simplificação do Cadastro de Alunos — Design Spec

**Data:** 2026-06-13  
**Status:** Aprovado para implementação

---

## Objetivo

Simplificar o cadastro de alunos removendo campos desnecessários (endereço, planos múltiplos) e adicionando seleção de forma de pagamento da mensalidade com registro no histórico financeiro.

---

## Escopo das mudanças

### 1. Cadastro de aluno — campos obrigatórios

**Manter obrigatórios:**
- Nome completo
- E-mail
- Data de nascimento

**Remover completamente:**
- Endereço (CEP, logradouro, número, complemento, bairro, cidade, estado)
- CPF (não estava obrigatório visualmente, mas estava no schema — remover do form de criação)
- Telefone (simplificação — não listado como obrigatório)

> Nota: CPF e telefone seguem existindo no tipo `AlunoDetalhes` pois podem ser necessários no futuro. No wizard de criação, apenas os 3 campos obrigatórios acima.

### 2. Forma de pagamento da mensalidade

Adicionar no wizard (passo 2, que será renomeado de "Plano" para "Pagamento"):
- Seleção obrigatória: **PIX** ou **Dinheiro**
- Campo visual: dois botões/cards de seleção (radio visual)

Esta informação deve ser registrada como o `metodoPagamento` no histórico financeiro ao cadastrar o aluno.

### 3. Remoção da escolha de planos

- Remover completamente a seleção de tipo de plano (Mensal/Trimestral/Semestral/Anual)
- O sistema passa a ter **mensalidade única padrão:**
  - 1º mês: R$ 50,00
  - A partir do 2º mês: R$ 65,00/mês
- A data de início continua existindo no passo 2
- O personal trainer (opcional) continua existindo

---

## Arquitetura das mudanças

### Arquivos afetados

| Arquivo | O que muda |
|---|---|
| `types/aluno.ts` | Remover `TipoPlano`, `PLANOS_CONFIG`, `endereco` de `NovoAlunoDadosBasicos`, simplificar `NovoAlunoPlano`, adicionar `metodoPagamento` |
| `components/alunos/novo-aluno-modal.tsx` | Refatorar wizard: remover endereço do passo 1, remover seleção de plano do passo 2, adicionar seleção PIX/Dinheiro |
| `app/(dashboard)/alunos/page.tsx` | Atualizar `handleSaveNovoAluno` para remover lógica de planos e registrar pagamento inicial; remover `PLANOS_CONFIG` do import |
| `components/alunos/alunos-filtros.tsx` | Remover filtro de plano |
| `components/alunos/alunos-tabela.tsx` | Remover coluna "Plano" ou substituir por "Pagamento" |
| `types/aluno.ts` | Manter `Aluno.plano` como opcional ou substituir por campo fixo (ver abaixo) |

### Decisão sobre `Aluno.plano`

O campo `plano` em `Aluno` e nos mocks será tratado como legado — **não será exibido** nas novas fichas. Nos mocks existentes, os dados permanecerão para não quebrar a estrutura. Novos alunos cadastrados **não terão** o campo plano preenchido.

A interface `Aluno` terá `plano` como opcional (`plano?: TipoPlano`) para compatibilidade.

### Registro de pagamento inicial

Ao cadastrar um novo aluno, gerar automaticamente no histórico financeiro:
- Um registro de pagamento pendente no valor de **R$ 50,00** (1º mês)
- `metodoPagamento`: o que o usuário selecionou (pix | dinheiro)
- `status`: "pendente"
- `referencia`: "1º mês"

No financeiro, isso aparece como nova transação de entrada.

---

## Regras de negócio

- `metodoPagamento` é obrigatório no cadastro (PIX ou Dinheiro)
- O valor fixo de R$ 50,00 é gerado automaticamente para o 1º mês
- A partir do 2º mês, o sistema deverá cobrar R$ 65,00 (lógica futura de API, fora do escopo desta entrega)
- Sem seleção de plano — todos os novos alunos são mensais por padrão

---

## O que NÃO muda

- Ficha lateral do aluno (`aluno-ficha.tsx`) — exibe dados históricos, sem impacto
- Página financeira — apenas recebe o novo registro via mock
- Autenticação, sidebar, layout
- Demais componentes de UI
