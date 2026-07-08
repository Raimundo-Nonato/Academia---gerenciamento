// ============================================================================
// BACKUP DO BANCO DE DADOS
// ============================================================================
// Copia o arquivo do banco para uma pasta de backups, com a data no nome, e
// apaga cópias com mais de 30 dias (para a pasta não crescer para sempre).
//
// Rodar manualmente:  pnpm run backup
// Agendar 1x por dia: ver instruções no final deste arquivo.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const DIAS_PARA_MANTER = 30;

const raizProjeto = path.join(import.meta.dirname, "..");
const pastaDados = process.env.DATA_DIR
  ? path.resolve(raizProjeto, process.env.DATA_DIR)
  : path.join(raizProjeto, "data");

const arquivoBanco = path.join(pastaDados, "wenvefit.sqlite");
if (!fs.existsSync(arquivoBanco)) {
  console.error(`Banco não encontrado em ${arquivoBanco}. Rode "pnpm dev" pelo menos uma vez antes.`);
  process.exit(1);
}

const pastaBackup = path.join(pastaDados, "backups");
fs.mkdirSync(pastaBackup, { recursive: true });

const carimbo = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const destino = path.join(pastaBackup, `wenvefit-${carimbo}.sqlite`);
fs.copyFileSync(arquivoBanco, destino);
console.log(`Backup criado: ${destino}`);

const limite = Date.now() - DIAS_PARA_MANTER * 24 * 60 * 60 * 1000;
for (const nome of fs.readdirSync(pastaBackup)) {
  const caminho = path.join(pastaBackup, nome);
  if (fs.statSync(caminho).mtimeMs < limite) {
    fs.unlinkSync(caminho);
    console.log(`Backup antigo removido: ${nome}`);
  }
}

// ============================================================================
// COMO AGENDAR NO WINDOWS (1x por dia, sem precisar digitar comando depois)
// ============================================================================
// 1. Abra o "Agendador de Tarefas" do Windows (pesquise no menu Iniciar).
// 2. Clique em "Criar Tarefa Básica..." (painel da direita).
// 3. Nome: "Backup WenveFit" -> Próximo.
// 4. Disparador: "Diariamente" -> escolha um horário (ex: 3:00 da manhã) -> Próximo.
// 5. Ação: "Iniciar um programa" -> Próximo.
// 6. Em "Programa/script", coloque o caminho do node, por exemplo:
//      C:\Program Files\nodejs\node.exe
// 7. Em "Adicionar argumentos", coloque:
//      scripts/backup-db.mjs
// 8. Em "Iniciar em (opcional)", coloque o caminho desta pasta do projeto, ex:
//      C:\Users\SEU_USUARIO\Downloads\academiasistema\Academia---gerenciamento
// 9. Concluir. Pronto — roda sozinho todo dia, mesmo com o site fechado.
// ============================================================================
