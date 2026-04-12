/**
 * Histórico Escolar SP — DocMaster
 * Layout: SPDocumentPage (réplica visual do histórico oficial SP)
 * Fluxo: DocMaster (useAuth, fetch, EmissionModal, exportElementToPDF)
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import {
  ArrowLeft, Download, ZoomIn, ZoomOut,
  Eye, EyeOff, PanelLeftClose, PanelLeft
} from "lucide-react";
import { exportElementToPDF } from "@/lib/pdfExport";
import EmissionModal from "@/components/EmissionModal";
import { useSPSubstitution } from "@/hooks/useSPSubstitution";
import SPSubstitutionPanel from "@/components/SPSubstitutionPanel";
import { SPPage1 } from "@/components/SPDocumentPage";
import { SIG_GERENTE_B64, SIG_DIRETOR_B64 } from "@/lib/spAssets";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

function getInitialZoom(sidebarVisible = true) {
  if (typeof window === "undefined") return 0.64;
  const sidebarWidth = sidebarVisible ? 360 : 56;
  const horizontalSpacing = 96;
  const verticalSpacing = 152;
  const availableWidth = Math.max(320, window.innerWidth - sidebarWidth - horizontalSpacing);
  const availableHeight = Math.max(320, window.innerHeight - verticalSpacing);
  const fitZoom = Math.min(availableWidth / A4_WIDTH_PX, availableHeight / A4_HEIGHT_PX);
  return Math.max(0.42, Math.min(0.72, fitZoom));
}

function buildSPExportIframeCSS() {
  return `
    * { box-sizing: border-box; }
    @page { size: A4 portrait; margin: 0; }
    html, body {
      margin: 0; padding: 0;
      width: 210mm; height: 297mm;
      background: #fff; color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    img { display: block; max-width: 100%; height: auto; }
    .sp-export-shell { width: 210mm; height: 297mm; overflow: hidden; background: #fff; position: relative; }
    .doc-page-sp {
      width: 210mm !important; height: 297mm !important;
      min-height: 297mm !important; max-height: 297mm !important;
      margin: 0 !important; box-shadow: none !important;
    }
    @media print {
      html, body { overflow: hidden; }
      .sp-export-shell { break-inside: avoid-page; page-break-inside: avoid; }
    }
  `;
}

async function imageUrlToBase64(url: string): Promise<string> {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Falha ao converter imagem para base64."));
      reader.readAsDataURL(blob);
    });
  } catch { return url; }
}

async function preloadPageImagesAsBase64(root: HTMLElement): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const imgs = Array.from(root.querySelectorAll("img"));
  const uniqueSrc = Array.from(new Set(imgs.map((img) => img.getAttribute("src") || "").filter(Boolean)));
  await Promise.all(uniqueSrc.map(async (src) => {
    try {
      const b64 = await imageUrlToBase64(src);
      if (b64) map.set(src, b64);
    } catch { /* mantém src original */ }
  }));
  return map;
}

function replaceImageUrls(html: string, urlMap: Map<string, string>) {
  let result = html;
  urlMap.forEach((b64, url) => { result = result.split(url).join(b64); });
  return result;
}

async function waitForImagesInElement(element: HTMLElement) {
  const images = element.querySelectorAll("img");
  await Promise.all(Array.from(images).map((img) =>
    new Promise<void>((resolve) => {
      if (img.complete && img.naturalWidth > 0) { resolve(); return; }
      const done = () => resolve();
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    })
  ));
}

function normalizeFileSegment(value: string): string {
  return (value || "DOCUMENTO")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");
}

