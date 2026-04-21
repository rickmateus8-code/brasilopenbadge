/**
 * Histórico Escolar SP — DocMaster
 * Layout: SPDocumentPage (réplica visual do histórico oficial SP)
 * Fluxo: DocMaster (useAuth, fetch, EmissionModal, exportElementToPDF)
 */
import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import {
  ArrowLeft, Download, ZoomIn, ZoomOut,
  PanelLeftClose, PanelLeft, CheckCircle2, AlertCircle, FileText
} from "lucide-react";
import EmissionModal from "@/components/EmissionModal";
import { useSPSubstitution } from "@/hooks/useSPSubstitution";
import SPSubstitutionPanel from "@/components/SPSubstitutionPanel";
import { SPPage1 } from "@/components/SPDocumentPage";
import { SIG_GERENTE_B64, SIG_DIRETOR_B64 } from "@/lib/spAssets";
import { usePDFExport, generatePDFFilename } from "@/lib/pdfExport";

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

export default function HistoricoSP() {
  const { user, updateBalance } = useAuth();
  const [, setLocation] = useLocation();
  const previewRef = useRef<HTMLDivElement>(null);
  const { exportPDF, exporting: isDownloading } = usePDFExport();

  const [zoom, setZoom] = useState(() => getInitialZoom(true));
  const showHighlights = false;
  const [isExporting, setIsExporting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const handleRequestEmit = useCallback(() => {
    if (!fieldMap.nome_aluno) { toast.error("Preencha o Nome do Aluno"); return; }
    if (!fieldMap.nome_escola) { toast.error("Preencha o Nome da Escola"); return; }
    if ((user?.balance || 0) <= 0) {
      toast.error("Saldo insuficiente. Recarregue para emitir documentos.");
      return;
    }
    setShowConfirmModal(true);
  }, [fieldMap.nome_aluno, fieldMap.nome_escola, user?.balance]);

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

  const handleExportPDF = useCallback(async () => {
    if (!previewRef.current) return;
    try {
      await exportPDF(previewRef.current, {
        filename: generatePDFFilename(fieldMap.nome_aluno || "DOCUMENTO", "historico-sp"),
        docType: "historico-sp",
      });
      toast.success("PDF gerado com sucesso!");
    } catch (err) {
      toast.error("Erro ao exportar PDF.");
    }
  }, [exportPDF, fieldMap.nome_aluno]);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-white font-sans">
        {/* Header no estilo AtestadoCria */}
        <header className="h-14 bg-[#d97706] flex items-center px-6 gap-4 shrink-0 shadow-md z-10">
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
          >
            <ArrowLeft size={14} /> VOLTAR
          </button>
          <div className="h-8 w-px bg-white/20" />
          <h1 className="text-sm font-black tracking-tight text-white uppercase italic">
            DocMaster <span className="font-light mx-1">|</span> Histórico Escolar SP
          </h1>
          
          <div className="ml-auto flex items-center gap-3">
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/10 border border-white/10">
                <AlertCircle size={14} className="text-amber-200" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Auto-deleção em 60 dias</span>
             </div>
            <button
              className={`flex items-center gap-2 text-xs font-black h-9 px-5 rounded-xl transition-all shadow-lg active:scale-95 ${
                saved 
                ? "bg-emerald-500 text-white" 
                : "bg-white text-amber-700 hover:bg-amber-50 shadow-amber-900/20"
              }`}
              onClick={handleRequestEmit}
              disabled={isExporting || saved}
            >
              <Download size={14} />
              {saved ? "DOCUMENTO EMITIDO" : isExporting ? "PROCESSANDO..." : "EMITIR E EXPORTAR"}
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden bg-gray-50">
          {/* Coluna de Formulário (Left) */}
          <aside className={`transition-all duration-300 border-r border-gray-200 bg-white shadow-xl z-10 flex flex-col ${sidebarOpen ? "w-[400px]" : "w-0 overflow-hidden"}`}>
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

          {/* Coluna de Preview (Right) */}
          <main className="flex-1 flex flex-col overflow-hidden relative">
            {/* Toolbar do Preview */}
            <div className="h-12 border-b border-gray-200 bg-white flex items-center px-4 gap-4 shrink-0 shadow-sm relative z-0">
              <button
                className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title={sidebarOpen ? "Recolher Editor" : "Expandir Editor"}
              >
                {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
              </button>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                 <FileText size={16} className="text-gray-400" />
                 <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Visualização em Tempo Real</span>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    className="h-7 w-7 flex items-center justify-center text-gray-500 hover:text-amber-600 hover:bg-white rounded-md transition-all"
                    onClick={() => setZoom(Math.max(0.4, zoom - 0.1))}
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="text-[10px] font-black text-gray-600 min-w-[36px] text-center">{Math.round(zoom * 100)}%</span>
                  <button
                    className="h-7 w-7 flex items-center justify-center text-gray-500 hover:text-amber-600 hover:bg-white rounded-md transition-all"
                    onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Documento Centralizado */}
            <div className="flex-1 overflow-auto flex justify-center py-10 custom-scrollbar bg-[#e5e7eb]">
              <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.2s ease-out" }}>
                <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-sm overflow-hidden" ref={previewRef}>
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
            
            {/* Aviso Flutuante */}
            {!saved && (
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-[10px] font-bold flex items-center gap-2 shadow-2xl z-20 border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  EDIÇÃO ATIVA: O DOCUMENTO SERÁ GERADO COM OS DADOS AO LADO
               </div>
            )}
          </main>
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
