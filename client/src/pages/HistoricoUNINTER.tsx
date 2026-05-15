/**
 * Histórico UNINTER — DocMaster
 * Layout: DocumentPages (réplica visual do histórico UNINTER — 6 páginas)
 * Fluxo: DocMaster (useAuth, fetch, EmissionModal, jsPDF + html2canvas)
 */
import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import {
  ArrowLeft, Download, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, Eye, EyeOff,
  PanelLeftClose, PanelLeft, AlertCircle, FileText
} from "lucide-react";
import EmissionModal from "@/components/EmissionModal";
import { useSubstitutionUninter } from "@/hooks/useSubstitutionUninter";
import SubstitutionPanelUninter from "@/components/SubstitutionPanelUninter";
import { Page1, Page2, Page3, Page4, Page5, Page6 } from "@/components/DocumentPages";
import { usePDFExport, generatePDFFilename } from "@/lib/pdfExport";
import HistoricoUNINTERDocument from "@/components/HistoricoUNINTERDocument";

const TOTAL_PAGES = 6;
const PAGE_LABELS = [
  "Informativo Colação",
  "Certificado Conclusão",
  "Histórico Escolar",
  "Selo UNINTER",
  "Componentes Curriculares (1)",
  "Componentes Curriculares (2)",
];

export default function HistoricoUNINTER() {
  const { user, updateBalance } = useAuth();
  const [, setLocation] = useLocation();
  const printRef = useRef<HTMLDivElement>(null);
  const { exportPDF, exporting: isDownloading } = usePDFExport();

  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(0.75);
  const [showHighlights, setShowHighlights] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    fields,
    fieldMap,
    activeHistorico,
    activeProfile,
    modifiedCount,
    importText,
    gradeRows,
    applyHistorico,
    updateField,
    resetToOriginal,
    setImportText,
    applyImportText,
    generateMatricula,
  } = useSubstitutionUninter();

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= TOTAL_PAGES) setCurrentPage(page);
  }, []);

  const handleRequestEmit = useCallback(() => {
    const nome = fieldMap.nome || fieldMap.nome_aluno || fieldMap.nome_completo || "";
    if (!nome) { toast.error("Preencha o Nome do Aluno"); return; }
    if ((user?.balance || 0) <= 0) {
      toast.error("Saldo insuficiente. Recarregue para emitir documentos.");
      return;
    }
    setShowConfirmModal(true);
  }, [fieldMap, user?.balance]);

  const handleSave = useCallback(async () => {
    setIsExporting(true);
    try {
      const nome = fieldMap.nome || fieldMap.nome_aluno || fieldMap.nome_completo || "";
      const payload = {
        nome,
        cpf: fieldMap.cpf || "",
        rg: fieldMap.rg || "",
        ra: fieldMap.matricula || "",
        curso: fieldMap.curso || "",
        polo: fieldMap.polo || "",
        dataEmissao: fieldMap.data_expedicao_historico || "",
        dataConclusao: fieldMap.conclusao_curso || "",
        historicoKey: activeHistorico,
        profileKey: activeProfile,
        gradeRows, // Corrigido: Incluir notas no payload
        ...fieldMap,
      };
      const res = await fetch("/api/documents/historico-uninter", {
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
  }, [fieldMap, activeHistorico, activeProfile, gradeRows, updateBalance]);

  const handleExportPDF = useCallback(async () => {
    if (!printRef.current) return;
    try {
      const nome = fieldMap.nome || fieldMap.nome_aluno || fieldMap.nome_completo || "DOCUMENTO";
      await exportPDF(printRef.current, {
        filename: generatePDFFilename(nome, "historico-uninter"),
        docType: "historico-uninter",
        multiPage: true,
      });
      toast.success("PDF gerado com sucesso!");
    } catch (err) {
      toast.error("Erro ao exportar PDF.");
    }
  }, [exportPDF, fieldMap]);

  const renderCurrentPage = () => {
    const props = { 
      f: fieldMap, 
      highlightModified: showHighlights, 
      profileKey: activeProfile,
      gradeRows // Corrigido: Repassar notas para os componentes de página
    };
    switch (currentPage) {
      case 1: return <Page1 {...props} />;
      case 2: return <Page2 {...props} />;
      case 3: return <Page3 {...props} />;
      case 4: return <Page4 />;
      case 5: return <Page5 {...props} />;
      case 6: return <Page6 {...props} />;
      default: return <Page1 {...props} />;
    }
  };

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
            DocMaster <span className="font-light mx-1">|</span> Histórico UNINTER
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
              <SubstitutionPanelUninter
                fields={fields}
                activeHistorico={activeHistorico}
                modifiedCount={modifiedCount}
                importText={importText}
                onUpdateImportText={setImportText}
                onApplyImportText={applyImportText}
                onApplyHistorico={applyHistorico}
                onUpdateField={updateField}
                onGenerateMatricula={generateMatricula}
                onReset={resetToOriginal}
              />
          </aside>

          {/* Coluna de Preview (Right) */}
          <main className="flex-1 flex flex-col overflow-hidden relative">
            {/* Toolbar do Preview */}
            <div className="h-12 border-b border-gray-200 bg-white flex items-center px-4 gap-4 shrink-0 shadow-sm relative z-0">
              <button
                className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
              </button>
              <div className="h-6 w-px bg-gray-200" />
              
              <div className="flex items-center gap-1">
                <button
                  className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all disabled:opacity-30"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`h-7 min-w-[28px] px-2 rounded-lg text-[11px] font-bold transition-all ${
                        p === currentPage ? "bg-amber-500 text-white shadow-md shadow-amber-200" : "text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all disabled:opacity-30"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === TOTAL_PAGES}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="h-6 w-px bg-gray-200 ml-2" />
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{PAGE_LABELS[currentPage - 1]}</span>

              <div className="ml-auto flex items-center gap-3">
                <button
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                    showHighlights ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50"
                  }`}
                  onClick={() => setShowHighlights(!showHighlights)}
                >
                  {showHighlights ? <Eye size={14} /> : <EyeOff size={14} />}
                  {showHighlights ? "DESTAQUES ON" : "DESTAQUES OFF"}
                </button>

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
                <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-sm overflow-hidden">
                  {renderCurrentPage()}
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

        {/* Container oculto com TODAS as páginas para exportação PDF */}
        <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
          <HistoricoUNINTERDocument
            ref={printRef}
            data={fieldMap}
            gradeRows={gradeRows}
            profileKey={activeProfile}
          />
        </div>
      </div>

      {/* Modal de Confirmação + Sucesso */}
      <EmissionModal
        docLabel="Histórico UNINTER"
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
        historyPath="/historico-uninter-salvos"
      />
    </DashboardLayout>
  );
}
