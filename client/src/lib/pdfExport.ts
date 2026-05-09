/**
 * ============================================================
 * SISTEMA UNIVERSAL DE EXPORTAÇÃO PDF — DocMaster
 * ============================================================
 *
 * PROBLEMA RAIZ (NÃO ALTERAR ESTA SOLUÇÃO):
 * O html2canvas 1.4.1 não suporta a função de cor CSS `oklch()`,
 * usada pelo TailwindCSS v4. Ao clonar o elemento para o DOM, ele
 * herda os estilos globais com `oklch()`, causando:
 *   "Error: Attempting to parse an unsupported color function 'oklch'"
 *
 * SOLUÇÃO DEFINITIVA (PERMANENTE):
 * 1. Criar um <iframe> sandboxado com `srcdoc` contendo o HTML do documento
 *    e apenas os estilos inline necessários (sem Tailwind global)
 * 2. Capturar o iframe com html2canvas (sem oklch)
 * 3. Gerar o PDF A4 com jsPDF
 *
 * POR QUE IFRAME?
 * - Cria um documento completamente isolado dos estilos globais do Tailwind
 * - html2canvas consegue capturar sem erros de cor
 * - Funciona em todos os browsers modernos (Chrome, Safari, Firefox, mobile)
 *
 * COMPATIBILIDADE MOBILE:
 * - Em dispositivos com DPR > 2 (Android/iOS), o scale é limitado a 1.5
 *   para evitar estouro de memória (canvas > 16MB causa falha silenciosa)
 *
 * IMAGENS E CORS:
 * - Todas as imagens remotas são convertidas para base64 ANTES da captura
 * - Isso evita erros de CORS no html2canvas
 *
 * ============================================================
 * COMO USAR EM NOVOS TIPOS DE DOCUMENTO:
 * ============================================================
 *
 * 1. Crie o componente de documento (ex: CNHDocument.tsx) com estilos
 *    inline (sem classes Tailwind) e largura fixa de 794px (A4 96dpi)
 *
 * 2. Use o hook `usePDFExport` no componente pai:
 *    ```tsx
 *    const { exportPDF, exporting } = usePDFExport();
 *    const docRef = useRef<HTMLDivElement>(null);
 *
 *    const handleExport = async () => {
 *      if (!docRef.current) return;
 *      await exportPDF(docRef.current, {
 *        filename: generatePDFFilename("NOME_PACIENTE", "CNH"),
 *        docType: "cnh",
 *      });
 *    };
 *    ```
 *
 * 3. Para documentos com múltiplas páginas, use `multiPage: true`
 *
 * ============================================================
 * REGRAS FIXAS (NÃO ALTERAR):
 * ============================================================
 * - DOC_REAL_WIDTH = 794px (A4 a 96dpi, 210mm)
 * - DOC_REAL_HEIGHT = 1123px (A4 a 96dpi, 297mm)
 * - O iframe DEVE usar srcdoc (não src) para isolamento de estilos
 * - Imagens DEVEM ser convertidas para base64 antes da captura
 * - O iframe DEVE ser removido do DOM após a captura (finally block)
 *
 * ============================================================
 */

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useState, useCallback } from "react";

// ── Constantes A4 (NÃO ALTERAR) ──────────────────────────────────────────────
/** Largura A4 exata em pixels a 96dpi (210mm = 794px) */
export const DOC_REAL_WIDTH = 794;
/** Altura A4 exata em pixels a 96dpi (297mm = 1123px) */
export const DOC_REAL_HEIGHT = 1123;

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type DocType =
  | "atestado"
  | "laudo"
  | "cnh"
  | "cha"
  | "toxicologico"
  | "historico-sp"
  | "historico-uninter"
  | "receita"
  | "peticaocria"
  | "diploma-uninter"
  | "generic";

export interface PDFExportOptions {
  /** Nome do arquivo gerado (ex: "ATESTADO_JOAO_2026-03-20.pdf") */
  filename: string;
  /** Tipo do documento — usado para prefixo e metadados */
  docType?: DocType;
  /** Escala de renderização (padrão: 2 para alta qualidade) */
  scale?: number;
  /** Qualidade JPEG 0-1 (padrão: 0.92) */
  quality?: number;
  /** Orientação do PDF (padrão: "p" = retrato) */
  orientation?: "p" | "l";
  /** Formato do PDF (padrão: "a4") */
  format?: "a4" | "letter";
  /** Se true, divide o conteúdo em múltiplas páginas A4 */
  multiPage?: boolean;
  /** Largura customizada em pixels (padrão: DOC_REAL_WIDTH) */
  customWidth?: number;
  /** Altura customizada em pixels (padrão: DOC_REAL_HEIGHT) */
  customHeight?: number;
}

