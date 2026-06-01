/**
 * CNHCria — Formulário Elite 3.0 (Universal)
 * UI: Moderna com Abas (Automação, Pessoais, CNH, Finalização)
 * Layout: Preserva paridade 1:1 na exportação via CNHDocument
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import DashboardLayout from "../components/DashboardLayout";
import CNHDocument, { type CNHDocumentHandle, type CNHDocumentProps } from "../components/CNHDocument";
import { toast } from "sonner";
import { getQRCodeCNH } from "@/config.qrcode";
import { validarCPF, displayDateToHtml } from "@/lib/utils";
import EmissionModal from "@/components/EmissionModal";
import RequiredFieldsModal from "@/components/RequiredFieldsModal";
import {
  ArrowLeft, Save, Download, MessageCircle, Copy, Zap,
  Upload, Type, AlertCircle, Camera, PenTool, Layout,
  RefreshCw, MousePointer2, ZoomIn, ZoomOut, Move, Trash2
} from "lucide-react";

// ─── Constantes ──────────────────────────────────────────────────────────────
const MODELO_TEXTO = `Nome Completo: 
CPF: 
Sexo: 
RG: 
Orgão Emissor: 
UF RG: 
Nacionalidade: BRASILEIRO(A)
Data Nascimento: 
Local Nascimento: 
UF Nasc: 
Nome do Pai: 
Nome da Mãe: 
Categoria: 
Tipo: 
Validade: 
Emissão: 
1ª Habilitação: 
Local Emissão: 
UF Emissão: 
Senha App: 
Observações: `;

const ESTILOS_ASS = [
  { label: "Estilo 1 (Cursiva Elegante)", font: "'Dancing Script', cursive" },
  { label: "Estilo 2 (Bradley Hand)", font: "'Caveat', cursive" },
];

const TABS = [
  { id: "automacao", label: "Automação", icon: Zap },
  { id: "pessoais", label: "1. Pessoais", icon: MousePointer2 },
  { id: "documento", label: "2. CNH", icon: Layout },
  { id: "finalizacao", label: "3. Finalização", icon: Camera },
];

const MANDATORY_FIELDS: Record<string, keyof CNHDocumentProps> = {
  "Nome Completo": "nome",
  "CPF": "cpf",
  "RG": "rg",
  "Órgão Emissor": "orgaoEmissor",
  "UF do RG": "ufRG",
  "Data de Nascimento": "dataNascimento",
  "Categoria": "categoria",
  "Local de Emissão": "localEmissao",
  "UF de Emissão": "ufEmissao",
  "Foto do Rosto": "fotoUrl",
  "Assinatura": "assinaturaUrl",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function gerarNumero(len: number): string {
  let r = "";
  for (let i = 0; i < len; i++) r += Math.floor(Math.random() * 10).toString();
  return r;
}

function formatarCPFInput(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

/**
 * Filtro avançado para remover fundo e comprimir imagem
 */
async function processAndCompressImage(dataUrl: string, options: { maxWidth?: number; maxHeight?: number; removeBg?: boolean; quality?: number } = {}): Promise<string> {
  const { maxWidth = 800, maxHeight = 800, removeBg = false, quality = 0.8 } = options;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Redimensionamento proporcional
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      
      if (!removeBg) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
      }
      
      ctx.drawImage(img, 0, 0, width, height);

      if (removeBg) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
          if (r > 220 && g > 220 && b > 220) pixels[i + 3] = 0;
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png")); // PNG para transparência
      } else {
        resolve(canvas.toDataURL("image/jpeg", quality)); // JPEG para menor tamanho
      }
    };
    img.src = dataUrl;
  });
}

