-- ============================================================================
-- MIGRAÇÃO 0002 — DADOS INICIAIS
-- ============================================================================
-- Personal trainers (mesmos IDs já usados no mock do frontend, para os
-- vínculos existentes em alunos.personal_id continuarem fazendo sentido).
INSERT INTO personals (id, nome) VALUES
  ('p1', 'Carlos Trainer'),
  ('p2', 'Ana Personal'),
  ('p3', 'Bruno Coach');

-- Única restrição inicial de permissão: GERENTE e RECEPCIONISTA não acessam
-- o Financeiro por padrão. O ADMIN pode liberar isso depois pela tela de
-- Configurações (não precisa mexer no banco na mão).
-- Todas as demais áreas (alunos, agenda, relatorios, funcionarios) ficam
-- permitidas por padrão, por não terem linha aqui.
INSERT INTO permissoes (role, recurso, permitido) VALUES
  ('GERENTE', 'financeiro', 0),
  ('RECEPCIONISTA', 'financeiro', 0);
