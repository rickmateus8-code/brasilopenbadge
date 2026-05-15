/**
 * Histórico UNINTER — DocMaster Elite
 * Layout: DocumentPages (réplica visual do histórico UNINTER — 6 páginas)
 * Fluxo: DocMaster (useAuth, fetch, EmissionModal, jsPDF + html2canvas)
 */
import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ArrowLeft, Download, ZoomIn, ZoomOut,
  PanelLeftClose, PanelLeft, CheckCircle2,
  ChevronLeft, ChevronRight
} from "lucide-react";
import EmissionModal from "@/components/EmissionModal";
import { useSubstitutionUninter } from "@/hooks/useSubstitutionUninter";
import SubstitutionPanelUninter from "@/components/SubstitutionPanelUninter";
import { Page1, Page2, Page3, Page4, Page5, Page6 } from "@/components/DocumentPages";
import { usePDFExport, generatePDFFilename } from "@/lib/pdfExport";
import HistoricoUNINTERDocument from "@/components/HistoricoUNINTERDocument";

const TOTAL_PAGES = 6;
const PAGE_LABELS = [
  "Pág 1: Informativo de Conclusão",
  "Pág 2: Certificado Oficial",
  "Pág 3: Histórico (Dados)",
  "Pág 4: Selo Institucional",
  "Pág 5: Grade Curricular A",
  "Pág 6: Grade Curricular B",
];

export default function HistoricoUNINTER() {
  const { user, updateBalance } = useAuth();
  const [, setLocation] = useLocation();
  const printRef = useRef<HTMLDivElement>(null);
  const { exportPDF, exporting: isDownloading } = usePDFExport();

  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(0.68);
  const [showHighlights, setShowHighlights] = useState(false); // Padrão OFF
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
        gradeRows,
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

  const handleResetAll = useCallback(() => {
    resetToOriginal();
    toast.success("Formulário resetado");
  }, [resetToOriginal]);

  const formatDateExtenso = (dateStr: string) => {
    if (!dateStr || !dateStr.includes("/")) return undefined;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return undefined;
    const [day, month, year] = parts;
    const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    const mIdx = parseInt(month) - 1;
    if (isNaN(mIdx) || mIdx < 0 || mIdx > 11) return undefined;
    return `Curitiba/PR, ${parseInt(day)} de ${months[mIdx]} de ${year}.`;
  };

  const effectiveDateText = formatDateExtenso(fieldMap.expedicao_diploma || "");

  const renderCurrentPage = () => {
    const props = { 
      f: { ...fieldMap, dateText: effectiveDateText }, 
      highlightModified: showHighlights, 
      profileKey: activeProfile,
      gradeRows
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
    <>
      <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-900 font-sans">
          {/* Header Elite */}
          <header className="h-14 bg-[#005CA9] flex items-center px-6 gap-4 shrink-0 shadow-md z-20">
            <button
              onClick={() => setLocation("/dashboard")}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all border border-white/10"
            >
              <ArrowLeft size={14} /> VOLTAR
            </button>
            <div className="h-8 w-px bg-white/20" />
            <h1 className="text-sm font-black tracking-tight text-white uppercase italic">
              DocMaster <span className="font-light mx-1">|</span> Histórico UNINTER Elite
            </h1>
            
            <div className="ml-auto flex items-center gap-3">
              <button
                className={`flex items-center gap-2 text-xs font-black h-9 px-5 rounded-xl transition-all shadow-lg active:scale-95 ${
                  saved 
                  ? "bg-emerald-500 text-white" 
                  : "bg-white text-[#005CA9] hover:bg-blue-50 shadow-blue-900/20"
                }`}
                onClick={handleRequestEmit}
                disabled={isExporting || saved}
              >
                <Download size={14} />
                {saved ? "EMISSÃO CONCLUÍDA" : isExporting ? "PROCESSANDO..." : "EMITIR E EXPORTAR"}
              </button>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            {/* Editor Lateral */}
            <aside className={`transition-all duration-300 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl z-10 flex flex-col ${sidebarOpen ? "w-[420px]" : "w-0 overflow-hidden"}`}>
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
                  onReset={handleResetAll}
                />
            </aside>

            {/* Área de Preview */}
            <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-100 dark:bg-slate-900/50">
              {/* Toolbar do Preview */}
              <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center px-4 gap-4 shrink-0 shadow-sm relative z-0">
                <button
                  className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
                </button>
                <div className="h-6 w-px bg-gray-200 dark:bg-slate-800" />
                
                <div className="flex items-center gap-1">
                  <button
                    className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all disabled:opacity-30"
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
                          p === currentPage ? "bg-[#005CA9] text-white shadow-md shadow-blue-200" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all disabled:opacity-30"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === TOTAL_PAGES}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="h-6 w-px bg-gray-200 dark:bg-slate-800 ml-2" />
                <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{PAGE_LABELS[currentPage - 1]}</span>

                <div className="ml-auto flex items-center gap-3">
                  <button
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                      showHighlights ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                    onClick={() => setShowHighlights(!showHighlights)}
                  >
                    <CheckCircle2 size={14} className={showHighlights ? "text-blue-600" : "text-gray-300"} />
                    {showHighlights ? "VER ORIGINAL" : "VER MODIFICAÇÕES"}
                  </button>
                  <div className="h-6 w-px bg-gray-200 dark:bg-slate-800" />
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                    <button className="h-7 w-7 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all" onClick={() => setZoom(Math.max(0.4, zoom - 0.1))}><ZoomOut size={16} /></button>
                    <span className="text-[10px] font-black text-gray-600 dark:text-slate-400 min-w-[36px] text-center">{Math.round(zoom * 100)}%</span>
                    <button className="h-7 w-7 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all" onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}><ZoomIn size={16} /></button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto flex justify-center py-10 custom-scrollbar bg-slate-200 dark:bg-slate-900/80 relative">
                <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                  <div className="bg-white shadow-[0_40px_80px_rgba(0,0,0,0.2)] rounded-sm overflow-hidden border border-slate-300 dark:border-slate-800">
                    {renderCurrentPage()}
                  </div>
                </div>
              </div>
            </main>
          </div>

          {/* Exportação Multi-página Oculta */}
          <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
            <HistoricoUNINTERDocument
              ref={printRef}
              data={{ ...fieldMap, dateText: effectiveDateText }}
              gradeRows={gradeRows}
              profileKey={activeProfile}
            />
          </div>
      </div>

      <EmissionModal
        docLabel="Histórico UNINTER Elite"
        docEmoji="🎓"
        documentPrice={1500}
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
    </>
  );
}
