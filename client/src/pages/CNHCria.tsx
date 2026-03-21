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
import DashboardLayout from "../components/DashboardLayout";
import CNHDocument, { type CNHDocumentHandle, type CNHDocumentProps } from "../components/CNHDocument";
import { toast } from "sonner";
import { getQRCodeCNH } from "@/config.qrcode";
import { validarCPF, formatarCPF as formatarCPFUtil, formatarRG, displayDateToHtml } from "@/lib/utils";
import {
  ArrowLeft, Save, Download, MessageCircle, Copy, Zap,
  Upload, Type, Lock, AlertCircle, Car
} from "lucide-react";

// ─── Constantes ──────────────────────────────────────────────────────────────
const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

const MODELO_TEXTO = `Nome Completo: 
CPF: 
Sexo: 
RG: 
Orgão Emissor: 
UF RG: 
Nacionalidade: BRASILEIRA
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
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const docRef = useRef<CNHDocumentHandle>(null);

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [codigoQR, setCodigoQR] = useState("");
  const [importText, setImportText] = useState("");

  const [data, setData] = useState<CNHDocumentProps>({
    nome: "", cpf: "", rg: "", orgaoEmissor: "", ufRG: "",
    sexo: "", nacionalidade: "BRASILEIRA", dataNascimento: "",
    localNascimento: "", ufNascimento: "", nomePai: "", nomeMae: "",
    categoria: "", tipo: "Definitiva", registro: "", espelho: "",
    validade: "", validadeCNH2: "", dataEmissao: "", primeiraHabilitacao: "",
    localEmissao: "", ufEmissao: "", assDigital1: "", assDigital2: "",
    senhaApp: "", observacoes: "", fotoUrl: "", assinaturaUrl: "",
    codigoQR: "PREVIEW", blurred: true,
  });

  // Atualizar campo genérico
  const update = useCallback((field: keyof CNHDocumentProps) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let val = e.target.value;
    if (field === "cpf") val = formatarCPFInput(val);
    if (field === "rg") val = val.replace(/\./g, ""); // RG sem pontos, apenas números
    setData(d => ({ ...d, [field]: val }));
  }, []);

  // ─── AUTO Generators ──────────────────────────────────────────────────────
  const handleAutoRegistro = () => setData(d => ({ ...d, registro: gerarNumero(11) }));
  const handleAutoEspelho = () => setData(d => ({ ...d, espelho: gerarNumero(10) }));
  const handleAutoAss1 = () => setData(d => ({ ...d, assDigital1: gerarNumero(10) }));
  const handleAutoAss2 = () => {
    const uf = data.ufEmissao || "SP";
    setData(d => ({ ...d, assDigital2: uf + gerarNumero(8) }));
  };

  // ─── Importação ────────────────────────────────────────────────────────────
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
    // Converter datas DD/MM/YYYY para YYYY-MM-DD (formato HTML date input)
    const convertDate = (val: string): string => {
      if (!val) return "";
      const trimmed = val.trim();
      // Se já está no formato YYYY-MM-DD, retorna direto
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      // Converte DD/MM/YYYY para YYYY-MM-DD
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
        return displayDateToHtml(trimmed);
      }
      return trimmed;
    };

    // RG: remover pontos, manter apenas números e letras
    const cleanRG = (val: string): string => val.replace(/\./g, "");

    setData(d => ({
      ...d,
      nome: get("Nome Completo") || d.nome,
      cpf: formatarCPFInput(get("CPF")) || d.cpf,
      sexo: get("Sexo") || d.sexo,
      rg: cleanRG(get("RG")) || d.rg,
      orgaoEmissor: get("Org[aã]o Emissor") || d.orgaoEmissor,
      ufRG: get("UF RG") || d.ufRG,
      nacionalidade: get("Nacionalidade") || d.nacionalidade || "BRASILEIRA",
      dataNascimento: convertDate(get("Data Nascimento")) || d.dataNascimento,
      localNascimento: get("Local Nascimento") || d.localNascimento,
      ufNascimento: get("UF Nasc") || d.ufNascimento,
      nomePai: get("Nome do Pai") || d.nomePai,
      nomeMae: get("Nome da M[aã]e") || d.nomeMae,
      categoria: get("Categoria") || d.categoria,
      tipo: get("Tipo") || d.tipo,
      validade: convertDate(get("Validade")) || d.validade,
      dataEmissao: convertDate(get("Emiss[aã]o")) || d.dataEmissao,
      primeiraHabilitacao: convertDate(get("1[ªa] Habilita[çc][aã]o")) || d.primeiraHabilitacao,
      localEmissao: get("Local Emiss[aã]o") || d.localEmissao,
      ufEmissao: get("UF Emiss[aã]o") || d.ufEmissao,
      senhaApp: get("Senha App") || d.senhaApp,
      observacoes: get("Observa[çc][oõ]es") || d.observacoes,
    }));
    toast.success("Dados importados!");
  };

  // ─── Foto Upload ───────────────────────────────────────────────────────────
  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setData(d => ({ ...d, fotoUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  // ─── Assinatura Upload ─────────────────────────────────────────────────────
  const handleAssinaturaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setData(d => ({ ...d, assinaturaUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  // ─── Assinatura por Texto ──────────────────────────────────────────────────
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
      fontSize -= 2;
      ctx.font = `${fontSize}px ${fonteSelecionada}`;
    }
    ctx.fillStyle = "black";
    ctx.textBaseline = "middle";
    ctx.fillText(assTexto, 20, 75);
    setData(d => ({ ...d, assinaturaUrl: cvs.toDataURL("image/png") }));
    toast.success("Assinatura gerada!");
  }, [assTexto, assEstilo]);

  // ─── Salvar Documento ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!data.nome || !data.cpf) {
      toast.error("Preencha Nome e CPF obrigatoriamente!");
      return;
    }
    // Validação de CPF universal
    if (!validarCPF(data.cpf)) {
      toast.error("CPF inválido! Verifique os dígitos informados.");
      return;
    }
    if ((user?.balance || 0) <= 0) {
      toast.error("Saldo insuficiente. Recarregue para emitir documentos.");
      return;
    }
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
        toast.success("CNH Digital emitida com sucesso!");
      } else {
        toast.error(result.error || "Erro ao gerar CNH");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  // ─── Exportar JPEG ─────────────────────────────────────────────────────────
  const handleExportJPEG = async () => {
    if (!docRef.current) return;
    setLoading(true);
    try {
      const blob = await docRef.current.exportAsBlob();
      if (!blob) throw new Error("Falha ao gerar imagem");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CNH_${data.nome.replace(/\s+/g, "_") || "DOCUMENTO"}_${Date.now()}.jpg`;
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

  // ─── WhatsApp Share ────────────────────────────────────────────────────────
  const handleWhatsApp = () => {
    const texto = encodeURIComponent(
      `*DocMaster - CNH Digital*\n\nOlá! Segue sua CNH Digital gerada pelo DocMaster.\n\nNome: ${data.nome}\nCPF: ${data.cpf}\nCategoria: ${data.categoria}\n\nAcesse o documento: ${getQRCodeCNH(codigoQR)}\n\nSenha App: ${data.senhaApp || "Não definida"}\n\n_Documento gerado por DocMaster_`
    );
    window.open(`https://wa.me/?text=${texto}`, "_blank");
  };

  // ─── Carregar Google Fonts para assinatura ─────────────────────────────────
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Caveat:wght@400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      {/* CSS tema escuro DocMaster */}
      <style>{`
        .cnh-form {
          font-family: 'Inter', sans-serif;
          background: #0f172a;
          color: #e2e8f0;
          padding: 24px;
          padding-bottom: 120px;
          width: 100%;
          max-width: 100%;
          min-height: 100vh;
          box-sizing: border-box;
        }
        .cnh-header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .cnh-header-top h1 {
          font-size: 20px;
          font-weight: 800;
          margin: 0;
        }
        .cnh-header-top h1 span.brand-black { color: #f1f5f9; }
        .cnh-header-top h1 span.brand-blue { color: #ef4444; }
        .cnh-divider {
          padding: 10px 0;
          font-size: 11px;
          text-transform: uppercase;
          color: #94a3b8;
          font-weight: 700;
          border-bottom: 1px solid #1e293b;
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
          color: #94a3b8;
        }
        .cnh-form-group input,
        .cnh-form-group select,
        .cnh-form-group textarea {
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #334155;
          background: #1e293b;
          color: #f1f5f9;
          outline: none;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.2s, background 0.2s;
        }
        .cnh-form-group input:focus,
        .cnh-form-group select:focus,
        .cnh-form-group textarea:focus {
          border-color: #ef4444;
          background: #1e293b;
        }
        .cnh-form-group textarea {
          resize: vertical;
          min-height: 60px;
        }
        .cnh-form-group .obs-textarea {
          border-color: #ef4444;
        }
        .cnh-badge-auto {
          font-size: 9px;
          background: #22c55e;
          color: white;
          padding: 3px 8px;
          border-radius: 4px;
          cursor: pointer;
          border: none;
          font-weight: 700;
          margin-left: 5px;
          transition: background 0.2s;
        }
        .cnh-badge-auto:hover {
          background: #16a34a;
        }
        .cnh-import-box {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          padding: 16px;
          border: 1px solid #334155;
          border-radius: 12px;
          background: #1e293b;
          margin-bottom: 16px;
        }
        .cnh-import-box .import-col h3 {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          margin: 0 0 8px 0;
        }
        .cnh-import-box .modelo-text {
          font-family: monospace;
          font-size: 11px;
          color: #94a3b8;
          background: #0f172a;
          border: 1px solid #334155;
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
          border: 1px solid #334155;
          border-radius: 8px;
          background: #0f172a;
          font-size: 12px;
          font-family: 'Inter', sans-serif;
          resize: none;
          outline: none;
          color: #f1f5f9;
          margin-bottom: 8px;
        }
        .cnh-import-box textarea:focus {
          border-color: #ef4444;
        }
        .cnh-btn-copiar {
          width: 100%;
          padding: 10px;
          background: linear-gradient(135deg, #f59e0b, #eab308);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: opacity 0.2s;
        }
        .cnh-btn-copiar:hover { opacity: 0.9; }
        .cnh-btn-processar {
          width: 100%;
          padding: 10px;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: opacity 0.2s;
        }
        .cnh-btn-processar:hover { opacity: 0.9; }
        .cnh-fotos-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          align-items: start;
        }
        .cnh-preview-box {
          margin-top: 10px;
          border: 1px solid #334155;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #1e293b;
        }
        .cnh-preview-rosto {
          width: 150px;
          height: 200px;
        }
        .cnh-preview-ass {
          width: 100%;
          height: 60px;
        }
        .cnh-ass-option {
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 10px;
        }
        .cnh-ass-option.green {
          background: #1a2e1a;
          border: 1px solid #22c55e33;
        }
        .cnh-ass-option.blue {
          background: #1a1e2e;
          border: 1px solid #3b82f633;
        }
        .cnh-ass-option h4 {
          font-size: 12px;
          font-weight: 600;
          margin: 0 0 6px 0;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .cnh-ass-option.green h4 { color: #4ade80; }
        .cnh-ass-option.blue h4 { color: #60a5fa; }
        .cnh-ass-option p {
          font-size: 10px;
          color: #64748b;
          margin: 0 0 6px 0;
        }
        .cnh-floating-save {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 500px;
          background: #ef4444;
          color: white;
          padding: 15px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: bold;
          box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.5);
          border: none;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          z-index: 100;
          transition: background 0.2s;
        }
        .cnh-floating-save:hover { background: #dc2626; }
        .cnh-floating-save:disabled {
          background: #475569;
          cursor: not-allowed;
          box-shadow: none;
        }
        .cnh-result-box {
          padding: 20px;
          background: #1a2e1a;
          border: 1px solid #22c55e44;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .cnh-result-box h3 {
          font-size: 16px;
          font-weight: 700;
          color: #4ade80;
          margin: 0 0 8px 0;
        }
        .cnh-result-box p {
          font-size: 13px;
          color: #86efac;
          margin: 4px 0;
        }
        .cnh-result-btns {
          display: flex;
          gap: 10px;
          margin-top: 12px;
          flex-wrap: wrap;
        }
        .cnh-btn-download {
          padding: 10px 20px;
          background: #16a34a;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.2s;
        }
        .cnh-btn-download:hover { background: #15803d; }
        .cnh-btn-whatsapp {
          padding: 10px 20px;
          background: #25D366;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.2s;
        }
        .cnh-btn-whatsapp:hover { background: #1da851; }
        .cnh-btn-voltar {
          background: transparent;
          color: #94a3b8;
          border: 1px solid #334155;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: 0.2s;
        }
        .cnh-btn-voltar:hover { background: #1e293b; color: #f1f5f9; }
        .cnh-balance-warn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #2e1a1a;
          border: 1px solid #ef444444;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 13px;
          color: #fca5a5;
        }
        .cnh-input-with-auto {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .cnh-input-with-auto input {
          flex: 1;
        }
        .cnh-file-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: 1px solid #334155;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          color: #94a3b8;
          background: #1e293b;
          transition: border-color 0.2s;
        }
        .cnh-file-label:hover { border-color: #ef4444; }
        .cnh-acesso-divider {
          font-size: 11px;
          text-transform: uppercase;
          color: #94a3b8;
          font-weight: 700;
          margin: 20px 0 10px 0;
        }
        @media (max-width: 640px) {
          .cnh-import-box { grid-template-columns: 1fr; }
          .cnh-fotos-grid { grid-template-columns: 1fr; }
          .cnh-form-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 480px) {
          .cnh-form-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="cnh-form">
        {/* Header */}
        <div className="cnh-header-top">
          <h1>
            (Criação de CNH) <span className="brand-black">DOCMASTER</span><span className="brand-blue">.STORE</span>
          </h1>
          <button className="cnh-btn-voltar" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft size={14} /> Voltar
          </button>
        </div>

        {/* Balance Warning */}
        {(user?.balance || 0) <= 0 && (
          <div className="cnh-balance-warn">
            <AlertCircle size={18} />
            Saldo insuficiente. <button onClick={() => setLocation("/recargas")} style={{ fontWeight: 700, textDecoration: "underline", background: "none", border: "none", color: "#fca5a5", cursor: "pointer" }}>Recarregue aqui</button>
          </div>
        )}

        {/* Resultado pós-emissão */}
        {saved && (
          <div className="cnh-result-box">
            <h3>CNH Digital emitida com sucesso!</h3>
            <p>Código: <strong style={{ fontFamily: "monospace" }}>{codigoQR}</strong></p>
            <p>Validação: <strong>{getQRCodeCNH(codigoQR)}</strong></p>
            <div className="cnh-result-btns">
              <button className="cnh-btn-download" onClick={handleExportJPEG} disabled={loading}>
                <Download size={14} /> Baixar JPEG
              </button>
              <button className="cnh-btn-whatsapp" onClick={handleWhatsApp}>
                <MessageCircle size={14} /> Enviar via WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* ═══ IMPORTAÇÃO E MODELO ═══ */}
        <div className="cnh-divider">
          <span style={{ fontSize: 14 }}>✏️</span> IMPORTAÇÃO E MODELO
        </div>

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
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Cole aqui o texto enviado pelo cliente..."
            />
            <button className="cnh-btn-processar" onClick={handleProcessarImportacao}>
              <Zap size={12} /> PROCESSAR DADOS
            </button>
          </div>
        </div>

        {/* ═══ 1. DADOS PESSOAIS ═══ */}
        <div className="cnh-divider">
          <span style={{ fontSize: 14 }}>👤</span> 1. DADOS PESSOAIS
        </div>

        <div className="cnh-form-grid">
          <div className="cnh-form-group" style={{ gridColumn: "span 2" }}>
            <label>Nome Completo</label>
            <input type="text" value={data.nome} onChange={update("nome")} />
          </div>
          <div className="cnh-form-group">
            <label>CPF</label>
            <input type="text" value={data.cpf} onChange={update("cpf")} placeholder="000.000.000-00" />
          </div>
          <div className="cnh-form-group">
            <label>Sexo</label>
            <select value={data.sexo} onChange={update("sexo")}>
              <option value="">ESCOLHA</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
            </select>
          </div>
        </div>

        <div className="cnh-form-grid">
          <div className="cnh-form-group">
            <label>RG</label>
            <input type="text" value={data.rg} onChange={update("rg")} />
          </div>
          <div className="cnh-form-group">
            <label>Orgão Emissor</label>
            <input type="text" value={data.orgaoEmissor} onChange={update("orgaoEmissor")} />
          </div>
          <div className="cnh-form-group">
            <label>UF RG</label>
            <input type="text" value={data.ufRG} onChange={update("ufRG")} maxLength={2} style={{ textTransform: "uppercase" }} />
          </div>
        </div>

        <div className="cnh-form-grid">
          <div className="cnh-form-group">
            <label>Nacionalidade</label>
            <input type="text" value={data.nacionalidade} onChange={update("nacionalidade")} />
          </div>
          <div className="cnh-form-group">
            <label>Data Nascimento</label>
            <input type="date" value={data.dataNascimento} onChange={update("dataNascimento")} />
          </div>
          <div className="cnh-form-group">
            <label>Local Nascimento</label>
            <input type="text" value={data.localNascimento} onChange={update("localNascimento")} />
          </div>
          <div className="cnh-form-group">
            <label>UF Nasc.</label>
            <input type="text" value={data.ufNascimento} onChange={update("ufNascimento")} maxLength={2} style={{ textTransform: "uppercase" }} />
          </div>
        </div>

        <div className="cnh-form-grid">
          <div className="cnh-form-group">
            <label>Nome do Pai</label>
            <input type="text" value={data.nomePai} onChange={update("nomePai")} />
          </div>
          <div className="cnh-form-group">
            <label>Nome da Mãe</label>
            <input type="text" value={data.nomeMae} onChange={update("nomeMae")} />
          </div>
        </div>

        {/* ═══ 2. DADOS DA CNH ═══ */}
        <div className="cnh-divider">
          <span style={{ fontSize: 14 }}>🪪</span> 2. DADOS DA CNH
        </div>

        <div className="cnh-form-grid">
          <div className="cnh-form-group">
            <label>Nº Registro <button className="cnh-badge-auto" onClick={handleAutoRegistro}>AUTO</button></label>
            <input type="text" value={data.registro} onChange={update("registro")} placeholder="Digite ou clique em AUTO para gerar" />
          </div>
          <div className="cnh-form-group">
            <label>Nº CNH (Espelho) <button className="cnh-badge-auto" onClick={handleAutoEspelho}>AUTO</button></label>
            <input type="text" value={data.espelho} onChange={update("espelho")} placeholder="Digite ou clique em AUTO para gerar" />
          </div>
          <div className="cnh-form-group">
            <label>Categoria</label>
            <input type="text" value={data.categoria} onChange={update("categoria")} placeholder="Ex: AB" style={{ textTransform: "uppercase" }} />
          </div>
          <div className="cnh-form-group">
            <label>Tipo</label>
            <select value={data.tipo} onChange={update("tipo")}>
              <option value="Definitiva">Definitiva</option>
              <option value="Permissão">Permissão</option>
            </select>
          </div>
        </div>

        <div className="cnh-form-grid">
          <div className="cnh-form-group">
            <label>Validade</label>
            <input type="date" value={data.validade} onChange={update("validade")} />
          </div>
          <div className="cnh-form-group">
            <label>Emissão</label>
            <input type="date" value={data.dataEmissao} onChange={update("dataEmissao")} />
          </div>
          <div className="cnh-form-group">
            <label>1ª Habilitação</label>
            <input type="date" value={data.primeiraHabilitacao} onChange={update("primeiraHabilitacao")} />
          </div>
        </div>

        <div className="cnh-form-grid">
          <div className="cnh-form-group">
            <label>Local Emissão</label>
            <input type="text" value={data.localEmissao} onChange={update("localEmissao")} />
          </div>
          <div className="cnh-form-group">
            <label>UF Emissão</label>
            <input type="text" value={data.ufEmissao} onChange={update("ufEmissao")} placeholder="UF" maxLength={2} style={{ textTransform: "uppercase" }} />
          </div>
        </div>

        {/* ═══ 3. CÓDIGO DE SEGURANÇA ═══ */}
        <div className="cnh-divider">
          <span style={{ fontSize: 14 }}>🔒</span> 3. CÓDIGO DE SEGURANÇA
        </div>

        <div className="cnh-form-grid">
          <div className="cnh-form-group">
            <label>Ass. Digital 1 <button className="cnh-badge-auto" onClick={handleAutoAss1}>AUTO</button></label>
            <input type="text" value={data.assDigital1} onChange={update("assDigital1")} placeholder="Digite ou clique em AUTO para gerar" />
          </div>
          <div className="cnh-form-group">
            <label>Ass. Digital 2 <button className="cnh-badge-auto" onClick={handleAutoAss2}>AUTO</button></label>
            <input type="text" value={data.assDigital2} onChange={update("assDigital2")} placeholder="UF + 8 Dígitos (Auto ao digitar UF)" />
          </div>
        </div>

        {/* ═══ 4. FOTOS E ACESSO ═══ */}
        <div className="cnh-divider">
          <span style={{ fontSize: 14 }}>📷</span> 4. FOTOS E ACESSO
        </div>

        <div className="cnh-fotos-grid">
          {/* Foto do Rosto */}
          <div>
            <div className="cnh-form-group">
              <label>
                Foto do Rosto{" "}
                <span style={{ fontSize: 10, color: "#2563eb" }}>
                  Para melhor qualidade, <a href="https://www.remove.bg/pt-br" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>remova o fundo AQUI</a>.
                </span>
              </label>
              <label className="cnh-file-label">
                <Upload size={14} /> Escolher Arquivo
                <input type="file" accept="image/*" onChange={handleFotoUpload} style={{ display: "none" }} />
              </label>
            </div>
            <div className="cnh-preview-box cnh-preview-rosto">
              {data.fotoUrl ? (
                <img src={data.fotoUrl} alt="Rosto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 12, color: "#64748b" }}>Prévia Rosto</span>
              )}
            </div>
          </div>

          {/* Assinatura */}
          <div>
            <div className="cnh-form-group">
              <label>Assinatura (Foto ou Digite)</label>
            </div>

            {/* Opção 1: Digitar */}
            <div className="cnh-ass-option green">
              <h4><Type size={12} /> Opção 1: Digite o Nome</h4>
              <p>Escolha um estilo e escreva o nome para gerar a assinatura.</p>
              <select
                value={assEstilo}
                onChange={(e) => setAssEstilo(parseInt(e.target.value))}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #334155", background: "#1e293b", color: "#f1f5f9", fontSize: "12px", marginBottom: "6px" }}
              >
                {ESTILOS_ASS.map((e, i) => <option key={i} value={i}>{e.label}</option>)}
              </select>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  value={assTexto}
                  onChange={(e) => setAssTexto(e.target.value)}
                  placeholder="Digite o nome para assinar..."
                  style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #334155", background: "#1e293b", color: "#f1f5f9", fontSize: "13px" }}
                />
                <button
                  onClick={gerarAssinaturaTexto}
                  style={{ padding: "8px 14px", background: "#22c55e", color: "white", border: "none", borderRadius: "6px", fontWeight: 700, fontSize: "11px", cursor: "pointer" }}
                >
                  Gerar
                </button>
              </div>
            </div>

            {/* Opção 2: Upload */}
            <div className="cnh-ass-option blue">
              <h4><Upload size={12} /> Opção 2: Envie uma Foto</h4>
              <p>Use uma imagem com fundo transparente ou branco.</p>
              <label className="cnh-file-label">
                <Upload size={14} /> Escolher Arquivo
                <input type="file" accept="image/*" onChange={handleAssinaturaUpload} style={{ display: "none" }} />
              </label>
            </div>

            {/* Prévia Assinatura */}
            <div className="cnh-preview-box cnh-preview-ass">
              {data.assinaturaUrl ? (
                <img src={data.assinaturaUrl} alt="Assinatura" style={{ height: "40px", objectFit: "contain" }} />
              ) : (
                <span style={{ fontSize: 12, color: "#64748b" }}>Prévia Assinatura</span>
              )}
            </div>
          </div>
        </div>

        {/* Acesso */}
        <div className="cnh-acesso-divider">ACESSO</div>
        <div className="cnh-form-grid">
          <div className="cnh-form-group">
            <label>Senha App Cliente</label>
            <input type="text" value={data.senhaApp} onChange={update("senhaApp")} />
          </div>
          <div className="cnh-form-group" style={{ gridColumn: "span 2" }}>
            <label>Observações (EAR)</label>
            <textarea
              value={data.observacoes}
              onChange={update("observacoes")}
              placeholder="Digite as observações (pressione Enter para pular linha)..."
              className="obs-textarea"
              style={{ borderColor: "#2563eb" }}
            />
          </div>
        </div>

        {/* Canvas oculto (ghostCanvas) para geração da imagem */}
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px", opacity: 0, pointerEvents: "none" }}>
          <CNHDocument
            ref={docRef}
            {...data}
            codigoQR={saved ? codigoQR : "PREVIEW"}
            blurred={!saved}
          />
        </div>

        {/* Botão SALVAR flutuante */}
        {!saved && (
          <button
            className="cnh-floating-save"
            onClick={handleSave}
            disabled={loading || saved}
          >
            {loading ? (
              <><div style={{ width: 16, height: 16, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> Gerando Documento...</>
            ) : (
              <><Save size={18} /> EMITIR CNH</>
            )}
          </button>
        )}
      </div>

      {/* Animação de spin */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
