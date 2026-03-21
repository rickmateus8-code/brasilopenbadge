/**
 * ReceitaCria — Emissão de Receituário Médico
 *
 * Tipos suportados:
 * - Simples (branco)
 * - Controle Especial (tarja amarela)
 * - Antimicrobiano (tarja azul)
 *
 * Segurança: QR Code gerado exclusivamente no servidor após emissão.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import PrescricaoDocument from "@/components/PrescricaoDocument";
import type { PrescricaoItem } from "@/components/PrescricaoDocument";
import { exportElementToPDF, generatePDFFilename } from "@/lib/pdfExport";
import { useAuth } from "@/contexts/AuthContext";

// ─── API de Médicos ────────────────────────────────────────────────────────────
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

// ─── Máscaras ─────────────────────────────────────────────────────────────────
function maskCPF(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
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

type TipoReceituario = "simples" | "controle_especial" | "antimicrobiano";

// ─── Componente ────────────────────────────────────────────────────────────────
export default function ReceitaCria() {
  const { user, updateBalance } = useAuth();
  const [, navigate] = useLocation();
  const previewRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // ── Logos ──────────────────────────────────────────────────────────────────
  const [logoLeft, setLogoLeft] = useState<string>("");
  const [logoRight, setLogoRight] = useState<string>("");
  const [logoSide, setLogoSide] = useState<"left" | "right">("left");
  const logoLeftRef = useRef<HTMLInputElement>(null);
  const logoRightRef = useRef<HTMLInputElement>(null);

  // ── Assinatura ─────────────────────────────────────────────────────────────
  const [signatureColor, setSignatureColor] = useState<string>("#0b109f");
  const [signatureImage, setSignatureImage] = useState<string>("");
  const signatureRef = useRef<HTMLInputElement>(null);

  // ── Tipo de receituário ────────────────────────────────────────────────────
  const [tipoReceituario, setTipoReceituario] = useState<TipoReceituario>("simples");

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
  const [showEditar, setShowEditar] = useState(false);

  // ── Formulário base ─────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    instituicao: "",
    unidade: "",
    enderecoEmitente: "",
    medico: "",
    crm: "",
    especialidade: "",
    paciente: "",
    cpf: "",
    identidade: "",
    endereco: "",
    telefone: "",
    cidade: "",
    dataEmissao: todayBR(),
    horaEmissao: nowTime(),
  });

  // ── Prescrição (lista de medicamentos) ─────────────────────────────────────
  const [prescricao, setPrescricao] = useState<PrescricaoItem[]>([
    { numero: 1, uso_interno: true, medicamento: "", quantidade: "", modo_uso: "" },
  ]);

  // ── Carregar cidades ao selecionar UF ─────────────────────────────────────
  useEffect(() => {
    if (!filtroUF) { setCidades([]); setFiltroCidade(""); return; }
    apiFetch(`/cidades?uf=${filtroUF}`)
      .then((d) => setCidades(d.cidades || []))
      .catch(() => setCidades([]));
  }, [filtroUF]);

  // ── Carregar bairros ao selecionar cidade ─────────────────────────────────
  useEffect(() => {
    if (!filtroUF || !filtroCidade) { setBairros([]); setFiltroBairro(""); return; }
    apiFetch(`/bairros?uf=${filtroUF}&cidade=${encodeURIComponent(filtroCidade)}`)
      .then((d) => setBairros(d.bairros || []))
      .catch(() => setBairros([]));
  }, [filtroUF, filtroCidade]);

  // ── Carregar locais ao selecionar bairro ──────────────────────────────────
  useEffect(() => {
    if (!filtroUF || !filtroCidade) { setLocais([]); setFiltroLocal(""); return; }
    const params = new URLSearchParams({ uf: filtroUF, cidade: filtroCidade });
    if (filtroBairro) params.set("bairro", filtroBairro);
    apiFetch(`/locais?${params}`)
      .then((d) => setLocais(d.locais || []))
      .catch(() => setLocais([]));
  }, [filtroUF, filtroCidade, filtroBairro]);

  // ── Preencher instituição ao selecionar cidade ────────────────────────────
  useEffect(() => {
    if (filtroCidade) {
      setForm((p) => ({
        ...p,
        instituicao: `PREFEITURA DE ${filtroCidade.toUpperCase()}`,
        cidade: filtroCidade.toUpperCase(),
        unidade: "",
      }));
    }
  }, [filtroCidade]);

  // ── Buscar médicos ─────────────────────────────────────────────────────────
  const buscarMedicos = useCallback(async () => {
    if (!filtroUF) { setErroBusca("Selecione o estado (UF) antes de buscar."); return; }
    setBuscando(true);
    setErroBusca("");
    setShowResultados(true);
    try {
      const params = new URLSearchParams({ uf: filtroUF });
      if (filtroCidade) params.set("cidade", filtroCidade);
      if (filtroBairro) params.set("bairro", filtroBairro);
      if (filtroLocal) params.set("local", filtroLocal);
      if (filtroEsp) params.set("especialidade", filtroEsp);
      if (termoBusca.trim()) params.set("nome", termoBusca.trim());
      const data = await apiFetch(`/buscar?${params}`);
      setResultados(data.medicos || []);
      if ((data.medicos || []).length === 0) setErroBusca("Nenhum médico encontrado. Tente outros filtros.");
    } catch (err: any) {
      setErroBusca(err.message || "Erro ao buscar médicos.");
    } finally {
      setBuscando(false);
    }
  }, [filtroUF, filtroCidade, filtroBairro, filtroLocal, filtroEsp, termoBusca]);

  // ── Auto-buscar ao selecionar cidade ──────────────────────────────────────
  useEffect(() => {
    if (filtroUF && filtroCidade) buscarMedicos();
  }, [filtroUF, filtroCidade, buscarMedicos]);

  // ── Selecionar médico ──────────────────────────────────────────────────────
  const selecionarMedico = (m: MedicoDB) => {
    const localTrabalho = m.local_trabalho?.toUpperCase() || "";
    const cidadeMedico = m.cidade?.toUpperCase() || "";
    setForm((p) => ({
      ...p,
      medico: m.nome_medico.toUpperCase(),
      crm: `CRM/${m.uf_crm || m.uf_local} ${m.crm}`,
      especialidade: (m.especialidade || "CLÍNICO GERAL").toUpperCase(),
      instituicao: cidadeMedico ? `PREFEITURA DE ${cidadeMedico}` : (p.instituicao || "CONSULTÓRIO MÉDICO"),
      unidade: localTrabalho || p.unidade,
      enderecoEmitente: [m.endereco, m.bairro, m.cidade, m.uf_local].filter(Boolean).join(", ").toUpperCase(),
      cidade: cidadeMedico || p.cidade,
    }));
    setShowResultados(false);
    setTermoBusca("");
    setShowEditar(true);
  };

  // ── Upload de logos ─────────────────────────────────────────────────────────
  const handleLogoUpload = async (side: "left" | "right", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await readFileAsBase64(file);
    if (side === "left") setLogoLeft(b64);
    else setLogoRight(b64);
  };

  // ── Upload de assinatura ────────────────────────────────────────────────────
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await readFileAsBase64(file);
    setSignatureImage(b64);
  };

  // ── Gerenciar prescrição ────────────────────────────────────────────────────
  const addMedicamento = () => {
    setPrescricao((p) => [
      ...p,
      { numero: p.length + 1, uso_interno: true, medicamento: "", quantidade: "", modo_uso: "" },
    ]);
  };

  const removeMedicamento = (idx: number) => {
    setPrescricao((p) => p.filter((_, i) => i !== idx).map((item, i) => ({ ...item, numero: i + 1 })));
  };

  const updateMedicamento = (idx: number, field: keyof PrescricaoItem, value: any) => {
    setPrescricao((p) => p.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  // ── Download PDF ────────────────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    try {
      const filename = generatePDFFilename(form.paciente || "RECEITA", "receita");
      await exportElementToPDF(previewRef.current, { filename, scale: 2, quality: 0.92, multiPage: true });
    } catch (err) {
      alert(`Erro ao gerar PDF: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { alert("Você precisa estar logado para emitir."); return; }

    // Validar prescrição
    const prescricaoValida = prescricao.filter((p) => p.medicamento.trim());
    if (prescricaoValida.length === 0) {
      alert("Adicione pelo menos um medicamento à prescrição.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        tipo_receituario: tipoReceituario,
        paciente: form.paciente.toUpperCase(),
        cpf: form.cpf || null,
        identidade: form.identidade || null,
        endereco: form.endereco || null,
        telefone: form.telefone || null,
        cidade: form.cidade || null,
        medico: form.medico.toUpperCase(),
        crm: form.crm,
        especialidade: form.especialidade.toUpperCase(),
        instituicao: form.instituicao || null,
        unidade: form.unidade || null,
        endereco_emitente: form.enderecoEmitente || null,
        prescricao: prescricaoValida,
        data_emissao: form.dataEmissao,
        hora_emissao: form.horaEmissao,
        logo_url: logoLeft || null,
        logo_right: logoRight || null,
        signature_color: signatureColor,
        signature_image: signatureImage || null,
      };

      const res = await fetch("/api/receitas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao emitir receita");
      }
      setCreatedCode(data.data?.codigo_qr || null);
      if (data.newBalance !== undefined) updateBalance(data.newBalance);
      setShowSuccessModal(true);
    } catch (error) {
      alert(`Erro ao emitir: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Estilos ─────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    padding: "14px 16px",
    marginBottom: 12,
  };
  const secTitle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    color: "#005CA9",
    borderBottom: "2px solid #005CA9",
    paddingBottom: 5,
    marginBottom: 10,
  };
  const lbl: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#000",
    marginBottom: 3,
  };
  const inp: React.CSSProperties = {
    width: "100%",
    padding: "6px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    color: "#000",
  };
  const sel: React.CSSProperties = { ...inp, background: "#fff" };
  const btnBlue: React.CSSProperties = {
    background: "#005CA9",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    padding: "8px 16px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    letterSpacing: 0.5,
  };
  const btnGreen: React.CSSProperties = {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    padding: "8px 16px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  };
  const btnGray: React.CSSProperties = {
    background: "#e2e8f0",
    color: "#000",
    border: "1px solid #cbd5e1",
    borderRadius: 7,
    padding: "8px 16px",
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
  };
  const btnRed: React.CSSProperties = {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "4px 10px",
    fontWeight: 700,
    fontSize: 11,
    cursor: "pointer",
  };

  // ── Preview data ────────────────────────────────────────────────────────────
  const previewData = {
    codigoQR: "RX-XXXX-XXXX",
    tipo_receituario: tipoReceituario,
    paciente: form.paciente || "NOME DO PACIENTE",
    cpf: form.cpf || undefined,
    identidade: form.identidade || undefined,
    endereco: form.endereco || undefined,
    telefone: form.telefone || undefined,
    cidade: form.cidade || undefined,
    medico: form.medico || "NOME DO MÉDICO",
    crm: form.crm || "CRM/UF 00000",
    especialidade: form.especialidade || "ESPECIALIDADE",
    instituicao: form.instituicao || (form.cidade ? `PREFEITURA DE ${form.cidade.toUpperCase()}` : undefined),
    unidade: form.unidade || undefined,
    endereco_emitente: form.enderecoEmitente || undefined,
    prescricao: prescricao.filter((p) => p.medicamento.trim()),
    data_emissao: form.dataEmissao || todayBR(),
    hora_emissao: form.horaEmissao,
    logo_url: logoLeft || undefined,
    logo_right: logoRight || undefined,
    signature_color: signatureColor,
    signature_image: signatureImage || undefined,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "Arial, Helvetica, sans-serif" }}>
      {/* ── Modal de Sucesso ── */}
      {showSuccessModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
        }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, maxWidth: 400, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#16a34a", marginBottom: 8 }}>Receita Emitida!</h2>
            {createdCode && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 16px", marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: "#166534", margin: 0, marginBottom: 4 }}>Código de Verificação:</p>
                <p style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: "#15803d", margin: 0, letterSpacing: 2 }}>{createdCode}</p>
                <p style={{ fontSize: 10, color: "#166534", margin: "4px 0 0" }}>Valide em: verificamed.digital</p>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                style={{ ...btnBlue, flex: 1 }}
                disabled={isDownloadingPdf}
                onClick={async () => {
                  setIsDownloadingPdf(true);
                  await handleDownloadPdf();
                  setIsDownloadingPdf(false);
                  setShowSuccessModal(false);
                  navigate("/dashboard");
                }}
              >
                {isDownloadingPdf ? "⏳ Baixando PDF..." : "⬇ BAIXAR PDF"}
              </button>
              <button style={{ ...btnGray, flex: 1 }} onClick={() => { setShowSuccessModal(false); navigate("/dashboard"); }}>
                VER HISTÓRICO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: "#7c3aed", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button style={{ ...btnGray, padding: "5px 12px", fontSize: 11 }} onClick={() => navigate("/dashboard")}>← VOLTAR</button>
          <h1 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>DocMaster — EMITIR RECEITA MÉDICA</h1>
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", background: "rgba(0,0,0,0.15)", padding: "4px 12px", borderRadius: 6, fontWeight: 600 }}>
          🔒 Dados excluídos automaticamente após 60 dias
        </span>
      </div>

      <div style={{ display: "flex", gap: 14, padding: 14, maxWidth: 2000, margin: "0 auto" }}>
        {/* ═══ COLUNA ESQUERDA — FORMULÁRIO ═══ */}
        <div style={{ width: 612, flexShrink: 0, overflowY: "auto", maxHeight: "calc(100vh - 70px)" }}>
          <form onSubmit={handleSubmit}>

            {/* ── Tipo de Receituário ── */}
            <div style={card}>
              <p style={secTitle}>📋 Tipo de Receituário</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {([
                  { value: "simples", label: "Simples", desc: "Branco — uso geral", color: "#374151" },
                  { value: "controle_especial", label: "Controle Especial", desc: "Tarja Amarela — 2 vias", color: "#92400e" },
                  { value: "antimicrobiano", label: "Antimicrobiano", desc: "Tarja Azul — notificação", color: "#1e40af" },
                ] as const).map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTipoReceituario(t.value)}
                    style={{
                      padding: "10px 8px",
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: "pointer",
                      textAlign: "center",
                      border: tipoReceituario === t.value ? `2px solid ${t.color}` : "2px solid #d1d5db",
                      background: tipoReceituario === t.value ? `${t.color}15` : "#f8fafc",
                      color: tipoReceituario === t.value ? t.color : "#374151",
                    }}
                  >
                    <div style={{ marginBottom: 2 }}>{t.label}</div>
                    <div style={{ fontSize: 9, fontWeight: 400, color: "#6b7280" }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── 1. Buscar Médico ── */}
            <div style={card}>
              <p style={secTitle}>🔍 1. Buscar Médico</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={lbl}>Estado (UF) *</label>
                  <select style={sel} value={filtroUF} onChange={(e) => { setFiltroUF(e.target.value); setFiltroCidade(""); }}>
                    <option value="">Selecione o Estado</option>
                    {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Cidade</label>
                  <select style={sel} value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)} disabled={!filtroUF || cidades.length === 0}>
                    <option value="">Selecione a Cidade</option>
                    {cidades.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {bairros.length > 0 && (
                  <div>
                    <label style={lbl}>Bairro</label>
                    <select style={sel} value={filtroBairro} onChange={(e) => setFiltroBairro(e.target.value)}>
                      <option value="">Todos os Bairros</option>
                      {bairros.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                )}
                {locais.length > 0 && (
                  <div>
                    <label style={lbl}>Local de Atendimento</label>
                    <select style={sel} value={filtroLocal} onChange={(e) => setFiltroLocal(e.target.value)}>
                      <option value="">Todos os Locais</option>
                      {locais.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label style={lbl}>Especialidade</label>
                  <select style={sel} value={filtroEsp} onChange={(e) => setFiltroEsp(e.target.value)}>
                    {ESPECIALIDADES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Nome do Médico</label>
                  <input style={inp} value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} placeholder="Buscar por nome..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), buscarMedicos())} />
                </div>
              </div>
              <button type="button" style={{ ...btnBlue, width: "100%" }} onClick={buscarMedicos} disabled={buscando || !filtroUF}>
                {buscando ? "⏳ Buscando..." : "🔍 BUSCAR NO BANCO DE DADOS"}
              </button>

              {/* Resultados */}
              {showResultados && (
                <div style={{ marginTop: 10 }}>
                  {erroBusca && <p style={{ color: "#ef4444", fontSize: 12, margin: "6px 0" }}>{erroBusca}</p>}
                  {resultados.length > 0 && (
                    <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                      {resultados.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => selecionarMedico(m)}
                          style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6", cursor: "pointer", transition: "background 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                        >
                          <strong style={{ fontSize: 12, color: "#111" }}>{m.nome_medico}</strong>
                          <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 8 }}>CRM/{m.uf_crm || m.uf_local} {m.crm}</span>
                          <br />
                          <span style={{ color: "#059669", fontSize: 11 }}>{m.especialidade}</span>
                          {m.local_trabalho && <span style={{ color: "#333", fontSize: 11, marginLeft: 8 }}>• {m.local_trabalho}</span>}
                          {m.cidade && <span style={{ color: "#333", fontSize: 11, marginLeft: 8 }}>📍 {m.cidade}/{m.uf_local}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Editar Médico */}
              <details open={showEditar} style={{ marginTop: 10 }}>
                <summary
                  style={{ cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#005CA9", padding: "6px 0", listStyle: "none" }}
                  onClick={() => setShowEditar(!showEditar)}
                >
                  ✏️ EDITAR MÉDICO / LOCAL / ASSINATURA
                </summary>
                <div style={{ paddingTop: 10, display: "grid", gap: 8 }}>
                  <p style={{ ...secTitle, fontSize: 10 }}>Dados do Local</p>
                  {/* Instituição: preenchida automaticamente — não exibida */}
                  <div>
                    <label style={lbl}>Local de Atendimento</label>
                    <input style={inp} value={form.unidade} onChange={(e) => setForm(p => ({ ...p, unidade: e.target.value }))} placeholder="Ex: UBS CENTRO, UPA NORTE, HOSPITAL MUNICIPAL" />
                  </div>
                  <div>
                    <label style={lbl}>Endereço Completo / Emitente</label>
                    <input style={{ ...inp, background: form.enderecoEmitente ? "#fff" : "#f8fafc" }}
                      value={form.enderecoEmitente}
                      onChange={(e) => setForm(p => ({ ...p, enderecoEmitente: e.target.value }))}
                      placeholder="Ex: RUA ANTÔNIO WALTER, 66 – CENTRO, VOTORANTIM/SP" />
                    <span style={{ fontSize: 10, color: "#666", marginTop: 2, display: "block" }}>Preenchido automaticamente ao selecionar médico.</span>
                  </div>
                  <div>
                    <label style={lbl}>Especialidade</label>
                    <input style={inp} value={form.especialidade} onChange={(e) => setForm(p => ({ ...p, especialidade: e.target.value }))} placeholder="Ex: CLÍNICO GERAL, PEDIATRA" />
                  </div>
                  <p style={{ ...secTitle, fontSize: 10 }}>Dados do Médico</p>
                  <div>
                    <label style={lbl}>Nome Completo</label>
                    <input style={inp} value={form.medico} onChange={(e) => setForm(p => ({ ...p, medico: e.target.value }))} placeholder="DR. NOME SOBRENOME" />
                  </div>
                  <div>
                    <label style={lbl}>CRM (Ex: CRM/SP 12345)</label>
                    <input style={inp} value={form.crm} onChange={(e) => setForm(p => ({ ...p, crm: e.target.value }))} placeholder="CRM/SP 00000" />
                  </div>
                  <p style={{ ...secTitle, fontSize: 10 }}>ASSINATURA</p>
                  <div>
                    <label style={lbl}>COR DA TINTA</label>
                    <select style={sel} value={signatureColor} onChange={(e) => setSignatureColor(e.target.value)}>
                      <option value="#0b109f">🔵 Azul Caneta (Padrão)</option>
                      <option value="#000000">⚫ Preto (Xerox)</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>USAR FOTO DA ASSINATURA (OPCIONAL)</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {signatureImage ? (
                        <div style={{ position: "relative" }}>
                          <img src={signatureImage} alt="Assinatura" style={{ maxHeight: 50, maxWidth: 160, objectFit: "contain", border: "1px solid #e5e7eb", borderRadius: 6 }} />
                          <button type="button" onClick={() => { setSignatureImage(""); if (signatureRef.current) signatureRef.current.value = ""; }}
                            style={{ position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 10, cursor: "pointer" }}>
                            ✕
                          </button>
                        </div>
                      ) : (
                        <label style={{ ...btnBlue, padding: "6px 12px", cursor: "pointer", fontSize: 11 }}>
                          📷 ENVIAR FOTO
                          <input ref={signatureRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleSignatureUpload} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </details>
            </div>

            {/* ── 2. Dados do Paciente ── */}
            <div style={card}>
              <p style={secTitle}>👤 2. Dados do Paciente</p>
              <div style={{ display: "grid", gap: 8 }}>
                <div>
                  <label style={lbl}>Nome Completo *</label>
                  <input style={inp} value={form.paciente} onChange={(e) => setForm(p => ({ ...p, paciente: e.target.value }))} placeholder="Nome Completo do Paciente" required />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={lbl}>CPF</label>
                    <input style={inp} value={form.cpf} onChange={(e) => setForm(p => ({ ...p, cpf: maskCPF(e.target.value) }))} placeholder="000.000.000-00" inputMode="numeric" maxLength={14} />
                  </div>
                  <div>
                    <label style={lbl}>RG / Identidade</label>
                    <input style={inp} value={form.identidade} onChange={(e) => setForm(p => ({ ...p, identidade: e.target.value }))} placeholder="Número do RG" />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={lbl}>Telefone</label>
                    <input style={inp} value={form.telefone} onChange={(e) => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
                  </div>
                  <div>
                    <label style={lbl}>Cidade</label>
                    <input style={inp} value={form.cidade} onChange={(e) => setForm(p => ({ ...p, cidade: e.target.value.toUpperCase() }))} placeholder="Ex: SÃO PAULO" />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Endereço do Paciente</label>
                  <input style={inp} value={form.endereco} onChange={(e) => setForm(p => ({ ...p, endereco: e.target.value }))} placeholder="Rua, Número, Bairro, Cidade/UF" />
                </div>
              </div>
            </div>

            {/* ── 3. Prescrição ── */}
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ ...secTitle, margin: 0, border: "none", padding: 0 }}>💊 3. Prescrição Médica</p>
                <button type="button" style={{ ...btnBlue, padding: "5px 12px", fontSize: 11 }} onClick={addMedicamento}>
                  + ADICIONAR MEDICAMENTO
                </button>
              </div>

              {prescricao.map((item, idx) => (
                <div key={idx} style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "12px 14px",
                  marginBottom: 10,
                  background: "#fafafa",
                  position: "relative",
                }}>
                  {/* Número + Remover */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%",
                        background: "#005CA9", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700,
                      }}>
                        {idx + 1}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Medicamento {idx + 1}</span>
                    </div>
                    {prescricao.length > 1 && (
                      <button type="button" style={btnRed} onClick={() => removeMedicamento(idx)}>✕ REMOVER</button>
                    )}
                  </div>

                  {/* Uso interno/externo */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <button
                      type="button"
                      onClick={() => updateMedicamento(idx, "uso_interno", true)}
                      style={{
                        flex: 1, padding: "6px 0", borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: "pointer",
                        background: item.uso_interno ? "#059669" : "#e2e8f0",
                        color: item.uso_interno ? "#fff" : "#374151",
                        border: "none",
                      }}
                    >
                      ● USO INTERNO
                    </button>
                    <button
                      type="button"
                      onClick={() => updateMedicamento(idx, "uso_interno", false)}
                      style={{
                        flex: 1, padding: "6px 0", borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: "pointer",
                        background: !item.uso_interno ? "#7c3aed" : "#e2e8f0",
                        color: !item.uso_interno ? "#fff" : "#374151",
                        border: "none",
                      }}
                    >
                      ○ USO EXTERNO
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    <div>
                      <label style={lbl}>Nome do Medicamento *</label>
                      <input
                        style={inp}
                        value={item.medicamento}
                        onChange={(e) => updateMedicamento(idx, "medicamento", e.target.value.toUpperCase())}
                        placeholder="Ex: AMOXICILINA 500MG — CÁPSULA"
                        required={idx === 0}
                      />
                    </div>
                    <div>
                      <label style={lbl}>Quantidade / Apresentação</label>
                      <input
                        style={inp}
                        value={item.quantidade}
                        onChange={(e) => updateMedicamento(idx, "quantidade", e.target.value)}
                        placeholder="Ex: 1 caixa com 21 cápsulas"
                      />
                    </div>
                    <div>
                      <label style={lbl}>Modo de Uso / Posologia</label>
                      <input
                        style={inp}
                        value={item.modo_uso}
                        onChange={(e) => updateMedicamento(idx, "modo_uso", e.target.value)}
                        placeholder="Ex: Tomar 1 cápsula de 8 em 8 horas por 7 dias"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" style={{ ...btnGray, width: "100%", marginTop: 4 }} onClick={addMedicamento}>
                + ADICIONAR OUTRO MEDICAMENTO
              </button>
            </div>

            {/* ── 4. Data de Emissão ── */}
            <div style={card}>
              <p style={secTitle}>📅 4. Data de Emissão</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={lbl}>Data de Emissão *</label>
                  <input style={inp} value={form.dataEmissao}
                    onChange={(e) => setForm(p => ({ ...p, dataEmissao: handleDateInput(e.target.value) }))}
                    placeholder="DD/MM/AAAA" maxLength={10} inputMode="numeric" required />
                </div>
                <div>
                  <label style={lbl}>Hora da Emissão</label>
                  <input style={inp} type="time" value={form.horaEmissao} onChange={(e) => setForm(p => ({ ...p, horaEmissao: e.target.value }))} />
                </div>
              </div>

              {/* ── Logos ── */}
              <div style={{ marginTop: 16 }}>
                <p style={{ ...secTitle, marginBottom: 10 }}>🖼 Logos do Documento</p>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <button type="button" onClick={() => setLogoSide("left")}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: "pointer", background: logoSide === "left" ? "#005CA9" : "#e2e8f0", color: logoSide === "left" ? "#fff" : "#374151", border: "none" }}>
                    ← LOGO ESQUERDA
                  </button>
                  <button type="button" onClick={() => setLogoSide("right")}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: "pointer", background: logoSide === "right" ? "#005CA9" : "#e2e8f0", color: logoSide === "right" ? "#fff" : "#374151", border: "none" }}>
                    LOGO DIREITA →
                  </button>
                </div>
                {/* Preview do logo selecionado */}
                <div style={{ height: 60, background: "#f8fafc", border: "1px dashed #d1d5db", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  {(logoSide === "left" ? logoLeft : logoRight) ? (
                    <img src={logoSide === "left" ? logoLeft : logoRight} alt="Logo" style={{ maxHeight: 50, maxWidth: 200, objectFit: "contain" }} />
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 11, color: "#000", fontWeight: 700, margin: 0 }}>SEM LOGO</p>
                      <p style={{ fontSize: 10, color: "#555", margin: "2px 0 0" }}>Tamanho ideal: 300×100px (PNG/JPG)</p>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <label style={{ ...btnBlue, flex: 1, display: "block", textAlign: "center", padding: "7px 0", cursor: "pointer", fontSize: 11 }}>
                    📁 ENVIAR LOGO
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleLogoUpload(logoSide, e)} />
                  </label>
                  <button type="button" style={{ ...btnGray, flex: 1, fontSize: 11, padding: "7px 0" }}
                    onClick={() => {
                      if (logoSide === "left") { setLogoLeft(""); if (logoLeftRef.current) logoLeftRef.current.value = ""; }
                      else { setLogoRight(""); if (logoRightRef.current) logoRightRef.current.value = ""; }
                    }}>
                    ✕ REMOVER
                  </button>
                </div>
                {/* Galeria de Logos Padrão */}
                <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                  Logos Padrão — Clique para aplicar ({logoSide === "left" ? "Esquerda" : "Direita"})
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                  {LOGOS_PADRAO.map((logo) => {
                    const currentLogo = logoSide === "left" ? logoLeft : logoRight;
                    const isSelected = currentLogo === logo.src;
                    return (
                      <div key={logo.id}
                        onClick={() => logoSide === "left" ? setLogoLeft(logo.src) : setLogoRight(logo.src)}
                        style={{ border: isSelected ? "2px solid #005CA9" : "1px solid #e5e7eb", borderRadius: 6, padding: 4, cursor: "pointer", background: isSelected ? "#eff6ff" : "#fff", height: 44, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
                        title={logo.label}>
                        <img src={logo.src} alt={logo.label} style={{ maxWidth: "100%", maxHeight: 36, objectFit: "contain" }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div style={{ display: "flex", gap: 10, paddingBottom: 20 }}>
              <button type="button" style={{ ...btnGray, flex: 1 }} onClick={() => navigate("/dashboard")}>CANCELAR</button>
              <button type="submit" disabled={isLoading}
                style={{ ...btnGreen, flex: 2, opacity: isLoading ? 0.7 : 1, fontSize: 14, padding: "12px 0" }}>
                {isLoading ? "⏳ Emitindo..." : "✅ CONFIRMAR E EMITIR RECEITA"}
              </button>
            </div>
          </form>
        </div>

        {/* ═══ COLUNA DIREITA — PREVIEW ═══ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 10, padding: "8px 12px", background: "#fff",
            borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <span style={{ fontWeight: 700, color: "#374151", fontSize: 14 }}>📄 Preview em Tempo Real</span>
            <span style={{ fontSize: 11, color: "#6b7280", background: "#fef3c7", padding: "3px 8px", borderRadius: 5, fontWeight: 600 }}>
              🔒 QR Code gerado somente após emissão
            </span>
          </div>
          <div style={{ flex: 1, overflow: "auto", background: "#525659", borderRadius: 10, padding: 14, maxHeight: "calc(100vh - 120px)" }}>
            <div style={{ width: 794, margin: "0 auto", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <PrescricaoDocument
                ref={previewRef}
                data={previewData}
                logoLeft={logoLeft}
                logoRight={logoRight}
                signatureColor={signatureColor}
                signatureImage={signatureImage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
