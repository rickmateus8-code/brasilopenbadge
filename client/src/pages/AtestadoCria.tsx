import AttestationDocument from "@/components/AttestationDocument";
import { downloadAttestationPdf } from "@/lib/attestationActions";
import { generatePDFFilename } from "@/lib/pdfExport";
import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { validarCPF } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import { 
  Plus, Search, FileText, Trash, ChevronUp, ChevronDown, CheckCircle2, AlertCircle, 
  ArrowLeft, Download, ZoomIn, ZoomOut, Maximize2, Settings2, Trash2, MapPin, 
  User, Clipboard, Calendar, Clock, Stethoscope, Building, Image as ImageIcon,
  Check, X, Sparkles, Filter, MoreHorizontal, History, RefreshCcw, Save, Move
} from "lucide-react";
import { toast } from "sonner";

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

const LOGOS_PADRAO = [
  { id: "logo1", label: "Logo 1", src: "/logos/logo1.png" },
  { id: "logo2", label: "Logo 2", src: "/logos/logo2.png" },
  { id: "logo3", label: "Logo 3", src: "/logos/logo3.jpg" },
  { id: "amil", label: "Amil", src: "/logos/amil.png" },
  { id: "hapvida", label: "Hapvida", src: "/logos/hapvida.png" },
  { id: "notredame", label: "Notre Dame", src: "/logos/notredame.png" },
  { id: "sulamerica", label: "Sul América", src: "/logos/sulamerica.png" },
  { id: "unimed", label: "Unimed", src: "/logos/unimed.png" },
];

const DIAS_EXTENSO: Record<number, { num: string; ext: string }> = {
  1: { num: "01", ext: "um" },
  2: { num: "02", ext: "dois" },
  3: { num: "03", ext: "três" },
  4: { num: "04", ext: "quatro" },
  5: { num: "05", ext: "cinco" },
  6: { num: "06", ext: "seis" },
  7: { num: "07", ext: "sete" },
  8: { num: "08", ext: "oito" },
  9: { num: "09", ext: "nove" },
  10: { num: "10", ext: "dez" },
  11: { num: "11", ext: "onze" },
  12: { num: "12", ext: "doze" },
  13: { num: "13", ext: "treze" },
  14: { num: "14", ext: "quatorze" },
  15: { num: "15", ext: "quinze" },
};

function gerarTextoAfastamento(dias: number): string {
  const d = DIAS_EXTENSO[dias];
  if (!d) return "";
  const unidade = dias === 1 ? "dia" : "dias";
  return `Necessita de ${d.num} (${d.ext}) ${unidade} de afastamento de suas atividades laborais para repouso e tratamento de saúde.`;
}

const TEXTO_PADRAO = `Atesto para os devidos fins que o(a) paciente acima identificado(a) compareceu a esta unidade de saúde na data de hoje para atendimento médico. Necessita de 03 (três) dia(s) de afastamento de suas atividades laborais para repouso e tratamento de saúde.`;

const TEXTO_LAUDO = `Declaro, para os devidos fins, que a paciente acima mencionada apresenta limitações físicas decorrentes de procedimento cirúrgico na coluna vertebral. Atualmente, a mesma não possui condições de exercer atividades laborativas.`;

function todayBR() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

