/**
 * ============================================================================
 * GERADOR DE PDF - FICHA DE TREINO
 * ============================================================================
 *
 * Gera um PDF com a ficha de treino do aluno, mantendo a mesma organização
 * (Dia/Treino -> Grupo Muscular -> Exercícios) criada pelo personal.
 */

import { jsPDF } from "jspdf";
import { FichaTreino } from "@/types/aluno";

const MARGIN_X = 14;
const PAGE_WIDTH = 210; // A4 em mm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const PAGE_HEIGHT = 297; // A4 em mm
const BOTTOM_MARGIN = 18;

/**
 * Gera e baixa o PDF da ficha de treino de um aluno.
 *
 * @param ficha Ficha de treino com a hierarquia completa.
 * @param nomeAluno Nome do aluno.
 */
export function gerarPDFFichaTreino(ficha: FichaTreino, nomeAluno: string): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 20;

  const checkPageBreak = (alturaNecessaria: number) => {
    if (y + alturaNecessaria > PAGE_HEIGHT - BOTTOM_MARGIN) {
      doc.addPage();
      y = 20;
    }
  };

  // ===== Título =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(ficha.nome || "Ficha de Treino", MARGIN_X, y);
  y += 8;

  // ===== Nome do aluno =====
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Aluno: ${nomeAluno}`, MARGIN_X, y);
  y += 6;

  if (ficha.descricao) {
    doc.setFontSize(10);
    const linhasDescricao = doc.splitTextToSize(ficha.descricao, CONTENT_WIDTH);
    doc.text(linhasDescricao, MARGIN_X, y);
    y += linhasDescricao.length * 5;
  }

  y += 4;
  doc.setDrawColor(200);
  doc.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
  y += 8;

  // ===== Dias de treino =====
  if (!ficha.dias || ficha.dias.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.text("Nenhum dia de treino cadastrado.", MARGIN_X, y);
  }

  ficha.dias?.forEach((dia) => {
    checkPageBreak(12);

    // Nome do dia
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(dia.nome || "Dia de Treino", MARGIN_X, y);
    y += 7;

    if (!dia.grupos || dia.grupos.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.text("Nenhum grupo muscular cadastrado.", MARGIN_X + 4, y);
      y += 8;
      return;
    }

    dia.grupos.forEach((grupo) => {
      checkPageBreak(14);

      // Nome do grupo muscular
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(grupo.nome || "Grupo Muscular", MARGIN_X + 4, y);
      y += 6;

      if (!grupo.exercicios || grupo.exercicios.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9.5);
        doc.text("Nenhum exercício cadastrado.", MARGIN_X + 8, y);
        y += 7;
        return;
      }

      // Cabeçalho da "tabela" de exercícios
      checkPageBreak(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const colX = {
        exercicio: MARGIN_X + 8,
        series: MARGIN_X + 88,
        reps: MARGIN_X + 108,
        carga: MARGIN_X + 132,
        descanso: MARGIN_X + 160,
      };
      doc.text("Exercício", colX.exercicio, y);
      doc.text("Séries", colX.series, y);
      doc.text("Reps", colX.reps, y);
      doc.text("Carga", colX.carga, y);
      doc.text("Descanso", colX.descanso, y);
      y += 1.5;
      doc.setDrawColor(220);
      doc.line(MARGIN_X + 8, y, PAGE_WIDTH - MARGIN_X, y);
      y += 4.5;

      grupo.exercicios.forEach((exercicio) => {
        checkPageBreak(12);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);

        const nomeLinhas = doc.splitTextToSize(
          exercicio.nome || "-",
          colX.series - colX.exercicio - 2
        );
        doc.text(nomeLinhas, colX.exercicio, y);
        doc.text(exercicio.series || "-", colX.series, y);
        doc.text(exercicio.repeticoes || "-", colX.reps, y);
        doc.text(exercicio.carga || "-", colX.carga, y);
        doc.text(exercicio.descanso || "-", colX.descanso, y);

        const linhasUsadas = Math.max(nomeLinhas.length, 1);
        y += linhasUsadas * 4.5;

        if (exercicio.observacoes) {
          checkPageBreak(8);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8.5);
          const obsLinhas = doc.splitTextToSize(
            `Obs.: ${exercicio.observacoes}`,
            CONTENT_WIDTH - 8
          );
          doc.text(obsLinhas, colX.exercicio, y);
          y += obsLinhas.length * 4;
        }

        y += 1.5;
      });

      y += 3;
    });

    y += 3;
  });

  const nomeArquivo = `ficha-treino-${(nomeAluno || "aluno")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}.pdf`;

  doc.save(nomeArquivo);
}
