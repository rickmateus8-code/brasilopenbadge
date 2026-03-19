/**
 * Sistema de exportação PDF robusto — compatível com mobile (Android/iOS) e desktop.
 *
 * Estratégia:
 * 1. Clona o elemento alvo para um container oculto fora do fluxo visual
 *    (position: fixed, left: -9999px) — sem transform scale, sem overflow hidden
 * 2. Captura o clone com html2canvas em tamanho real
 * 3. Gera o PDF A4 com proporção correta
 * 4. Remove o clone e salva o arquivo
 *
 * Por que clonar?
 * - O elemento original pode estar dentro de um container com transform: scale(),
 *   overflow: hidden ou position: absolute, o que faz o html2canvas capturar
 *   dimensões incorretas ou falhar silenciosamente em mobile.
 * - O clone é renderizado em tamanho real (sem escala), garantindo PDF nítido.
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
 * Funciona corretamente mesmo quando o elemento está dentro de containers
 * com transform: scale(), overflow: hidden ou position: absolute.
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

  // Em dispositivos com DPR alto (Android/iOS), limita o scale para evitar
  // estouro de memória (canvas > 16MB causa falha silenciosa em mobile)
  const dpr = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;
  const safeScale = dpr > 2 ? Math.min(scale, 1.5) : scale;

  // ── 1. Criar container oculto para o clone ──────────────────────────────
  const hiddenContainer = document.createElement("div");
  hiddenContainer.style.cssText = [
    "position: fixed",
    "top: 0",
    "left: -99999px",
    "width: " + element.scrollWidth + "px",
    "background: #ffffff",
    "z-index: -1",
    "pointer-events: none",
    "overflow: visible",
  ].join("; ");

  // ── 2. Clonar o elemento (deep clone com estilos computados) ────────────
  const clone = element.cloneNode(true) as HTMLElement;

  // Remove qualquer transform residual do clone
  clone.style.transform = "none";
  clone.style.position = "static";
  clone.style.width = element.scrollWidth + "px";

  hiddenContainer.appendChild(clone);
  document.body.appendChild(hiddenContainer);

  // Aguarda o browser renderizar o clone (imagens, fontes, QR Code SVG)
  await new Promise((r) => setTimeout(r, 300));

  try {
    // ── 3. Capturar o clone com html2canvas ─────────────────────────────
    const canvas = await html2canvas(clone, {
      scale: safeScale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 20000,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error(
        "Canvas gerado está vazio. Verifique se o elemento está visível e tem dimensões."
      );
    }

    // ── 4. Criar PDF A4 ──────────────────────────────────────────────────
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

    // Preenche a largura total do A4 mantendo proporção
    const ratio = pdfWidth / imgWidth;
    const scaledWidth = pdfWidth;
    const scaledHeight = imgHeight * ratio;

    const imgData = canvas.toDataURL("image/jpeg", quality);

    if (scaledHeight <= pdfHeight) {
      // Conteúdo cabe em uma única página — centraliza verticalmente
      const yOffset = (pdfHeight - scaledHeight) / 2;
      pdf.addImage(imgData, "JPEG", 0, yOffset, scaledWidth, scaledHeight);
    } else {
      // Conteúdo maior que uma página — divide em múltiplas páginas
      let pageIndex = 0;
      let yRendered = 0; // mm já renderizados

      while (yRendered < scaledHeight) {
        if (pageIndex > 0) pdf.addPage();

        // Fatia do canvas correspondente a esta página (em pixels)
        const startPx = Math.round((yRendered / ratio));
        const sliceHeightPx = Math.min(
          Math.round(pdfHeight / ratio),
          imgHeight - startPx
        );

        if (sliceHeightPx <= 0) break;

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = imgWidth;
        pageCanvas.height = sliceHeightPx;

        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, startPx, imgWidth, sliceHeightPx,
            0, 0, imgWidth, sliceHeightPx
          );
          const pageImgData = pageCanvas.toDataURL("image/jpeg", quality);
          const pageScaledHeight = sliceHeightPx * ratio;
          pdf.addImage(pageImgData, "JPEG", 0, 0, scaledWidth, pageScaledHeight);
        }

        yRendered += pdfHeight;
        pageIndex++;
      }
    }

    // ── 5. Salvar PDF ────────────────────────────────────────────────────
    pdf.save(filename);

  } finally {
    // ── 6. Limpar o container oculto ─────────────────────────────────────
    if (document.body.contains(hiddenContainer)) {
      document.body.removeChild(hiddenContainer);
    }
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

  const dpr = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;
  const safeScale = dpr > 2 ? Math.min(scale, 1.5) : scale;

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

      const hiddenContainer = document.createElement("div");
      hiddenContainer.style.cssText = [
        "position: fixed",
        "top: 0",
        "left: -99999px",
        "width: " + element.scrollWidth + "px",
        "background: #ffffff",
        "z-index: -1",
        "overflow: visible",
      ].join("; ");

      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.transform = "none";
      clone.style.position = "static";
      hiddenContainer.appendChild(clone);
      document.body.appendChild(hiddenContainer);

      await new Promise((r) => setTimeout(r, 200));

      try {
        const canvas = await html2canvas(clone, {
          scale: safeScale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          imageTimeout: 20000,
          windowWidth: clone.scrollWidth,
          windowHeight: clone.scrollHeight,
        });

        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const scaledWidth = imgWidth * ratio;
        const scaledHeight = imgHeight * ratio;
        const xOffset = (pdfWidth - scaledWidth) / 2;
        const yOffset = (pdfHeight - scaledHeight) / 2;

        const imgData = canvas.toDataURL("image/jpeg", quality);

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", xOffset, yOffset, scaledWidth, scaledHeight);
      } finally {
        if (document.body.contains(hiddenContainer)) {
          document.body.removeChild(hiddenContainer);
        }
      }
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
