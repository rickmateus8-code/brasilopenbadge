import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ArrowLeft, Download, ZoomIn, ZoomOut,
  AlertCircle, FileText, CheckCircle, Search, Save, X, PanelLeftClose, PanelLeft,
  ChevronUp, ChevronDown, Calendar as CalendarIcon
} from "lucide-react";
import EmissionModal from "@/components/EmissionModal";
import PeticaoDocument, { type PetitionData } from "@/components/PetitionSTJDocument";
import { usePDFExport, generatePDFFilename } from "@/lib/pdfExport";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

export default function PeticaoCria() {
  const { user, updateBalance } = useAuth();
  const [, setLocation] = useLocation();
  const previewRef = useRef<HTMLDivElement>(null);
  const { exportPDF, exporting: isDownloading } = usePDFExport();

  const [zoomScale, setZoomScale] = useState(0.65);
  const [zoomTranslateY, setZoomTranslateY] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [previewMode, setPreviewMode] = useState<"fit" | "full">("fit");
  const [currentSection, setCurrentSection] = useState<"top" | "bottom">("top");

  const [isExporting, setIsExporting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [documentPrice, setDocumentPrice] = useState<number>(2000); // R$ 20,00 padrão

  // Buscar preço atualizado
  useEffect(() => {
    fetch("/api/pricing")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.pricing?.["peticao-stj"]) {
          setDocumentPrice(data.pricing["peticao-stj"].price);
        }
      })
      .catch(err => console.error("Erro ao buscar preço:", err));
  }, []);

  const formatCurrency = (val: string) => {
    // Remove tudo que não é dígito
    let digits = val.replace(/\D/g, "");
    if (!digits) return "";
    
    // Converte para valor numérico
    const amount = (parseInt(digits) / 100).toFixed(2);
    const [int, dec] = amount.split(".");
    
    // Formata o inteiro com pontos de milhar
    const formattedInt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    return `R$ ${formattedInt},${dec}`;
  };

  const formatDateMask = (val: string) => {
    const v = val.replace(/\D/g, "").slice(0, 8);
    if (v.length >= 5) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
    } else if (v.length >= 3) {
      return `${v.slice(0, 2)}/${v.slice(2)}`;
    }
    return v;
  };

  const formatCPFCNPJ = (val: string) => {
    const v = val.replace(/\D/g, "");
    if (v.length <= 11) {
      // CPF: 000.000.000-00
      return v
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      // CNPJ: 00.000.000/0000-00
      return v.slice(0, 14)
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
  };

  const validateCPFCNPJ = (val: string) => {
    const v = val.replace(/\D/g, "");
    if (v.length === 11) {
      // Validação básica de CPF
      if (/^(\d)\1+$/.test(v)) return false;
      let add = 0;
      for (let i = 0; i < 9; i++) add += parseInt(v.charAt(i)) * (10 - i);
      let rev = 11 - (add % 11);
      if (rev === 10 || rev === 11) rev = 0;
      if (rev !== parseInt(v.charAt(9))) return false;
      add = 0;
      for (let i = 0; i < 10; i++) add += parseInt(v.charAt(i)) * (11 - i);
      rev = 11 - (add % 11);
      if (rev === 10 || rev === 11) rev = 0;
      if (rev !== parseInt(v.charAt(10))) return false;
      return true;
    } else if (v.length === 14) {
      // Validação básica de CNPJ
      let tamanho = v.length - 2;
      let numeros = v.substring(0, tamanho);
      let digitos = v.substring(tamanho);
      let soma = 0;
      let pos = tamanho - 7;
      for (let i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
        if (pos < 2) pos = 9;
      }
      let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
      if (resultado !== parseInt(digitos.charAt(0))) return false;
      tamanho = tamanho + 1;
      numeros = v.substring(0, tamanho);
      soma = 0;
      pos = tamanho - 7;
      for (let i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
        if (pos < 2) pos = 9;
      }
      resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
      if (resultado !== parseInt(digitos.charAt(1))) return false;
      return true;
    }
    return false;
  };

  const handleCpfCnpjChange = (val: string) => {
    const masked = formatCPFCNPJ(val);
    setForm({ ...form, cpf_cnpj: masked });
  };

  const formatProcessMask = (val: string) => {
    const v = val.replace(/\D/g, "").slice(0, 20);
    let masked = v;
    if (v.length > 7) masked = `${v.slice(0, 7)}-${v.slice(7)}`;
    if (v.length > 9) masked = `${v.slice(0, 7)}-${v.slice(7, 9)}.${v.slice(9)}`;
    if (v.length > 13) masked = `${v.slice(0, 7)}-${v.slice(7, 9)}.${v.slice(9, 13)}.${v.slice(13)}`;
    if (v.length > 14) masked = `${v.slice(0, 7)}-${v.slice(7, 9)}.${v.slice(9, 13)}.${v.slice(13, 14)}.${v.slice(14)}`;
    if (v.length > 16) masked = `${v.slice(0, 7)}-${v.slice(7, 9)}.${v.slice(9, 13)}.${v.slice(13, 14)}.${v.slice(14, 16)}.${v.slice(16)}`;
    return masked;
  };

  const generateAlvaraNumber = () => {
    return Math.floor(1000000 + Math.random() * 9000000).toString();
  };

  const [form, setForm] = useState<PetitionData>({
    id: "XXXX.XXXX",
    processo: "",
    credor: "",
    cpf_cnpj: "",
    advogado: "",
    contra: "",
    valor: "",
    data: "02/05/2026",
    alvara_numero: generateAlvaraNumber()
  });

  const handleReset = () => {
    setForm({
      id: "XXXX.XXXX",
      processo: "",
      credor: "",
      cpf_cnpj: "",
      advogado: "",
      contra: "",
      valor: "",
      data: "02/05/2026",
      alvara_numero: generateAlvaraNumber()
    });
    toast.success("Formulário resetado");
  };


  const getFitScale = useCallback(() => {
    const container = document.getElementById("preview-container");
    if (!container) return 0.65;
    const padding = 20; 
    const availableWidth = container.offsetWidth - padding;
    const availableHeight = container.offsetHeight - padding;
    const scaleX = availableWidth / A4_WIDTH_PX;
    const scaleY = availableHeight / A4_HEIGHT_PX;
    return Math.min(scaleX, scaleY, 1.0);
  }, []);

  const scrollToPreviewSection = useCallback((section: "top" | "bottom") => {
    const container = document.getElementById("preview-container");
    if (container) {
      const containerHeight = container.offsetHeight;
      const padding = 15;
      
      // Preservar o zoomScale atual ou usar o mínimo focado
      const s = Math.max(zoomScale, 0.95);
      
      let targetY = 0;
      if (section === "top") {
        targetY = padding / s; 
      } else {
        const scaledHeight = A4_HEIGHT_PX * s;
        if (scaledHeight > containerHeight) {
          targetY = (containerHeight - padding) / s - A4_HEIGHT_PX;
        } else {
          targetY = padding / s;
        }
      }
      
      setZoomScale(s);
      setZoomTranslateY(targetY);
      setCurrentSection(section);
      setIsFocused(true);
    }
  }, [zoomScale]);

  const resetPreviewZoom = useCallback(() => {
    const scale = getFitScale();
    const container = document.getElementById("preview-container");
    let ty = 0;
    if (container) {
      const containerHeight = container.offsetHeight;
      const docHeight = A4_HEIGHT_PX;
      ty = (containerHeight / scale - docHeight) / 2;
    }
    setZoomScale(scale);
    setZoomTranslateY(ty);
    setIsFocused(false);
    setCurrentSection("top");
  }, [getFitScale]);

  useEffect(() => {
    const handleResize = () => { if (!isFocused || previewMode === "full") resetPreviewZoom(); };
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 100);
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(timer); };
  }, [resetPreviewZoom, isFocused, previewMode]);
