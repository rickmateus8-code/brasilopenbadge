/**
 * Utilitários para exportação de PDF com melhor qualidade
 * Compatível com dispositivos móveis (Android/iOS)
 */

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export interface PDFExportOptions {
  filename: string;
  scale?: number;
  quality?: number;
  orientation?: "p" | "l";
  format?: "a4" | "letter";
}

/**
 * Exportar elemento HTML para PDF com qualidade otimizada.
 *
 * Notas importantes para mobile:
 * - O elemento capturado DEVE estar sem transform scale aplicado,
 *   caso contrário o html2canvas captura a versão escalada e o PDF fica distorcido.
 * - Em dispositivos com DPR alto (Android/iOS), o scale do html2canvas é
 *   limitado a 2 para evitar estouro de memória.
 */
export async function exportElementToPDF(
  element: HTMLElement,
  options: PDFExportOptions
): Promise<void> {
  const {
    filename,
    scale = 2,
    quality = 0.92,
    orientation = "p",
    format = "a4",
  } = options;

  // Em dispositivos com pouca memória (mobile), limita o scale para evitar crash
  const deviceScale = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;
  const safeScale = deviceScale > 2 ? Math.min(scale, 1.5) : scale;

  try {
    // Converter elemento para canvas com alta qualidade
    const canvas = await html2canvas(element, {
      scale: safeScale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 15000,
      // Usa as dimensões reais do elemento (sem considerar transform do pai)
      windowHeight: element.scrollHeight,
      windowWidth: element.scrollWidth,
      // Ignora elementos fora do elemento capturado
      ignoreElements: (el) => {
        // Ignora elementos de UI que não devem aparecer no PDF
        return el.tagName === "BUTTON" || el.classList.contains("no-print");
      },
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error("Canvas gerado está vazio. Verifique se o elemento está visível.");
    }

    // Criar PDF A4
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format,
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Calcular proporção mantendo aspecto — preenche a largura do A4
    const ratio = pdfWidth / imgWidth;
    const scaledWidth = pdfWidth;
    const scaledHeight = imgHeight * ratio;

    // Se o conteúdo cabe em uma página, centraliza verticalmente
    // Caso contrário, começa do topo com margem mínima
    const yOffset = scaledHeight <= pdfHeight
      ? (pdfHeight - scaledHeight) / 2
      : 0;

    // Converter canvas para imagem JPEG com qualidade ajustada
    const imgData = canvas.toDataURL("image/jpeg", quality);

    if (scaledHeight <= pdfHeight) {
      // Conteúdo cabe em uma única página
      pdf.addImage(imgData, "JPEG", 0, yOffset, scaledWidth, scaledHeight);
    } else {
      // Conteúdo maior que uma página — divide em múltiplas páginas
      let yPosition = 0;
      let pageIndex = 0;

      while (yPosition < scaledHeight) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        // Recorta a porção da página atual do canvas
        const pageCanvas = document.createElement("canvas");
        const pageHeightPx = Math.round((pdfHeight / ratio));
        const startY = Math.round(yPosition / ratio);
        const sliceHeight = Math.min(pageHeightPx, imgHeight - startY);

        pageCanvas.width = imgWidth;
        pageCanvas.height = sliceHeight;

        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(canvas, 0, startY, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight);
          const pageImgData = pageCanvas.toDataURL("image/jpeg", quality);
          const pageScaledHeight = sliceHeight * ratio;
          pdf.addImage(pageImgData, "JPEG", 0, 0, scaledWidth, pageScaledHeight);
        }

        yPosition += pdfHeight;
        pageIndex++;
      }
    }

    // Salvar PDF — em mobile o browser abre o arquivo para download
    pdf.save(filename);
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    throw new Error(
      `Falha ao exportar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`
    );
  }
}

/**
 * Exportar múltiplas páginas para PDF
 */
export async function exportMultiPagePDF(
  elements: HTMLElement[],
  options: PDFExportOptions
): Promise<void> {
  const {
    filename,
    scale = 2,
    quality = 0.92,
    orientation = "p",
    format = "a4",
  } = options;

  const deviceScale = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;
  const safeScale = deviceScale > 2 ? Math.min(scale, 1.5) : scale;

  try {
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format,
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      const canvas = await html2canvas(element, {
        scale: safeScale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 15000,
        windowHeight: element.scrollHeight,
        windowWidth: element.scrollWidth,
      });

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

      const xOffset = (pdfWidth - scaledWidth) / 2;
      const yOffset = (pdfHeight - scaledHeight) / 2;

      const imgData = canvas.toDataURL("image/jpeg", quality);

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, "JPEG", xOffset, yOffset, scaledWidth, scaledHeight);
    }

    pdf.save(filename);
  } catch (error) {
    console.error("Erro ao gerar PDF multi-página:", error);
    throw new Error(
      `Falha ao exportar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`
    );
  }
}

/**
 * Gerar nome de arquivo formatado
 */
export function generatePDFFilename(
  patientName: string,
  suffix?: string
): string {
  const formatted = patientName
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");

  const timestamp = new Date().toISOString().split("T")[0];
  const filename = suffix
    ? `ATESTADO_${formatted}_${suffix}`
    : `ATESTADO_${formatted}`;

  return `${filename}_${timestamp}.pdf`;
}
