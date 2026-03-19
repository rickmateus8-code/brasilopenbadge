import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "wouter";
import AttestationDocument from "@/components/AttestationDocument";
import type { AttestationData } from "@/data/attestations";
import { exportElementToPDF, generatePDFFilename } from "@/lib/pdfExport";
import { createAttestation } from "@/lib/attestationStore";
import { createAttestationApi } from "@/lib/apiClient";
import { handleDateInput, formatDateToEnglish } from "@/lib/dateMask";

// ─── Constantes ────────────────────────────────────────────────────────────────
const DEFAULT_LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663380726083/Jt3ChWN8C56HSCFrn4RLrZ/idab-logo-correct_03a04244.webp";

const UFS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

const CIDS_RAPIDOS = [
  { code: "A09",   desc: "Diarreia / Gastroenterite" },
  { code: "A90",   desc: "Dengue" },
  { code: "B34.9", desc: "Virose não especificada" },
  { code: "H10",   desc: "Conjuntivite" },
  { code: "J11",   desc: "Gripe (Influenza)" },
  { code: "J00",   desc: "Resfriado comum" },
  { code: "J01",   desc: "Sinusite aguda" },
  { code: "J03",   desc: "Amigdalite" },
  { code: "J06",   desc: "Infecção Vias Aéreas" },
  { code: "J30",   desc: "Rinite Alérgica" },
  { code: "M54.2", desc: "Dor no Pescoço" },
  { code: "M54.5", desc: "Dor Lombar" },
  { code: "S93",   desc: "Entorse Tornozelo" },
  { code: "R51",   desc: "Dor de Cabeça" },
  { code: "G43",   desc: "Enxaqueca" },
  { code: "K29",   desc: "Gastrite" },
  { code: "R10",   desc: "Dor Abdominal" },
  { code: "N39.0", desc: "Infecção Urinária" },
  { code: "Z76.3", desc: "Acompanhante" },
  { code: "T78.0", desc: "Reação Anafilática (Ovo)" },
  { code: "L50",   desc: "Urticária" },
  { code: "J45",   desc: "Asma" },
  { code: "I10",   desc: "Hipertensão" },
  { code: "E11",   desc: "Diabetes Tipo 2" },
];