export default function HistoricoSP() {
  const { user, updateBalance } = useAuth();
  const [, setLocation] = useLocation();

  const [zoom, setZoom] = useState(() => getInitialZoom(true));
  const [showHighlights, setShowHighlights] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    fields,
    fieldMap,
    modifiedCount,
    currentGrades,
    importText,
    brasaoUrl,
    hasCustomBrasao,
    updateField,
    setImportText,
    applyImportText,
    generateSecurityCode,
    generateRA,
    resetToOriginal,
    handleBrasaoUpload,
    resetBrasaoUpload,
  } = useSPSubstitution();

  const [assinaturaGerenteUrl, setAssinaturaGerenteUrl] = useState<string | null>(null);
  const [assinaturaDiretorUrl, setAssinaturaDiretorUrl] = useState<string | null>(null);

  const handleAssinaturaGerenteUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => { setAssinaturaGerenteUrl(e.target?.result as string); toast.success("Assinatura do Gerente carregada!"); };
    reader.readAsDataURL(file);
  }, []);

  const handleAssinaturaDiretorUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => { setAssinaturaDiretorUrl(e.target?.result as string); toast.success("Assinatura do Diretor carregada!"); };
    reader.readAsDataURL(file);
  }, []);

  const handleResetAll = useCallback(() => {
    resetToOriginal();
    setAssinaturaGerenteUrl(null);
    setAssinaturaDiretorUrl(null);
    toast.success("Formulário redefinido para o estado vazio.");
  }, [resetToOriginal]);

  // Validação e abertura do modal de confirmação
  const handleRequestEmit = useCallback(() => {
    if (!fieldMap.nome_aluno) { toast.error("Preencha o Nome do Aluno"); return; }
    if (!fieldMap.nome_escola) { toast.error("Preencha o Nome da Escola"); return; }
    if ((user?.balance || 0) <= 0) {
      toast.error("Saldo insuficiente. Recarregue para emitir documentos.");
      return;
    }
    setShowConfirmModal(true);
  }, [fieldMap.nome_aluno, fieldMap.nome_escola, user?.balance]);

  // Salvar no backend e cobrar saldo
  const handleSave = useCallback(async () => {
    setIsExporting(true);
    try {
      const payload = {
        nome: fieldMap.nome_aluno || "",
        cpf: fieldMap.cpf || "",
        rg: fieldMap.rg || "",
        ra: fieldMap.ra || "",
        curso: "Ensino Médio",
        instituicao: fieldMap.nome_escola_full || fieldMap.nome_escola || "",
        dataEmissao: fieldMap.data_emissao || "",
        dataConclusao: fieldMap.ano_conclusao || "",
        ...fieldMap,
      };
      const res = await fetch("/api/documents/historico-sp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        if (result.newBalance !== undefined) updateBalance(result.newBalance);
        setSaved(true);
        setShowConfirmModal(false);
        setShowSuccessModal(true);
      } else {
        toast.error(result.error || "Erro ao gerar histórico");
        setShowConfirmModal(false);
      }
    } catch { toast.error("Erro de conexão"); setShowConfirmModal(false); }
    finally { setIsExporting(false); }
  }, [fieldMap, updateBalance]);

  // Exportar PDF via iframe isolado (método do RAR)
  const handleExportPDF = useCallback(async () => {
    setIsDownloading(true);
    let iframe: HTMLIFrameElement | null = null;
    let releaseByAfterPrint = false;

    try {
      const exportSourcePage = document.getElementById("doc-page-sp-export") as HTMLElement | null;
      if (!exportSourcePage) throw new Error("Layout base não encontrado para exportação.");

      await waitForImagesInElement(exportSourcePage);
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      const imageMap = await preloadPageImagesAsBase64(exportSourcePage);

      iframe = document.createElement("iframe");
      iframe.style.cssText = `position:fixed;left:-99999px;top:0;width:210mm;height:297mm;border:none;background:#fff;`;
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error("Falha ao preparar ambiente isolado para exportação.");

      const captureNode = exportSourcePage.cloneNode(true) as HTMLElement;
      captureNode.id = "doc-page-sp-capture";
      const captureHtml = replaceImageUrls(captureNode.outerHTML, imageMap);

      iframeDoc.open();
      iframeDoc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${buildSPExportIframeCSS()}</style></head><body><div class="sp-export-shell">${captureHtml}</div></body></html>`);
      iframeDoc.close();

      const iframeCapturePage = iframeDoc.getElementById("doc-page-sp-capture") as HTMLElement | null;
      if (!iframeCapturePage) throw new Error("Não foi possível montar a página para exportação.");

      await waitForImagesInElement(iframeCapturePage);
      await new Promise((resolve) => setTimeout(resolve, 150));

      const fileBaseName = `HISTORICO_ESCOLAR_${normalizeFileSegment(fieldMap.nome_aluno || "DOCUMENTO")}`;
      iframeDoc.title = fileBaseName;

      const frameWindow = iframe.contentWindow;
      if (!frameWindow) throw new Error("Não foi possível abrir o contexto de impressão.");

      releaseByAfterPrint = true;
      let cleanedUp = false;
      let fallbackTimer = 0;
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        if (fallbackTimer) window.clearTimeout(fallbackTimer);
        if (iframe && document.body.contains(iframe)) document.body.removeChild(iframe);
        iframe = null;
      };
      frameWindow.onafterprint = cleanup;
      fallbackTimer = window.setTimeout(cleanup, 120000);
      frameWindow.focus();
      frameWindow.print();
      toast.success("Janela de impressão aberta. Use 'Salvar como PDF' no Chrome.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Erro ao preparar impressão PDF: " + message);
    } finally {
      if (!releaseByAfterPrint && iframe && document.body.contains(iframe)) document.body.removeChild(iframe);
      setIsDownloading(false);
    }
  }, [fieldMap.nome_aluno]);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-[#0a0a0f]">
        {/* Top Bar */}
        <header className="h-12 border-b border-[#1a1a2a] bg-[#0d0d14] flex items-center px-4 gap-3 shrink-0">
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-1 text-[#666688] hover:text-white text-sm px-2 py-1 rounded transition-colors"
          >
            <ArrowLeft size={15} className="mr-1" /> Voltar
          </button>
          <div className="h-6 w-px bg-[#2a2a3a]" />
          <h1 className="text-sm font-semibold tracking-wide text-white">
            Histórico Escolar SP — Visualizador Interativo
          </h1>
          <div className="ml-auto flex items-center gap-2">
            {modifiedCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400 font-medium">
                {modifiedCount} alterações
              </span>
            )}
            <button
              className="flex items-center gap-1 text-xs h-7 px-3 rounded border border-[#2a2a3a] text-[#aaaacc] hover:bg-[#1a1a2a] transition-colors"
              onClick={() => setShowHighlights(!showHighlights)}
            >
              {showHighlights ? <Eye size={13} className="mr-1" /> : <EyeOff size={13} className="mr-1" />}
              {showHighlights ? "Destaques ON" : "Destaques OFF"}
            </button>
            <button
              className="flex items-center gap-1 text-xs h-7 px-3 rounded bg-gradient-to-r from-[#2d8c4e] to-[#1a6b35] hover:from-[#35a05a] hover:to-[#1f7a3e] text-white font-semibold transition-all disabled:opacity-60"
              onClick={handleRequestEmit}
              disabled={isExporting || saved}
            >
              <Download size={13} className="mr-1" />
              {saved ? "✅ Emitido" : isExporting ? "Processando..." : "Emitir e Exportar PDF"}
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {sidebarOpen && (
            <aside className="w-80 border-r border-[#1a1a2a] bg-[#0d0d14] shrink-0 flex flex-col overflow-hidden">
              <SPSubstitutionPanel
                fields={fields}
                modifiedCount={modifiedCount}
                importText={importText}
                onUpdateImportText={setImportText}
                onApplyImportText={applyImportText}
                onUpdateField={updateField}
                onGenerateSecurityCode={generateSecurityCode}
                onGenerateRA={generateRA}
                onReset={handleResetAll}
                onBrasaoUpload={handleBrasaoUpload}
                onBrasaoReset={resetBrasaoUpload}
                brasaoUrl={brasaoUrl}
                hasCustomBrasao={hasCustomBrasao}
                onAssinaturaGerenteUpload={handleAssinaturaGerenteUpload}
                onAssinaturaGerenteReset={() => { setAssinaturaGerenteUrl(null); toast.success("Assinatura restaurada."); }}
                onAssinaturaDiretorUpload={handleAssinaturaDiretorUpload}
                onAssinaturaDiretorReset={() => { setAssinaturaDiretorUrl(null); toast.success("Assinatura restaurada."); }}
                assinaturaGerenteUrl={assinaturaGerenteUrl || SIG_GERENTE_B64}
                assinaturaDiretorUrl={assinaturaDiretorUrl || SIG_DIRETOR_B64}
                hasCustomAssinaturaGerente={!!assinaturaGerenteUrl}
                hasCustomAssinaturaDiretor={!!assinaturaDiretorUrl}
              />
            </aside>
          )}

          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="h-10 border-b border-[#1a1a2a] bg-[#0a0a0f]/50 flex items-center px-3 gap-2 shrink-0">
              <button
                className="h-7 w-7 p-0 flex items-center justify-center text-[#666688] hover:text-white rounded transition-colors"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
              </button>
              <div className="h-4 w-px bg-[#2a2a3a] mx-1" />
              <span className="text-xs text-[#555566]">Histórico Escolar – Ensino Médio (SP)</span>
              <div className="ml-auto flex items-center gap-1">
                <button
                  className="h-7 w-7 p-0 flex items-center justify-center text-[#666688] hover:text-white rounded transition-colors"
                  onClick={() => setZoom(Math.max(0.4, zoom - 0.1))}
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-xs text-[#aaaacc] w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button
                  className="h-7 w-7 p-0 flex items-center justify-center text-[#666688] hover:text-white rounded transition-colors"
                  onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex justify-center py-6" style={{ background: "#e8e8e8" }}>
              <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
                <div style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.1)", borderRadius: 2 }}>
                  <SPPage1
                    f={fieldMap}
                    highlightModified={showHighlights}
                    grades={currentGrades}
                    brasaoUrl={brasaoUrl || undefined}
                    assinaturaGerenteUrl={assinaturaGerenteUrl || undefined}
                    assinaturaDiretorUrl={assinaturaDiretorUrl || undefined}
                    pageId="doc-page-sp-preview"
                  />
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Base real de exportação (fora do zoom) */}
        <div
          aria-hidden
          style={{
            position: "fixed", left: "-99999px", top: 0,
            width: "210mm", height: "297mm",
            opacity: 0, pointerEvents: "none", overflow: "hidden", background: "#fff",
          }}
        >
          <SPPage1
            f={fieldMap}
            highlightModified={false}
            grades={currentGrades}
            brasaoUrl={brasaoUrl || undefined}
            assinaturaGerenteUrl={assinaturaGerenteUrl || undefined}
            assinaturaDiretorUrl={assinaturaDiretorUrl || undefined}
            pageId="doc-page-sp-export"
          />
        </div>
      </div>

      {/* Modal de Confirmação + Sucesso */}
      <EmissionModal
        docLabel="Histórico Escolar SP"
        docEmoji="🎓"
        documentPrice={500}
        userBalance={user?.balance ?? 0}
        showConfirm={showConfirmModal}
        showSuccess={showSuccessModal}
        isEmitting={isExporting}
        isDownloading={isDownloading}
        onConfirm={handleSave}
        onCancel={() => setShowConfirmModal(false)}
        onDownload={handleExportPDF}
        onClose={() => setShowSuccessModal(false)}
        historyPath="/historico-sp-salvos"
      />
    </DashboardLayout>
  );
}
