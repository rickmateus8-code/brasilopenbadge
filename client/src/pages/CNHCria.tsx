/**
 * CNHCria — Formulário de criação de CNH Digital
 *
 * Layout visual idêntico ao elitedoc.store/cnhcria:
 * - Single column (sem preview lateral)
 * - Inputs com border tracejada em vermelho/laranja
 * - Botão SALVAR DOCUMENTO flutuante no bottom
 * - Seções com dividers (border-bottom)
 * - Canvas oculto (ghostCanvas) para geração da imagem
 * - Após emissão: botões de download JPEG + WhatsApp
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import DashboardLayout from "../components/DashboardLayout";
import CNHDocument, { type CNHDocumentHandle, type CNHDocumentProps } from "../components/CNHDocument";
import { toast } from "sonner";
import { getQRCodeCNH } from "@/config.qrcode";
import { validarCPF, displayDateToHtml } from "@/lib/utils";
import EmissionModal from "@/components/EmissionModal";
import {
  ArrowLeft, Save, Download, MessageCircle, Copy, Zap,
  Upload, Type, AlertCircle
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

// ─── Componente ──────────────────────────────────────────────────────────────
export default function CNHCria() {
  const { user, updateBalance } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [, setLocation] = useLocation();
  const docRef = useRef<CNHDocumentHandle>(null);

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [codigoQR, setCodigoQR] = useState("");
  const [importText, setImportText] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isApplyingAI, setIsApplyingAI] = useState(false);
  const [documentPrice, setDocumentPrice] = useState(0);

  const [data, setData] = useState<CNHDocumentProps>({
    nome: "", cpf: "", rg: "", orgaoEmissor: "", ufRG: "",
    sexo: "", nacionalidade: "BRASILEIRO(A)", dataNascimento: "",
    localNascimento: "", ufNascimento: "", nomePai: "", nomeMae: "",
    categoria: "", tipo: "Definitiva", registro: "", espelho: "",
    validade: "", validadeCNH2: "", dataEmissao: "", primeiraHabilitacao: "",
    localEmissao: "", ufEmissao: "", assDigital1: "", assDigital2: "",
    senhaApp: "", observacoes: "", fotoUrl: "", assinaturaUrl: "",
    codigoQR: "PREVIEW", blurred: true,
  });

  const update = useCallback((field: keyof CNHDocumentProps) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let val = e.target.value;
    if (field === "cpf") val = formatarCPFInput(val);
    if (field === "rg") val = val.replace(/\./g, "");
    setData(d => ({ ...d, [field]: val }));
  }, []);

  const handleAutoRegistro = () => setData(d => ({ ...d, registro: gerarNumero(11) }));
  const handleAutoEspelho = () => setData(d => ({ ...d, espelho: gerarNumero(10) }));
  const handleAutoAss1 = () => setData(d => ({ ...d, assDigital1: gerarNumero(10) }));
  const handleAutoAss2 = () => {
    const uf = data.ufEmissao || "SP";
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
    const autoAss2 = get("Ass\\.? Digital 2") || (ufEmissaoVal + gerarNumero(8));
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
  };

  const compressImage = (dataUrl: string, maxW = 400, maxH = 500, quality = 0.7, preserveTransparency = false): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        if (preserveTransparency) {
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/png'));
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      };
      img.src = dataUrl;
    });
  };

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result as string);
      setData(d => ({ ...d, fotoUrl: compressed }));
    };
    reader.readAsDataURL(file);
  };

  const applyImageAdjustments = (base64: string, brightness: number, contrast: number, saturation: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.filter = `brightness(${1 + brightness/100}) contrast(${1 + contrast/100}) saturate(${1 + saturation/100})`;
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.src = base64;
    });
  };

  const handleApplyAI = async () => {
    if (!data.fotoUrl) { toast.error("Envie uma foto primeiro!"); return; }
    setIsApplyingAI(true);
    try {
      const res = await fetch("/api/cnh-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: data.fotoUrl }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (result?.success && result?.imageUrl) {
        const adj = result.adjustments || { brightness: 5, contrast: 10, saturation: -5 };
        const adjustedImage = await applyImageAdjustments(result.imageUrl, adj.brightness, adj.contrast, adj.saturation);
        setData(d => ({ ...d, fotoUrl: adjustedImage }));
        toast.success(`Ajustes visuais aplicados!`);
      } else {
        toast.error(result?.error || "Erro ao aplicar ajustes");
      }
    } catch (err) {
      console.error("AI error:", err);
      toast.error("Erro ao processar ajustes.");
    } finally {
      setIsApplyingAI(false);
    }
  };

  const handleAssinaturaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result as string, 500, 150, 0.8, true);
      setData(d => ({ ...d, assinaturaUrl: compressed }));
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
    if (!data.nome || !data.cpf) { toast.error("Preencha Nome e CPF!"); return; }
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
        body: JSON.stringify({ ...data, type: "cnh" }),
      });
      const result = await res.json();
      if (result.success) {
        const codigo = result.data?.codigoValidacao || result.data?.codigo_validacao || result.data?.id || "CNH-" + Date.now();
        setCodigoQR(codigo);
        setData(d => ({ ...d, codigoQR: codigo, blurred: false }));
        setSaved(true);
        setShowConfirmModal(false);
        setShowSuccessModal(true);
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
      <style>{`
        .cnh-form {
          font-family: 'Inter', sans-serif;
          background: ${isDark ? "#0f172a" : "#ffffff"};
          color: ${isDark ? "#f1f5f9" : "#1e293b"};
          padding: 24px;
          padding-bottom: 120px;
          width: 100vw;
          height: 100vh;
          box-sizing: border-box;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9999;
          overflow-y: auto;
        }
        .cnh-header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          border-bottom: 2px solid #005CA9;
          padding-bottom: 12px;
        }
        .cnh-header-top h1 {
          font-size: 20px;
          font-weight: 800;
          margin: 0;
          color: #005CA9;
        }
        .cnh-header-top h1 span.brand-black { color: ${isDark ? "#f1f5f9" : "#1e293b"}; }
        .cnh-header-top h1 span.brand-blue { color: #005CA9; }
        .cnh-divider {
          padding: 10px 0;
          font-size: 11px;
          text-transform: uppercase;
          color: ${isDark ? "#94a3b8" : "#64748b"};
          font-weight: 700;
          border-bottom: 1px solid ${isDark ? "#1e293b" : "#e2e8f0"};
          margin: 25px 0 15px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cnh-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }
        .cnh-form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .cnh-form-group label {
          font-size: 12px;
          font-weight: 600;
          color: ${isDark ? "#94a3b8" : "#64748b"};
        }
        .cnh-form-group input,
        .cnh-form-group select,
        .cnh-form-group textarea {
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid ${isDark ? "#334155" : "#cbd5e1"};
          background: ${isDark ? "#1e293b" : "#ffffff"};
          color: ${isDark ? "#f1f5f9" : "#0f172a"};
          outline: none;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .cnh-form-group input:focus,
        .cnh-form-group select:focus,
        .cnh-form-group textarea:focus {
          border-color: #005CA9;
          box-shadow: 0 0 0 2px rgba(0, 92, 169, 0.1);
        }
        .cnh-form-group textarea {
          resize: vertical;
          min-height: 60px;
        }
        .cnh-badge-auto {
          font-size: 9px;
          background: #059669;
          color: white;
          padding: 3px 8px;
          border-radius: 4px;
          cursor: pointer;
          border: none;
          font-weight: 700;
          margin-left: 5px;
        }
        .cnh-import-box {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          padding: 16px;
          border: 1px solid ${isDark ? "#334155" : "#e2e8f0"};
          border-radius: 12px;
          background: ${isDark ? "#1e293b" : "#f8fafc"};
          margin-bottom: 16px;
        }
        .cnh-import-box .import-col h3 {
          font-size: 12px;
          font-weight: 600;
          color: ${isDark ? "#94a3b8" : "#64748b"};
          margin: 0 0 8px 0;
        }
        .cnh-import-box .modelo-text {
          font-family: monospace;
          font-size: 11px;
          color: ${isDark ? "#94a3b8" : "#475569"};
          background: ${isDark ? "#0f172a" : "#ffffff"};
          border: 1px solid ${isDark ? "#334155" : "#e2e8f0"};
          border-radius: 8px;
          padding: 10px;
          height: 160px;
          overflow: auto;
          white-space: pre-wrap;
          margin-bottom: 8px;
        }
        .cnh-import-box textarea {
          width: 100%;
          height: 160px;
          padding: 10px;
          border: 1px solid ${isDark ? "#334155" : "#e2e8f0"};
          border-radius: 8px;
          background: ${isDark ? "#0f172a" : "#ffffff"};
          font-size: 12px;
          color: ${isDark ? "#f1f5f9" : "#0f172a"};
          margin-bottom: 8px;
          resize: none;
        }
        .cnh-btn-copiar, .cnh-btn-processar {
          width: 100%;
          padding: 10px;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: white;
        }
        .cnh-btn-copiar { background: #f59e0b; }
        .cnh-btn-processar { background: #005CA9; }
        .cnh-fotos-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          align-items: start;
        }
        .cnh-preview-box {
          margin-top: 10px;
          border: 1px solid ${isDark ? "#334155" : "#e2e8f0"};
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: ${isDark ? "#0f172a" : "#f1f5f9"};
        }
        .cnh-preview-rosto { width: 150px; height: 200px; }
        .cnh-preview-ass { width: 100%; height: 60px; }
        .cnh-ass-option { padding: 10px; border-radius: 8px; margin-bottom: 10px; }
        .cnh-ass-option.green {
          background: ${isDark ? "#1a2e1a" : "#f0fdf4"};
          border: 1px solid ${isDark ? "#22c55e33" : "#bbf7d0"};
        }
        .cnh-ass-option.blue {
          background: ${isDark ? "#1a1e2e" : "#eff6ff"};
          border: 1px solid ${isDark ? "#3b82f633" : "#bfdbfe"};
        }
        .cnh-ass-option h4 { font-size: 12px; font-weight: 600; margin: 0 0 6px 0; display: flex; align-items: center; gap: 5px; }
        .cnh-ass-option.green h4 { color: ${isDark ? "#4ade80" : "#15803d"}; }
        .cnh-ass-option.blue h4 { color: ${isDark ? "#60a5fa" : "#1d4ed8"}; }
        .cnh-floating-save {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 500px;
          background: #059669;
          color: white;
          padding: 15px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: bold;
          box-shadow: 0 10px 25px -5px rgba(5, 150, 105, 0.4);
          border: none;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          z-index: 10000;
        }
        .cnh-result-box {
          padding: 20px;
          background: ${isDark ? "#1a2e1a" : "#f0fdf4"};
          border: 1px solid ${isDark ? "#22c55e44" : "#bbf7d0"};
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .cnh-btn-download {
          padding: 10px 20px; background: #005CA9; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;
        }
        .cnh-btn-whatsapp {
          padding: 10px 20px; background: #25D366; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;
        }
        .cnh-btn-voltar {
          background: transparent; color: ${isDark ? "#94a3b8" : "#64748b"}; border: 1px solid ${isDark ? "#334155" : "#e2e8f0"}; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 5px;
        }
        .cnh-file-label {
          display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid ${isDark ? "#334155" : "#cbd5e1"}; border-radius: 8px; cursor: pointer; font-size: 12px; background: ${isDark ? "#1e293b" : "#ffffff"};
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="cnh-form">
        <div className="cnh-header-top">
          <h1>
            (Criação de CNH) <span className="brand-black">DOCMASTER</span><span className="brand-blue">.STORE</span>
          </h1>
          <button className="cnh-btn-voltar" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft size={14} /> Voltar
          </button>
        </div>

        {(user?.balance || 0) <= 0 && (
          <div style={{ padding: 12, background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 10, marginBottom: 20, color: "#991b1b", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={18} />
            Saldo insuficiente. <button onClick={() => setLocation("/recargas")} style={{ fontWeight: 700, textDecoration: "underline", background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>Recarregue aqui</button>
          </div>
        )}

        {saved && (
          <div className="cnh-result-box">
            <h3 style={{ color: isDark ? "#4ade80" : "#15803d", fontWeight: 700 }}>CNH Digital emitida com sucesso!</h3>
            <p style={{ color: isDark ? "#86efac" : "#166534", fontSize: 13 }}>Código: <strong style={{ fontFamily: "monospace" }}>{codigoQR}</strong></p>
            <p style={{ color: isDark ? "#86efac" : "#166534", fontSize: 13 }}>Validação: <strong>{getQRCodeCNH(codigoQR)}</strong></p>
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <button className="cnh-btn-download" onClick={handleExportPdf} disabled={loading}>
                <Download size={14} /> Baixar PDF
              </button>
              <button className="cnh-btn-download" onClick={handleExportJPEG} disabled={loading} style={{ background: "#6b7280" }}>
                <Download size={14} /> Baixar JPEG
              </button>
              <button className="cnh-btn-whatsapp" onClick={handleWhatsApp}>
                <MessageCircle size={14} /> Enviar WhatsApp
              </button>
            </div>
          </div>
        )}

        <div className="cnh-divider">✏️ IMPORTAÇÃO E MODELO</div>
        <div className="cnh-import-box">
          <div className="import-col">
            <h3>1. Envie para o Cliente</h3>
            <div className="modelo-text">{MODELO_TEXTO}</div>
            <button className="cnh-btn-copiar" onClick={handleCopiarModelo}>
              <Copy size={12} /> COPIAR MODELO
            </button>
          </div>
          <div className="import-col">
            <h3>2. Cole o texto preenchido</h3>
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Cole aqui..." />
            <button className="cnh-btn-processar" onClick={handleProcessarImportacao}>
              <Zap size={12} /> PROCESSAR DADOS
            </button>
          </div>
        </div>

        <div className="cnh-divider">👤 1. DADOS PESSOAIS</div>
        <div className="cnh-form-grid">
          <div className="cnh-form-group" style={{ gridColumn: "span 2" }}><label>Nome Completo</label><input type="text" value={data.nome} onChange={update("nome")} /></div>
          <div className="cnh-form-group"><label>CPF</label><input type="text" value={data.cpf} onChange={update("cpf")} placeholder="000.000.000-00" /></div>
          <div className="cnh-form-group"><label>Sexo</label>
            <select value={data.sexo} onChange={update("sexo")}>
              <option value="">ESCOLHA</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option>
            </select>
          </div>
        </div>

        <div className="cnh-form-grid">
          <div className="cnh-form-group"><label>RG</label><input type="text" value={data.rg} onChange={update("rg")} /></div>
          <div className="cnh-form-group"><label>Orgão Emissor</label><input type="text" value={data.orgaoEmissor} onChange={update("orgaoEmissor")} /></div>
          <div className="cnh-form-group"><label>UF RG</label><input type="text" value={data.ufRG} onChange={update("ufRG")} maxLength={2} style={{ textTransform: "uppercase" }} /></div>
        </div>

        <div className="cnh-form-grid">
          <div className="cnh-form-group"><label>Nacionalidade</label><input type="text" value={data.nacionalidade} onChange={update("nacionalidade")} /></div>
          <div className="cnh-form-group"><label>Data Nascimento</label><input type="date" value={data.dataNascimento} onChange={update("dataNascimento")} /></div>
          <div className="cnh-form-group"><label>Local Nascimento</label><input type="text" value={data.localNascimento} onChange={update("localNascimento")} /></div>
          <div className="cnh-form-group"><label>UF Nasc.</label><input type="text" value={data.ufNascimento} onChange={update("ufNascimento")} maxLength={2} style={{ textTransform: "uppercase" }} /></div>
        </div>

        <div className="cnh-divider">🪪 2. DADOS DA CNH</div>
        <div className="cnh-form-grid">
          <div className="cnh-form-group"><label>Nº Registro <button className="cnh-badge-auto" onClick={handleAutoRegistro}>AUTO</button></label><input type="text" value={data.registro} onChange={update("registro")} /></div>
          <div className="cnh-form-group"><label>Nº CNH (Espelho) <button className="cnh-badge-auto" onClick={handleAutoEspelho}>AUTO</button></label><input type="text" value={data.espelho} onChange={update("espelho")} /></div>
          <div className="cnh-form-group"><label>Categoria</label><input type="text" value={data.categoria} onChange={update("categoria")} style={{ textTransform: "uppercase" }} /></div>
          <div className="cnh-form-group"><label>Tipo</label>
            <select value={data.tipo} onChange={update("tipo")}><option value="Definitiva">Definitiva</option><option value="Permissão">Permissão</option></select>
          </div>
        </div>

        <div className="cnh-form-grid">
          <div className="cnh-form-group"><label>Validade</label><input type="date" value={data.validade} onChange={update("validade")} /></div>
          <div className="cnh-form-group"><label>Emissão</label><input type="date" value={data.dataEmissao} onChange={update("dataEmissao")} /></div>
          <div className="cnh-form-group"><label>1ª Habilitação</label><input type="date" value={data.primeiraHabilitacao} onChange={update("primeiraHabilitacao")} /></div>
        </div>

        <div className="cnh-divider">🔒 3. CÓDIGO DE SEGURANÇA</div>
        <div className="cnh-form-grid">
          <div className="cnh-form-group"><label>Ass. Digital 1 <button className="cnh-badge-auto" onClick={handleAutoAss1}>AUTO</button></label><input type="text" value={data.assDigital1} onChange={update("assDigital1")} /></div>
          <div className="cnh-form-group"><label>Ass. Digital 2 <button className="cnh-badge-auto" onClick={handleAutoAss2}>AUTO</button></label><input type="text" value={data.assDigital2} onChange={update("assDigital2")} /></div>
        </div>

        <div className="cnh-divider">📷 4. FOTOS E ASSINATURA</div>
        <div className="cnh-fotos-grid">
          <div>
            <label className="cnh-file-label"><Upload size={14} /> Foto do Rosto<input type="file" accept="image/*" onChange={handleFotoUpload} style={{ display: "none" }} /></label>
            <div className="cnh-preview-box cnh-preview-rosto">
              {data.fotoUrl ? <img src={data.fotoUrl} alt="Rosto" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 12 }}>Prévia</span>}
            </div>
            {data.fotoUrl && (
              <button onClick={handleApplyAI} disabled={isApplyingAI} style={{ marginTop: 8, width: "100%", padding: 10, background: "linear-gradient(135deg, #8b5cf6, #a855f7)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: isApplyingAI ? "not-allowed" : "pointer" }}>
                {isApplyingAI ? "Processando..." : "Aplicar Ajustes IA"}
              </button>
            )}
          </div>
          <div>
            <div className="cnh-ass-option green">
              <h4><Type size={12} /> Digitar Nome</h4>
              <select value={assEstilo} onChange={(e) => setAssEstilo(parseInt(e.target.value))} style={{ width: "100%", padding: 6, marginBottom: 6, borderRadius: 6, background: isDark ? "#1e293b" : "#fff", color: isDark ? "#fff" : "#000", border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}` }}>
                {ESTILOS_ASS.map((e, i) => <option key={i} value={i}>{e.label}</option>)}
              </select>
              <div style={{ display: "flex", gap: 6 }}>
                <input type="text" value={assTexto} onChange={(e) => setAssTexto(e.target.value)} placeholder="Nome..." style={{ flex: 1, padding: 6, borderRadius: 6, background: isDark ? "#1e293b" : "#fff", color: isDark ? "#fff" : "#000", border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}` }} />
                <button onClick={gerarAssinaturaTexto} style={{ background: "#22c55e", color: "white", border: "none", borderRadius: 6, padding: "0 10px" }}>Gerar</button>
              </div>
            </div>
            <div className="cnh-ass-option blue">
              <h4><Upload size={12} /> Enviar Foto</h4>
              <label className="cnh-file-label"><Upload size={14} /> Foto Assinatura<input type="file" accept="image/*" onChange={handleAssinaturaUpload} style={{ display: "none" }} /></label>
            </div>
            <div className="cnh-preview-box cnh-preview-ass">
              {data.assinaturaUrl ? <img src={data.assinaturaUrl} alt="Ass" style={{ height: "40px", objectFit: "contain" }} /> : <span style={{ fontSize: 12 }}>Assinatura</span>}
            </div>
          </div>
        </div>

        <div className="cnh-divider">ACESSO</div>
        <div className="cnh-form-grid">
          <div className="cnh-form-group"><label>Senha App Cliente</label><input type="text" value={data.senhaApp} onChange={update("senhaApp")} /></div>
          <div className="cnh-form-group" style={{ gridColumn: "span 2" }}><label>Observações (EAR)</label><textarea value={data.observacoes} onChange={update("observacoes")} placeholder="Observações..." /></div>
        </div>

        <div style={{ position: "absolute", left: "-9999px", opacity: 0 }}><CNHDocument ref={docRef} {...data} codigoQR={saved ? codigoQR : "PREVIEW"} blurred={!saved} /></div>

        {!saved && (
          <button className="cnh-floating-save" onClick={handleRequestEmit} disabled={loading}>
            {loading ? "Gerando..." : <><Save size={18} /> EMITIR CNH</>}
          </button>
        )}
      </div>

      <EmissionModal
        docLabel="CNH Digital" docEmoji="🚗" documentPrice={documentPrice} userBalance={user?.balance ?? 0}
        showConfirm={showConfirmModal} showSuccess={showSuccessModal} isEmitting={loading} isDownloading={isDownloading}
        onConfirm={handleSave} onCancel={() => setShowConfirmModal(false)}
        onDownload={async () => { setIsDownloading(true); await handleExportPdf(); setIsDownloading(false); }}
        onClose={() => setShowSuccessModal(false)} historyPath="/cnhsalvas"
      />
    </DashboardLayout>
  );
}
