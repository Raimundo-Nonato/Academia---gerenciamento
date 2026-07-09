/**
 * Funcionário: não é uma conta de login, é só um registro que o ADMIN
 * mantém em Configurações — nome + um interruptor "financeiro" no mesmo
 * formato do usado no Gerente.
 *
 * IMPORTANTE: como funcionário não loga no sistema, esse interruptor ainda
 * NÃO é checado em lugar nenhum (lib/auth/guard.ts só olha a tabela
 * `permissoes`, por role de usuário) — hoje ele só guarda o valor. Só passa
 * a valer algo de verdade se/quando funcionário ganhar conta de login própria.
 */
export interface Funcionario {
  id: string;
  nome: string;
  financeiro: boolean;
  criadoEm: string;
}