// ── Utilitários internos ──────────────────────────────────────────────────────

/**
 * Converte imagem remota para base64 para evitar erros CORS no html2canvas.
 * Retorna a URL original se a conversão falhar.
 * NÃO ALTERAR — crítico para funcionamento do PDF.
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
 * Substitui todas as imagens remotas do container por versões base64.
 * NÃO ALTERAR — crítico para funcionamento do PDF.
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

// ── Função principal de exportação ───────────────────────────────────────────

/**
 * Exporta um elemento HTML para PDF.
 *
 * FLUXO (NÃO ALTERAR):
 * 1. Extrai o outerHTML do elemento
 * 2. Cria iframe oculto com srcdoc (isolado do Tailwind)
 * 3. Converte imagens para base64
 * 4. Captura com html2canvas
 * 5. Gera PDF A4 com jsPDF
 * 6. Remove o iframe do DOM
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
    multiPage = false,
    customWidth,
    customHeight,
  } = options;

  const docWidth = customWidth || DOC_REAL_WIDTH;
  const docHeight = customHeight || DOC_REAL_HEIGHT;

  // Limita scale em mobile para evitar estouro de memória
  const dpr = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;
  const safeScale = dpr > 2 ? Math.min(scale, 1.5) : scale;

  // ── 1. Extrair HTML ──────────────────────────────────────────────────────
  const elementHTML = element.outerHTML;

  // ── 2. Criar iframe isolado (NÃO ALTERAR ESTA ESTRATÉGIA) ───────────────
  const iframe = document.createElement("iframe");
  iframe.style.cssText = [
    "position: fixed",
    "top: 0",
    `left: -${docWidth + 500}px`,
    `width: ${docWidth}px`,
    `height: ${docHeight}px`,
    "border: none",
    "z-index: -9999",
    "pointer-events: none",
    "visibility: hidden",
  ].join("; ");

  // srcdoc com HTML puro — SEM Tailwind, SEM oklch
  iframe.srcdoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #ffffff;
    width: ${docWidth}px;
    height: ${multiPage ? "auto" : docHeight + "px"};
    overflow: ${multiPage ? "visible" : "hidden"};
    font-family: Arial, Helvetica, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }
  #attestation-document {
    margin: 0 auto !important;
    box-shadow: none !important;
  }
</style>
</head>
<body>
${elementHTML}
</body>
</html>`;

  document.body.appendChild(iframe);

  try {
    // ── 3. Aguardar iframe carregar ──────────────────────────────────────
    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      setTimeout(resolve, 2000); // Fallback
    });

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) throw new Error("Não foi possível acessar o documento do iframe");

    const iframeBody = iframeDoc.body;
    const iframeEl = iframeBody.firstElementChild as HTMLElement;
    if (!iframeEl) throw new Error("Elemento não encontrado no iframe");

    // ── 4. Converter imagens para base64 ─────────────────────────────────
    await inlineImages(iframeBody);

    // Aguarda fontes e layout estabilizarem
    await new Promise((r) => setTimeout(r, 500));

    // Torna visível apenas para captura
    iframe.style.visibility = "visible";

    // Para documentos multiPage, usa a altura real do elemento (pode ser múltiplos de DOC_REAL_HEIGHT)
    const docRenderHeight = multiPage
      ? Math.max(iframeEl.scrollHeight || docHeight, docHeight)
      : docHeight;
    iframe.style.height = `${docRenderHeight}px`;
    await new Promise((r) => setTimeout(r, 100));

    // ── 5. Capturar com html2canvas ──────────────────────────────────────
    const canvas = await html2canvas(iframeEl, {
      scale: safeScale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 20000,
      windowWidth: docWidth,
      windowHeight: docRenderHeight,
      width: docWidth,
      height: docRenderHeight,
      x: 0,
      y: 0,
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error("Canvas gerado está vazio.");
    }

    // ── 6. Gerar PDF A4 ──────────────────────────────────────────────────
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
    const ratio = pdfWidth / imgWidth;
    const scaledWidth = pdfWidth;
    const scaledHeight = imgHeight * ratio;

    if (!multiPage || scaledHeight <= pdfHeight) {
      // Página única — sempre começa do topo (offsetY = 0)
      const imgData = canvas.toDataURL("image/jpeg", quality);
      pdf.addImage(imgData, "JPEG", 0, 0, scaledWidth, scaledHeight);
    } else {
      // Múltiplas páginas — divide o canvas em fatias A4
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
          ctx.drawImage(canvas, 0, startPx, imgWidth, sliceHeightPx, 0, 0, imgWidth, sliceHeightPx);
          const pageImgData = pageCanvas.toDataURL("image/jpeg", quality);
          const pageScaledHeight = sliceHeightPx * ratio;
          pdf.addImage(pageImgData, "JPEG", 0, 0, scaledWidth, pageScaledHeight);
        }

        yRenderedMM += pdfHeight;
        pageIndex++;
      }
    }

    // ── 7. Salvar PDF ────────────────────────────────────────────────────
    pdf.save(filename);

  } finally {
    // ── 8. Remover iframe (SEMPRE executado) ─────────────────────────────
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
}

// ── Hook React para exportação PDF ───────────────────────────────────────────

/**
 * Hook React universal para exportação de PDF.
 *
 * Uso:
 * ```tsx
 * const { exportPDF, exporting } = usePDFExport();
 * const docRef = useRef<HTMLDivElement>(null);
 *
 * <button onClick={() => exportPDF(docRef.current!, { filename: "doc.pdf" })} disabled={exporting}>
 *   {exporting ? "Gerando PDF..." : "Baixar PDF"}
 * </button>
 * <div ref={docRef}><MeuDocumento /></div>
 * ```
 */
