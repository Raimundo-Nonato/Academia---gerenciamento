-- ============================================================================
-- MIGRAÇÃO 0003 — PERSONAL TRAINER VIRA TEXTO LIVRE
-- ============================================================================
-- Personal trainer deixa de ser um cadastro (sem tabela própria, sem tela de
-- gerenciar). Quem registra o aluno digita o nome na hora, sem escolher de
-- uma lista fixa. A tabela `personals` e os campos `personal_id` (com FK)
-- saem; entra uma coluna de texto livre em cada tabela que precisava exibir
-- o nome do personal.

ALTER TABLE alunos ADD COLUMN personal_nome TEXT;
UPDATE alunos SET personal_nome = (
  SELECT p.nome FROM personals p WHERE p.id = alunos.personal_id
) WHERE personal_id IS NOT NULL;
ALTER TABLE alunos DROP COLUMN personal_id;

ALTER TABLE fichas_treino ADD COLUMN personal_nome TEXT;
UPDATE fichas_treino SET personal_nome = (
  SELECT p.nome FROM personals p WHERE p.id = fichas_treino.personal_id
) WHERE personal_id IS NOT NULL;
ALTER TABLE fichas_treino DROP COLUMN personal_id;

DROP TABLE personals;
