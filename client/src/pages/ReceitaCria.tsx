/**
 * ReceitaCria — Emissão de Receituário Médico (Dr. Consulta)
 *
 * Fluxo simplificado:
 * 1. Selecionar UF + Cidade → busca automática de médicos da Dr. Consulta
 * 2. Selecionar médico → preenche dados automaticamente
 * 3. Preencher dados do paciente
 * 4. Adicionar medicamentos
 * 5. Emitir receita
 *
 * Logo dr.consulta fixa (extraída do PDF original).
 * Somente médicos da rede Dr. Consulta são exibidos.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import PrescricaoDocument from "@/components/PrescricaoDocument";
import type { PrescricaoItem } from "@/components/PrescricaoDocument";
import { exportElementToPDF, generatePDFFilename } from "@/lib/pdfExport";
import { useAuth } from "@/contexts/AuthContext";

// ─── API de Médicos (rotas corretas) ──────────────────────────────────────────
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
    if (e?.name === "AbortError") throw new Error("Timeout: servidor demorou demais.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Constantes ───────────────────────────────────────────────────────────────
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

// ─── Tipos ────────────────────────────────────────────────────────────────────
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

type TipoReceituario = "simples" | "controle_especial" | "antimicrobiano";

// ─── Componente ───────────────────────────────────────────────────────────────
export default function ReceitaCria() {
  const { user, updateBalance } = useAuth();
  const [, navigate] = useLocation();
  const previewRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // ── Assinatura ──────────────────────────────────────────────────────────────
  const [signatureColor, setSignatureColor] = useState<string>("#0b109f");
  const [signatureImage, setSignatureImage] = useState<string>("");
  const signatureRef = useRef<HTMLInputElement>(null);

  // ── Tipo de receituário ─────────────────────────────────────────────────────
  const [tipoReceituario, setTipoReceituario] = useState<TipoReceituario>("controle_especial");

  // ── Busca de médicos ────────────────────────────────────────────────────────
  const [filtroUF, setFiltroUF] = useState("");
  const [filtroCidade, setFiltroCidade] = useState("");
  const [filtroEsp, setFiltroEsp] = useState("");
  const [termoBusca, setTermoBusca] = useState("");
  const [cidades, setCidades] = useState<string[]>([]);
  const [resultados, setResultados] = useState<MedicoDB[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState("");
  const [showResultados, setShowResultados] = useState(false);
  const [medicoSelecionado, setMedicoSelecionado] = useState(false);

  // ── Formulário ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    // Emitente (preenchido automaticamente)
    unidade: "",
    enderecoEmitente: "",
    cnpjEmitente: "14.245.016/0059-95",
    telefoneEmitente: "4090-1510",
    siteEmitente: "www.drconsulta.com",
    // Médico
    medico: "",
    crm: "",
    especialidade: "",
    // Paciente
    paciente: "",
    cpf: "",
    identidade: "",
    endereco: "",
    telefone: "",
    cidade: "",
    // Emissão
    dataEmissao: todayBR(),
    horaEmissao: nowTime(),
  });

  // ── Prescrição ──────────────────────────────────────────────────────────────
  const [prescricao, setPrescricao] = useState<PrescricaoItem[]>([
    { numero: 1, uso_interno: true, medicamento: "", quantidade: "", modo_uso: "" },
  ]);

  // ── Carregar cidades ao selecionar UF ─────────────────────────────────────
  useEffect(() => {
    if (!filtroUF) { setCidades([]); setFiltroCidade(""); return; }
    apiFetch(`/cidades?uf=${filtroUF}`)
      .then((d) => setCidades(d.cidades || d || []))
      .catch(() => setCidades([]));
  }, [filtroUF]);

  // ── Buscar médicos (somente Dr. Consulta) ─────────────────────────────────
  const buscarMedicos = useCallback(async () => {
    if (!filtroUF) { setErroBusca("Selecione o estado (UF)."); return; }
    setBuscando(true);
    setErroBusca("");
    setShowResultados(true);
    try {
      const params = new URLSearchParams({ uf: filtroUF });
      if (filtroCidade) params.set("cidade", filtroCidade);
      if (filtroEsp) params.set("especialidade", filtroEsp);
      if (termoBusca.trim().length >= 3) params.set("nome", termoBusca.trim());
      const data = await apiFetch(`/buscar?${params}`);
      const medicos = data.medicos || data || [];
      setResultados(medicos);
      if (medicos.length === 0) setErroBusca("Nenhum médico da Dr. Consulta encontrado. Tente outros filtros.");
    } catch (err: any) {
      setErroBusca(err.message || "Erro ao buscar médicos.");
    } finally {
      setBuscando(false);
    }
  }, [filtroUF, filtroCidade, filtroEsp, termoBusca]);

  // ── Auto-buscar ao selecionar cidade ──────────────────────────────────────
  useEffect(() => {
    if (filtroUF && filtroCidade) buscarMedicos();
  }, [filtroUF, filtroCidade, buscarMedicos]);

  // ── Selecionar médico ─────────────────────────────────────────────────────
  const selecionarMedico = (m: MedicoDB) => {
    const localTrabalho = m.local_trabalho?.toUpperCase() || "";
    setForm((p) => ({
      ...p,
      medico: m.nome_medico.toUpperCase(),
      crm: `CRM/${m.uf_crm || m.uf_local} ${m.crm}`,
      especialidade: (m.especialidade || "CLÍNICO GERAL").toUpperCase(),
      unidade: localTrabalho || p.unidade,
      enderecoEmitente: [m.endereco, m.bairro, m.cidade, m.uf_local].filter(Boolean).join(", ").toUpperCase(),
    }));
    setShowResultados(false);
    setTermoBusca("");
    setMedicoSelecionado(true);
  };

  // ── Upload de assinatura ──────────────────────────────────────────────────
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await readFileAsBase64(file);
    setSignatureImage(b64);
  };

  // ── Gerenciar prescrição ──────────────────────────────────────────────────
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

  // ── Download PDF ──────────────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    try {
      const filename = generatePDFFilename(form.paciente || "RECEITA", "receita");
      await exportElementToPDF(previewRef.current, { filename, scale: 2, quality: 0.92, multiPage: true });
    } catch (err) {
      alert(`Erro ao gerar PDF: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { alert("Você precisa estar logado para emitir."); return; }

    const prescricaoValida = prescricao.filter((p) => p.medicamento.trim());
    if (prescricaoValida.length === 0) {
      alert("Adicione pelo menos um medicamento à prescrição.");
      return;
    }

    if (!form.medico.trim()) {
      alert("Selecione um médico antes de emitir.");
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
        instituicao: "DR. CONSULTA",
        unidade: form.unidade || null,
        endereco_emitente: form.enderecoEmitente || null,
        prescricao: prescricaoValida,
        data_emissao: form.dataEmissao,
        hora_emissao: form.horaEmissao,
        logo_url: "/logos/drconsulta.png",
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

  // ── Estilos ───────────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    padding: "14px 16px",
    marginBottom: 12,
  };
  const secTitle: React.CSSProperties = {
    fontSize: 12,
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
    padding: "7px 10px",
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

  // ── Preview data ──────────────────────────────────────────────────────────
  const previewData = {
    tipo_receituario: tipoReceituario,
    // Emitente — logo dr.consulta fixa
    logo_url: "/logos/drconsulta.png",
    nome_unidade: form.unidade || "UNIDADE DR. CONSULTA",
    cnpj_emitente: form.cnpjEmitente || undefined,
    endereco_emitente: form.enderecoEmitente || undefined,
    telefone_emitente: form.telefoneEmitente || undefined,
    site_emitente: form.siteEmitente || undefined,
    // Paciente
    paciente_nome: form.paciente || "NOME DO PACIENTE",
    paciente_cpf: form.cpf || undefined,
    paciente_identidade: form.identidade || undefined,
    paciente_endereco: form.endereco || undefined,
    paciente_telefone: form.telefone || undefined,
    paciente_cidade: form.cidade || undefined,
    // Médico
    medico_nome: form.medico || "NOME DO MÉDICO",
    medico_crm: form.crm || "000000",
    medico_uf: filtroUF || "UF",
    medico_especialidade: form.especialidade || undefined,
    medico_assinatura_url: signatureImage || undefined,
    // Prescrição
    medicamentos: prescricao
      .filter((p) => p.medicamento.trim())
      .map((p) => ({
        uso_tipo: p.uso_interno ? "interno" as const : "externo" as const,
        nome: p.medicamento,
        quantidade: p.quantidade,
        posologia: p.modo_uso,
      })),
    // Emissão
    data_emissao: form.dataEmissao || todayBR(),
    codigo_qr: undefined,
    qr_code_url: undefined,
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
                <p style={{ fontSize: 10, color: "#166534", margin: "4px 0 0" }}>Valide em: <a href={`https://verificamed.digital/verificar/receita/${createdCode}`} target="_blank" rel="noreferrer" style={{ color: "#15803d" }}>verificamed.digital</a></p>
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
                {isDownloadingPdf ? "Baixando PDF..." : "BAIXAR PDF"}
              </button>
              <button style={{ ...btnGray, flex: 1 }} onClick={() => { setShowSuccessModal(false); navigate("/dashboard"); }}>
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: "#005CA9", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button style={{ ...btnGray, padding: "5px 12px", fontSize: 11 }} onClick={() => navigate("/dashboard")}>← VOLTAR</button>
          <h1 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>EMITIR RECEITA MÉDICA — Dr. Consulta</h1>
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", background: "rgba(0,0,0,0.15)", padding: "4px 12px", borderRadius: 6, fontWeight: 600 }}>
          Dados excluídos após 60 dias
        </span>
      </div>

      <div style={{ display: "flex", gap: 14, padding: 14, maxWidth: 2000, margin: "0 auto" }}>
        {/* ═══ COLUNA ESQUERDA — FORMULÁRIO ═══ */}
        <div style={{ width: 580, flexShrink: 0, overflowY: "auto", maxHeight: "calc(100vh - 70px)" }}>
          <form onSubmit={handleSubmit}>

            {/* ── Tipo de Receituário ── */}
            <div style={card}>
              <p style={secTitle}>Tipo de Receituário</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {([
                  { value: "simples", label: "Simples", desc: "Branco", color: "#374151" },
                  { value: "controle_especial", label: "Controle Especial", desc: "2 vias — Retenção", color: "#92400e" },
                  { value: "antimicrobiano", label: "Antimicrobiano", desc: "Notificação", color: "#1e40af" },
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

            {/* ── 1. Buscar Médico (Dr. Consulta) ── */}
            <div style={card}>
              <p style={secTitle}>1. Selecionar Médico — Dr. Consulta</p>
              <p style={{ fontSize: 10, color: "#6b7280", margin: "-6px 0 10px", lineHeight: 1.4 }}>
                Somente médicos cadastrados na rede <strong>Dr. Consulta</strong> são exibidos.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={lbl}>Estado (UF) *</label>
                  <select style={sel} value={filtroUF} onChange={(e) => { setFiltroUF(e.target.value); setFiltroCidade(""); setResultados([]); setShowResultados(false); setMedicoSelecionado(false); }}>
                    <option value="">Selecione</option>
                    {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Cidade</label>
                  <select style={sel} value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)} disabled={!filtroUF || cidades.length === 0}>
                    <option value="">Selecione</option>
                    {cidades.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={lbl}>Especialidade</label>
                  <select style={sel} value={filtroEsp} onChange={(e) => setFiltroEsp(e.target.value)}>
                    {ESPECIALIDADES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Nome do Médico</label>
                  <input style={inp} value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} placeholder="Buscar por nome..." onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscarMedicos(); } }} />
                </div>
              </div>
              <button type="button" style={{ ...btnBlue, width: "100%" }} onClick={buscarMedicos} disabled={buscando || !filtroUF}>
                {buscando ? "Buscando..." : "BUSCAR MÉDICOS DR. CONSULTA"}
              </button>

              {/* Resultados */}
              {showResultados && (
                <div style={{ marginTop: 10 }}>
                  {erroBusca && <p style={{ color: "#ef4444", fontSize: 12, margin: "6px 0" }}>{erroBusca}</p>}
                  {resultados.length > 0 && (
                    <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                      {resultados.map((m, i) => (
                        <div
                          key={m.id || i}
                          onClick={() => selecionarMedico(m)}
                          style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6", cursor: "pointer", transition: "background 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                        >
                          <strong style={{ fontSize: 12, color: "#111" }}>{m.nome_medico}</strong>
                          <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 8 }}>CRM/{m.uf_crm || m.uf_local} {m.crm}</span>
                          <br />
                          <span style={{ color: "#059669", fontSize: 11 }}>{m.especialidade}</span>
                          {m.local_trabalho && <span style={{ color: "#333", fontSize: 10, marginLeft: 8 }}>{m.local_trabalho}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Médico selecionado */}
              {medicoSelecionado && form.medico && (
                <div style={{ marginTop: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 4 }}>Médico Selecionado:</div>
                  <div style={{ fontSize: 12, color: "#111" }}>{form.medico}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{form.crm} — {form.especialidade}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{form.unidade}</div>
                  <button type="button" style={{ ...btnGray, padding: "4px 10px", fontSize: 10, marginTop: 6 }} onClick={() => { setMedicoSelecionado(false); setShowResultados(true); }}>
                    Alterar Médico
                  </button>
                </div>
              )}

              {/* Editar dados do emitente (colapsado) */}
              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#6b7280", padding: "4px 0" }}>
                  Editar dados do emitente / assinatura
                </summary>
                <div style={{ paddingTop: 8, display: "grid", gap: 6 }}>
                  <div>
                    <label style={lbl}>Unidade / Local</label>
                    <input style={inp} value={form.unidade} onChange={(e) => setForm(p => ({ ...p, unidade: e.target.value }))} placeholder="UNIDADE DR. CONSULTA" />
                  </div>
                  <div>
                    <label style={lbl}>Endereço Emitente</label>
                    <input style={inp} value={form.enderecoEmitente} onChange={(e) => setForm(p => ({ ...p, enderecoEmitente: e.target.value }))} placeholder="Rua, Número, Bairro, Cidade/UF" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <div>
                      <label style={lbl}>CNPJ</label>
                      <input style={inp} value={form.cnpjEmitente} onChange={(e) => setForm(p => ({ ...p, cnpjEmitente: e.target.value }))} />
                    </div>
                    <div>
                      <label style={lbl}>Central Atendimento</label>
                      <input style={inp} value={form.telefoneEmitente} onChange={(e) => setForm(p => ({ ...p, telefoneEmitente: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Site</label>
                    <input style={inp} value={form.siteEmitente} onChange={(e) => setForm(p => ({ ...p, siteEmitente: e.target.value }))} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <div>
                      <label style={lbl}>Nome do Médico</label>
                      <input style={inp} value={form.medico} onChange={(e) => setForm(p => ({ ...p, medico: e.target.value }))} />
                    </div>
                    <div>
                      <label style={lbl}>CRM</label>
                      <input style={inp} value={form.crm} onChange={(e) => setForm(p => ({ ...p, crm: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Especialidade</label>
                    <input style={inp} value={form.especialidade} onChange={(e) => setForm(p => ({ ...p, especialidade: e.target.value }))} />
                  </div>
                  <div>
                    <label style={lbl}>Cor da Tinta (Assinatura)</label>
                    <select style={sel} value={signatureColor} onChange={(e) => setSignatureColor(e.target.value)}>
                      <option value="#0b109f">Azul Caneta</option>
                      <option value="#000000">Preto</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Foto da Assinatura (opcional)</label>
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
                        <label style={{ ...btnBlue, padding: "5px 10px", cursor: "pointer", fontSize: 10 }}>
                          ENVIAR FOTO
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
              <p style={secTitle}>2. Dados do Paciente</p>
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
                  <label style={lbl}>Endereço Completo</label>
                  <input style={inp} value={form.endereco} onChange={(e) => setForm(p => ({ ...p, endereco: e.target.value }))} placeholder="Rua, Número, Bairro, Cidade/UF, CEP" />
                </div>
              </div>
            </div>

            {/* ── 3. Prescrição ── */}
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ ...secTitle, margin: 0, border: "none", padding: 0 }}>3. Prescrição Médica</p>
                <button type="button" style={{ ...btnBlue, padding: "5px 12px", fontSize: 11 }} onClick={addMedicamento}>
                  + ADICIONAR
                </button>
              </div>

              {prescricao.map((item, idx) => (
                <div key={idx} style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "10px 12px",
                  marginBottom: 8,
                  background: "#fafafa",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: "#005CA9", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 700,
                      }}>
                        {idx + 1}
                      </div>
                      {/* Uso interno/externo toggle */}
                      <button type="button" onClick={() => updateMedicamento(idx, "uso_interno", !item.uso_interno)}
                        style={{
                          padding: "3px 10px", borderRadius: 4, fontWeight: 600, fontSize: 10, cursor: "pointer",
                          background: item.uso_interno ? "#059669" : "#7c3aed",
                          color: "#fff", border: "none",
                        }}>
                        {item.uso_interno ? "USO INTERNO" : "USO EXTERNO"}
                      </button>
                    </div>
                    {prescricao.length > 1 && (
                      <button type="button" style={btnRed} onClick={() => removeMedicamento(idx)}>✕</button>
                    )}
                  </div>

                  <div style={{ display: "grid", gap: 5 }}>
                    <input
                      style={inp}
                      value={item.medicamento}
                      onChange={(e) => updateMedicamento(idx, "medicamento", e.target.value.toUpperCase())}
                      placeholder="Nome do Medicamento — Ex: AMOXICILINA 500MG CÁPSULA"
                      required={idx === 0}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 5 }}>
                      <input
                        style={inp}
                        value={item.quantidade}
                        onChange={(e) => updateMedicamento(idx, "quantidade", e.target.value)}
                        placeholder="Qtd: 1 caixa"
                      />
                      <input
                        style={inp}
                        value={item.modo_uso}
                        onChange={(e) => updateMedicamento(idx, "modo_uso", e.target.value)}
                        placeholder="Uso: Tomar 1 cápsula de 8/8h por 7 dias"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── 4. Data ── */}
            <div style={card}>
              <p style={secTitle}>4. Data de Emissão</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={lbl}>Data *</label>
                  <input style={inp} value={form.dataEmissao}
                    onChange={(e) => setForm(p => ({ ...p, dataEmissao: handleDateInput(e.target.value) }))}
                    placeholder="DD/MM/AAAA" maxLength={10} inputMode="numeric" required />
                </div>
                <div>
                  <label style={lbl}>Hora</label>
                  <input style={inp} type="time" value={form.horaEmissao} onChange={(e) => setForm(p => ({ ...p, horaEmissao: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div style={{ display: "flex", gap: 10, paddingBottom: 20 }}>
              <button type="button" style={{ ...btnGray, flex: 1 }} onClick={() => navigate("/dashboard")}>CANCELAR</button>
              <button type="submit" disabled={isLoading}
                style={{ ...btnGreen, flex: 2, opacity: isLoading ? 0.7 : 1, fontSize: 14, padding: "12px 0" }}>
                {isLoading ? "Emitindo..." : "CONFIRMAR E EMITIR RECEITA"}
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
            <span style={{ fontWeight: 700, color: "#374151", fontSize: 14 }}>Preview em Tempo Real</span>
            <span style={{ fontSize: 11, color: "#6b7280", background: "#fef3c7", padding: "3px 8px", borderRadius: 5, fontWeight: 600 }}>
              QR Code gerado somente após emissão
            </span>
          </div>
          <div style={{ flex: 1, overflow: "auto", background: "#525659", borderRadius: 10, padding: 14, maxHeight: "calc(100vh - 120px)" }}>
            <div ref={previewRef} style={{ width: 794, margin: "0 auto", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <PrescricaoDocument
                data={previewData}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