export function usePDFExport() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportPDF = useCallback(async (
    element: HTMLElement | null,
    options: PDFExportOptions
  ) => {
    if (!element) {
      setError("Elemento do documento não encontrado");
      return;
    }
    setExporting(true);
    setError(null);
    try {
      await exportElementToPDF(element, options);
    } catch (err: any) {
      const msg = err?.message || "Erro ao gerar PDF";
      setError(msg);
      throw err;
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportPDF, exporting, error };
}

// ── Utilitários de nomenclatura ───────────────────────────────────────────────

/** Prefixos de arquivo por tipo de documento */
const DOC_PREFIXES: Record<DocType, string> = {
  atestado: "ATESTADO",
  laudo: "LAUDO",
  cnh: "CNH",
  cha: "CHA_NAUTICA",
  toxicologico: "TOXICOLOGICO",
  "historico-sp": "HISTORICO_SP",
  "historico-uninter": "HISTORICO_UNINTER",
  receita: "RECEITA",
  peticaocria: "PETICAO_JUDICIAL",
  "diploma-uninter": "DIPLOMA_UNINTER",
  generic: "DOCUMENTO",
};

/**
 * Gera nome de arquivo formatado para o PDF.
 * Formato universal: {DOCUMENTO}_{NOME_COMPLETO}.pdf
 *
 * @param name - Nome do paciente/titular
 * @param docType - Tipo do documento (padrão: "atestado")
 * @param suffix - Sufixo adicional opcional (ignorado para manter formato limpo)
 *
 * Exemplos:
 * - generatePDFFilename("João Silva") → "ATESTADO_JOAO_SILVA.pdf"
 * - generatePDFFilename("João Silva", "cnh") → "CNH_JOAO_SILVA.pdf"
 * - generatePDFFilename("João Silva", "receita") → "RECEITA_JOAO_SILVA.pdf"
 */
export function generatePDFFilename(
  name: string,
  docType: DocType = "atestado",
  _suffix?: string
): string {
  const formatted = name
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");

  const prefix = DOC_PREFIXES[docType] || "DOCUMENTO";

  // Formato universal: {DOCUMENTO}_{NOME_COMPLETO}.pdf
  return `${prefix}_${formatted}.pdf`;
}

/**
 * Gera o PDF do elemento e retorna um blob URL (para exibição em iframe).
 * Diferente de exportElementToPDF, NÃO faz download — retorna a URL do blob.
 * O chamador é responsável por chamar URL.revokeObjectURL() quando não precisar mais.
 */
export async function exportElementToPDFBlob(
  element: HTMLElement,
  options: Omit<PDFExportOptions, "filename">
): Promise<string> {
  const {
    scale = 2,
    quality = 0.92,
    orientation = "p",
    format = "a4",
    multiPage = false,
    customWidth,
    customHeight,
  } = options;

  const docWidth = customWidth || DOC_REAL_WIDTH;
  const docHeight = customHeight || DOC_REAL_HEIGHT;

  const dpr = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;
  const safeScale = dpr > 2 ? Math.min(scale, 1.5) : scale;
  const elementHTML = element.outerHTML;
  const iframe = document.createElement("iframe");
  iframe.style.cssText = [
    "position: fixed",
    "top: 0",
    `left: -${docWidth + 500}px`,
    `width: ${docWidth}px`,
    `height: ${docHeight}px`,
    "border: none",
    "z-index: -9999",
    "pointer-events: none",
    "visibility: hidden",
  ].join("; ");
  iframe.srcdoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #ffffff;
    width: ${docWidth}px;
    height: ${multiPage ? "auto" : docHeight + "px"};
    overflow: ${multiPage ? "visible" : "hidden"};
    font-family: Arial, Helvetica, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }
  #attestation-document {
    margin: 0 auto !important;
    box-shadow: none !important;
  }
