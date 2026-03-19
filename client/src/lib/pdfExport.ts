/**
 * Sistema de exportação PDF — compatível com mobile (Android/iOS) e desktop.
 *
 * Estratégia definitiva:
 * 1. Cria um container COMPLETAMENTE NOVO e independente (não usa o elemento original)
 *    com largura fixa de DOC_REAL_WIDTH px, fora da viewport (left: -99999px)
 * 2. Clona o conteúdo do elemento para dentro desse container
 * 3. Aguarda imagens e fontes carregarem
 * 4. Captura com html2canvas em tamanho real
 * 5. Gera PDF A4 com proporção correta
 * 6. Remove o container temporário
 *
 * Por que não usar o elemento original diretamente?
 * - O elemento pode estar dentro de um container com transform: scale(),
 *   overflow: hidden, ou position: absolute — o html2canvas captura dimensões
 *   incorretas nesses casos, causando PDF em branco ou distorcido no mobile.
 * - Criar um container independente garante captura em tamanho real.
 */

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// Largura real do documento AttestationDocument (850 * 1.1875)
export const DOC_REAL_WIDTH = 1010;

export interface PDFExportOptions {
  filename: string;
  scale?: number;
  quality?: number;
  orientation?: "p" | "l";
  format?: "a4" | "letter";
}

/**
 * Pré-carrega todas as imagens dentro de um elemento HTML.
 * Retorna uma Promise que resolve quando todas as imagens estiverem carregadas.
 */
async function preloadImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll("img")) as HTMLImageElement[];
  if (images.length === 0) return;

  const promises = images.map(
    (img) =>
      new Promise<void>((resolve) => {
        if (img.complete && img.naturalWidth > 0) {
          resolve();
          return;
        }
        img.onload = () => resolve();
        img.onerror = () => resolve(); // resolve mesmo em erro para não bloquear
        // Força reload se necessário
        if (!img.src) {
          resolve();
        } else {
          // Adiciona crossOrigin para imagens remotas (CloudFront)
          img.crossOrigin = "anonymous";
          const src = img.src;
          img.src = "";
          img.src = src;
        }
      })
  );

  await Promise.all(promises);
}

/**
 * Exportar elemento HTML para PDF.
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

  // ── 1. Criar container completamente independente ──────────────────────
  const offscreenWrapper = document.createElement("div");
  offscreenWrapper.setAttribute("data-pdf-export", "true");
  offscreenWrapper.style.cssText = [
    "position: fixed",
    "top: 0",
    `left: -${DOC_REAL_WIDTH + 200}px`,
    `width: ${DOC_REAL_WIDTH}px`,
    "background: #ffffff",
    "z-index: -9999",
    "pointer-events: none",
    "overflow: visible",
    "visibility: hidden",
  ].join("; ");

  // ── 2. Clonar o conteúdo do elemento ──────────────────────────────────
  const clone = element.cloneNode(true) as HTMLElement;

  // Garantir que o clone não tenha transform nem posicionamento relativo ao pai
  clone.style.cssText += [
    "; transform: none",
    "position: static",
    `width: ${DOC_REAL_WIDTH}px`,
    "max-width: none",
    "margin: 0",
    "padding-left: 0",
    "padding-right: 0",
    "box-shadow: none",
  ].join("; ");

  offscreenWrapper.appendChild(clone);
  document.body.appendChild(offscreenWrapper);

  try {
    // ── 3. Aguardar imagens carregarem (logo CloudFront + qualquer outra) ─
    await preloadImages(offscreenWrapper);

    // Aguarda o browser finalizar o layout do clone
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 400));

    // Torna visível apenas para captura
    offscreenWrapper.style.visibility = "visible";

    // ── 4. Capturar com html2canvas ────────────────────────────────────
    const canvas = await html2canvas(clone, {
      scale: safeScale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 25000,
      windowWidth: DOC_REAL_WIDTH,
      windowHeight: clone.scrollHeight || 1400,
      x: 0,
      y: 0,
      width: DOC_REAL_WIDTH,
      height: clone.scrollHeight || 1400,
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error(
        "Canvas gerado está vazio. Verifique se o elemento tem dimensões válidas."
      );
    }

    // ── 5. Gerar PDF A4 ────────────────────────────────────────────────
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format,
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();   // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Preenche a largura total do A4 mantendo proporção
    const ratio = pdfWidth / imgWidth;
    const scaledWidth = pdfWidth;
    const scaledHeight = imgHeight * ratio;

    if (scaledHeight <= pdfHeight) {
      // Conteúdo cabe em uma única página
      const imgData = canvas.toDataURL("image/jpeg", quality);
      pdf.addImage(imgData, "JPEG", 0, 0, scaledWidth, scaledHeight);
    } else {
      // Conteúdo maior que uma página — divide em múltiplas páginas
      let pageIndex = 0;
      let yRenderedMM = 0;

      while (yRenderedMM < scaledHeight) {
        if (pageIndex > 0) pdf.addPage();

        const startPx = Math.round(yRenderedMM / ratio);
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

        yRenderedMM += pdfHeight;
        pageIndex++;
      }
    }

    // ── 6. Salvar PDF ──────────────────────────────────────────────────
    pdf.save(filename);

  } finally {
    // ── 7. Remover container temporário ───────────────────────────────
    if (document.body.contains(offscreenWrapper)) {
      document.body.removeChild(offscreenWrapper);
    }
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
  const base = suffix
    ? `ATESTADO_${formatted}_${suffix}`
    : `ATESTADO_${formatted}`;

  return `${base}_${timestamp}.pdf`;
}
