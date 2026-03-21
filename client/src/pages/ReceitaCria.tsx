/**
 * ReceitaCria — Emissão de Receituário Médico (Dr. Consulta)
 *
 * Fluxo:
 * 1. Selecionar UF → Cidade → Unidade (preenche endereço automaticamente)
 * 2. Selecionar Especialidade + buscar médico (opcional)
 * 3. Preencher dados do paciente
 * 4. Adicionar medicamentos
 * 5. Emitir receita
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import PrescricaoDocument from "@/components/PrescricaoDocument";
import type { PrescricaoItem } from "@/components/PrescricaoDocument";
import { exportElementToPDF, generatePDFFilename } from "@/lib/pdfExport";
import { useAuth } from "@/contexts/AuthContext";

// ─── API helpers ─────────────────────────────────────────────────────────────
async function apiFetch(path: string) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 25000);
  try {
    const r = await fetch(`/api/medicos${path}`, { signal: c.signal, headers: { "Content-Type": "application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  } catch (e: any) {
    if (e?.name === "AbortError") throw new Error("Timeout");
    throw e;
  } finally { clearTimeout(t); }
}

// ─── Máscaras ────────────────────────────────────────────────────────────────
function maskCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}
function handleDateInput(v: string) {
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

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface Unidade {
  id: number; id_unit: number; nome: string; key: string;
  endereco: string; bairro: string; cidade: string; uf: string;
  cep: string; telefone: string; horario: string; rt_nome: string; rt_crm: string;
}
interface MedicoDB {
  id: number; nome_medico: string; crm: string; uf_crm: string;
  especialidade: string; local_trabalho: string; cidade: string;
  uf_local: string; endereco: string; bairro: string;
}
type TipoReceituario = "simples" | "controle_especial" | "antimicrobiano";

// ─── Componente ──────────────────────────────────────────────────────────────
export default function ReceitaCria() {
  const { user, updateBalance } = useAuth();
  const [, navigate] = useLocation();
  const previewRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Assinatura
  const [signatureColor, setSignatureColor] = useState("#0b109f");
  const [signatureImage, setSignatureImage] = useState("");
  const signatureRef = useRef<HTMLInputElement>(null);

  // Tipo
  const [tipoReceituario, setTipoReceituario] = useState<TipoReceituario>("controle_especial");

  // ── Unidades Dr. Consulta ──────────────────────────────────────────────────
  const [ufs, setUfs] = useState<string[]>([]);
  const [cidades, setCidades] = useState<string[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [filtroUF, setFiltroUF] = useState("");
  const [filtroCidade, setFiltroCidade] = useState("");
  const [filtroUnidade, setFiltroUnidade] = useState<Unidade | null>(null);
  const [filtroEsp, setFiltroEsp] = useState("");

  // ── Busca de médicos ───────────────────────────────────────────────────────
  const [termoBusca, setTermoBusca] = useState("");
  const [resultados, setResultados] = useState<MedicoDB[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState("");
  const [showResultados, setShowResultados] = useState(false);
  const [medicoSelecionado, setMedicoSelecionado] = useState(false);

  // ── Formulário ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    unidade: "", enderecoEmitente: "",
    cnpjEmitente: "14.245.016/0059-95", telefoneEmitente: "4090-1510", siteEmitente: "www.drconsulta.com",
    medico: "", crm: "", especialidade: "",
    paciente: "", cpf: "", identidade: "", endereco: "", telefone: "", cidade: "",
    dataEmissao: todayBR(), horaEmissao: nowTime(),
  });

  // Prescrição
  const [prescricao, setPrescricao] = useState<PrescricaoItem[]>([
    { numero: 1, uso_interno: true, medicamento: "", quantidade: "", modo_uso: "" },
  ]);

  // ── Carregar UFs disponíveis ───────────────────────────────────────────────
  useEffect(() => {
    apiFetch("/unidades").then(d => setUfs(d.ufs || [])).catch(() => {});
    apiFetch("/especialidades").then(d => setEspecialidades(d.especialidades || [])).catch(() => {});
  }, []);

  // ── Carregar cidades ao selecionar UF ──────────────────────────────────────
  useEffect(() => {
    if (!filtroUF) { setCidades([]); setFiltroCidade(""); setUnidades([]); setFiltroUnidade(null); return; }
    apiFetch(`/unidades?uf=${filtroUF}`).then(d => setCidades(d.cidades || [])).catch(() => setCidades([]));
  }, [filtroUF]);

  // ── Carregar unidades ao selecionar cidade ─────────────────────────────────
  useEffect(() => {
    if (!filtroUF || !filtroCidade) { setUnidades([]); setFiltroUnidade(null); return; }
    apiFetch(`/unidades?uf=${filtroUF}&cidade=${encodeURIComponent(filtroCidade)}`)
      .then(d => setUnidades(d.unidades || []))
      .catch(() => setUnidades([]));
  }, [filtroUF, filtroCidade]);

  // ── Ao selecionar unidade → preencher emitente automaticamente ─────────────
  const selecionarUnidade = (u: Unidade) => {
    setFiltroUnidade(u);
    const endCompleto = [u.endereco, u.bairro, `${u.cidade}/${u.uf}`, u.cep ? `CEP ${u.cep}` : ""].filter(Boolean).join(", ");
    setForm(p => ({
      ...p,
      unidade: `UNIDADE DR. CONSULTA ${u.nome.toUpperCase()}`,
      enderecoEmitente: endCompleto,
    }));
  };

  // ── Buscar médicos ─────────────────────────────────────────────────────────
  const buscarMedicos = useCallback(async () => {
    if (!filtroUF) { setErroBusca("Selecione o estado."); return; }
    setBuscando(true); setErroBusca(""); setShowResultados(true);
    try {
      const params = new URLSearchParams({ uf: filtroUF });
      if (filtroCidade) params.set("cidade", filtroCidade);
      if (filtroEsp) params.set("especialidade", filtroEsp);
      if (termoBusca.trim().length >= 3) params.set("nome", termoBusca.trim());
      const data = await apiFetch(`/buscar?${params}`);
      const medicos = data.medicos || data || [];
      setResultados(medicos);
      if (medicos.length === 0) setErroBusca("Nenhum médico encontrado. Tente outros filtros.");
    } catch (err: any) { setErroBusca(err.message || "Erro ao buscar."); }
    finally { setBuscando(false); }
  }, [filtroUF, filtroCidade, filtroEsp, termoBusca]);

  // ── Selecionar médico ──────────────────────────────────────────────────────
  const selecionarMedico = (m: MedicoDB) => {
    setForm(p => ({
      ...p,
      medico: m.nome_medico.toUpperCase(),
      crm: `CRM/${m.uf_crm || m.uf_local} ${m.crm}`,
      especialidade: (m.especialidade || "CLÍNICO GERAL").toUpperCase(),
    }));
    setShowResultados(false); setTermoBusca(""); setMedicoSelecionado(true);
  };

  // ── Upload assinatura ──────────────────────────────────────────────────────
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setSignatureImage(await readFileAsBase64(file));
  };

  // ── Prescrição ─────────────────────────────────────────────────────────────
  const addMedicamento = () => setPrescricao(p => [...p, { numero: p.length + 1, uso_interno: true, medicamento: "", quantidade: "", modo_uso: "" }]);
  const removeMedicamento = (idx: number) => setPrescricao(p => p.filter((_, i) => i !== idx).map((item, i) => ({ ...item, numero: i + 1 })));
  const updateMedicamento = (idx: number, field: keyof PrescricaoItem, value: any) => setPrescricao(p => p.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  // ── Download PDF ───────────────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    try {
      await exportElementToPDF(previewRef.current, { filename: generatePDFFilename(form.paciente || "RECEITA", "receita"), scale: 2, quality: 0.92, multiPage: true });
    } catch (err) { alert(`Erro ao gerar PDF: ${err instanceof Error ? err.message : "Erro"}`); }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { alert("Faça login para emitir."); return; }
    const prescricaoValida = prescricao.filter(p => p.medicamento.trim());
    if (prescricaoValida.length === 0) { alert("Adicione pelo menos um medicamento."); return; }
    if (!form.medico.trim()) { alert("Preencha o nome do médico."); return; }

    setIsLoading(true);
    try {
      const payload = {
        tipo_receituario: tipoReceituario,
        paciente: form.paciente.toUpperCase(), cpf: form.cpf || null,
        identidade: form.identidade || null, endereco: form.endereco || null,
        telefone: form.telefone || null, cidade: form.cidade || null,
        medico: form.medico.toUpperCase(), crm: form.crm,
        especialidade: form.especialidade.toUpperCase(),
        instituicao: "DR. CONSULTA", unidade: form.unidade || null,
        endereco_emitente: form.enderecoEmitente || null,
        prescricao: prescricaoValida, data_emissao: form.dataEmissao, hora_emissao: form.horaEmissao,
        logo_url: "/logos/drconsulta.png",
        signature_color: signatureColor, signature_image: signatureImage || null,
      };
      const res = await fetch("/api/receitas", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Erro ao emitir");
      setCreatedCode(data.data?.codigo_qr || null);
      if (data.newBalance !== undefined) updateBalance(data.newBalance);
      setShowSuccessModal(true);
    } catch (error) { alert(`Erro: ${error instanceof Error ? error.message : "Erro"}`); }
    finally { setIsLoading(false); }
  };

  // ── Estilos ────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = { background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", padding: "14px 16px", marginBottom: 12 };
  const secTitle: React.CSSProperties = { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#005CA9", borderBottom: "2px solid #005CA9", paddingBottom: 5, marginBottom: 10 };
  const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 600, color: "#000", marginBottom: 3 };
  const inp: React.CSSProperties = { width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit", color: "#000" };
  const sel: React.CSSProperties = { ...inp, background: "#fff" };
  const btnBlue: React.CSSProperties = { background: "#005CA9", color: "#fff", border: "none", borderRadius: 7, padding: "8px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer", letterSpacing: 0.5 };
  const btnGreen: React.CSSProperties = { background: "#16a34a", color: "#fff", border: "none", borderRadius: 7, padding: "8px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer" };
  const btnGray: React.CSSProperties = { background: "#e2e8f0", color: "#000", border: "1px solid #cbd5e1", borderRadius: 7, padding: "8px 16px", fontWeight: 600, fontSize: 12, cursor: "pointer" };
  const btnRed: React.CSSProperties = { background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontWeight: 700, fontSize: 11, cursor: "pointer" };

  // ── Preview data ───────────────────────────────────────────────────────────
  const previewData = {
    tipo_receituario: tipoReceituario,
    logo_url: "/logos/drconsulta.png",
    nome_unidade: form.unidade || "UNIDADE DR. CONSULTA",
    cnpj_emitente: form.cnpjEmitente || undefined,
    endereco_emitente: form.enderecoEmitente || undefined,
    telefone_emitente: form.telefoneEmitente || undefined,
    site_emitente: form.siteEmitente || undefined,
    paciente_nome: form.paciente || "NOME DO PACIENTE",
    paciente_cpf: form.cpf || undefined,
    paciente_identidade: form.identidade || undefined,
    paciente_endereco: form.endereco || undefined,
    paciente_telefone: form.telefone || undefined,
    paciente_cidade: form.cidade || undefined,
    medico_nome: form.medico || "NOME DO MÉDICO",
    medico_crm: form.crm || "000000",
    medico_uf: filtroUF || "UF",
    medico_especialidade: form.especialidade || undefined,
    medico_assinatura_url: signatureImage || undefined,
    signature_color: signatureColor,
    medicamentos: prescricao.filter(p => p.medicamento.trim()).map(p => ({
      uso_tipo: p.uso_interno ? "interno" as const : "externo" as const,
      nome: p.medicamento, quantidade: p.quantidade, posologia: p.modo_uso,
    })),
    data_emissao: form.dataEmissao || todayBR(),
    codigo_qr: createdCode || undefined, qr_code_url: createdCode ? `https://docmaster.store/v/${createdCode}` : undefined,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "Arial, Helvetica, sans-serif" }}>
      {/* Modal Sucesso */}
      {showSuccessModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
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
              <button style={{ ...btnBlue, flex: 1 }} disabled={isDownloadingPdf}
                onClick={async () => { setIsDownloadingPdf(true); await handleDownloadPdf(); setIsDownloadingPdf(false); setShowSuccessModal(false); navigate("/dashboard"); }}>
                {isDownloadingPdf ? "Baixando PDF..." : "BAIXAR PDF"}
              </button>
              <button style={{ ...btnGray, flex: 1 }} onClick={() => { setShowSuccessModal(false); navigate("/dashboard"); }}>FECHAR</button>
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

            {/* Tipo de Receituário */}
            <div style={card}>
              <p style={secTitle}>Tipo de Receituário</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {([
                  { value: "simples", label: "Simples", desc: "Branco", color: "#374151" },
                  { value: "controle_especial", label: "Controle Especial", desc: "2 vias — Retenção", color: "#92400e" },
                  { value: "antimicrobiano", label: "Antimicrobiano", desc: "Notificação", color: "#1e40af" },
                ] as const).map(t => (
                  <button key={t.value} type="button" onClick={() => setTipoReceituario(t.value)}
                    style={{
                      padding: "10px 8px", borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: "pointer", textAlign: "center",
                      border: tipoReceituario === t.value ? `2px solid ${t.color}` : "2px solid #d1d5db",
                      background: tipoReceituario === t.value ? `${t.color}15` : "#f8fafc",
                      color: tipoReceituario === t.value ? t.color : "#374151",
                    }}>
                    <div style={{ marginBottom: 2 }}>{t.label}</div>
                    <div style={{ fontSize: 9, fontWeight: 400, color: "#6b7280" }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── 1. Unidade Dr. Consulta ── */}
            <div style={card}>
              <p style={secTitle}>1. Unidade Dr. Consulta</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={lbl}>Estado (UF) *</label>
                  <select style={sel} value={filtroUF} onChange={e => { setFiltroUF(e.target.value); setFiltroCidade(""); setUnidades([]); setFiltroUnidade(null); setMedicoSelecionado(false); setResultados([]); setShowResultados(false); }}>
                    <option value="">Selecione</option>
                    {ufs.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Cidade *</label>
                  <select style={sel} value={filtroCidade} onChange={e => { setFiltroCidade(e.target.value); setFiltroUnidade(null); }} disabled={!filtroUF || cidades.length === 0}>
                    <option value="">Selecione</option>
                    {cidades.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Lista de unidades */}
              {unidades.length > 0 && (
                <div>
                  <label style={lbl}>Unidade *</label>
                  <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                    {unidades.map(u => (
                      <div key={u.id} onClick={() => selecionarUnidade(u)}
                        style={{
                          padding: "8px 12px", borderBottom: "1px solid #f3f4f6", cursor: "pointer",
                          background: filtroUnidade?.id === u.id ? "#eff6ff" : "",
                          borderLeft: filtroUnidade?.id === u.id ? "3px solid #005CA9" : "3px solid transparent",
                        }}
                        onMouseEnter={e => { if (filtroUnidade?.id !== u.id) e.currentTarget.style.background = "#f8fafc"; }}
                        onMouseLeave={e => { if (filtroUnidade?.id !== u.id) e.currentTarget.style.background = ""; }}>
                        <strong style={{ fontSize: 12, color: "#111" }}>{u.nome}</strong>
                        <br />
                        <span style={{ fontSize: 10, color: "#6b7280" }}>{u.endereco}, {u.bairro}</span>
                        {u.rt_nome && <span style={{ fontSize: 10, color: "#059669", marginLeft: 6 }}>RT: {u.rt_nome}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unidade selecionada */}
              {filtroUnidade && (
                <div style={{ marginTop: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", marginBottom: 2 }}>Unidade Selecionada:</div>
                  <div style={{ fontSize: 12, color: "#111", fontWeight: 600 }}>{form.unidade}</div>
                  <div style={{ fontSize: 10, color: "#6b7280" }}>{form.enderecoEmitente}</div>
                </div>
              )}
            </div>

            {/* ── 2. Médico ── */}
            <div style={card}>
              <p style={secTitle}>2. Médico Prescritor</p>

              {/* Modo: manual ou busca */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={lbl}>Especialidade</label>
                  <select style={sel} value={filtroEsp} onChange={e => setFiltroEsp(e.target.value)}>
                    <option value="">Todas</option>
                    {especialidades.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Buscar por Nome</label>
                  <input style={inp} value={termoBusca} onChange={e => setTermoBusca(e.target.value)}
                    placeholder="Nome do médico..." onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); buscarMedicos(); } }} />
                </div>
              </div>

              <button type="button" style={{ ...btnBlue, width: "100%", marginBottom: 8 }} onClick={buscarMedicos} disabled={buscando || !filtroUF}>
                {buscando ? "Buscando..." : "BUSCAR MÉDICO"}
              </button>

              {/* Resultados */}
              {showResultados && (
                <div>
                  {erroBusca && <p style={{ color: "#ef4444", fontSize: 12, margin: "6px 0" }}>{erroBusca}</p>}
                  {resultados.length > 0 && (
                    <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                      {resultados.map((m, i) => (
                        <div key={m.id || i} onClick={() => selecionarMedico(m)}
                          style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                          onMouseLeave={e => e.currentTarget.style.background = ""}>
                          <strong style={{ fontSize: 12, color: "#111" }}>{m.nome_medico}</strong>
                          <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 8 }}>CRM/{m.uf_crm || m.uf_local} {m.crm}</span>
                          <br /><span style={{ color: "#059669", fontSize: 11 }}>{m.especialidade}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Médico selecionado ou preenchimento manual */}
              {medicoSelecionado && form.medico ? (
                <div style={{ marginTop: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", marginBottom: 2 }}>Médico Selecionado:</div>
                  <div style={{ fontSize: 12, color: "#111" }}>{form.medico}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{form.crm} — {form.especialidade}</div>
                  <button type="button" style={{ ...btnGray, padding: "4px 10px", fontSize: 10, marginTop: 4 }} onClick={() => { setMedicoSelecionado(false); setShowResultados(true); }}>
                    Alterar
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: 8, padding: "8px 0" }}>
                  <p style={{ fontSize: 10, color: "#6b7280", margin: "0 0 6px" }}>Ou preencha manualmente:</p>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 6 }}>
                      <div>
                        <label style={lbl}>Nome Completo *</label>
                        <input style={inp} value={form.medico} onChange={e => setForm(p => ({ ...p, medico: e.target.value.toUpperCase() }))} placeholder="NOME DO MÉDICO" />
                      </div>
                      <div>
                        <label style={lbl}>CRM *</label>
                        <input style={inp} value={form.crm} onChange={e => setForm(p => ({ ...p, crm: e.target.value }))} placeholder="CRM/UF 000000" />
                      </div>
                    </div>
                    <div>
                      <label style={lbl}>Especialidade</label>
                      <select style={sel} value={form.especialidade} onChange={e => setForm(p => ({ ...p, especialidade: e.target.value }))}>
                        <option value="">Selecione</option>
                        {especialidades.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Assinatura */}
              <div style={{ marginTop: 10, borderTop: "1px solid #e5e7eb", paddingTop: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Assinatura do Médico</p>
                <div style={{ display: "grid", gap: 6 }}>
                  <div>
                    <label style={lbl}>Cor da Tinta</label>
                    <select style={sel} value={signatureColor} onChange={e => setSignatureColor(e.target.value)}>
                      <option value="#0b109f">Azul Caneta</option>
                      <option value="#000000">Preto</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Foto da Assinatura</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {signatureImage ? (
                        <div style={{ position: "relative" }}>
                          <img src={signatureImage} alt="Assinatura" style={{ maxHeight: 50, maxWidth: 160, objectFit: "contain", border: "1px solid #e5e7eb", borderRadius: 6 }} />
                          <button type="button" onClick={() => { setSignatureImage(""); if (signatureRef.current) signatureRef.current.value = ""; }}
                            style={{ position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 10, cursor: "pointer" }}>✕</button>
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
              </div>
            </div>

            {/* ── 3. Paciente ── */}
            <div style={card}>
              <p style={secTitle}>3. Dados do Paciente</p>
              <div style={{ display: "grid", gap: 8 }}>
                <div>
                  <label style={lbl}>Nome Completo *</label>
                  <input style={inp} value={form.paciente} onChange={e => setForm(p => ({ ...p, paciente: e.target.value }))} placeholder="Nome Completo do Paciente" required />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={lbl}>CPF {createdCode && <span style={{ fontSize: 9, color: "#ef4444", fontWeight: 700 }}>🔒 BLOQUEADO</span>}</label>
                    <input style={{ ...inp, ...(createdCode ? { background: "#f3f4f6", color: "#6b7280", cursor: "not-allowed" } : {}) }} value={form.cpf} onChange={e => { if (!createdCode) setForm(p => ({ ...p, cpf: maskCPF(e.target.value) })); }} placeholder="000.000.000-00" inputMode="numeric" maxLength={14} readOnly={!!createdCode} />
                  </div>
                  <div>
                    <label style={lbl}>RG / Identidade</label>
                    <input style={inp} value={form.identidade} onChange={e => setForm(p => ({ ...p, identidade: e.target.value }))} placeholder="Número do RG" />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={lbl}>Telefone</label>
                    <input style={inp} value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
                  </div>
                  <div>
                    <label style={lbl}>Cidade</label>
                    <input style={inp} value={form.cidade} onChange={e => setForm(p => ({ ...p, cidade: e.target.value.toUpperCase() }))} placeholder="Ex: SÃO PAULO" />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Endereço Completo</label>
                  <input style={inp} value={form.endereco} onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} placeholder="Rua, Número, Bairro, CEP" />
                </div>
              </div>
            </div>

            {/* ── 4. Prescrição ── */}
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ ...secTitle, margin: 0, border: "none", padding: 0 }}>4. Prescrição Médica</p>
                <button type="button" style={{ ...btnBlue, padding: "5px 12px", fontSize: 11 }} onClick={addMedicamento}>+ ADICIONAR</button>
              </div>
              {prescricao.map((item, idx) => (
                <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", marginBottom: 8, background: "#fafafa" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#005CA9", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{idx + 1}</div>
                      <button type="button" onClick={() => updateMedicamento(idx, "uso_interno", !item.uso_interno)}
                        style={{ padding: "3px 10px", borderRadius: 4, fontWeight: 600, fontSize: 10, cursor: "pointer", background: item.uso_interno ? "#059669" : "#7c3aed", color: "#fff", border: "none" }}>
                        {item.uso_interno ? "USO INTERNO" : "USO EXTERNO"}
                      </button>
                    </div>
                    {prescricao.length > 1 && <button type="button" style={btnRed} onClick={() => removeMedicamento(idx)}>✕</button>}
                  </div>
                  <div style={{ display: "grid", gap: 5 }}>
                    <input style={inp} value={item.medicamento} onChange={e => updateMedicamento(idx, "medicamento", e.target.value.toUpperCase())} placeholder="Nome do Medicamento — Ex: AMOXICILINA 500MG CÁPSULA" required={idx === 0} />
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 2fr", gap: 5, alignItems: "end" }}>
                      <div>
                        <label style={{ ...lbl, fontSize: 10 }}>Qtd</label>
                        <select style={{ ...sel, width: 60, padding: "7px 4px", fontSize: 12 }}
                          value={(() => { const m = item.quantidade.match(/^(\d+)/); return m ? (parseInt(m[1]) <= 10 ? m[1] : "custom") : ""; })()}
                          onChange={e => {
                            const v = e.target.value;
                            if (v === "custom") { updateMedicamento(idx, "quantidade", ""); return; }
                            if (!v) { updateMedicamento(idx, "quantidade", ""); return; }
                            const n = parseInt(v);
                            const ext: Record<number,string> = {1:"uma",2:"duas",3:"três",4:"quatro",5:"cinco",6:"seis",7:"sete",8:"oito",9:"nove",10:"dez"};
                            const numStr = String(n).padStart(2, "0");
                            updateMedicamento(idx, "quantidade", `${numStr} (${ext[n]}) caixa${n > 1 ? "s" : ""}`);
                          }}>
                          <option value="">-</option>
                          {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={String(n)}>{String(n).padStart(2,"0")}</option>)}
                          <option value="custom">+</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ ...lbl, fontSize: 10 }}>Quantidade</label>
                        <input style={inp} value={item.quantidade} onChange={e => updateMedicamento(idx, "quantidade", e.target.value)} placeholder="Ex: 01 (uma) caixa" />
                      </div>
                      <input style={inp} value={item.modo_uso} onChange={e => updateMedicamento(idx, "modo_uso", e.target.value)} placeholder="Uso: Tomar 1 cápsula de 8/8h por 7 dias" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── 5. Data ── */}
            <div style={card}>
              <p style={secTitle}>5. Data de Emissão</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={lbl}>Data *</label>
                  <input style={inp} value={form.dataEmissao} onChange={e => setForm(p => ({ ...p, dataEmissao: handleDateInput(e.target.value) }))} placeholder="DD/MM/AAAA" maxLength={10} inputMode="numeric" required />
                </div>
                <div>
                  <label style={lbl}>Hora</label>
                  <input style={inp} type="time" value={form.horaEmissao} onChange={e => setForm(p => ({ ...p, horaEmissao: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Botões */}
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "8px 12px", background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <span style={{ fontWeight: 700, color: "#374151", fontSize: 14 }}>Preview em Tempo Real</span>
            <span style={{ fontSize: 11, color: "#6b7280", background: "#fef3c7", padding: "3px 8px", borderRadius: 5, fontWeight: 600 }}>QR Code gerado somente após emissão</span>
          </div>
          <div style={{ flex: 1, overflow: "auto", background: "#525659", borderRadius: 10, padding: 14, maxHeight: "calc(100vh - 120px)" }}>
            <div ref={previewRef} style={{ width: 794, margin: "0 auto", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <PrescricaoDocument data={previewData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
