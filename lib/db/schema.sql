-- ============================================================================
-- MAPA DO BANCO DE DADOS DO WENVEFIT
-- ============================================================================
-- Este arquivo é só para LEITURA/CONSULTA — mostra todas as tabelas de uma vez,
-- para entender o banco todo rapidamente.
--
-- O que realmente é executado fica em `lib/db/migrations/*.sql`, aplicado em
-- ordem pelo `lib/db/migrate.ts`. Se precisar mudar o banco no futuro, crie um
-- novo arquivo de migração (ex: 0003_alguma_coisa.sql) — nunca edite os
-- arquivos de migração antigos, pois eles já podem ter rodado em produção.
-- ============================================================================

-- Usuários do sistema (login). Só 2 contas reais por enquanto: GERENTE e ADMIN.
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,     -- senha criptografada (hash), nunca texto puro
  role TEXT NOT NULL CHECK (role IN ('RECEPCIONISTA','GERENTE','ADMIN')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sessões de login ativas. O cookie do navegador guarda o "id" desta tabela.
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,             -- token aleatório = valor do cookie
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,        -- sessão expira em 7 dias
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Permissões configuráveis pelo ADMIN. O ADMIN nunca aparece aqui — ele sempre
-- tem acesso total, isso é garantido no código (lib/auth/guard.ts), não no banco.
-- "configuracoes" também nunca aparece aqui: é sempre exclusiva do ADMIN.
-- Regra: se não houver linha para (role, recurso), o acesso é PERMITIDO por
-- padrão. Só é preciso guardar as exceções (o que foi restringido).
CREATE TABLE permissoes (
  role TEXT NOT NULL CHECK (role IN ('RECEPCIONISTA','GERENTE')),
  recurso TEXT NOT NULL,           -- único valor hoje: 'financeiro'
  permitido INTEGER NOT NULL,      -- 0 ou 1
  PRIMARY KEY (role, recurso)
);

-- Alunos: dados básicos + sensíveis na mesma tabela (a máscara do CPF acontece
-- na camada da API, não aqui no banco).
CREATE TABLE alunos (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT NOT NULL,
  data_matricula TEXT NOT NULL,          -- ISO yyyy-mm-dd
  status TEXT NOT NULL CHECK (status IN ('ativo','inadimplente','suspenso','cancelado')),
  proximo_vencimento TEXT NOT NULL,      -- ISO yyyy-mm-dd

  -- campos de AlunoDetalhes (sensíveis / LGPD)
  cpf TEXT,
  data_nascimento TEXT,
  endereco_logradouro TEXT,
  endereco_numero TEXT,
  endereco_complemento TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_estado TEXT,
  endereco_cep TEXT,
  observacoes_medicas TEXT,
  contato_emergencia_nome TEXT,
  contato_emergencia_telefone TEXT,
  contato_emergencia_parentesco TEXT,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- Nome do personal trainer, digitado livremente por quem cadastra o aluno
  -- (não é um cadastro à parte — sem tabela, sem tela de gerenciar). Coluna
  -- adicionada depois (migração 0003), por isso fica no fim da tabela real.
  personal_nome TEXT
);
CREATE INDEX idx_alunos_email ON alunos(email);
CREATE INDEX idx_alunos_status ON alunos(status);

-- Lançamentos financeiros (mensalidade / despesa / estorno).
CREATE TABLE lancamentos (
  id TEXT PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor REAL NOT NULL,
  data TEXT NOT NULL,                    -- ISO yyyy-mm-dd (data do lançamento)
  categoria TEXT NOT NULL CHECK (categoria IN ('mensalidade','despesa','estorno')),
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('pix','dinheiro')),
  aluno_id TEXT REFERENCES alunos(id) ON DELETE SET NULL, -- só preenchido p/ mensalidade
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_lancamentos_data ON lancamentos(data);
CREATE INDEX idx_lancamentos_categoria ON lancamentos(categoria);

-- Funcionários: lista simples mantida pelo ADMIN (não é conta de login,
-- por isso o toggle "financeiro" abaixo ainda não é checado em lugar
-- nenhum — ver types/funcionario.ts).
CREATE TABLE funcionarios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  financeiro INTEGER NOT NULL DEFAULT 0 -- migração 0005, por isso no fim
);

-- Fichas de treino (hierarquia de 4 níveis). Tabelas criadas agora só para
-- reservar o formato — a tela de gerenciar fichas fica para uma fase futura.
CREATE TABLE fichas_treino (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativa INTEGER NOT NULL DEFAULT 1,
  aluno_id TEXT REFERENCES alunos(id) ON DELETE CASCADE,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizada_em TEXT NOT NULL DEFAULT (datetime('now')),
  personal_nome TEXT -- migração 0003, por isso no fim (ver comentário em `alunos`)
);

CREATE TABLE dias_treino (
  id TEXT PRIMARY KEY,
  ficha_id TEXT NOT NULL REFERENCES fichas_treino(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE grupos_musculares_treino (
  id TEXT PRIMARY KEY,
  dia_id TEXT NOT NULL REFERENCES dias_treino(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE exercicios_treino (
  id TEXT PRIMARY KEY,
  grupo_id TEXT NOT NULL REFERENCES grupos_musculares_treino(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  series TEXT NOT NULL,
  repeticoes TEXT NOT NULL,
  carga TEXT NOT NULL,
  descanso TEXT NOT NULL,
  observacoes TEXT,
  ordem INTEGER NOT NULL DEFAULT 0
);