</style>
</head>
<body>
${elementHTML}
</body>
</html>`;
  document.body.appendChild(iframe);
  try {
    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      setTimeout(resolve, 2000);
    });
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) throw new Error("Não foi possível acessar o documento do iframe");
    const iframeBody = iframeDoc.body;
    const iframeEl = iframeBody.firstElementChild as HTMLElement;
    if (!iframeEl) throw new Error("Elemento não encontrado no iframe");
    await inlineImages(iframeBody);
    await new Promise((r) => setTimeout(r, 500));
    iframe.style.visibility = "visible";
    const docHeightFinal = docHeight;
    iframe.style.height = `${docHeightFinal}px`;
    await new Promise((r) => setTimeout(r, 100));
    const canvas = await html2canvas(iframeEl, {
      scale: safeScale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 20000,
      windowWidth: docWidth,
      windowHeight: docHeightFinal,
      width: docWidth,
      height: docHeightFinal,
      x: 0,
      y: 0,
    });
    if (canvas.width === 0 || canvas.height === 0) throw new Error("Canvas gerado está vazio.");
    const pdf = new jsPDF({ orientation, unit: "mm", format, compress: true });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = pdfWidth / imgWidth;
    const scaledWidth = pdfWidth;
    const scaledHeight = imgHeight * ratio;
    if (!multiPage || scaledHeight <= pdfHeight) {
      const offsetY = Math.max(0, (pdfHeight - scaledHeight) / 2);
      const imgData = canvas.toDataURL("image/jpeg", quality);
      pdf.addImage(imgData, "JPEG", 0, offsetY, scaledWidth, scaledHeight);
    } else {
      let pageIndex = 0;
      let yRenderedMM = 0;
      while (yRenderedMM < scaledHeight) {
        if (pageIndex > 0) pdf.addPage();
        const startPx = Math.round(yRenderedMM / ratio);
        const sliceHeightPx = Math.min(Math.round(pdfHeight / ratio), imgHeight - startPx);
        if (sliceHeightPx <= 0) break;
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = imgWidth;
        pageCanvas.height = sliceHeightPx;
        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(canvas, 0, startPx, imgWidth, sliceHeightPx, 0, 0, imgWidth, sliceHeightPx);
          const pageImgData = pageCanvas.toDataURL("image/jpeg", quality);
          const pageScaledHeight = sliceHeightPx * ratio;
          pdf.addImage(pageImgData, "JPEG", 0, 0, scaledWidth, pageScaledHeight);
        }
        yRenderedMM += pdfHeight;
        pageIndex++;
      }
    }
    const pdfBlob = pdf.output("blob");
    return URL.createObjectURL(pdfBlob);
  } finally {
    if (document.body.contains(iframe)) document.body.removeChild(iframe);
  }
}
