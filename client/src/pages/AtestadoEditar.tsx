import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import AttestationDocument, { type AttestationData } from "@/components/AttestationDocument";
import { exportElementToPDF, generatePDFFilename } from "@/lib/pdfExport";
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

const TEXTO_PADRAO = `Atesto para os devidos fins que o(a) paciente acima identificado(a) compareceu a esta unidade de saúde na data de hoje para atendimento médico. Necessita de 03 (três) dia(s) de afastamento de suas atividades laborais para repouso e tratamento de saúde.`;

const TEXTO_LAUDO = `Declaro, para os devidos fins, que a paciente acima mencionada apresenta limitações físicas decorrentes de procedimento cirúrgico na coluna vertebral.

Atualmente, a mesma não possui condições de exercer atividades laborativas, devido às seguintes restrições:
• Necessidade de uso de apoio para deambulação (locomoção);
• Dificuldade para permanecer em pé por períodos prolongados;
• Limitação funcional que compromete atividades que exigem esforço físico ou permanência contínua em postura ortostática (em pé).

Diante do quadro apresentado, recomenda-se afastamento de atividades trabalhistas por tempo indeterminado, devendo ser reavaliada periodicamente conforme evolução clínica.`;

// ─── Máscaras ─────────────────────────────────────────────────────────────────
function maskCPF(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

function maskCNS(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 15);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0,3)} ${d.slice(3)}`;
  if (d.length <= 11) return `${d.slice(0,3)} ${d.slice(3,7)} ${d.slice(7)}`;
  return `${d.slice(0,3)} ${d.slice(3,7)} ${d.slice(7,11)} ${d.slice(11)}`;
}

function handleDateInput(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0,2)}/${d.slice(2)}`;
  return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`;
}

function todayBR() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}
function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function optimizeImageForUpload(file: File, options?: { maxWidth?: number; maxHeight?: number; quality?: number }) {
  const { maxWidth = 1400, maxHeight = 1400, quality = 0.82 } = options || {};

  if (!file.type.startsWith("image/")) {
    return readFileAsBase64(file);
  }

  const originalDataUrl = await readFileAsBase64(file);

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const width = img.width || maxWidth;
      const height = img.height || maxHeight;
      const ratio = Math.min(1, maxWidth / width, maxHeight / height);
      const targetWidth = Math.max(1, Math.round(width * ratio));
      const targetHeight = Math.max(1, Math.round(height * ratio));

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(originalDataUrl);
        return;
      }

      // Se não for PNG, preencher fundo com branco para evitar fundo preto em transparências convertidas
      if (file.type !== "image/png") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const preferredType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const optimizedDataUrl = canvas.toDataURL(preferredType, quality);

      resolve(optimizedDataUrl.length < originalDataUrl.length ? optimizedDataUrl : originalDataUrl);
    };
    img.onerror = () => resolve(originalDataUrl);
    img.src = originalDataUrl;
  });
}

async function parseJsonResponseSafely(res: Response) {
  const rawText = await res.text();
  const trimmed = rawText.trim();

  if (!trimmed) {
    throw new Error("O servidor retornou uma resposta vazia.");
  }

  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html") || trimmed.startsWith("<")) {
    throw new Error(`Erro do servidor (HTTP ${res.status}).`);
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error(`Resposta inválida do servidor (HTTP ${res.status}).`);
  }
}

function getUploadSizeInBytes(value?: string) {
  if (!value) return 0;
  const base64 = value.includes(",") ? value.split(",")[1] || "" : value;
  return Math.ceil((base64.length * 3) / 4);
}

// ─── Tipos ─────────────────────────────────────────────────────────────────────
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
  telefone?: string;
}

// ─── Componente ────────────────────────────────────────────────────────────────
export default function AtestadoEditar() {
  const { user, updateBalance } = useAuth();
  const { validityDays } = useSettings();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  const previewRef = useRef<HTMLDivElement>(null);
  
  // ── ESTADOS (Declarados no topo para evitar ReferenceError) ────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [autoDownloadTriggered, setAutoDownloadTriggered] = useState(false);

  // ── Logos ──────────────────────────────────────────────────────────────────
  const [logoLeft, setLogoLeft] = useState<string>("");
  const [logoRight, setLogoRight] = useState<string>("");
  const [logoSide, setLogoSide] = useState<"left" | "right">("left");
  const logoLeftRef = useRef<HTMLInputElement>(null);
  const logoRightRef = useRef<HTMLInputElement>(null);

  // ── Escala e posição dos logos ─────────────────────────────────────────────
  const [logoLeftScale, setLogoLeftScale] = useState<number>(1);
  const [logoRightScale, setLogoRightScale] = useState<number>(1);
  const [logoLeftX, setLogoLeftX] = useState<number>(0);
  const [logoLeftY, setLogoLeftY] = useState<number>(0);
  const [logoRightX, setLogoRightX] = useState<number>(0);
  const [logoRightY, setLogoRightY] = useState<number>(0);

  // ── Assinatura ─────────────────────────────────────────────────────────────
  const [signatureColor, setSignatureColor] = useState<string>("#000000");
  const [signatureImage, setSignatureImage] = useState<string>("");
  const signatureRef = useRef<HTMLInputElement>(null);

  // ── Carimbo Interativo Elite 2.0 ───────────────────────────────────────────
  const [stampScale, setStampScale] = useState<number>(1.2);
  const [stampX, setStampX] = useState<number>(141); 
  const [stampY, setStampY] = useState<number>(-120); 
  const [stampRotate, setStampRotate] = useState<number>(-3);
  const [hideQRCode, setHideQRCode] = useState<boolean>(false);
  const [showStampInfo, setShowStampInfo] = useState<boolean>(true);

  // ── Tipo de documento ──────────────────────────────────────────
  const [tipoDoc, setTipoDoc] = useState<"CPF" | "CNS">("CPF");
  const [documentType, setDocumentType] = useState<'atestado' | 'laudo' | 'relatorio'>('atestado');
  const [codigoQR, setCodigoQR] = useState("");

  // ── Formulário ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    instituicao: "",
    unidade: "",
    enderecoEmitente: "",
    medico: "",
    crm: "",
    especialidade: "",
    paciente: "",
    sexo: "FEMALE" as "MALE" | "FEMALE",
    nascimento: "",
    docValue: "",
    nomeMae: "",
    endereco: "",
    cid: "",
    cidDisplay: "",
    cidNome: "",
    afastamento: "3",
    textoAtestado: TEXTO_PADRAO,
    dataAssinatura: todayBR(),
    horaAssinatura: nowTime(),
    dataEmissao: todayBR(),
    cidade: "",
    modoCarimbo: false,
  });

  // ── API de CPF ─────────────────────────────────────────────────────────────
  const [cpfLoading, setCpfLoading] = useState(false);
  const [cpfStatus, setCpfStatus] = useState<"idle" | "ok" | "error" | "not_found">("idle");
  const [cpfMsg, setCpfMsg] = useState("");

  // ── Busca de médicos ────────────────────────────────────────────────────────
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
  const skipClearUnidade = useRef(false);

  // ── Importação rápida ───────────────────────────────────────────────────────
  const [importTexto, setImportTexto] = useState("");
  const [showImport, setShowImport] = useState(false);

  // ── CEP do paciente ─────────────────────────────────────────────────────────
  const [cepPaciente, setCepPaciente] = useState("");
  const [cepNumero, setCepNumero] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepUFPreenchida, setCepUFPreenchida] = useState(""); 

  const [searchUF, setSearchUF] = useState("");
  const [searchCidade, setSearchCidade] = useState("");
  const [searchBairro, setSearchBairro] = useState("");

  // ── Preview Inteligente ─────────────────────────
  const [zoomScale, setZoomScale] = useState(0.65);
  const [zoomTranslateY, setZoomTranslateY] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [previewMode, setPreviewMode] = useState<"auto" | "full">("auto");
  const [currentSection, setCurrentSection] = useState<"top" | "bottom">("top");

  // ── EFEITOS E LÓGICA ───────────────────────────────────────────────────────

  // Giro aleatório a cada emissão para realismo
  const generateRandomGiro = () => parseFloat((Math.random() * (10 - (-10)) + (-10)).toFixed(1));

  // Gerador de posições randômicas
  const generateRandomPos = () => ({
    x: Math.floor(Math.random() * (141 - (-131) + 1)) + (-131),
    y: Math.floor(Math.random() * ((-120) - (-208) + 1)) + (-208)
  });

  useEffect(() => {
    if (documentType === 'relatorio') {
      if (!form.textoAtestado || form.textoAtestado === TEXTO_PADRAO || form.textoAtestado === TEXTO_LAUDO) {
        const patientName = form.paciente || "NOME DO PACIENTE";
        const relatorioTemplate = `ATESTO para os fins de comprovação profissional que ${patientName.toUpperCase()} foi, por mim atendido(a) na data abaixo, estando sem condições de assumir suas atividades profissionais por ( ${form.afastamento || "3"} ) dias.

