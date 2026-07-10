-- ============================================================================
-- MIGRAÇÃO 0004 — FUNCIONÁRIOS (LISTA SIMPLES)
-- ============================================================================
-- Não é conta de login nem cadastro complexo — só uma lista que o ADMIN
-- mantém em Meu Perfil: nome do funcionário + uma nota livre sobre o que é
-- visível para ele(a).
CREATE TABLE funcionarios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  visibilidade TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