async function optimizeImageForUpload(file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const max = 1200;
        let w = img.width, h = img.height;
        if (w > max || h > max) {
          if (w > h) { h *= max / w; w = max; }
          else { w *= max / h; h = max; }
        }
        canvas.width = w; canvas.height = h;
        ctx?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function handleDateInput(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

async function parseJsonResponseSafely(res: Response) {
  const t = await res.text();
  try { return JSON.parse(t); } catch { throw new Error("Erro no servidor"); }
}

const POS_STEP = 1;
const SCALE_STEP = 0.05;
const STAMP_POS_STEP = 5;

interface MedicoDB {
  id: number; nome_medico: string; crm: string; uf_crm: string; especialidade: string;
  local_trabalho: string; cidade: string; uf_local: string; endereco: string; bairro: string;
}

export default function AtestadoCria() {
  const { user, updateBalance } = useAuth();
  const [, navigate] = useLocation();
  const { validityDays } = useSettings();
  const previewRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [autoDownloadTriggered, setAutoDownloadTriggered] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const [logoLeft, setLogoLeft] = useState("");
  const [logoRight, setLogoRight] = useState("");
  const [logoSide, setLogoSide] = useState<"left" | "right">("left");
  const [logoLeftScale, setLogoLeftScale] = useState(1);
  const [logoRightScale, setLogoRightScale] = useState(1);
  const [logoLeftX, setLogoLeftX] = useState(0);
  const [logoLeftY, setLogoLeftY] = useState(0);
  const [logoRightX, setLogoRightX] = useState(0);
  const [logoRightY, setLogoRightY] = useState(0);
  const [signatureColor, setSignatureColor] = useState("#0b109f");
  const [signatureImage, setSignatureImage] = useState("");
  const [stampScale, setStampScale] = useState(1.2);
  const [stampX, setStampX] = useState(141);
  const [stampY, setStampY] = useState(-120);
  const [stampRotate, setStampRotate] = useState(-3);
  const [hideQRCode, setHideQRCode] = useState(false);
  const [showStampInfo, setShowStampInfo] = useState(true);

  const [tipoDoc, setTipoDoc] = useState<"CPF" | "CNS">("CPF");
  const [documentType, setDocumentType] = useState<'atestado' | 'laudo'>('atestado');
  const [filtroUF, setFiltroUF] = useState("");
  const [filtroCidade, setFiltroCidade] = useState("");
  const [cidades, setCidades] = useState<string[]>([]);
  const [resultados, setResultados] = useState<MedicoDB[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [showResultados, setShowResultados] = useState(false);
  const [showEditar, setShowEditar] = useState(true);
  const [termoBusca, setTermoBusca] = useState("");

  const [form, setForm] = useState({
    instituicao: "", unidade: "", enderecoEmitente: "", medico: "", crm: "", especialidade: "",
    paciente: "", sexo: "FEMALE" as "MALE" | "FEMALE", nascimento: "", docValue: "", nomeMae: "",
    endereco: "", cid: "", cidDisplay: "", cidNome: "", afastamento: "3", textoAtestado: TEXTO_PADRAO,
    dataAssinatura: todayBR(), horaAssinatura: nowTime(), dataEmissao: todayBR(), cidade: "", modoCarimbo: false,
  });

  const [zoomScale, setZoomScale] = useState(0.65);
  const [zoomTranslateY, setZoomTranslateY] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [currentSection, setCurrentSection] = useState<"top" | "bottom">("top");

  const previewData = { ...form, id: "XXXX.XXXX", codigoQR: "XXXX.XXXX" };

  useEffect(() => {
    if (filtroUF) apiFetch(`/cidades?uf=${filtroUF}`).then(setCidades).catch(() => {});
  }, [filtroUF]);

  const buscarMedicos = async () => {
    if (!filtroUF || !filtroCidade) return;
    setBuscando(true); setShowResultados(true);
    try {
      const data = await apiFetch(`/busca?uf=${filtroUF}&cidade=${encodeURIComponent(filtroCidade)}&q=${encodeURIComponent(termoBusca)}`);
      setResultados(data.results || []);
    } catch { toast.error("Erro na busca"); }
    finally { setBuscando(false); }
  };

  const selecionarMedico = (m: MedicoDB) => {
    setForm(p => ({
      ...p, medico: m.nome_medico, crm: `CRM/${m.uf_crm} ${m.crm}`, especialidade: m.especialidade,
      unidade: m.local_trabalho, enderecoEmitente: `${m.endereco}${m.bairro ? `, ${m.bairro}` : ""}, ${m.cidade}/${m.uf_local}`,
      cidade: m.cidade, instituicao: `PREFEITURA DE ${m.cidade.toUpperCase()}`,
    }));
    setShowResultados(false);
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const payload = { ...form, logoUrl: logoLeft, logoRight, signatureColor, signatureImage, logoLeftScale, logoRightScale, logoLeftX, logoLeftY, logoRightX, logoRightY, stampScale, stampX, stampY, stampRotate, hideQRCode, showStampInfo, modoCarimbo: form.modoCarimbo, documentType, cidade: form.cidade };
      await downloadAttestationPdf(payload);
    } catch (err: any) { toast.error("Erro ao gerar PDF"); }
    finally { setIsDownloadingPdf(false); }
  };

  useEffect(() => {
    if (showSuccessModal && !autoDownloadTriggered) {
      setAutoDownloadTriggered(true);
      handleDownloadPdf().then(() => {
        setTimeout(() => { setShowSuccessModal(false); navigate("/atestadosalvos"); }, 1500);
      });
    }
  }, [showSuccessModal, autoDownloadTriggered]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const payload = { ...form, cpf: tipoDoc === "CPF" ? form.docValue : "", cns: tipoDoc === "CNS" ? form.docValue : "", logoUrl: logoLeft, logoRight, signatureColor, signatureImage, logoLeftScale, logoRightScale, logoLeftX, logoLeftY, logoRightX, logoRightY, stampScale, stampX, stampY, stampRotate, hideQRCode, showStampInfo, documentType };
      const res = await fetch("/api/attestations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await parseJsonResponseSafely(res);
      if (!res.ok || !data.success) throw new Error(data.error);
      if (data.newBalance !== undefined) updateBalance(data.newBalance);
      setShowSuccessModal(true);
    } catch (e: any) { toast.error(e.message); }
    finally { setIsLoading(false); }
  };

  const btnBlue: React.CSSProperties = { background: "#005CA9", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontWeight: 700, cursor: "pointer" };
  const inp: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none", color: "#000" };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4, textTransform: "uppercase" };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9", overflow: "hidden" }}>
      {showSuccessModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.9)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", padding: 40, borderRadius: 20, textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}>
            <CheckCircle2 size={48} color="#16a34a" style={{ margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>Sucesso!</h2>
            <p style={{ fontSize: 14, color: "#666" }}>Documento emitido e download iniciado...</p>
          </div>
        </div>
      )}
      <div style={{ background: "#005CA9", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fff" }}>
        <button onClick={() => navigate("/dashboard")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 6, padding: "6px 12px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>← VOLTAR</button>
        <span style={{ fontWeight: 800, fontSize: 16 }}>DOCMASTER — EMITIR ATESTADO</span>
        <div style={{ width: 80 }} />
      </div>
      <div style={{ flex: 1, display: "flex", padding: 12, gap: 12, overflow: "hidden" }}>
        <div style={{ width: 550, overflowY: "auto", background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: "#005CA9", marginBottom: 12, borderBottom: "2px solid #005CA9", paddingBottom: 6 }}>🔍 1. SELECIONAR MÉDICO</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <SearchSelect label="UF" value={filtroUF} options={UFS} onChange={setFiltroUF} />
            <SearchSelect label="Cidade" value={filtroCidade} options={cidades} onChange={setFiltroCidade} disabled={!filtroUF} />
          </div>
          <input style={{ ...inp, marginBottom: 10 }} placeholder="NOME OU CRM..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)} />
          <button onClick={buscarMedicos} style={{ ...btnBlue, width: "100%", marginBottom: 12 }} disabled={buscando}>{buscando ? "Buscando..." : "BUSCAR MÉDICO"}</button>
          
          {showResultados && resultados.length > 0 && (
            <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 16 }}>
              {resultados.map(r => (
                <div key={r.id} onClick={() => selecionarMedico(r)} style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#005CA9" }}>{r.nome_medico}</div>
                  <div style={{ fontSize: 11, color: "#666" }}>{r.crm} • {r.especialidade}</div>
                </div>
              ))}
            </div>
          )}

          <details open={showEditar}>
            <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#005CA9", marginBottom: 10 }}>✏️ EDITAR DADOS EMITENTE</summary>
            <div style={{ display: "grid", gap: 10 }}>
              <div><label style={lbl}>Local</label><input style={inp} value={form.unidade} onChange={e => setForm(p => ({ ...p, unidade: e.target.value }))} /></div>
              <div><label style={lbl}>Endereço</label><input style={inp} value={form.enderecoEmitente} onChange={e => setForm(p => ({ ...p, enderecoEmitente: e.target.value }))} /></div>
              <div><label style={lbl}>Médico</label><input style={inp} value={form.medico} onChange={e => setForm(p => ({ ...p, medico: e.target.value }))} /></div>
              <div><label style={lbl}>CRM</label><input style={inp} value={form.crm} onChange={e => setForm(p => ({ ...p, crm: e.target.value }))} /></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={form.modoCarimbo} onChange={e => setForm(p => ({ ...p, modoCarimbo: e.target.checked }))} /> <label style={lbl}>Modo Carimbo Elite</label></div>
            </div>
          </details>

          <p style={{ fontSize: 12, fontWeight: 800, color: "#005CA9", margin: "20px 0 12px", borderBottom: "2px solid #005CA9", paddingBottom: 6 }}>👤 2. DADOS DO PACIENTE</p>
          <div style={{ display: "grid", gap: 10 }}>
            <div><label style={lbl}>Nome do Paciente</label><input style={inp} value={form.paciente} onChange={e => setForm(p => ({ ...p, paciente: e.target.value }))} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><label style={lbl}>CPF</label><input style={inp} value={form.docValue} onChange={e => setForm(p => ({ ...p, docValue: handleDateInput(e.target.value) }))} /></div>
              <div><label style={lbl}>Nascimento</label><input style={inp} value={form.nascimento} onChange={e => setForm(p => ({ ...p, nascimento: handleDateInput(e.target.value) }))} /></div>
            </div>
          </div>
          
          <button onClick={handleSubmit} style={{ ...btnBlue, width: "100%", height: 50, fontSize: 15, marginTop: 24, background: "#16a34a" }} disabled={isLoading}>{isLoading ? "EMITINDO..." : "EMITIR AGORA"}</button>
        </div>

        <div style={{ flex: 1, background: "#fff", borderRadius: 12, overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: 20 }}>
          <div style={{ width: 794, transform: "scale(0.7)", transformOrigin: "top center", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
            <AttestationDocument data={previewData} logoLeft={logoLeft} logoRight={logoRight} signatureColor={signatureColor} signatureImage={signatureImage} documentType={documentType} stampScale={stampScale} stampX={stampX} stampY={stampY} stampRotate={stampRotate} hideQRCode={hideQRCode} showStampInfo={showStampInfo} modoCarimbo={form.modoCarimbo} isExporting={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