// ─── Componente ──────────────────────────────────────────────────────────────
export default function CNHCria() {
  const { user, updateBalance } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [, setLocation] = useLocation();
  const docRef = useRef<CNHDocumentHandle>(null);

  const [activeTab, setActiveTab] = useState("automacao");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [codigoQR, setCodigoQR] = useState("");
  const [importText, setImportText] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isApplyingAI, setIsApplyingAI] = useState(false);
  const [documentPrice, setDocumentPrice] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showRequiredModal, setShowRequiredModal] = useState(false);

  const [data, setData] = useState<CNHDocumentProps>({
    nome: "", cpf: "", rg: "", orgaoEmissor: "", ufRG: "",
    sexo: "", nacionalidade: "BRASILEIRO(A)", dataNascimento: "",
    localNascimento: "", ufNascimento: "", nomePai: "", nomeMae: "",
    categoria: "", tipo: "Definitiva", registro: "", espelho: "",
    validade: "", validadeCNH2: "", dataEmissao: "", primeiraHabilitacao: "",
    localEmissao: "", ufEmissao: "", assDigital1: "", assDigital2: "",
    senhaApp: "", observacoes: "", fotoUrl: "", assinaturaUrl: "",
    fotoScale: 1.1, fotoOffsetX: 0, fotoOffsetY: 0,
    assScale: 1.0, assOffsetX: 0, assOffsetY: 0,
    codigoQR: "PREVIEW", blurred: true,
  });

  const update = useCallback((field: keyof CNHDocumentProps) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let val = e.target.value;
    if (field === "cpf") val = formatarCPFInput(val);
    if (field === "rg") val = val.replace(/\./g, "");
    
    setData(d => {
      const next = { ...d, [field]: val };
      // Auto Renach (Ass Digital 2)
      if (field === "ufEmissao" && val.length === 2) {
        next.assDigital2 = val.toUpperCase() + gerarNumero(8);
      }
      return next;
    });
  }, []);

  const adjustMedia = (field: keyof CNHDocumentProps, amount: number) => {
    setData(d => ({ ...d, [field]: (Number(d[field] || 0) + amount) }));
  };

  const handleAutoRegistro = () => setData(d => ({ ...d, registro: gerarNumero(11) }));
  const handleAutoEspelho = () => setData(d => ({ ...d, espelho: gerarNumero(10) }));
  const handleAutoAss1 = () => setData(d => ({ ...d, assDigital1: gerarNumero(10) }));
  const handleAutoAss2 = () => {
    const uf = (data.ufEmissao || "SP").toUpperCase();
    setData(d => ({ ...d, assDigital2: uf + gerarNumero(8) }));
  };

  const handleCopiarModelo = () => {
    navigator.clipboard.writeText(MODELO_TEXTO);
    toast.success("Modelo copiado!");
  };

  const handleProcessarImportacao = () => {
    if (!importText.trim()) { toast.error("Cole os dados primeiro!"); return; }
    const get = (label: string): string => {
      const regex = new RegExp(`${label}:\\s*(.*)`, "i");
      const m = importText.match(regex);
      return m ? m[1].trim() : "";
    };
    const convertDate = (val: string): string => {
      if (!val) return "";
      const trimmed = val.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
        return displayDateToHtml(trimmed);
      }
      return trimmed;
    };
    const cleanRG = (val: string): string => val.replace(/\./g, "");

    const ufEmissaoVal = get("UF Emiss[aã]o") || data.ufEmissao || "SP";
    const autoRegistro = get("N[ºo] Registro") || gerarNumero(11);
    const autoEspelho = get("N[ºo] CNH") || get("Espelho") || gerarNumero(10);
    const autoAss1 = get("Ass\\.? Digital 1") || gerarNumero(10);
    const autoAss2 = get("Ass\\.? Digital 2") || (ufEmissaoVal.toUpperCase() + gerarNumero(8));
    const autoSenha = get("Senha App") || get("Senha") || String(Math.floor(1000 + Math.random() * 9000));

    setData(d => ({
      ...d,
      nome: get("Nome Completo") || d.nome,
      cpf: formatarCPFInput(get("CPF")) || d.cpf,
      sexo: get("Sexo") || d.sexo,
      rg: cleanRG(get("RG")) || d.rg,
      orgaoEmissor: get("Org[aã]o Emissor") || d.orgaoEmissor,
      ufRG: get("UF RG") || d.ufRG,
      nacionalidade: get("Nacionalidade") || d.nacionalidade || "BRASILEIRO(A)",
      dataNascimento: convertDate(get("Data Nascimento")) || d.dataNascimento,
      localNascimento: get("Local Nascimento") || d.localNascimento,
      ufNascimento: get("UF Nasc") || d.ufNascimento,
      nomePai: get("Nome do Pai") || d.nomePai,
      nomeMae: get("Nome da M[aã]e") || d.nomeMae,
      categoria: get("Categoria") || d.categoria,
      tipo: get("Tipo") || d.tipo,
      registro: autoRegistro,
      espelho: autoEspelho,
      validade: convertDate(get("Validade")) || d.validade,
      dataEmissao: convertDate(get("Emiss[aã]o")) || d.dataEmissao,
      primeiraHabilitacao: convertDate(get("1[ªa] Habilita[çc][aã]o")) || d.primeiraHabilitacao,
      localEmissao: get("Local Emiss[aã]o") || d.localEmissao,
      ufEmissao: ufEmissaoVal,
      assDigital1: autoAss1,
      assDigital2: autoAss2,
      senhaApp: autoSenha,
      observacoes: get("Observa[çc][oõ]es") || d.observacoes,
    }));
    toast.success("Dados importados!");
    setActiveTab("pessoais");
  };

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      // Remove fundo automaticamente ao subir
      const cleanImg = await removeBackground(reader.result as string);
      setData(d => ({ ...d, fotoUrl: cleanImg }));
      toast.success("Foto processada (Fundo Removido)");
    };
    reader.readAsDataURL(file);
  };

  const handleAssinaturaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const cleanImg = await removeBackground(reader.result as string);
      setData(d => ({ ...d, assinaturaUrl: cleanImg }));
      toast.success("Assinatura processada");
    };
    reader.readAsDataURL(file);
  };

  const [assTexto, setAssTexto] = useState("");
  const [assEstilo, setAssEstilo] = useState(0);

  const gerarAssinaturaTexto = useCallback(() => {
    if (!assTexto.trim()) return;
    const cvs = document.createElement("canvas");
    cvs.width = 600;
    cvs.height = 150;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 600, 150);
    const fonteSelecionada = ESTILOS_ASS[assEstilo]?.font || "'Dancing Script', cursive";
    let fontSize = 48;
    ctx.font = `${fontSize}px ${fonteSelecionada}`;
    while (ctx.measureText(assTexto).width > 560 && fontSize > 16) {
      fontSize -= 2; ctx.font = `${fontSize}px ${fonteSelecionada}`;
    }
    ctx.fillStyle = "black";
    ctx.textBaseline = "middle";
    ctx.fillText(assTexto, 20, 75);
    setData(d => ({ ...d, assinaturaUrl: cvs.toDataURL("image/png") }));
    toast.success("Assinatura gerada!");
  }, [assTexto, assEstilo]);

  const handleRequestEmit = async () => {
    const missing: string[] = [];
    Object.entries(MANDATORY_FIELDS).forEach(([label, key]) => {
      if (!data[key]) missing.push(label);
    });

    if (missing.length > 0) {
      setMissingFields(missing);
      setShowRequiredModal(true);
      return;
    }

    if (!validarCPF(data.cpf)) { toast.error("CPF inválido!"); return; }
    
    try {
      const pricingRes = await fetch("/api/pricing", { credentials: "include" });
      const pricingData = await pricingRes.json();
      if (pricingData.success && pricingData.pricing?.cnh) setDocumentPrice(pricingData.pricing.cnh.price);
    } catch { }
    setShowConfirmModal(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents/cnh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...data, type: "cnh", renach: data.assDigital2 }),
      });
      const result = await res.json();
      if (result.success) {
        const codigo = result.data?.codigoValidacao || result.data?.codigo_validacao || result.data?.id || "CNH-" + Date.now();
        setCodigoQR(codigo);
        setData(d => ({ ...d, codigoQR: codigo, blurred: false }));
        setSaved(true);
        setShowConfirmModal(false);
        
        // Auto Download
        toast.info("Emissão concluída! Iniciando download...");
        setTimeout(async () => {
          if (docRef.current) await docRef.current.exportAsPdf();
          toast.success("Download iniciado. Redirecionando...");
          setTimeout(() => setLocation("/cnhsalvas"), 2000);
        }, 1000);

        if (result.newBalance !== undefined) updateBalance(result.newBalance);

        // Sync (não crítico)
        fetch("https://cnh-digital.manus.space/api/cnh-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, cpf: data.cpf, validationId: codigo, foto: data.fotoUrl }),
        }).catch(() => {});
      } else {
        toast.error(result.error || "Erro ao gerar CNH");
        setShowConfirmModal(false);
      }
    } catch {
      toast.error("Erro de conexão");
      setShowConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!docRef.current) return;
    setLoading(true);
    try {
      await docRef.current.exportAsPdf();
      toast.success("PDF exportado com sucesso!");
    } catch {
      toast.error("Erro ao exportar PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleExportJPEG = async () => {
    if (!docRef.current) return;
    setLoading(true);
    try {
      const blob = await docRef.current.exportAsBlob();
      if (!blob) throw new Error("Falha ao gerar imagem");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const nomeFormatado = (data.nome || "DOCUMENTO").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
      a.download = `CNH_${nomeFormatado}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Imagem JPEG exportada!");
    } catch {
      toast.error("Erro ao exportar imagem");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    const texto = encodeURIComponent(
      `*DocMaster - CNH Digital*\n\nOlá! Segue sua CNH Digital gerada pelo DocMaster.\n\nNome: ${data.nome}\nCPF: ${data.cpf}\nCategoria: ${data.categoria}\n\nAcesse o documento: ${getQRCodeCNH(codigoQR)}\n\nSenha App: ${data.senhaApp || "Não definida"}\n\n_Documento gerado por DocMaster_`
    );
    window.open(`https://wa.me/?text=${texto}`, "_blank");
  };

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Caveat:wght@400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  return (
    <DashboardLayout>
      <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 overflow-y-auto font-sans flex flex-col">
        {/* Header Elite */}
        <header className="h-16 bg-[#005CA9] flex items-center px-8 gap-4 shrink-0 shadow-lg z-20">
          <button onClick={() => setLocation("/dashboard")} className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-black px-4 py-2 rounded-xl transition-all border border-white/10 flex items-center gap-2">
            <ArrowLeft size={16} /> VOLTAR
          </button>
          <div className="h-8 w-px bg-white/20" />
          <h1 className="text-lg font-black tracking-tighter text-white uppercase italic">
            DOCMASTER<span className="text-white/60">.STORE</span> <span className="font-light mx-2">|</span> GERADOR DE CNH
          </h1>
          <div className="ml-auto flex items-center gap-4">
            <div className="bg-emerald-500/20 border border-emerald-500/30 px-4 py-1.5 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Painel Ativo</span>
            </div>
            <button onClick={() => window.location.reload()} className="text-white/60 hover:text-white transition-colors">
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Navegação por Abas Lateral */}
          <aside className="w-56 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border ${
                  activeTab === tab.id 
                  ? "bg-[#005CA9] text-white border-[#005CA9] shadow-lg shadow-blue-500/20 translate-x-1" 
                  : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-900"
                }`}
              >
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </aside>

          {/* Área do Formulário */}
          <main className="flex-1 p-10 overflow-y-auto bg-white dark:bg-slate-950 custom-scrollbar relative">
            <div className="max-w-4xl mx-auto">
              
              {saved && (
                <div className="mb-10 p-8 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in zoom-in">
                  <div>
                    <h3 className="text-xl font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-tight">Emissão Concluída!</h3>
                    <p className="text-sm text-emerald-600 dark:text-emerald-500 font-medium">O documento foi gerado e registrado com sucesso.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleExportPdf} className="bg-[#005CA9] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center gap-2">
                      <Download size={14} /> PDF
                    </button>
                    <button onClick={handleExportJPEG} className="bg-slate-700 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2">
                      <Camera size={14} /> JPEG
                    </button>
                    <button onClick={handleWhatsApp} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 active:scale-95 flex items-center gap-2">
                      <MessageCircle size={14} /> WHATSAPP
                    </button>
                  </div>
                </div>
              )}

              {/* ABA: AUTOMAÇÃO */}
              {activeTab === "automacao" && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="flex items-center gap-2 mb-8 border-b-2 border-dashed border-emerald-100 dark:border-emerald-900/30 pb-4">
                      <Zap className="text-emerald-500" size={24} />
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Automação Inteligente</h2>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col gap-4">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">1. Envie para o Cliente</h3>
                        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 font-mono text-[11px] text-slate-500 h-48 overflow-y-auto whitespace-pre-wrap">
                          {MODELO_TEXTO}
                        </div>
                        <button onClick={handleCopiarModelo} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-amber-500/20">
                           <Copy size={16} /> COPIAR MODELO
                        </button>
                      </div>
                      <div className="flex flex-col gap-4">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">2. Cole a Resposta</h3>
                        <textarea 
                          value={importText} 
                          onChange={(e) => setImportText(e.target.value)}
                          placeholder="Cole aqui o texto preenchido pelo cliente..."
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-sm h-48 focus:ring-2 ring-blue-500/20 outline-none transition-all resize-none"
                        />
                        <button onClick={handleProcessarImportacao} className="w-full bg-[#005CA9] hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-500/20">
                           <Zap size={16} /> PROCESSAR DADOS
                        </button>
                      </div>
                   </div>
                </div>
              )}

              {/* ABA: PESSOAIS */}
              {activeTab === "pessoais" && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="flex items-center gap-2 mb-8 border-b-2 border-dashed border-blue-100 dark:border-blue-900/30 pb-4">
                      <MousePointer2 className="text-blue-500" size={24} />
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">1. Dados Pessoais</h2>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormGroup label="Nome Completo" className="md:col-span-2">
                        <input type="text" value={data.nome} onChange={update("nome")} placeholder="NOME COMPLETO DO CONDUTOR" className="uppercase" />
                      </FormGroup>
                      <FormGroup label="CPF">
                        <input type="text" value={data.cpf} onChange={update("cpf")} placeholder="000.000.000-00" />
                      </FormGroup>
                      <FormGroup label="Sexo">
                        <select value={data.sexo} onChange={update("sexo")}>
                          <option value="">ESCOLHA</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Feminino">Feminino</option>
                        </select>
                      </FormGroup>
                      <FormGroup label="RG">
                        <input type="text" value={data.rg} onChange={update("rg")} placeholder="NÚMERO DO RG" />
                      </FormGroup>
                      <FormGroup label="Órgão Emissor">
                        <input type="text" value={data.orgaoEmissor} onChange={update("orgaoEmissor")} placeholder="Ex: SSP" className="uppercase" />
                      </FormGroup>
                      <FormGroup label="UF RG">
                        <input type="text" value={data.ufRG} onChange={update("ufRG")} maxLength={2} placeholder="UF" className="uppercase" />
                      </FormGroup>
                      <FormGroup label="Nacionalidade">
                        <input type="text" value={data.nacionalidade} onChange={update("nacionalidade")} className="uppercase" />
                      </FormGroup>
                      <FormGroup label="Data Nascimento">
                        <input type="date" value={data.dataNascimento} onChange={update("dataNascimento")} />
                      </FormGroup>
                      <FormGroup label="Local Nascimento">
                        <input type="text" value={data.localNascimento} onChange={update("localNascimento")} placeholder="CIDADE" className="uppercase" />
                      </FormGroup>
                      <FormGroup label="UF Nasc.">
                        <input type="text" value={data.ufNascimento} onChange={update("ufNascimento")} maxLength={2} placeholder="UF" className="uppercase" />
                      </FormGroup>
                      <FormGroup label="Nome do Pai">
                        <input type="text" value={data.nomePai} onChange={update("nomePai")} className="uppercase" />
                      </FormGroup>
                      <FormGroup label="Nome da Mãe">
                        <input type="text" value={data.nomeMae} onChange={update("nomeMae")} className="uppercase" />
                      </FormGroup>
                   </div>
                </div>
              )}

              {/* ABA: CNH */}
              {activeTab === "documento" && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="flex items-center gap-2 mb-8 border-b-2 border-dashed border-blue-100 dark:border-blue-900/30 pb-4">
                      <Layout className="text-blue-500" size={24} />
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">2. Dados da CNH</h2>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormGroup label="Nº Registro" autoBtn={handleAutoRegistro}>
                        <input type="text" value={data.registro} onChange={update("registro")} maxLength={11} />
                      </FormGroup>
                      <FormGroup label="Nº CNH (Espelho)" autoBtn={handleAutoEspelho}>
                        <input type="text" value={data.espelho} onChange={update("espelho")} maxLength={10} />
                      </FormGroup>
                      <FormGroup label="Categoria">
                        <input type="text" value={data.categoria} onChange={update("categoria")} className="uppercase" placeholder="Ex: AB" />
                      </FormGroup>
                      <FormGroup label="Tipo">
                        <select value={data.tipo} onChange={update("tipo")}>
                          <option value="Definitiva">Definitiva</option>
                          <option value="Permissão">Permissão</option>
                        </select>
                      </FormGroup>
                      <FormGroup label="Emissão">
                        <input type="date" value={data.dataEmissao} onChange={update("dataEmissao")} />
                      </FormGroup>
                      <FormGroup label="Validade">
                        <input type="date" value={data.validade} onChange={update("validade")} />
                      </FormGroup>
                      <FormGroup label="1ª Habilitação">
                        <input type="date" value={data.primeiraHabilitacao} onChange={update("primeiraHabilitacao")} />
                      </FormGroup>
                      <FormGroup label="Local Emissão">
                        <input type="text" value={data.localEmissao} onChange={update("localEmissao")} className="uppercase" />
                      </FormGroup>
                      <FormGroup label="UF Emissão">
                        <input type="text" value={data.ufEmissao} onChange={update("ufEmissao")} maxLength={2} className="uppercase" placeholder="UF" />
                      </FormGroup>
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                         <FormGroup label="Ass. Digital 1 (Segurança)" autoBtn={handleAutoAss1}>
                           <input type="text" value={data.assDigital1} onChange={update("assDigital1")} />
                         </FormGroup>
                         <FormGroup label="Ass. Digital 2 (Renach)" autoBtn={handleAutoAss2}>
                           <input type="text" value={data.assDigital2} onChange={update("assDigital2")} placeholder="UF + 8 DÍGITOS" />
                         </FormGroup>
                      </div>
                   </div>
                </div>
              )}

              {/* ABA: FINALIZAÇÃO (FOTOS) */}
              {activeTab === "finalizacao" && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="flex items-center gap-2 mb-8 border-b-2 border-dashed border-blue-100 dark:border-blue-900/30 pb-4">
                      <Camera className="text-blue-500" size={24} />
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">3. Fotos e Finalização</h2>
                   </div>
                   
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      {/* Coluna Foto */}
                      <div className="space-y-6">
                        <div className="flex flex-col gap-3">
                           <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <Upload size={14} /> FOTO DO ROSTO (3X4)
                           </label>
                           <div className="relative group">
                              <input type="file" accept="image/*" onChange={handleFotoUpload} className="hidden" id="file-foto" />
                              <label htmlFor="file-foto" className="block w-full h-[450px] bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer hover:border-blue-500 transition-all relative">
                                 {data.fotoUrl ? (
                                   <div className="w-full h-full relative flex items-center justify-center bg-white">
                                      <div style={{ width: "300px", height: "400px", overflow: "hidden", position: "relative", backgroundColor: "#fff" }}>
                                        <img src={data.fotoUrl} alt="Foto" style={{ 
                                          width: "100%", 
                                          height: "100%", 
                                          objectFit: "cover",
                                          transform: `scale(${data.fotoScale}) translate(${data.fotoOffsetX}px, ${data.fotoOffsetY}px)`
                                        }} />
                                      </div>
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                         <span className="text-white font-black text-xs uppercase tracking-widest bg-blue-600 px-4 py-2 rounded-full">Trocar Foto</span>
                                      </div>
                                   </div>
                                 ) : (
                                   <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                      <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                                         <Upload size={24} className="text-blue-500" />
                                      </div>
                                      <span className="text-xs font-bold text-slate-400">CLIQUE PARA SUBIR (3X4)</span>
                                   </div>
                                 )}
                              </label>
                           </div>

                           {data.fotoUrl && (
                             <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                                <div className="flex items-center justify-between">
                                   <span className="text-[10px] font-black text-slate-400 uppercase">Ajustes de Enquadramento</span>
                                   <button onClick={() => setData(d => ({ ...d, fotoScale: 1.1, fotoOffsetX: 0, fotoOffsetY: 0 }))} className="text-blue-500 text-[10px] font-bold uppercase hover:underline">Resetar</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <ControlGroup label="Zoom">
                                      <button onClick={() => adjustMedia("fotoScale", -0.05)} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm"><ZoomOut size={14}/></button>
                                      <span className="text-[10px] font-black min-w-[40px] text-center">{(data.fotoScale || 1).toFixed(2)}x</span>
                                      <button onClick={() => adjustMedia("fotoScale", 0.05)} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm"><ZoomIn size={14}/></button>
                                   </ControlGroup>
                                   <ControlGroup label="Vertical">
                                      <button onClick={() => adjustMedia("fotoOffsetY", -5)} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm"><ArrowLeft className="rotate-90" size={14}/></button>
                                      <button onClick={() => adjustMedia("fotoOffsetY", 5)} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm"><ArrowLeft className="-rotate-90" size={14}/></button>
                                   </ControlGroup>
                                </div>
                                <button onClick={() => removeBackground(data.fotoUrl).then(url => setData(d => ({...d, fotoUrl: url})))} className="w-full py-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2">
                                   <Trash2 size={14} /> Remover Fundo (Filtro PNG)
                                </button>
                             </div>
                           )}
                        </div>
                      </div>

                      {/* Coluna Assinatura */}
                      <div className="space-y-6">
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-6 rounded-[2rem]">
                           <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Type size={14}/> Gerar por Texto</h4>
                           <div className="space-y-4">
                              <select value={assEstilo} onChange={(e) => setAssEstilo(parseInt(e.target.value))} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold outline-none">
                                {ESTILOS_ASS.map((e, i) => <option key={i} value={i}>{e.label}</option>)}
                              </select>
                              <div className="flex gap-2">
                                <input type="text" value={assTexto} onChange={(e) => setAssTexto(e.target.value)} placeholder="Digite o nome..." className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs outline-none focus:ring-2 ring-blue-500/20" />
                                <button onClick={gerarAssinaturaTexto} className="bg-emerald-500 text-white px-5 rounded-xl font-black text-[10px] uppercase hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">Gerar</button>
                              </div>
                           </div>
                        </div>

                        <div className="flex flex-col gap-3">
                           <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <PenTool size={14} /> OU ENVIE FOTO DA ASSINATURA
                           </label>
                           <div className="relative group">
                              <input type="file" accept="image/*" onChange={handleAssinaturaUpload} className="hidden" id="file-ass" />
                              <label htmlFor="file-ass" className="block w-full h-[120px] bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer hover:border-blue-500 transition-all relative">
                                 {data.assinaturaUrl ? (
                                   <div className="w-full h-full flex items-center justify-center p-4 bg-white">
                                      <img src={data.assinaturaUrl} alt="Ass" style={{ 
                                        height: "100%", 
                                        objectFit: "contain",
                                        transform: `scale(${data.assScale}) translate(${data.assOffsetX}px, ${data.assOffsetY}px)`,
                                        filter: "contrast(1.5) brightness(0.8)"
                                      }} />
                                   </div>
                                 ) : (
                                   <div className="w-full h-full flex items-center justify-center gap-3">
                                      <Upload size={18} className="text-slate-300" />
                                      <span className="text-[10px] font-bold text-slate-300 tracking-widest">SUBIR ARQUIVO</span>
                                   </div>
                                 )}
                              </label>
                           </div>
                           
                           {data.assinaturaUrl && (
                             <ControlGroup label="Ajustar Assinatura" className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <button onClick={() => adjustMedia("assScale", -0.05)} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm"><ZoomOut size={12}/></button>
                                <span className="text-[9px] font-black">Zoom</span>
                                <button onClick={() => adjustMedia("assScale", 0.05)} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm"><ZoomIn size={12}/></button>
                                <div className="w-px h-6 bg-slate-200 mx-2" />
                                <button onClick={() => adjustMedia("assOffsetY", -2)} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm"><ArrowLeft className="rotate-90" size={12}/></button>
                                <button onClick={() => adjustMedia("assOffsetY", 2)} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm"><ArrowLeft className="-rotate-90" size={12}/></button>
                             </ControlGroup>
                           )}
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4">
                           <FormGroup label="Senha App Cliente">
                             <input type="text" value={data.senhaApp} onChange={update("senhaApp")} placeholder="Ex: 1234" />
                           </FormGroup>
                           <FormGroup label="Observações (EAR / Toxicológico)">
                             <textarea value={data.observacoes} onChange={update("observacoes")} rows={3} placeholder="Digite as observações..." />
                           </FormGroup>
                        </div>
                      </div>
                   </div>
                </div>
              )}

              <div className="h-40" /> {/* Spacer */}
            </div>
          </main>
        </div>

        {/* Footer de Ação Fixo */}
        {!saved && (
          <div className="fixed bottom-0 left-0 right-0 h-24 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-10 flex items-center justify-between z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80">
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Custo da Emissão</span>
               <span className="text-xl font-black text-[#005CA9] tracking-tight">R$ 18,00</span>
            </div>
            <button 
              onClick={handleRequestEmit} 
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center gap-3 disabled:opacity-50"
            >
              {loading ? "PROCESSANDO..." : <><Save size={20} /> EMITIR CNH</>}
            </button>
          </div>
        )}

        {/* Canvas Oculto para Renderização 1:1 */}
        <div style={{ position: "absolute", left: "-9999px", opacity: 0 }}>
          <CNHDocument ref={docRef} {...data} codigoQR={saved ? codigoQR : "PREVIEW"} blurred={!saved} />
        </div>
      </div>

      <RequiredFieldsModal
        isOpen={showRequiredModal}
        onClose={() => setShowRequiredModal(false)}
        missingFields={missingFields}
        onConfirm={() => {
          setShowRequiredModal(false);
          setShowConfirmModal(true);
        }}
      />

      <EmissionModal
        docLabel="CNH Digital" docEmoji="🚗" documentPrice={1800} userBalance={user?.balance ?? 0}
        showConfirm={showConfirmModal} showSuccess={showSuccessModal} isEmitting={loading} isDownloading={isDownloading}
        onConfirm={handleSave} onCancel={() => setShowConfirmModal(false)}
        onDownload={async () => { setIsDownloading(true); await handleExportPdf(); setIsDownloading(false); }}
        onClose={() => setShowSuccessModal(false)} historyPath="/cnhsalvas"
        isFree={user?.role === 'admin' || (Array.isArray(user?.free_documents) && user.free_documents.includes('cnh'))}
      />
    </DashboardLayout>
  );
}

// ─── Sub-componentes Locais ──────────────────────────────────────────────────
function FormGroup({ label, children, className = "", autoBtn }: { label: string; children: React.ReactNode; className?: string; autoBtn?: () => void }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</label>
        {autoBtn && <button onClick={autoBtn} className="text-[9px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md hover:bg-emerald-500 hover:text-white transition-all uppercase">Auto</button>}
      </div>
      <div className="relative group">
        {React.cloneElement(children as React.ReactElement, {
          className: `w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-[#005CA9]/20 focus:border-[#005CA9] transition-all ${(children as any).props.className || ""}`
        })}
      </div>
    </div>
  );
}

function ControlGroup({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
       <div className="flex items-center gap-2">
          {children}
       </div>
    </div>
  );
}
