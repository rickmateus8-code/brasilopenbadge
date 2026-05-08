import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import DashboardLayout from "../components/DashboardLayout";
import DiplomaUninterDocument, { type DiplomaUninterData } from "../components/DiplomaUninterDocument";
import { toast } from "sonner";
import { usePDFExport, generatePDFFilename } from "@/lib/pdfExport";
import EmissionModal from "@/components/EmissionModal";
import {
  ArrowLeft, Save, Download, MessageCircle, Copy, Zap,
  Upload, Type, AlertCircle, Trash2, Search
} from "lucide-react";

// ─── Constantes ──────────────────────────────────────────────────────────────
const MODELO_TEXTO = `Nome do Diplomado: 
Nacionalidade: BRASILEIRO(A)
Natural de: 
Estado (UF): 
Data de Nascimento: 
RG: 
CPF: 
Curso: 
Título Conferido: 
Data de Conclusão: 
Colação de Grau: 
Local de Emissão: Curitiba
Data de Emissão: `;

const ESTILOS_ASS = [
  { label: "Estilo 1 (Cursiva Elegante)", font: "'Dancing Script', cursive" },
  { label: "Estilo 2 (Bradley Hand)", font: "'Caveat', cursive" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function gerarCodigoValidacao(): string {
  const chars = "abcdef0123456789";
  let res = "";
  for (let i = 0; i < 64; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
  return res;
}

// ─── Componente ──────────────────────────────────────────────────────────────
export default function DiplomaUninterCria() {
  const { user, updateBalance } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [, setLocation] = useLocation();
  const docRef = useRef<HTMLDivElement>(null);
  const { exportPDF, exporting: isExportingPDF } = usePDFExport();

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [importText, setImportText] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [documentPrice, setDocumentPrice] = useState(2500); // R$ 25,00

  const [data, setData] = useState<DiplomaUninterData>({
    nome_diplomado: "",
    nacionalidade: "BRASILEIRO(A)",
    naturalidade_estado: "",
    data_nascimento: "",
    documento_numero: "",
    curso: "",
    data_conclusao: "",
    data_colacao: "",
    titulo_conferido: "CURSO PROFISSIONALIZANTE",
    cidade_emissao: "Curitiba",
    data_emissao: "",
    secretaria_nome: "Simone Ramos de Oliveira",
    reitor_nome: "Benhur Etelberto Gaio",
    codigo_validacao: gerarCodigoValidacao(),
    url_validacao: "https://uninter-meudiploma.online",

    // Page 2 Defaults
    portaria_recredenciamento: "1.219, de 25/05/2012",
    dou_recredenciamento: "244, Seção 1, pág. 125, de 20/12/2018",
    retificacao_dou: "27/12/2018, n.° 248, Seção 1, pág. 85",
    portaria_reconhecimento: "913, de 20/12/2022",
    dou_reconhecimento: "245, Seção 1, pág. 35-40 n.°",
    processo_numero: "201827038",
    registro_numero: "4521|08|127|" + Math.floor(1000 + Math.random() * 9000),
    secretaria_registro_nome: "EDILAINE ALVES BELCHIOR",
    portaria_registro: "169/2021",
    mantenedora_nome: "UNINTER EDUCACIONAL S/A",
    mantenedora_cnpj: "02.261.854/0001-57",
  });

  const update = useCallback((field: keyof DiplomaUninterData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setData(d => ({ ...d, [field]: e.target.value }));
  }, []);

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

    setData(d => ({
      ...d,
      nome_diplomado: get("Nome do Diplomado") || d.nome_diplomado,
      nacionalidade: get("Nacionalidade") || d.nacionalidade,
      naturalidade_estado: (get("Natural de") + "-" + get("Estado \\(UF\\)")) || d.naturalidade_estado,
      data_nascimento: get("Data de Nascimento") || d.data_nascimento,
      documento_numero: get("CPF") || get("RG") || d.documento_numero,
      curso: get("Curso") || d.curso,
      titulo_conferido: get("Título Conferido") || d.titulo_conferido,
      data_conclusao: get("Data de Conclusão") || d.data_conclusao,
      data_colacao: get("Colação de Grau") || d.data_colacao,
      cidade_emissao: get("Local de Emissão") || d.cidade_emissao,
      data_emissao: get("Data de Emissão") || d.data_emissao,
    }));
    toast.success("Dados processados!");
  };

  const handleRequestEmit = () => {
    if (!data.nome_diplomado || !data.curso) {
      toast.error("Preencha Nome e Curso obrigatoriamente!");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents/diploma-uninter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...data, type: "diploma-uninter" }),
      });
      const result = await res.json();
      if (result.success) {
        setSaved(true);
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        if (result.newBalance !== undefined) updateBalance(result.newBalance);
      } else {
        toast.error(result.error || "Erro ao gerar Diploma");
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
    setIsDownloading(true);
    try {
      await exportPDF(docRef.current, {
        filename: generatePDFFilename(data.nome_diplomado, "diploma-uninter"),
        docType: "diploma-uninter",
        orientation: "l",
        multiPage: true,
        scale: 2,
      });
      toast.success("Diploma exportado com sucesso!");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("Erro ao exportar PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  // ─── Signature Generation ──────────────────────────────────────────────────
  const [assTexto, setAssTexto] = useState("");
  const [assEstilo, setAssEstilo] = useState(0);

  const gerarAssinatura = (target: "assSecretariaImg" | "assReitorImg" | "assRegistroImg") => {
    if (!assTexto.trim()) return;
    const cvs = document.createElement("canvas");
    cvs.width = 600; cvs.height = 150;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    const font = ESTILOS_ASS[assEstilo].font;
    ctx.font = `48px ${font}`;
    ctx.fillStyle = "black";
    ctx.textBaseline = "middle";
    ctx.fillText(assTexto, 20, 75);
    setData(d => ({ ...d, [target]: cvs.toDataURL("image/png") }));
    toast.success("Assinatura gerada!");
  };

  const handleUploadImg = (target: "assSecretariaImg" | "assReitorImg" | "assRegistroImg") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setData(d => ({ ...d, [target]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <DashboardLayout>
      <style>{`
        .uninter-page-wrapper {
          display: flex;
          width: 100vw;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9999;
          background: ${isDark ? "#0f172a" : "#f1f5f9"};
          font-family: 'Inter', sans-serif;
        }
        .uninter-form-container {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          padding-bottom: 120px;
          background: ${isDark ? "#0f172a" : "#ffffff"};
          color: ${isDark ? "#f1f5f9" : "#1e293b"};
        }
        .uninter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          border-bottom: 2px solid #005CA9;
          padding-bottom: 12px;
        }
        .uninter-header h1 { font-size: 20px; font-weight: 800; margin: 0; color: #005CA9; }
        .uninter-divider {
          padding: 10px 0; font-size: 11px; text-transform: uppercase; color: ${isDark ? "#94a3b8" : "#64748b"}; font-weight: 700; border-bottom: 1px solid ${isDark ? "#1e293b" : "#e2e8f0"}; margin: 25px 0 15px 0; display: flex; align-items: center; gap: 8px;
        }
        .uninter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 16px; }
        .uninter-group { display: flex; flex-direction: column; gap: 5px; }
        .uninter-group label { font-size: 12px; font-weight: 600; color: ${isDark ? "#94a3b8" : "#64748b"}; }
        .uninter-group input, .uninter-group select, .uninter-group textarea {
          padding: 10px 12px; border-radius: 8px; border: 1px solid ${isDark ? "#334155" : "#cbd5e1"}; background: ${isDark ? "#1e293b" : "#ffffff"}; color: ${isDark ? "#f1f5f9" : "#0f172a"}; outline: none; font-size: 13px;
        }
        .uninter-group input:focus { border-color: #005CA9; }
        .uninter-btn-action { padding: 10px; border: none; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; color: white; }
        .uninter-floating-save {
          position: fixed; bottom: 20px; left: 25%; transform: translateX(-50%); width: 40%; max-width: 400px; background: #059669; color: white; padding: 15px; border-radius: 12px; font-size: 16px; font-weight: bold; box-shadow: 0 10px 25px -5px rgba(5, 150, 105, 0.4); border: none; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 10px; z-index: 10001;
        }
        .uninter-import-box { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 16px; border: 1px solid ${isDark ? "#334155" : "#e2e8f0"}; border-radius: 12px; background: ${isDark ? "#1e293b" : "#f8fafc"}; }
        .uninter-import-box textarea { width: 100%; height: 120px; padding: 10px; border-radius: 8px; border: 1px solid ${isDark ? "#334155" : "#e2e8f0"}; background: ${isDark ? "#0f172a" : "#fff"}; color: ${isDark ? "#fff" : "#000"}; resize: none; font-size: 12px; }
      `}</style>

      <div className="uninter-page-wrapper">
        <div className="uninter-form-container custom-scrollbar">
          <div className="uninter-header">
            <h1>ELITEDOC<span style={{ color: isDark ? "#fff" : "#000" }}>.STORE</span> Gerador de <span style={{ color: "#005CA9" }}>DIPLOMA UNINTER</span></h1>
            <button className="uninter-btn-action" style={{ background: "transparent", color: isDark ? "#94a3b8" : "#64748b", border: "1px solid #e2e8f0" }} onClick={() => setLocation("/dashboard")}>
              <ArrowLeft size={14} /> Voltar
            </button>
          </div>

          {/* AUTOMACAO */}
          <div className="uninter-divider">✨ AUTOMAÇÃO VIA WHATSAPP</div>
          <div className="uninter-import-box">
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 5 }}>1. Envie para o cliente</label>
              <div style={{ padding: 10, background: isDark ? "#0f172a" : "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11, fontFamily: "monospace", whiteSpace: "pre-wrap", height: 100, overflow: "auto", marginBottom: 10 }}>{MODELO_TEXTO}</div>
              <button className="uninter-btn-action" style={{ background: "#3b82f6", width: "100%" }} onClick={handleCopiarModelo}><Copy size={14} /> Copiar Modelo</button>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 5 }}>2. Cole o texto preenchido</label>
              <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Cole aqui..." />
              <button className="uninter-btn-action" style={{ background: "#10b981", width: "100%" }} onClick={handleProcessarImportacao}><Zap size={14} /> Processar Dados</button>
            </div>
          </div>

          {/* SEÇÃO 1: DIPLOMADO */}
          <div className="uninter-divider">👤 1. DADOS DO DIPLOMADO</div>
          <div className="uninter-grid">
            <div className="uninter-group" style={{ gridColumn: "span 2" }}><label>Nome Completo</label><input type="text" value={data.nome_diplomado} onChange={update("nome_diplomado")} /></div>
            <div className="uninter-group"><label>Nacionalidade</label><input type="text" value={data.nacionalidade} onChange={update("nacionalidade")} /></div>
          </div>
          <div className="uninter-grid">
            <div className="uninter-group"><label>Natural de / Estado (Ex: SALVADOR-BA)</label><input type="text" value={data.naturalidade_estado} onChange={update("naturalidade_estado")} /></div>
            <div className="uninter-group"><label>Data de Nascimento</label><input type="text" value={data.data_nascimento} onChange={update("data_nascimento")} placeholder="7 de junho de 1977" /></div>
            <div className="uninter-group"><label>Documento (RG/CPF)</label><input type="text" value={data.documento_numero} onChange={update("documento_numero")} /></div>
          </div>

          {/* SEÇÃO 2: CURSO */}
          <div className="uninter-divider">🎓 2. DADOS DO CURSO</div>
          <div className="uninter-grid">
            <div className="uninter-group" style={{ gridColumn: "span 2" }}><label>Nome do Curso (Em maiúsculas)</label><input type="text" value={data.curso} onChange={update("curso")} placeholder="ELETRICISTA PREDIAL" /></div>
            <div className="uninter-group"><label>Título Conferido</label><input type="text" value={data.titulo_conferido} onChange={update("titulo_conferido")} /></div>
          </div>
          <div className="uninter-grid">
            <div className="uninter-group"><label>Data de Conclusão</label><input type="text" value={data.data_conclusao} onChange={update("data_conclusao")} placeholder="15 de dezembro de 2010" /></div>
            <div className="uninter-group"><label>Colação de Grau</label><input type="text" value={data.data_colacao} onChange={update("data_colacao")} placeholder="20 de dezembro de 2010" /></div>
          </div>

          {/* SEÇÃO 3: DADOS DO VERSO (PORTARIAS) */}
          <div className="uninter-divider">📄 3. PORTARIAS E RECONHECIMENTO (VERSO)</div>
          <div className="uninter-grid">
            <div className="uninter-group"><label>Portaria Recredenciamento</label><input type="text" value={data.portaria_recredenciamento} onChange={update("portaria_recredenciamento")} /></div>
            <div className="uninter-group"><label>DOU Recredenciamento</label><input type="text" value={data.dou_recredenciamento} onChange={update("dou_recredenciamento")} /></div>
          </div>
          <div className="uninter-grid">
            <div className="uninter-group"><label>Retificação DOU</label><input type="text" value={data.retificacao_dou} onChange={update("retificacao_dou")} /></div>
            <div className="uninter-group"><label>Portaria Reconhecimento</label><input type="text" value={data.portaria_reconhecimento} onChange={update("portaria_reconhecimento")} /></div>
          </div>
          <div className="uninter-grid">
            <div className="uninter-group"><label>DOU Reconhecimento</label><input type="text" value={data.dou_reconhecimento} onChange={update("dou_reconhecimento")} /></div>
            <div className="uninter-group"><label>Número do Processo</label><input type="text" value={data.processo_numero} onChange={update("processo_numero")} /></div>
          </div>

          {/* SEÇÃO 4: REGISTRO E EMISSÃO */}
          <div className="uninter-divider">📅 4. REGISTRO E EMISSÃO</div>
          <div className="uninter-grid">
            <div className="uninter-group"><label>Número do Registro</label><input type="text" value={data.registro_numero} onChange={update("registro_numero")} /></div>
            <div className="uninter-group"><label>Portaria Registro</label><input type="text" value={data.portaria_registro} onChange={update("portaria_registro")} /></div>
          </div>
          <div className="uninter-grid">
            <div className="uninter-group"><label>Local de Emissão</label><input type="text" value={data.cidade_emissao} onChange={update("cidade_emissao")} /></div>
            <div className="uninter-group"><label>Data de Emissão</label><input type="text" value={data.data_emissao} onChange={update("data_emissao")} placeholder="12 de janeiro de 2011" /></div>
          </div>

          {/* SEÇÃO 5: ASSINATURAS */}
          <div className="uninter-divider">🖋️ 5. ASSINATURAS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 40 }}>
            {/* Assinatura Secretária */}
            <div style={{ padding: 15, border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`, borderRadius: 12, background: isDark ? "#1e293b" : "#f8fafc" }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 10 }}>Secretário(a) Geral</label>
              <input type="text" value={data.secretaria_nome} onChange={update("secretaria_nome")} style={{ width: "100%", marginBottom: 10, padding: 8, borderRadius: 6, border: "1px solid #ddd", background: "#fff", color: "#000" }} />
              <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                <input type="text" placeholder="Digitar p/ ass..." value={assTexto} onChange={(e) => setAssTexto(e.target.value)} style={{ flex: 1, padding: 6, fontSize: 12, borderRadius: 6, border: "1px solid #ddd" }} />
                <button className="uninter-btn-action" style={{ background: "#6366f1" }} onClick={() => gerarAssinatura("assSecretariaImg")}>OK</button>
              </div>
              <label className="uninter-btn-action" style={{ background: "#94a3b8", cursor: "pointer" }}>
                <Upload size={12} /> Upload
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleUploadImg("assSecretariaImg")} />
              </label>
              {data.assSecretariaImg && <img src={data.assSecretariaImg} style={{ height: 40, marginTop: 10, border: "1px solid #eee", background: "#fff" }} />}
            </div>

            {/* Assinatura Reitor */}
            <div style={{ padding: 15, border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`, borderRadius: 12, background: isDark ? "#1e293b" : "#f8fafc" }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 10 }}>Reitor</label>
              <input type="text" value={data.reitor_nome} onChange={update("reitor_nome")} style={{ width: "100%", marginBottom: 10, padding: 8, borderRadius: 6, border: "1px solid #ddd", background: "#fff", color: "#000" }} />
              <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                <input type="text" placeholder="Digitar p/ ass..." value={assTexto} onChange={(e) => setAssTexto(e.target.value)} style={{ flex: 1, padding: 6, fontSize: 12, borderRadius: 6, border: "1px solid #ddd" }} />
                <button className="uninter-btn-action" style={{ background: "#6366f1" }} onClick={() => gerarAssinatura("assReitorImg")}>OK</button>
              </div>
              <label className="uninter-btn-action" style={{ background: "#94a3b8", cursor: "pointer" }}>
                <Upload size={12} /> Upload
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleUploadImg("assReitorImg")} />
              </label>
              {data.assReitorImg && <img src={data.assReitorImg} style={{ height: 40, marginTop: 10, border: "1px solid #eee", background: "#fff" }} />}
            </div>

            {/* Assinatura Registro (Verso) */}
            <div style={{ padding: 15, border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`, borderRadius: 12, background: isDark ? "#1e293b" : "#f8fafc" }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 10 }}>Registrador(a) (Verso)</label>
              <input type="text" value={data.secretaria_registro_nome} onChange={update("secretaria_registro_nome")} style={{ width: "100%", marginBottom: 10, padding: 8, borderRadius: 6, border: "1px solid #ddd", background: "#fff", color: "#000" }} />
              <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                <input type="text" placeholder="Digitar p/ ass..." value={assTexto} onChange={(e) => setAssTexto(e.target.value)} style={{ flex: 1, padding: 6, fontSize: 12, borderRadius: 6, border: "1px solid #ddd" }} />
                <button className="uninter-btn-action" style={{ background: "#6366f1" }} onClick={() => gerarAssinatura("assRegistroImg")}>OK</button>
              </div>
              <label className="uninter-btn-action" style={{ background: "#94a3b8", cursor: "pointer" }}>
                <Upload size={12} /> Upload
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleUploadImg("assRegistroImg")} />
              </label>
              {data.assRegistroImg && <img src={data.assRegistroImg} style={{ height: 40, marginTop: 10, border: "1px solid #eee", background: "#fff" }} />}
            </div>
          </div>
        </div>

        {/* ═══ COLUNA DIREITA — PREVIEW REALTIME ═══ */}
        <div className="hidden xl:flex flex-1 flex-col min-w-0 h-screen sticky top-0 bg-gray-100 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
          <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <span className="text-sm font-black text-gray-800 dark:text-gray-200 italic uppercase">Preview Realtime</span>
            <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[10px] font-black rounded-lg">
              DIPLOMA UNINTER
            </div>
          </div>
          <div className="flex-1 overflow-auto p-8 flex items-start justify-center custom-scrollbar">
            <div style={{ transform: "scale(0.65)", transformOrigin: "top center" }}>
              <DiplomaUninterDocument ref={docRef} data={data} />
            </div>
          </div>
        </div>

        {!saved && (
          <button className="uninter-floating-save" onClick={handleRequestEmit} disabled={loading}>
            {loading ? "Processando..." : <><Save size={18} /> EMITIR DIPLOMA</>}
          </button>
        )}
      </div>

      <EmissionModal
        docLabel="Diploma Uninter" docEmoji="🎓" documentPrice={documentPrice} userBalance={user?.balance ?? 0}
        showConfirm={showConfirmModal} showSuccess={showSuccessModal} isEmitting={loading} isDownloading={isDownloading}
        onConfirm={handleSave} onCancel={() => setShowConfirmModal(false)}
        onDownload={handleExportPdf}
        onClose={() => setShowSuccessModal(false)} historyPath="/dashboard"
      />
    </DashboardLayout>
  );
}
