-- ============================================================================
-- MIGRAÇÃO 0005 — FUNCIONÁRIO GANHA TOGGLE DE ACESSO (IGUAL AO GERENTE)
-- ============================================================================
-- A nota livre "visibilidade" vira um interruptor de verdade, no mesmo
-- estilo do painel de Controle de acesso do Gerente. Só existe um recurso
-- configurável hoje ("financeiro"), por isso uma coluna dedicada — se um
-- dia houver mais de um recurso configurável, revisar para algo genérico
-- (ex: tabela funcionario_permissoes, como o padrão já usado em `permissoes`).
ALTER TABLE funcionarios ADD COLUMN financeiro INTEGER NOT NULL DEFAULT 0;
ALTER TABLE funcionarios DROP COLUMN visibilidade;
