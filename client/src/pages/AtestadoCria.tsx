import AttestationDocument from "@/components/AttestationDocument";
import { downloadAttestationPdf } from "@/lib/attestationActions";
import { generatePDFFilename } from "@/lib/pdfExport";
import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { validarCPF } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";

// ─── SearchSelect: select com campo de busca integrado no dropdown ────────────
function SearchSelect({
  label, value, options, placeholder, disabled, onChange, onFocus
}: {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  onChange: (v: string) => void;
  onFocus?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = options.filter(o => !search || o.toUpperCase().includes(search.toUpperCase()));

  const triggerStyle: React.CSSProperties = {
    width: "100%",
    padding: "6px 28px 6px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 13,
    background: disabled ? "#f3f4f6" : "#fff",
    color: value ? "#000" : "#9ca3af",
    cursor: disabled ? "not-allowed" : "pointer",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    position: "relative" as const,
    userSelect: "none" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 32,
    outline: open ? "2px solid #005CA9" : "none",
    borderColor: open ? "#005CA9" : "#d1d5db",
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearch("");
  };

  return (
    <div style={{ position: "relative" }} ref={ref} onFocus={onFocus}>
      <div
        style={triggerStyle}
        onClick={() => { if (!disabled) { setOpen(o => !o); setSearch(""); if (!open && onFocus) onFocus(); } }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value || placeholder || label + "..."}
        </span>
        <span style={{ fontSize: 10, color: "#6b7280", marginLeft: 4 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "#fff",
          border: "1px solid #d1d5db",
          borderRadius: 6,
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "6px 8px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
            <input
              autoFocus
              style={{
                width: "100%",
                padding: "4px 8px",
                border: "1px solid #d1d5db",
                borderRadius: 4,
                fontSize: 12,
                outline: "none",
                boxSizing: "border-box" as const,
              }}
              placeholder="🔍 Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  if (filtered.length > 0) handleSelect(filtered[0]);
                }
                if (e.key === "Escape") {
                  setOpen(false);
                  setSearch("");
                }
              }}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            <div
              style={{ padding: "6px 12px", fontSize: 13, color: "#9ca3af", cursor: "pointer" }}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(""); }}
            >
              {placeholder || label + "..."}
            </div>
            {filtered.length === 0 && (
              <div style={{ padding: "6px 12px", fontSize: 12, color: "#9ca3af" }}>Nenhum resultado</div>
            )}
            {filtered.map(o => (
              <div
                key={o}
                style={{
                  padding: "6px 12px",
                  fontSize: 13,
                  cursor: "pointer",
                  background: o === value ? "#dbeafe" : "transparent",
                  fontWeight: o === value ? 700 : 400,
                  color: "#000",
                }}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(o); }}
                onMouseEnter={(e) => (e.currentTarget.style.background = o === value ? "#dbeafe" : "#f3f4f6")}
                onMouseLeave={(e) => (e.currentTarget.style.background = o === value ? "#dbeafe" : "transparent")}
              >
                {o}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── API de Médicos (Cloudflare D1 — banco unificado) ─────────────────────────
async function apiFetch(path: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(`/api/medicos${path}`, {
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`API HTTP ${res.status}`);
    return res.json();
  } catch (e: any) {
    if (e?.name === "AbortError") throw new Error("Timeout: servidor demorou demais. Tente novamente.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Constantes ────────────────────────────────────────────────────────────────
const ESTADOS_SIGLAS: Record<string, string> = {
  "ACRE": "AC", "ALAGOAS": "AL", "AMAPA": "AP", "AMAZONAS": "AM", "BAHIA": "BA",
  "CEARA": "CE", "DISTRITO FEDERAL": "DF", "ESPIRITO SANTO": "ES", "GOIAS": "GO",
  "MARANHAO": "MA", "MATO GROSSO": "MT", "MATO GROSSO DO SUL": "MS", "MINAS GERAIS": "MG",
  "PARA": "PA", "PARAIBA": "PB", "PARANA": "PR", "PERNAMBUCO": "PE", "PIAUI": "PI",
  "RIO DE JANEIRO": "RJ", "RIO GRANDE DO NORTE": "RN", "RIO GRANDE DO SUL": "RS",
  "RONDONIA": "RO", "RORAIMA": "RR", "SANTA CATARINA": "SC", "SAO PAULO": "SP",
  "SERGIPE": "SE", "TOCANTINS": "TO"
};

function converterEstadoParaSigla(nomeEstado: string): string {
  if (!nomeEstado) return "";
  const nomeNorm = nomeEstado.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
  return ESTADOS_SIGLAS[nomeNorm] || nomeNorm;
}

const UFS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

const ESPECIALIDADES = [
  { value: "", label: "Todas as Áreas" },
  { value: "CLINICO GERAL", label: "Médico Geral" },
  { value: "PEDIATRIA", label: "Pediatria" },
  { value: "GINECOLOGIA", label: "Ginecologia" },
  { value: "CARDIOLOGIA", label: "Cardiologia" },
  { value: "ORTOPEDIA", label: "Ortopedia" },
  { value: "OFTALMOLOGIA", label: "Oftalmologia" },
  { value: "PSIQUIATRIA", label: "Psiquiatria" },
  { value: "DERMATOLOGIA", label: "Dermatologia" },
  { value: "CIRURGIA GERAL", label: "Cirurgia Geral" },
];

const CIDS_CATEGORIZADOS = [
  {
    grupo: "Infecciosos (3-7 dias)",
    itens: [
      { code: "A09", desc: "Diarreia / Gastroenterite" },
      { code: "A90", desc: "Dengue" },
      { code: "B34.9", desc: "Virose não especificada" },
      { code: "H10", desc: "Conjuntivite" },
      { code: "J11", desc: "Gripe (Influenza)" },
    ],
  },
  {
    grupo: "Respiratórios (2-5 dias)",
    itens: [
      { code: "J00", desc: "Resfriado comum" },
      { code: "J01", desc: "Sinusite aguda" },
      { code: "J03", desc: "Amigdalite" },
      { code: "J06", desc: "Infecção Vias Aéreas" },
      { code: "J30", desc: "Rinite Alérgica" },
    ],
  },
  {
    grupo: "Dores e Ortopedia",
    itens: [
      { code: "M54.2", desc: "Dor no Pescoço" },
      { code: "M54.5", desc: "Dor Lombar" },
      { code: "S93", desc: "Entorse Tornozelo" },
      { code: "R51", desc: "Dor de Cabeça" },
      { code: "G43", desc: "Enxaqueca" },
    ],
  },
  {
    grupo: "Outros",
    itens: [
      { code: "K29", desc: "Gastrite" },
      { code: "R10", desc: "Dor Abdominal" },
      { code: "N39.0", desc: "Infecção Urinária" },
      { code: "Z76.3", desc: "Acompanhante" },
      { code: "T78.0", desc: "Reação Anafilática (Ovo)" },
      { code: "L50", desc: "Urticária" },
      { code: "J45", desc: "Asma" },
    ],
  },
];

// ─── Logos padrão disponíveis ──────────────────────────────────────────────────
const LOGOS_PADRAO = [
  { id: "logo1",      label: "Logo 1",       src: "/logos/logo1.png" },
  { id: "logo2",      label: "Logo 2",       src: "/logos/logo2.png" },
  { id: "logo3",      label: "Logo 3",       src: "/logos/logo3.jpg" },
  { id: "amil",       label: "Amil",         src: "/logos/amil.png" },
  { id: "hapvida",    label: "Hapvida",      src: "/logos/hapvida.png" },
  { id: "notredame",  label: "Notre Dame",   src: "/logos/notredame.png" },
  { id: "sulamerica", label: "Sul América",  src: "/logos/sulamerica.png" },
  { id: "unimed",     label: "Unimed",       src: "/logos/unimed.png" },
];

// ─── Mapeamento de dias por extenso ───────────────────────────────────────────
const DIAS_EXTENSO: Record<number, { num: string; ext: string }> = {
  1:  { num: "01", ext: "um" },
  2:  { num: "02", ext: "dois" },
  3:  { num: "03", ext: "três" },
  4:  { num: "04", ext: "quatro" },
  5:  { num: "05", ext: "cinco" },
  6:  { num: "06", ext: "seis" },
  7:  { num: "07", ext: "sete" },
  8:  { num: "08", ext: "oito" },
  9:  { num: "09", ext: "nove" },
  10: { num: "10", ext: "dez" },
  11: { num: "11", ext: "onze" },
  12: { num: "12", ext: "doze" },
  13: { num: "13", ext: "treze" },
  14: { num: "14", ext: "quatorze" },
  15: { num: "15", ext: "quinze" },
};

function todayBR() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}
function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

async function optimizeImageForUpload(file: File, options?: { maxWidth?: number; maxHeight?: number; quality?: number }) {
  const { maxWidth = 1400, maxHeight = 1400, quality = 0.82 } = options || {};
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const ratio = Math.min(1, maxWidth / width, maxHeight / height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL(file.type, quality));
        } else resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function handleDateInput(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0,2)}/${d.slice(2)}`;
  return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`;
}

async function parseJsonResponseSafely(res: Response) {
  const rawText = await res.text();
  const trimmed = rawText.trim();
  if (!trimmed) throw new Error("Resposta vazia do servidor.");
  if (trimmed.startsWith("<")) throw new Error(`HTML retornado em vez de JSON (HTTP ${res.status}).`);
  try { return JSON.parse(trimmed); } catch { throw new Error("Erro ao processar JSON do servidor."); }
}

function getUploadSizeInBytes(value?: string) {
  if (!value) return 0;
  const base64 = value.includes(",") ? value.split(",")[1] || "" : value;
  return Math.ceil((base64.length * 3) / 4);
}

interface MedicoDB {
  id: number;
  nome_medico: string;
  crm: string;
  uf_crm: string;
  especialidade: string;
  local_trabalho: string;
  cidade: string;
  uf_local: string;
  endereco: string;
  bairro: string;
}

export default function AtestadoCria() {
  const { user, updateBalance } = useAuth();
  const { validityDays } = useSettings();
  const [, navigate] = useLocation();
  const previewRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [autoDownloadTriggered, setAutoDownloadTriggered] = useState(false);

  const [logoLeft, setLogoLeft] = useState("");
  const [logoRight, setLogoRight] = useState("");
  const [logoSide, setLogoSide] = useState<"left" | "right">("left");
  const [logoLeftScale, setLogoLeftScale] = useState(1);
  const [logoRightScale, setLogoRightScale] = useState(1);
  const [logoLeftX, setLogoLeftX] = useState(0);
  const [logoLeftY, setLogoLeftY] = useState(0);
  const [logoRightX, setLogoRightX] = useState(0);
  const [logoRightY, setLogoRightY] = useState(0);
  const [signatureColor, setSignatureColor] = useState("#000000");
  const [signatureImage, setSignatureImage] = useState("");

  const [stampScale, setStampScale] = useState(1.2);
  const [stampX, setStampX] = useState(141); 
  const [stampY, setStampY] = useState(-120); 
  const [stampRotate, setStampRotate] = useState(-3);
  const [hideQRCode, setHideQRCode] = useState(false);
  const [showStampInfo, setShowStampInfo] = useState(true);

  const [tipoDoc, setTipoDoc] = useState<"CPF" | "CNS">("CPF");
  const [documentType, setDocumentType] = useState<'atestado' | 'laudo'>('atestado');

  const [cpfLoading, setCpfLoading] = useState(false);
  const [cpfStatus, setCpfStatus] = useState<"idle" | "ok" | "error" | "not_found">("idle");
  const [cpfMsg, setCpfMsg] = useState("");

  const [filtroUF, setFiltroUF] = useState("");
  const [filtroCidade, setFiltroCidade] = useState("");
  const [filtroBairro, setFiltroBairro] = useState("");
  const [filtroLocal, setFiltroLocal] = useState("");
  const [filtroEsp, setFiltroEsp] = useState("");
  const [termoBusca, setTermoBusca] = useState("");
  const [cidades, setCidades] = useState<string[]>([]);
  const [bairros, setBairros] = useState<string[]>([]);
  const [locais, setLocais] = useState<string[]>([]);
  const [resultados, setResultados] = useState<MedicoDB[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState("");
  const [showResultados, setShowResultados] = useState(false);
  const [showEditar, setShowEditar] = useState(true);

  const [form, setForm] = useState({
    instituicao: "", unidade: "", enderecoEmitente: "", medico: "", crm: "", especialidade: "",
    paciente: "", sexo: "FEMALE" as "MALE" | "FEMALE", nascimento: "", docValue: "", nomeMae: "",
    endereco: "", cid: "", cidDisplay: "", cidNome: "", afastamento: "3", textoAtestado: TEXTO_PADRAO,
    dataAssinatura: todayBR(), horaAssinatura: nowTime(), dataEmissao: todayBR(), cidade: "", modoCarimbo: false,
  });

  const [importTexto, setImportTexto] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [cepPaciente, setCepPaciente] = useState("");
  const [cepNumero, setCepNumero] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepUFPreenchida, setCepUFPreenchida] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [documentPrice, setDocumentPrice] = useState(0);
  const [priceLoading, setPriceLoading] = useState(false);

  const [zoomScale, setZoomScale] = useState(0.65);
  const [zoomTranslateY, setZoomTranslateY] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [currentSection, setCurrentSection] = useState<"top" | "bottom">("top");

  const getFitScale = useCallback(() => {
    const container = document.getElementById("preview-container");
    if (!container) return 0.65;
    const scaleX = (container.offsetWidth - 20) / 794;
    const scaleY = (container.offsetHeight - 20) / 1123;
    return Math.min(scaleX, scaleY, 1.0);
  }, []);

  const scrollToPreviewSection = useCallback((section: "top" | "bottom") => {
    const container = document.getElementById("preview-container");
    if (container) {
      const focusScale = Math.min((container.offsetWidth - 30) / 794, 1.05);
      const targetY = section === "top" ? 15 : (container.offsetHeight - (1123 * focusScale) - 15);
      setZoomScale(focusScale);
      setZoomTranslateY(targetY);
      setCurrentSection(section);
      setIsFocused(true);
    }
  }, []);

  const resetPreviewZoom = () => {
    setZoomScale(getFitScale());
    setZoomTranslateY(0);
    setIsFocused(false);
    setCurrentSection("top");
  };

  useEffect(() => {
    const handleResize = () => { if (!isFocused) setZoomScale(getFitScale()); };
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100);
    return () => window.removeEventListener('resize', handleResize);
  }, [getFitScale, isFocused]);

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const payload = {
        ...form, logoUrl: logoLeft, logoRight, signatureColor, signatureImage,
        logoLeftScale, logoRightScale, logoLeftX, logoLeftY, logoRightX, logoRightY,
        stampScale, stampX, stampY, stampRotate, hideQRCode, showStampInfo, modoCarimbo: form.modoCarimbo,
        documentType, cidade: form.cidade
      };
      await downloadAttestationPdf(payload);
    } catch (err: any) { alert(`Erro ao gerar PDF: ${err.message}`); }
    finally { setIsDownloadingPdf(false); }
  };

  useEffect(() => {
    if (showSuccessModal && !autoDownloadTriggered) {
      setAutoDownloadTriggered(true);
      handleDownloadPdf().then(() => {
        setTimeout(() => { setShowSuccessModal(false); navigate("/atestadosalvos"); }, 1000);
      });
    }
  }, [showSuccessModal, autoDownloadTriggered]);

  const handleSubmit = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);
    try {
      const payload = {
        ...form, paciente: form.paciente.toUpperCase(), cpf: tipoDoc === "CPF" ? form.docValue : "",
        cns: tipoDoc === "CNS" ? form.docValue : "", tipoDoc, nomeMae: form.nomeMae.toUpperCase(),
        endereco: form.endereco.toUpperCase(), cid: form.cid.toUpperCase(),
        medico: form.medico.toUpperCase(), crm: form.crm, especialidade: form.especialidade.toUpperCase(),
        logoUrl: logoLeft, logoRight, signatureColor, signatureImage, modoCarimbo: form.modoCarimbo,
        logoLeftScale, logoRightScale, logoLeftX, logoLeftY, logoRightX, logoRightY,
        stampScale, stampX, stampY, stampRotate: parseFloat((Math.random() * 20 - 10).toFixed(1)),
        hideQRCode, showStampInfo, documentType,
      };
      const res = await fetch("/api/attestations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(payload),
      });
      const data = await parseJsonResponseSafely(res);
      if (!res.ok || !data.success) throw new Error(data.error || "Erro ao emitir");
      if (data.newBalance !== undefined) updateBalance(data.newBalance);
      setCreatedCode(data.codigoQR);
      setShowSuccessModal(true);
    } catch (error: any) { alert(`Erro ao emitir: ${error.message}`); }
    finally { setIsLoading(false); }
  };

  const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", padding: "14px 16px", marginBottom: 12 };
  const secTitle: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#005CA9", borderBottom: "2px solid #005CA9", paddingBottom: 5, marginBottom: 10 };
  const inp: React.CSSProperties = { width: "100%", padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none", color: "#000" };

  return (
    <div style={{ height: "100vh", overflow: "hidden", background: "#fff", display: "flex", flexDirection: "column" }}>
      {showSuccessModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "48px 40px 36px", textAlign: "center", maxWidth: 340, width: "88%", boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>Sucesso!</h2>
            <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 28px" }}>Documento emitido com sucesso!</p>
            <button style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "12px 40px", fontWeight: 700, fontSize: 15, width: "100%" }} onClick={() => navigate("/atestadosalvos")}>OK</button>
          </div>
        </div>
      )}
      <div style={{ background: "#005CA9", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button style={{ background: "#e2e8f0", padding: "5px 12px", border: "none", borderRadius: 7, fontSize: 11, cursor: "pointer" }} onClick={() => navigate("/dashboard")}>← VOLTAR</button>
        <h1 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>DocMaster — EMITIR ATESTADO</h1>
        <div />
      </div>
      <div style={{ display: "flex", flex: 1, padding: "10px", gap: 10, overflow: "hidden" }}>
        <div style={{ width: 612, overflowY: "auto", paddingRight: 5 }}>
          <div style={cardStyle}>
            <p style={secTitle}>🔍 1. Buscar Médico</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <SearchSelect label="UF" value={filtroUF} options={UFS} onChange={setFiltroUF} />
              <SearchSelect label="Cidade" value={filtroCidade} options={cidades} onChange={setFiltroCidade} disabled={!filtroUF} />
            </div>
            <button style={{ width: "100%", background: "#005CA9", color: "#fff", border: "none", borderRadius: 7, padding: "10px", fontWeight: 700, cursor: "pointer" }} onClick={() => handleSubmit()}>EMITIR ATESTADO</button>
          </div>
          {/* ... rest of form inputs ... */}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f8fafc", borderRadius: 10, position: "relative" }}>
           <div id="preview-container" style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
              <div style={{ width: 794, transform: `scale(${zoomScale}) translateY(${zoomTranslateY}px)`, transformOrigin: "top center", transition: "transform 0.5s ease" }}>
                <AttestationDocument
                  ref={previewRef}
                  data={previewData}
                  logoLeft={logoLeft}
                  logoRight={logoRight}
                  signatureColor={signatureColor}
                  signatureImage={signatureImage}
                  documentType={documentType}
                  stampScale={stampScale}
                  stampX={stampX}
                  stampY={stampY}
                  stampRotate={stampRotate}
                  hideQRCode={hideQRCode}
                  showStampInfo={showStampInfo}
                  modoCarimbo={form.modoCarimbo}
                  isExporting={false}
                />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