A resolução CFM Nº 1.658/2002, art. 5º, parágrafo único, determina que os médicos somente podem informar o diagnóstico nos atestados (CID) nas hipóteses de exercício de dever legal ou por solicitação do próprio paciente ou seu responsável legal.

Sendo assim, eu ${patientName.toUpperCase()} expressamente solicito que seja informado neste atestado médico o diagnóstico, codificado (CID) relativo à patologia que originou este documento.`;
        setForm(prev => ({ ...prev, textoAtestado: relatorioTemplate }));
      }
    } else if (documentType === 'laudo') {
      if (!form.textoAtestado || form.textoAtestado === TEXTO_PADRAO) {
        setForm(prev => ({ ...prev, textoAtestado: TEXTO_LAUDO }));
      }
    } else {
      if (!form.textoAtestado || form.textoAtestado === TEXTO_LAUDO) {
        setForm(prev => ({ ...prev, textoAtestado: TEXTO_PADRAO }));
      }
    }
  }, [documentType]);

  useEffect(() => {
    if (hideQRCode) {
      setStampX(-3); setStampY(-64); setStampScale(1.10); setStampRotate(-3);
    } else {
      const pos = generateRandomPos();
      setStampX(pos.x); setStampY(pos.y); setStampScale(1.20); setStampRotate(generateRandomGiro());
    }
  }, [hideQRCode]);

  const resetStampTransform = () => {
    if (hideQRCode) {
      setStampScale(1.10); setStampX(-3); setStampY(-64); setStampRotate(-3);
    } else {
      const pos = generateRandomPos();
      setStampScale(1.20); setStampX(pos.x); setStampY(pos.y); setStampRotate(generateRandomGiro());
    }
  };

  const STAMP_POS_STEP = 8;
  const STAMP_ROTATE_STEP = 1;

  const getFitScale = useCallback(() => {
    const container = document.getElementById("preview-container");
    if (!container) return 0.65;
    const scaleX = (container.offsetWidth - 20) / 794;
    const scaleY = (container.offsetHeight - 20) / 1123;
    return Math.min(scaleX, scaleY, 1.0);
  }, []);

  const scrollToPreviewSection = useCallback((section: "top" | "bottom") => {
    if (previewMode === "full") return;
    const container = document.getElementById("preview-container");
    if (container) {
      const focusScale = Math.min((container.offsetWidth - 30) / 794, 1.05);
      let targetY = section === "top" ? 15 : (container.offsetHeight - (1123 * focusScale) - 15);
      setZoomScale(focusScale); setZoomTranslateY(targetY); setCurrentSection(section); setIsFocused(true);
    }
  }, [previewMode]);

  const handleFocusSection = (sectionId: string) => {
    const isTop = sectionId === "preview-header" || sectionId === "preview-patient" || sectionId === "preview-top";
    scrollToPreviewSection(isTop ? "top" : "bottom");
  };

  const resetPreviewZoom = () => { setZoomScale(getFitScale()); setZoomTranslateY(0); setIsFocused(false); setCurrentSection("top"); };

  // ── Buscar dados do documento ──────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/attestations/${id}`, { credentials: "include" })
      .then(res => res.json())
      .then((res: any) => {
        if (!res.success) { setNotFound(true); return; }
        const d = res.data;
        setForm({
          instituicao: d.instituicao || "", unidade: d.unidade || "", enderecoEmitente: d.endereco_emitente || "",
          medico: d.medico || "", crm: d.crm || "", especialidade: d.especialidade || "",
          paciente: d.paciente || "", sexo: d.sexo || "FEMALE", nascimento: d.nascimento || "",
          docValue: d.cpf || d.cns || "", nomeMae: d.nome_mae || "", endereco: d.endereco || "",
          cid: d.cid || "", cidDisplay: d.cid_display || d.cid || "", cidNome: d.cid_nome || "",
          afastamento: d.afastamento || "3", textoAtestado: d.texto_atestado || TEXTO_PADRAO,
          dataAssinatura: d.data_assinatura || todayBR(), horaAssinatura: d.hora_assinatura || nowTime(),
          dataEmissao: d.data_emissao || todayBR(), cidade: d.cidade || "", modoCarimbo: d.modo_carimbo || false,
        });
        setTipoDoc(d.cns && !d.cpf ? "CNS" : "CPF");
        setDocumentType(d.document_type || "atestado");
        setCodigoQR(d.codigo_qr || "");
        setLogoLeft(d.logo_url || ""); setLogoRight(d.logo_right || "");
        setSignatureColor(d.signature_color || "#0b109f"); setSignatureImage(d.signature_image || "");
        setLogoLeftScale(d.logo_left_scale || 1); setLogoRightScale(d.logo_right_scale || 1);
        setLogoLeftX(d.logo_left_x || 0); setLogoLeftY(d.logo_left_y || 0);
        setLogoRightX(d.logo_right_x || 0); setLogoRightY(d.logo_right_y || 0);
        setStampScale(d.stamp_scale || 1.2); setStampX(d.stamp_x || 141);
        setStampY(d.stamp_y || -120); setStampRotate(d.stamp_rotate || -3);
        setHideQRCode(d.hide_qr_code === 1); setShowStampInfo(d.show_stamp_info !== 0);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setSavedMsg("");
    try {
      const payload = { ...form, documentType, logoUrl: logoLeft, logoRight, signatureImage, signatureColor, logoLeftScale, logoRightScale, logoLeftX, logoLeftY, logoRightX, logoRightY, stampScale, stampX, stampY, stampRotate, hideQRCode, showStampInfo };
      const res = await fetch(`/api/attestations/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(payload) });
      const data = await res.json() as any;
      if (data.success) { setSavedMsg("✅ Documento salvo!"); setTimeout(() => setSavedMsg(""), 3000); }
      else alert(data.error || "Erro ao salvar.");
    } catch { alert("Erro ao salvar."); }
    finally { setSaving(false); }
  };

  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    try {
      setIsExporting(true);
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;background:white;";
      document.body.appendChild(container);
      const clone = previewRef.current.cloneNode(true) as HTMLElement;
      clone.style.transform = "none"; container.appendChild(clone);
      await new Promise(r => setTimeout(r, 800));
      await exportElementToPDF(clone, { filename: generatePDFFilename(form.paciente, documentType), docType: documentType, scale: 2 });
      document.body.removeChild(container);
    } catch { alert("Erro ao exportar PDF."); }
    finally { setIsExporting(false); }
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>Carregando...</div>;
  if (notFound) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>Documento não encontrado.</div>;

  const previewData: AttestationData & Record<string, any> = {
    ...form, id, codigoQR,
    dataEmissaoFormatada: (() => {
      if (!form.dataEmissao || form.dataEmissao.length < 10) return "";
      const [dd, mm, yyyy] = form.dataEmissao.split("/");
      const meses = ["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
      return `${form.cidade}, ${parseInt(dd)} DE ${meses[parseInt(mm)-1]} DE ${yyyy}`;
    })()
  };

  return (
    <div style={{ height: "100vh", overflow: "hidden", background: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#005CA9", padding: "10px 20px", color: "#fff", fontWeight: 700 }}>DocMaster — EDITAR ATESTADO</div>
      <div style={{ display: "flex", flex: 1, padding: 10, gap: 10, overflow: "hidden" }}>
        <div style={{ width: 612, overflowY: "auto", paddingRight: 5 }}>
          <form onSubmit={handleSave} style={{ background: "#f8fafc", padding: 15, borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <label style={{ fontSize: 12, fontWeight: 700 }}>Tipo de Documento</label>
            <div style={{ display: "flex", gap: 10, marginTop: 5 }}>
              {['atestado', 'laudo', 'relatorio'].map(t => (
                <button key={t} type="button" onClick={() => setDocumentType(t as any)} style={{ flex: 1, padding: 8, borderRadius: 6, fontWeight: 700, textTransform: "uppercase", background: documentType === t ? "#005CA9" : "#e2e8f0", color: documentType === t ? "#fff" : "#000" }}>{t}</button>
              ))}
            </div>
            <div style={{ marginTop: 15 }}>
               <label style={{ fontSize: 12, fontWeight: 700 }}>Paciente</label>
               <input style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6 }} value={form.paciente} onChange={e => setForm(p => ({ ...p, paciente: e.target.value }))} />
            </div>
            <div style={{ marginTop: 15 }}>
               <label style={{ fontSize: 12, fontWeight: 700 }}>Texto</label>
               <textarea rows={8} style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6 }} value={form.textoAtestado} onChange={e => setForm(p => ({ ...p, textoAtestado: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
               <button type="submit" disabled={saving} style={{ flex: 1, padding: 12, background: "#005CA9", color: "#fff", fontWeight: 700, border: "none", borderRadius: 8 }}>{saving ? "Salvando..." : "SALVAR ALTERAÇÕES"}</button>
               <button type="button" onClick={handleExportPDF} style={{ flex: 1, padding: 12, background: "#16a34a", color: "#fff", fontWeight: 700, border: "none", borderRadius: 8 }}>EXPORTAR PDF</button>
            </div>
            {savedMsg && <p style={{ color: "#16a34a", fontSize: 12, marginTop: 10, textAlign: "center", fontWeight: 700 }}>{savedMsg}</p>}
          </form>
        </div>
        <div style={{ flex: 1, position: "relative", background: "#f1f5f9", borderRadius: 10, display: "flex", justifyContent: "center", alignItems: "flex-start", overflow: "hidden" }} id="preview-container">
          <div style={{ width: 794, transform: `scale(${zoomScale}) translateY(${zoomTranslateY}px)`, transformOrigin: "top center", transition: "transform 0.3s" }}>
            <AttestationDocument ref={previewRef} data={previewData} documentType={documentType} logoLeft={logoLeft} logoRight={logoRight} signatureImage={signatureImage} signatureColor={signatureColor} isExporting={isExporting} />
          </div>
        </div>
      </div>
    </div>
  );
}
