/**
 * Sistema de exportação PDF — compatível com mobile (Android/iOS) e desktop.
 *
 * CAUSA RAIZ DO ERRO "Erro ao baixar":
 * O html2canvas 1.4.1 não suporta a função de cor CSS moderna `oklch()`,
 * usada pelo TailwindCSS v4. Ao clonar o elemento para o DOM, ele herda
 * os estilos globais do Tailwind com `oklch()`, causando:
 *   "Error: Attempting to parse an unsupported color function 'oklch'"
 *
 * SOLUÇÃO:
 * 1. Criar um <iframe> sandboxado com srcdoc contendo o HTML do documento
 *    e apenas os estilos inline necessários (sem Tailwind global)
 * 2. Capturar o iframe com html2canvas
 * 3. Gerar o PDF A4
 *
 * Por que iframe?
 * - O iframe com srcdoc cria um documento completamente isolado
 * - Não herda os estilos globais do Tailwind (oklch)
 * - O html2canvas consegue capturar o conteúdo sem erros de cor
 * - Funciona em todos os browsers modernos (Chrome, Safari, Firefox)
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
 * Converte imagens remotas para base64 para evitar problemas CORS no html2canvas.
 * Retorna a URL original se a conversão falhar.
 */
async function toBase64(url: string): Promise<string> {
  try {
    const resp = await fetch(url, { mode: "cors" });
    if (!resp.ok) return url;
    const blob = await resp.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

/**
 * Substitui todas as imagens remotas do elemento por versões base64.
 * Isso evita problemas de CORS no html2canvas.
 */
async function inlineImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll("img")) as HTMLImageElement[];
  await Promise.all(
    images.map(async (img) => {
      if (!img.src || img.src.startsWith("data:")) return;
      const b64 = await toBase64(img.src);
      img.src = b64;
    })
  );
}

/**
 * Exportar elemento HTML para PDF.
 *
 * Estratégia:
 * 1. Extrai o HTML e estilos inline do elemento
 * 2. Cria um iframe oculto com srcdoc (isolado dos estilos globais do Tailwind)
 * 3. Converte imagens remotas para base64
 * 4. Captura com html2canvas (sem oklch)
 * 5. Gera PDF A4
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

  // ── 1. Extrair HTML do elemento ────────────────────────────────────────
  const elementHTML = element.outerHTML;

  // ── 2. Criar iframe isolado ────────────────────────────────────────────
  const iframe = document.createElement("iframe");
  iframe.style.cssText = [
    "position: fixed",
    "top: 0",
    `left: -${DOC_REAL_WIDTH + 500}px`,
    `width: ${DOC_REAL_WIDTH}px`,
    "height: 2000px",
    "border: none",
    "z-index: -9999",
    "pointer-events: none",
    "visibility: hidden",
  ].join("; ");

  // srcdoc com HTML puro — sem Tailwind, sem oklch
  iframe.srcdoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #ffffff;
    width: ${DOC_REAL_WIDTH}px;
    overflow: visible;
    font-family: Arial, Helvetica, sans-serif;
  }
</style>
</head>
<body>
${elementHTML}
</body>
</html>`;

  document.body.appendChild(iframe);

  try {
    // ── 3. Aguardar o iframe carregar ──────────────────────────────────
    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      // Fallback: resolve após 2s mesmo sem onload
      setTimeout(resolve, 2000);
    });

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) throw new Error("Não foi possível acessar o documento do iframe");

    const iframeBody = iframeDoc.body;
    const iframeEl = iframeBody.firstElementChild as HTMLElement;
    if (!iframeEl) throw new Error("Elemento não encontrado no iframe");

    // ── 4. Converter imagens para base64 (evita CORS no html2canvas) ───
    await inlineImages(iframeBody);

    // Aguarda fontes e layout estabilizarem
    await new Promise((r) => setTimeout(r, 500));

    // Torna visível apenas para captura
    iframe.style.visibility = "visible";

    // Calcula altura real do documento no iframe
    const docHeight = iframeBody.scrollHeight || iframeEl.scrollHeight || 1400;

    // Ajusta altura do iframe para o conteúdo completo
    iframe.style.height = `${docHeight + 50}px`;
    await new Promise((r) => setTimeout(r, 100));

    // ── 5. Capturar com html2canvas ────────────────────────────────────
    const canvas = await html2canvas(iframeEl, {
      scale: safeScale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 20000,
      windowWidth: DOC_REAL_WIDTH,
      windowHeight: docHeight,
      width: DOC_REAL_WIDTH,
      height: docHeight,
      x: 0,
      y: 0,
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error("Canvas gerado está vazio.");
    }

    // ── 6. Gerar PDF A4 ────────────────────────────────────────────────
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

    // ── 7. Salvar PDF ──────────────────────────────────────────────────
    pdf.save(filename);

  } finally {
    // ── 8. Remover iframe ──────────────────────────────────────────────
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
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