const handleRequestEmit = useCallback(() => {
  if (!form.credor) { toast.error("Preencha o Nome do Credor"); return; }
  if (!form.advogado) { toast.error("Preencha o Nome do Advogado"); return; }
  const balance = user?.balance || 0;

  // Sincronizado com o slug do Admin (Aceita ambos)
  const freeDocsArr = Array.isArray(user?.free_documents) ? user?.free_documents : [];
  const isFree = user?.role === 'admin' || freeDocsArr.includes('peticao-stj') || freeDocsArr.includes('peticaocria');

  if (user?.role !== 'admin' && !isFree && balance < documentPrice) {
    toast.error(`Saldo insuficiente. Necessário R$ ${(documentPrice/100).toFixed(2)}`);
    return;
  }
  setShowConfirmModal(true);
}, [form.credor, form.advogado, user?.balance, user?.role, user?.free_documents, documentPrice]);

const handleSave = useCallback(async () => {
  setIsExporting(true);
  try {
    // Re-verificar isFree para evitar falha no post se o saldo for 0
    const freeDocsArr = Array.isArray(user?.free_documents) ? user?.free_documents : [];
    const isFree = user?.role === 'admin' || freeDocsArr.includes('peticao-stj') || freeDocsArr.includes('peticaocria');

    const payload = {
      ...form,
      document_type: "peticao-stj",
      price: isFree ? 0 : documentPrice
    };
    const res = await fetch("/api/documents/peticao-stj", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
      const result = await res.json();
      if (result.success) {
        if (result.newBalance !== undefined) updateBalance(result.newBalance);
        setSaved(true);
        const finalId = result.data.id;
        setForm(p => ({ ...p, id: finalId }));
        
        setShowConfirmModal(false);
        toast.success("Emissão realizada! Gerando download...");

        // Aguardar atualização do estado do ID no componente antes de exportar
        setTimeout(async () => {
          if (previewRef.current) {
            try {
              await exportPDF(previewRef.current, {
                filename: generatePDFFilename(form.credor || "PETICAO", "peticaocria"),
                docType: "peticaocria",
                customWidth: 794,
                customHeight: 1123,
              });
              toast.success("Download iniciado!");
              // Redirecionar após o download
              setTimeout(() => {
                setLocation("/peticaocria-salvos");
              }, 1500);
            } catch (err) {
              toast.error("Erro ao gerar download automático.");
              setShowSuccessModal(true); // Fallback para modal manual
            }
          } else {
            setShowSuccessModal(true);
          }
        }, 500);
      } else {
        toast.error(result.error || "Erro ao gerar petição");
        setShowConfirmModal(false);
      }
    } catch { toast.error("Erro de conexão"); setShowConfirmModal(false); }
    finally { setIsExporting(false); }
  }, [form, updateBalance]);

  const handleExportPDF = useCallback(async () => {
    if (!previewRef.current) return;
    try {
      await exportPDF(previewRef.current, {
        filename: generatePDFFilename(form.credor || "PETICAO", "peticaocria"),
        docType: "peticaocria",
        customWidth: 794,
        customHeight: 1123,
      });
      toast.success("PDF gerado com sucesso!");
    } catch (err) { toast.error("Erro ao exportar PDF."); }
  }, [exportPDF, form.credor]);

  const inp = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 13,
    color: "#000",
    outline: "none",
    boxSizing: "border-box" as const,
    marginBottom: 10
  };

  const lbl = {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: "#4b5563",
    marginBottom: 4,
    textTransform: "uppercase" as const,
    letterSpacing: "0.025em"
  };

  const card = {
    background: "#fff",
    padding: 16,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    marginBottom: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  };

  const subfonte = {
    fontSize: 10,
    color: "#000", // Preto absoluto para os exemplos
    marginTop: -8,
    marginBottom: 10,
    fontStyle: "italic",
    opacity: 0.7
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-white font-sans">
      <header className="h-14 bg-[#1e1b4b] flex items-center px-6 gap-4 shrink-0 shadow-md z-10">
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
          >
            <ArrowLeft size={14} /> VOLTAR
          </button>
          <div className="h-8 w-px bg-white/20" />
          <h1 className="text-sm font-black tracking-tight text-white uppercase italic">
            DocMaster <span className="font-light mx-1">|</span> Petição Judicial
          </h1>
          
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-xs font-bold h-9 px-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100 shadow-sm active:scale-95"
              disabled={isExporting}
            >
              <X size={14} /> LIMPAR
            </button>
            <button
              className={`flex items-center gap-2 text-xs font-black h-9 px-5 rounded-xl transition-all shadow-lg active:scale-95 ${
                saved ? "bg-emerald-500 text-white" : "bg-white text-[#1e1b4b] hover:bg-gray-50 shadow-indigo-900/20"
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
          <aside className={`transition-all duration-300 border-r border-gray-200 bg-white shadow-xl z-10 flex flex-col ${sidebarOpen ? "w-[400px]" : "w-0 overflow-hidden"}`}>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <div style={card}>
                <p className="text-sm font-bold text-indigo-950 mb-4 flex items-center gap-2"><FileText size={16} /> ⚖️ Dados do Processo</p>
                
                <label style={lbl}>Credor</label>
                <input style={inp} value={form.credor} onChange={(e) => setForm(p => ({ ...p, credor: e.target.value }))} placeholder="Ex: LAZARA MARGARIDA..." />
                
                <label style={lbl}>CPF/CNPJ do Credor</label>
                <div className="relative">
                  <input 
                    style={{ ...inp, paddingRight: 40, border: form.cpf_cnpj && !validateCPFCNPJ(form.cpf_cnpj) ? "1px solid #ef4444" : inp.border }} 
                    value={form.cpf_cnpj} 
                    onChange={(e) => handleCpfCnpjChange(e.target.value)} 
                    placeholder="000.000.000-00" 
                  />
                  {form.cpf_cnpj && (
                    <div className="absolute right-3 top-[10px]">
                      {validateCPFCNPJ(form.cpf_cnpj) ? (
                        <CheckCircle size={16} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={16} className="text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {form.cpf_cnpj && !validateCPFCNPJ(form.cpf_cnpj) && (
                  <p className="text-[10px] text-red-500 font-bold mt-[-8px] mb-3 ml-1 uppercase">Documento inválido</p>
                )}

                <label style={lbl}>Advogado(a)</label>
                <input style={inp} value={form.advogado} onChange={(e) => setForm(p => ({ ...p, advogado: e.target.value }))} placeholder="Ex: KEVIN PEREIRA..." />

                <label style={lbl}>Número do Processo</label>
                <input style={inp} value={form.processo} onChange={(e) => setForm(p => ({ ...p, processo: formatProcessMask(e.target.value) }))} placeholder="0000000-00.0000.0.00.0000" />

                <label style={lbl}>Execução Contra</label>
                <input style={inp} value={form.contra} onChange={(e) => setForm(p => ({ ...p, contra: e.target.value }))} placeholder="Ex: BANCO ITAU..." />

                <label style={lbl}>Valor a Receber (R$)</label>
                <input 
                  style={inp} 
                  value={form.valor} 
                  onChange={(e) => setForm(p => ({ ...p, valor: formatCurrency(e.target.value) }))} 
                  placeholder="Ex: 26.516,28" 
                />

                <label style={lbl}>Data do Documento</label>
                <input 
                  type="date"
                  style={{ ...inp, marginBottom: 16 }} 
                  value={form.data.includes('/') ? (()=>{
                    const [d,m,y] = form.data.split('/');
                    return `${y}-${m}-${d}`;
                  })() : ""} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const [y, m, d] = val.split('-');
                    setForm(p => ({ ...p, data: `${d}/${m}/${y}` }));
                  }} 
                />
              </div>
            </div>
          </aside>

          <main className="flex-1 relative flex flex-col overflow-hidden">
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 bg-white shadow-xl rounded-xl text-gray-700 hover:bg-gray-50 transition-all border border-gray-100">{sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}</button>
              
              {/* Zoom Controls */}
              <button onClick={() => setZoomScale(s => Math.min(s + 0.1, 2))} className="p-2.5 bg-white shadow-xl rounded-xl text-gray-700 hover:bg-gray-50 transition-all border border-gray-100"><ZoomIn size={20} /></button>
              <button onClick={() => setZoomScale(s => Math.max(s - 0.1, 0.3))} className="p-2.5 bg-white shadow-xl rounded-xl text-gray-700 hover:bg-gray-50 transition-all border border-gray-100"><ZoomOut size={20} /></button>
              
              {/* Navigation Controls (Moved from bottom-right to top-left sidebar) */}
              <div className="h-px bg-gray-200 my-1 mx-2" />
              <button 
                onClick={() => scrollToPreviewSection("top")} 
                className={`p-2.5 shadow-xl rounded-xl transition-all border ${currentSection === "top" && isFocused ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-100 hover:bg-gray-50"}`}
                title="Ver Topo"
              >
                <ChevronUp size={20} />
              </button>
              <button 
                onClick={() => scrollToPreviewSection("bottom")} 
                className={`p-2.5 shadow-xl rounded-xl transition-all border ${currentSection === "bottom" && isFocused ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-100 hover:bg-gray-50"}`}
                title="Ver Assinatura"
              >
                <ChevronDown size={20} />
              </button>
              <button 
                onClick={resetPreviewZoom} 
                className={`p-2.5 shadow-xl rounded-xl transition-all border ${!isFocused ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-100 hover:bg-gray-50"}`}
                title="Ajustar à Tela"
              >
                <Search size={20} />
              </button>
            </div>

            <div id="preview-container" className="w-full h-full flex items-start justify-center overflow-hidden bg-white relative" style={{ perspective: "1000px" }}>
              <div style={{ width: A4_WIDTH_PX, flexShrink: 0, transform: `scale(${zoomScale}) translateY(${zoomTranslateY}px)`, transformOrigin: "top center", transition: "transform 0.85s cubic-bezier(0.22, 1, 0.36, 1)", boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}>
                <PeticaoDocument ref={previewRef} data={form} />
              </div>
            </div>
          </main>
        </div>

        <EmissionModal 
          docLabel="Petição Judicial"
          docEmoji="⚖️"
          documentPrice={documentPrice}
          userBalance={user?.balance || 0}
          isFree={user?.role === 'admin' || (Array.isArray(user?.free_documents) && (user.free_documents.includes('peticao-stj') || user.free_documents.includes('peticaocria') || user.free_documents.includes('peticao')))}
          showConfirm={showConfirmModal}
          showSuccess={showSuccessModal}
          isEmitting={isExporting}
          isDownloading={isDownloading}
          onConfirm={handleSave}
          onCancel={() => setShowConfirmModal(false)}
          onDownload={handleExportPDF}
          onClose={() => {
            setShowConfirmModal(false);
            setShowSuccessModal(false);
          }}
          historyPath="/peticaocria-salvos"
        />
        {showSuccessModal && (
          <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border border-white/20 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="text-emerald-500 w-12 h-12" /></div>
              <h2 className="text-2xl font-black text-gray-900 mb-2 italic">EMISSÃO CONCLUÍDA!</h2>
              <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">Sua petição foi registrada com sucesso e já está pronta para download.</p>
              <div className="grid grid-cols-1 gap-3">
                <button onClick={handleExportPDF} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"><Download size={18} /> BAIXAR PETIÇÃO PDF</button>
                <button onClick={() => setLocation("/peticaocria-salvos")} className="text-gray-400 hover:text-gray-600 text-xs font-bold py-2 transition-colors">VER HISTÓRICO DE PETIÇÕES</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
