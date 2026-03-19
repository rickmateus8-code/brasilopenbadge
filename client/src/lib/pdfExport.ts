/**
 * Utilitários para exportação de PDF com melhor qualidade
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
 * Exportar elemento HTML para PDF com qualidade otimizada
 */
export async function exportElementToPDF(
  element: HTMLElement,
  options: PDFExportOptions
): Promise<void> {
  const {
    filename,
    scale = 2,
    quality = 0.95,
    orientation = "p",
    format = "a4",
  } = options;

  try {
    // Converter elemento para canvas com alta qualidade
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 0,
      windowHeight: element.scrollHeight,
      windowWidth: element.scrollWidth,
    });

    // Criar PDF
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

    // Calcular proporção mantendo aspecto
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;

    // Centralizar imagem
    const xOffset = (pdfWidth - scaledWidth) / 2;
    const yOffset = (pdfHeight - scaledHeight) / 2;

    // Converter canvas para imagem com qualidade
    const imgData = canvas.toDataURL("image/jpeg", quality);

    // Adicionar imagem ao PDF
    pdf.addImage(imgData, "JPEG", xOffset, yOffset, scaledWidth, scaledHeight);

    // Salvar PDF
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
    quality = 0.95,
    orientation = "p",
    format = "a4",
  } = options;

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

      // Converter elemento para canvas
      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 0,
        windowHeight: element.scrollHeight,
        windowWidth: element.scrollWidth,
      });

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calcular proporção
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

      const xOffset = (pdfWidth - scaledWidth) / 2;
      const yOffset = (pdfHeight - scaledHeight) / 2;

      // Converter para imagem
      const imgData = canvas.toDataURL("image/jpeg", quality);

      // Adicionar página se não for a primeira
      if (i > 0) {
        pdf.addPage();
      }

      // Adicionar imagem
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