// ─── Tipos ─────────────────────────────────────────────────────────────────────
interface CfmMedico {
  nome: string;
  crm: string;
  uf: string;
  especialidade: string;
  municipio?: string;
  situacao?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().split("T")[0];
}
function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function isoToBR(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function CreateAttestation() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  // Logo
  const [logoLocalUrl, setLogoLocalUrl] = useState<string>(DEFAULT_LOGO_URL);
  const logoFileRef = useRef<HTMLInputElement>(null);

  // Busca CFM
  const [ufBusca, setUfBusca] = useState("");
  const [nomeBusca, setNomeBusca] = useState("");
  const [crmBusca, setCrmBusca] = useState("");
  const [cfmResultados, setCfmResultados] = useState<CfmMedico[]>([]);
  const [cfmBuscando, setCfmBuscando] = useState(false);
  const [cfmErro, setCfmErro] = useState("");

  // Formulário
  const [form, setForm] = useState({
    // Instituição
    instituicao: "IDAB - SALVADOR/BAHIA",
    enderecoEmitente: "AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA, SALVADOR - BA, 41825-000",
    // Médico
    medico: "DIMITRI GUSMAO FLORES",
    crm: "CRM/BA 14180",
    especialidade: "ALLERGY AND IMMUNOLOGY",
    // Paciente
    paciente: "",
    sexo: "FEMALE" as "MALE" | "FEMALE",
    nascimento: "",
    cpf: "",
    nomeMae: "",
    endereco: "",
    // Dados médicos
    passaporte: "",
    condicao: "The patient has a history of severe allergic reaction (anaphylaxis) to egg proteins, representing a risk condition for administration of vaccines containing this component.",
    vacinacao: "YELLOW FEVER",
    cid: "T78.0 ANAPHYLACTIC REACTION DUE TO FOOD (EGG)",
    // Data/hora
    dataAssinatura: isoToBR(todayISO()),
    horaAssinatura: nowTime(),
    dataEmissao: isoToBR(todayISO()),
  });

  // Importação rápida
  const [importTexto, setImportTexto] = useState("");
  const [showImport, setShowImport] = useState(false);

  // ── Handlers genéricos ──────────────────────────────────────────────────────
  const set = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => set(e.target.name, e.target.value);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    set(e.target.name, handleDateInput(e.target.value));
  };

  // ── Upload de logo local ────────────────────────────────────────────────────
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setLogoLocalUrl(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoLocalUrl(DEFAULT_LOGO_URL);
    if (logoFileRef.current) logoFileRef.current.value = "";
  };

  // ── Busca CFM ───────────────────────────────────────────────────────────────
  const buscarCFM = useCallback(async () => {
    if (!ufBusca && !nomeBusca && !crmBusca) {
      setCfmErro("Informe ao menos UF, nome ou CRM.");
      return;
    }
    setCfmBuscando(true);
    setCfmErro("");
    setCfmResultados([]);

    try {
      const params = new URLSearchParams();
      if (ufBusca) params.set("uf", ufBusca);
      if (nomeBusca) params.set("nome", nomeBusca.toUpperCase());
      if (crmBusca) params.set("crm", crmBusca);

      // Proxy via nosso Worker para evitar CORS
      const url = `/api/cfm/buscar?${params.toString()}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.status === "sucesso" && Array.isArray(data.dados)) {
        const medicos: CfmMedico[] = data.dados.map((m: any) => ({
          nome: m.nome || m.NOME || "",
          crm: m.crm || m.CRM || "",
          uf: m.uf || m.UF || ufBusca,
          especialidade: m.especialidade || m.ESPECIALIDADE || "",
          municipio: m.municipio || m.MUNICIPIO || "",
          situacao: m.situacao || m.SITUACAO || "",
        }));
        setCfmResultados(medicos);
        if (medicos.length === 0) setCfmErro("Nenhum médico encontrado.");
      } else {
        setCfmErro(data.dados || "Nenhum resultado encontrado.");
      }
    } catch (err) {
      setCfmErro("Erro ao consultar o CFM. Preencha os dados manualmente.");
    } finally {
      setCfmBuscando(false);
    }
  }, [ufBusca, nomeBusca, crmBusca]);

  const selecionarMedico = (m: CfmMedico) => {
    set("medico", m.nome.toUpperCase());
    set("crm", `CRM/${m.uf} ${m.crm}`);
    set("especialidade", m.especialidade.toUpperCase() || "CLÍNICO GERAL");
    if (m.municipio) set("instituicao", `CONSULTÓRIO MÉDICO - ${m.municipio.toUpperCase()}`);
    setCfmResultados([]);
    setNomeBusca("");
    setCrmBusca("");
  };

  // ── Importação rápida ───────────────────────────────────────────────────────
  const processarImportacao = () => {
    if (!importTexto.trim()) return;
    const mapa: Record<string, string> = {
      "nome completo": "paciente",
      "nome": "paciente",
      "cpf": "cpf",
      "cns": "cpf",
      "numero do doc": "cpf",
      "nascimento": "nascimento",
      "data de nascimento": "nascimento",
      "sexo": "sexo",
      "nome da mae": "nomeMae",
      "mae": "nomeMae",
      "endereco do paciente": "endereco",
      "endereco": "endereco",
      "passaporte": "passaporte",
      "cid": "cid",
      "condicao": "condicao",
      "condicao clinica": "condicao",
      "vacinacao": "vacinacao",
      "cidade": "instituicao",
      "data do atestado": "dataAssinatura",
      "data": "dataAssinatura",
      "horario": "horaAssinatura",
      "hora": "horaAssinatura",
    };

    const normalize = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    const linhas = importTexto.split("\n");
    const updates: Partial<typeof form> = {};

    linhas.forEach((linha) => {
      const idx = linha.lastIndexOf(":");
      if (idx === -1) return;
      const chave = normalize(linha.substring(0, idx));
      const valor = linha.substring(idx + 1).trim().toUpperCase();
      if (!valor) return;

      for (const label in mapa) {
        if (chave.includes(label)) {
          const field = mapa[label] as keyof typeof form;
          if (field === "sexo") {
            (updates as any)[field] = valor.startsWith("M") ? "MALE" : "FEMALE";
          } else if (field === "nascimento" || field === "dataAssinatura") {
            const d = valor.replace(/\D/g, "");
            if (d.length === 8) {
              (updates as any)[field] = `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4, 8)}`;
            } else {
              (updates as any)[field] = valor;
            }
          } else {
            (updates as any)[field] = valor;
          }
        }
      }
    });

    setForm((p) => ({ ...p, ...updates }));
    setImportTexto("");
    setShowImport(false);
  };

  // ── Download PDF ────────────────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    try {
      const filename = generatePDFFilename(form.paciente || "ATESTADO", "EMITIDO");
      await exportElementToPDF(previewRef.current, { filename, scale: 2, quality: 0.92 });
    } catch (err) {
      alert(`Erro ao gerar PDF: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      paciente: form.paciente.toUpperCase(),
      sexo: form.sexo,
      nascimento: form.nascimento,
      cpf: form.cpf,
      nomeMae: form.nomeMae.toUpperCase(),
      endereco: form.endereco.toUpperCase(),
      passaporte: form.passaporte.toUpperCase(),
      condicao: form.condicao,
      vacinacao: form.vacinacao.toUpperCase(),
      cid: form.cid.toUpperCase(),
      medico: form.medico.toUpperCase(),
      crm: form.crm,
      especialidade: form.especialidade.toUpperCase(),
      dataAssinatura: form.dataAssinatura,
      horaAssinatura: form.horaAssinatura,
      dataEmissao: formatDateToEnglish(form.dataEmissao).toUpperCase(),
      logoUrl: logoLocalUrl || DEFAULT_LOGO_URL,
      instituicao: form.instituicao,
      enderecoEmitente: form.enderecoEmitente,
    };

    try {
      let newAtt: any;
      try {
        const apiResult = await createAttestationApi(payload);
        newAtt = apiResult || createAttestation(payload as any);
      } catch {
        newAtt = createAttestation(payload as any);
      }
      setCreatedCode(newAtt.codigoQR);
      alert(`✅ Atestado emitido com sucesso!\n\nCódigo de Validação: ${newAtt.codigoQR}`);
    } catch (error) {
      alert(`Erro ao emitir atestado: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Preview data ────────────────────────────────────────────────────────────
  const previewData: AttestationData & Record<string, any> = {
    id: createdCode || "XXXX.XXXX",
    paciente: form.paciente || "NOME DO PACIENTE",
    sexo: form.sexo,
    nascimento: form.nascimento || "DD/MM/AAAA",
    cpf: form.cpf || "XXX.XXX.XXX-XX",
    nomeMae: form.nomeMae || "NOME DA MÃE",
    endereco: form.endereco || "ENDEREÇO COMPLETO",
    passaporte: form.passaporte || "XXXXXXX",
    condicao: form.condicao,
    vacinacao: form.vacinacao,
    cid: form.cid,
    codigoQR: createdCode || "XXXX.XXXX",
    dataAssinatura: form.dataAssinatura || "DD/MM/AAAA",
    horaAssinatura: form.horaAssinatura || "HH:MM",
    medico: form.medico,
    crm: form.crm,
    especialidade: form.especialidade,
    dataEmissao: form.dataEmissao ? formatDateToEnglish(form.dataEmissao) : "MONTH DD, YYYY",
    logoUrl: logoLocalUrl,
    instituicao: form.instituicao,
    enderecoEmitente: form.enderecoEmitente,
  };

  // ── Estilos inline ──────────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    padding: "16px",
    marginBottom: 14,
  };
  const sectionTitle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#005CA9",
    borderBottom: "2px solid #005CA9",
    paddingBottom: 6,
    marginBottom: 12,
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 3,
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "6px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, background: "#fff" };
  const btnGreen: React.CSSProperties = {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    padding: "9px 18px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    letterSpacing: 0.5,
  };
  const btnBlue: React.CSSProperties = {
    background: "#005CA9",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    padding: "9px 18px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    letterSpacing: 0.5,
  };
  const btnGray: React.CSSProperties = {
    background: "#e2e8f0",
    color: "#475569",
    border: "1px solid #cbd5e1",
    borderRadius: 7,
    padding: "9px 18px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "Roboto, sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ background: "#005CA9", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/">
            <button style={{ ...btnGray, padding: "6px 14px", fontSize: 12 }}>← VOLTAR</button>
          </Link>
          <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>
            IDAB — EMITIR ATESTADO
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...btnGreen, padding: "6px 14px", fontSize: 12 }} onClick={handleDownloadPdf}>
            ⬇ BAIXAR PDF
          </button>
        </div>
      </div>

      {/* ── Layout principal ── */}
      <div style={{ display: "flex", gap: 16, padding: "16px", maxWidth: 1800, margin: "0 auto" }}>

        {/* ═══════════════════ COLUNA ESQUERDA — FORMULÁRIO ═══════════════════ */}
        <div style={{ width: 500, flexShrink: 0, overflowY: "auto", maxHeight: "calc(100vh - 80px)" }}>
          <form onSubmit={handleSubmit}>

            {/* Código gerado */}
            {createdCode && (
              <div style={{ ...cardStyle, background: "#f0fdf4", border: "1px solid #86efac" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#166534", margin: 0 }}>✅ Código de Validação Gerado:</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: "#15803d", margin: "4px 0 0" }}>{createdCode}</p>
              </div>
            )}

            {/* ── Importação Rápida ── */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ ...sectionTitle, margin: 0, border: "none", padding: 0 }}>📋 Importação Rápida de Dados</p>
                <button type="button" style={{ ...btnGray, padding: "4px 10px", fontSize: 11 }}
                  onClick={() => setShowImport(!showImport)}>
                  {showImport ? "▲ FECHAR" : "▼ ABRIR"}
                </button>
              </div>
              {showImport && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
                    Cole os dados do paciente no formato <code>Campo: Valor</code> (um por linha):
                  </p>
                  <textarea
                    value={importTexto}
                    onChange={(e) => setImportTexto(e.target.value)}
                    rows={8}
                    placeholder={"Nome Completo: JOÃO DA SILVA\nCPF: 123.456.789-00\nNascimento: 01/01/1990\nSexo: M\nNome da Mae: MARIA DA SILVA\nEndereço: RUA X, 100\nCID: A09\nData: 19/03/2026\nHorario: 14:30"}
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
                  />
                  <button type="button" style={{ ...btnBlue, width: "100%", marginTop: 8 }}
                    onClick={processarImportacao}>
                    ⚡ PROCESSAR DADOS
                  </button>
                </div>
              )}
            </div>

            {/* ── Busca de Médico CFM ── */}
            <div style={cardStyle}>
              <p style={sectionTitle}>🔍 1. Buscar Médico (CFM)</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={labelStyle}>UF</label>
                  <select style={selectStyle} value={ufBusca} onChange={(e) => setUfBusca(e.target.value)}>
                    <option value="">Selecione...</option>
                    {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Nome ou CRM</label>
                  <input
                    style={inputStyle}
                    placeholder="Ex: DIMITRI ou 14180"
                    value={nomeBusca}
                    onChange={(e) => setNomeBusca(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), buscarCFM())}
                  />
                </div>
              </div>
              <button type="button" style={{ ...btnBlue, width: "100%" }} onClick={buscarCFM} disabled={cfmBuscando}>
                {cfmBuscando ? "🔄 Buscando..." : "🔍 BUSCAR NO CFM"}
              </button>

              {cfmErro && (
                <p style={{ fontSize: 12, color: "#dc2626", marginTop: 8, padding: "6px 10px", background: "#fef2f2", borderRadius: 6 }}>
                  {cfmErro}
                </p>
              )}

              {cfmResultados.length > 0 && (
                <div style={{ marginTop: 10, maxHeight: 200, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                  {cfmResultados.map((m, i) => (
                    <div
                      key={i}
                      onClick={() => selecionarMedico(m)}
                      style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid #f3f4f6",
                        cursor: "pointer",
                        fontSize: 12,
                        background: i % 2 === 0 ? "#fff" : "#f9fafb",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#f9fafb")}
                    >
                      <strong style={{ color: "#005CA9" }}>{m.nome}</strong>
                      <span style={{ color: "#6b7280", marginLeft: 8 }}>CRM/{m.uf} {m.crm}</span>
                      {m.especialidade && <span style={{ color: "#059669", marginLeft: 8 }}>• {m.especialidade}</span>}
                      {m.municipio && <span style={{ color: "#9ca3af", marginLeft: 8 }}>📍 {m.municipio}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Dados do Médico / Instituição ── */}
            <div style={cardStyle}>
              <p style={sectionTitle}>🏥 Dados da Instituição e Médico</p>
              <div style={{ display: "grid", gap: 8 }}>
                <div>
                  <label style={labelStyle}>Nome da Instituição</label>
                  <input style={inputStyle} name="instituicao" value={form.instituicao} onChange={handleInput} />
                </div>
                <div>
                  <label style={labelStyle}>Endereço Emitente</label>
                  <input style={inputStyle} name="enderecoEmitente" value={form.enderecoEmitente} onChange={handleInput} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={labelStyle}>Nome do Médico</label>
                    <input style={inputStyle} name="medico" value={form.medico} onChange={handleInput} required />
                  </div>
                  <div>
                    <label style={labelStyle}>CRM</label>
                    <input style={inputStyle} name="crm" value={form.crm} onChange={handleInput} placeholder="CRM/BA 14180" required />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Especialidade</label>
                  <input style={inputStyle} name="especialidade" value={form.especialidade} onChange={handleInput} required />
                </div>
              </div>
            </div>

            {/* ── Logo ── */}
            <div style={cardStyle}>
              <p style={sectionTitle}>🖼 Logo da Instituição</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 80, height: 60, border: "2px dashed #d1d5db", borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", background: "#f9fafb", flexShrink: 0,
                }}>
                  {logoLocalUrl ? (
                    <img src={logoLocalUrl} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  ) : (
                    <span style={{ fontSize: 10, color: "#9ca3af", textAlign: "center" }}>SEM LOGO</span>
                  )}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{
                    ...btnBlue, display: "inline-block", textAlign: "center",
                    padding: "7px 14px", cursor: "pointer", fontSize: 12,
                  }}>
                    📁 ENVIAR LOGO (LOCAL)
                    <input
                      ref={logoFileRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLogoUpload}
                    />
                  </label>
                  <button type="button" style={{ ...btnGray, fontSize: 11, padding: "5px 10px" }} onClick={handleRemoveLogo}>
                    🔄 Usar Logo Padrão IDAB
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>
                Formatos aceitos: PNG, JPG, WEBP, SVG. A logo será incorporada diretamente no PDF.
              </p>
            </div>

            {/* ── Dados do Paciente ── */}
            <div style={cardStyle}>
              <p style={sectionTitle}>👤 2. Dados do Paciente</p>
              <div style={{ display: "grid", gap: 8 }}>
                <div>
                  <label style={labelStyle}>Nome Completo</label>
                  <input style={inputStyle} name="paciente" value={form.paciente} onChange={handleInput}
                    placeholder="Nome Completo" required />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={labelStyle}>Sexo</label>
                    <select style={selectStyle} name="sexo" value={form.sexo} onChange={handleInput}>
                      <option value="FEMALE">Feminino</option>
                      <option value="MALE">Masculino</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Data de Nascimento</label>
                    <input style={inputStyle} name="nascimento" value={form.nascimento}
                      onChange={handleDateChange} placeholder="DD/MM/AAAA" maxLength={10} inputMode="numeric" required />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>CPF / CNS</label>
                  <input style={inputStyle} name="cpf" value={form.cpf} onChange={handleInput}
                    placeholder="XXX.XXX.XXX-XX" required />
                </div>
                <div>
                  <label style={labelStyle}>Nome da Mãe</label>
                  <input style={inputStyle} name="nomeMae" value={form.nomeMae} onChange={handleInput}
                    placeholder="Nome da Mãe" required />
                </div>
                <div>
                  <label style={labelStyle}>Endereço do Paciente</label>
                  <input style={inputStyle} name="endereco" value={form.endereco} onChange={handleInput}
                    placeholder="Rua, Número, Bairro, Cidade/UF" required />
                </div>
              </div>
            </div>

            {/* ── Dados Médicos ── */}
            <div style={cardStyle}>
              <p style={sectionTitle}>🩺 Dados Médicos</p>
              <div style={{ display: "grid", gap: 8 }}>
                <div>
                  <label style={labelStyle}>Passaporte (opcional)</label>
                  <input style={inputStyle} name="passaporte" value={form.passaporte} onChange={handleInput}
                    placeholder="Ex: FX255093" />
                </div>
                <div>
                  <label style={labelStyle}>Condição Clínica (em inglês)</label>
                  <textarea
                    name="condicao"
                    value={form.condicao}
                    onChange={handleInput}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Vacinação Contraindicada</label>
                  <input style={inputStyle} name="vacinacao" value={form.vacinacao} onChange={handleInput}
                    placeholder="Ex: YELLOW FEVER" required />
                </div>
                <div>
                  <label style={labelStyle}>CID / ICD</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <select
                      style={{ ...selectStyle, flex: 1 }}
                      onChange={(e) => {
                        if (e.target.value) set("cid", e.target.value);
                      }}
                      value=""
                    >
                      <option value="">Selecione um CID rápido...</option>
                      {CIDS_RAPIDOS.map((c) => (
                        <option key={c.code} value={`${c.code} ${c.desc.toUpperCase()}`}>
                          {c.code} — {c.desc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input style={{ ...inputStyle, marginTop: 6 }} name="cid" value={form.cid}
                    onChange={handleInput} placeholder="Ou digite o código (Ex: T78.0)" required />
                </div>
              </div>
            </div>

            {/* ── Data e Hora ── */}
            <div style={cardStyle}>
              <p style={sectionTitle}>📅 3. Data e Hora</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={labelStyle}>Data da Assinatura</label>
                  <input style={inputStyle} name="dataAssinatura" value={form.dataAssinatura}
                    onChange={handleDateChange} placeholder="DD/MM/AAAA" maxLength={10} inputMode="numeric" required />
                </div>
                <div>
                  <label style={labelStyle}>Hora da Assinatura</label>
                  <input style={inputStyle} type="time" name="horaAssinatura" value={form.horaAssinatura}
                    onChange={handleInput} required />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Data de Emissão</label>
                  <input style={inputStyle} name="dataEmissao" value={form.dataEmissao}
                    onChange={handleDateChange} placeholder="DD/MM/AAAA" maxLength={10} inputMode="numeric" required />
                </div>
              </div>
            </div>

            {/* ── Botões de Ação ── */}
            <div style={{ display: "flex", gap: 10, paddingBottom: 20 }}>
              <Link href="/">
                <button type="button" style={{ ...btnGray, flex: 1 }}>CANCELAR</button>
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                style={{ ...btnGreen, flex: 2, opacity: isLoading ? 0.7 : 1 }}
              >
                {isLoading ? "⏳ Emitindo..." : "✅ EMITIR ATESTADO"}
              </button>
            </div>

          </form>
        </div>

        {/* ═══════════════════ COLUNA DIREITA — PREVIEW ═══════════════════════ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 12, padding: "8px 12px", background: "#fff",
            borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <span style={{ fontWeight: 700, color: "#374151", fontSize: 14 }}>
              📄 Preview em Tempo Real
            </span>
            <button style={btnBlue} onClick={handleDownloadPdf}>
              ⬇ BAIXAR PDF
            </button>
          </div>
          <div style={{
            flex: 1, overflow: "auto", background: "#525659",
            borderRadius: 10, padding: 16,
            maxHeight: "calc(100vh - 140px)",
          }}>
            <div style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <AttestationDocument ref={previewRef} data={previewData} logoUrl={logoLocalUrl} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
