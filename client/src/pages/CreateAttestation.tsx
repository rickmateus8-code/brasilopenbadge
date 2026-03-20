import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "wouter";
import AttestationDocument from "@/components/AttestationDocument";
import type { AttestationData } from "@/data/attestations";
import { exportElementToPDF, generatePDFFilename } from "@/lib/pdfExport";
import { createAttestation } from "@/lib/attestationStore";
import { createAttestationApi } from "@/lib/apiClient";
import { handleDateInput, formatDateToEnglish } from "@/lib/dateMask";

// ─── Supabase (banco de médicos do elitedoc) ───────────────────────────────────
const SB_URL = "https://ijkzwzvanougkjcxquvn.supabase.co";
const SB_KEY = "sb_publishable_x76vx-9M9DrmibJ6NeELJg_iT1_CDsT";

async function sbFetch(path: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Supabase HTTP ${res.status}`);
  return res.json();
}

// ─── Constantes ────────────────────────────────────────────────────────────────
const DEFAULT_LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663380726083/Jt3ChWN8C56HSCFrn4RLrZ/idab-logo-correct_03a04244.webp";

// Logos padrão disponíveis (baixadas do elitedoc.store)
const LOGOS_PADRAO = [
  { id: "idab",       label: "IDAB",         src: DEFAULT_LOGO_URL },
  { id: "logo1",      label: "Logo 1",       src: "/logos/logo1.png" },
  { id: "logo2",      label: "Logo 2",       src: "/logos/logo2.png" },
  { id: "logo3",      label: "Logo 3",       src: "/logos/logo3.jpg" },
  { id: "amil",       label: "Amil",         src: "/logos/amil.png" },
  { id: "hapvida",    label: "Hapvida",      src: "/logos/hapvida.png" },
  { id: "notredame",  label: "Notre Dame",   src: "/logos/notredame.png" },
  { id: "sulamerica", label: "Sul América",  src: "/logos/sulamerica.png" },
  { id: "unimed",     label: "Unimed",       src: "/logos/unimed.png" },
];

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

// ─── Helpers ───────────────────────────────────────────────────────────────────
function todayBR() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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

// ─── Componente ────────────────────────────────────────────────────────────────
export default function CreateAttestation() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  // ── Logos ──────────────────────────────────────────────────────────────────
  const [logoLeft, setLogoLeft] = useState<string>(DEFAULT_LOGO_URL);
  const [logoRight, setLogoRight] = useState<string>("");
  const logoLeftRef = useRef<HTMLInputElement>(null);
  const logoRightRef = useRef<HTMLInputElement>(null);

  // ── Assinatura ─────────────────────────────────────────────────────────────
  const [signatureColor, setSignatureColor] = useState<string>("#0b109f");
  const [signatureImage, setSignatureImage] = useState<string>("");
  const signatureRef = useRef<HTMLInputElement>(null);

  // ── Busca de médicos ────────────────────────────────────────────────────────
  const [filtroUF, setFiltroUF] = useState("");
  const [filtroCidade, setFiltroCidade] = useState("");
  const [filtroBairro, setFiltroBairro] = useState("");
  const [filtroEsp, setFiltroEsp] = useState("");
  const [termoBusca, setTermoBusca] = useState("");
  const [cidades, setCidades] = useState<string[]>([]);
  const [bairros, setBairros] = useState<string[]>([]);
  const [resultados, setResultados] = useState<MedicoDB[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState("");
  const [showResultados, setShowResultados] = useState(false);

  // ── Formulário ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    instituicao: "IDAB - SALVADOR/BAHIA",
    unidade: "",
    enderecoEmitente: "AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA, SALVADOR - BA, 41825-000",
    medico: "DIMITRI GUSMAO FLORES",
    crm: "CRM/BA 14180",
    especialidade: "ALLERGY AND IMMUNOLOGY",
    paciente: "",
    sexo: "FEMALE" as "MALE" | "FEMALE",
    nascimento: "",
    cpf: "",
    nomeMae: "",
    endereco: "",
    passaporte: "",
    condicao:
      "The patient has a history of severe allergic reaction (anaphylaxis) to egg proteins, representing a risk condition for administration of vaccines containing this component.",
    vacinacao: "YELLOW FEVER",
    cid: "T78.0 ANAPHYLACTIC REACTION DUE TO FOOD (EGG)",
    dataAssinatura: todayBR(),
    horaAssinatura: nowTime(),
    dataEmissao: todayBR(),
    cidade: "",
    textoAtestado: "",
    cidDisplay: "",
    cidNome: "",
    afastamento: "",
    modoCarimbo: false,
  });

  // ── Importação rápida ───────────────────────────────────────────────────────
  const [importTexto, setImportTexto] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showEditar, setShowEditar] = useState(false);

  // ── Carregar cidades quando UF muda ────────────────────────────────────────
  useEffect(() => {
    if (!filtroUF) { setCidades([]); setBairros([]); return; }
    sbFetch(
      `medicos_brasil?uf_local=eq.${filtroUF}&select=cidade&order=cidade.asc`
    )
      .then((data: any[]) => {
        const unicas = [...new Set(data.map((d) => d.cidade).filter(Boolean))].sort();
        setCidades(unicas as string[]);
      })
      .catch(() => setCidades([]));
    setFiltroCidade("");
    setFiltroBairro("");
    setBairros([]);
  }, [filtroUF]);

  // ── Carregar bairros quando cidade muda ────────────────────────────────────
  useEffect(() => {
    if (!filtroUF || !filtroCidade) { setBairros([]); return; }
    sbFetch(
      `medicos_brasil?uf_local=eq.${filtroUF}&cidade=eq.${encodeURIComponent(filtroCidade)}&select=bairro&order=bairro.asc`
    )
      .then((data: any[]) => {
        const unicos = [...new Set(data.map((d) => d.bairro).filter(Boolean))].sort();
        setBairros(unicos as string[]);
      })
      .catch(() => setBairros([]));
    setFiltroBairro("");
  }, [filtroUF, filtroCidade]);

  // ── Busca de médicos ────────────────────────────────────────────────────────
  const buscarMedicos = useCallback(async () => {
    const termo = termoBusca.trim().toUpperCase().replace(/[.\-]/g, "");

    // Exige UF + pelo menos 3 chars de nome/CRM para evitar timeout
    if (!filtroUF) {
      setErroBusca("Selecione a UF antes de buscar.");
      return;
    }
    if (termo.length < 3) {
      setErroBusca("Digite ao menos 3 caracteres do nome ou CRM.");
      return;
    }

    setBuscando(true);
    setErroBusca("");
    setShowResultados(true);

    try {
      // Detectar se é busca por CRM (só números) ou por nome
      const isCRM = /^\d+$/.test(termo);
      let query: string;

      if (isCRM) {
        // Busca por CRM exige UF obrigatório para não dar timeout
        query = `medicos_brasil?select=*&limit=30&order=nome_medico.asc&uf_crm=eq.${filtroUF}&crm=ilike.*${termo}*`;
      } else {
        // Busca por nome: UF obrigatório + nome com ilike
        query = `medicos_brasil?select=*&limit=30&order=nome_medico.asc&uf_crm=eq.${filtroUF}&nome_medico=ilike.*${termo}*`;
        if (filtroEsp) query += `&especialidade=ilike.*${filtroEsp}*`;
      }

      const data: MedicoDB[] = await sbFetch(query);
      setResultados(data);
      if (data.length === 0) setErroBusca("Nenhum médico encontrado. Tente outro nome ou preencha manualmente.");
    } catch {
      setErroBusca("Erro ao buscar. Verifique a conexão ou preencha manualmente.");
    } finally {
      setBuscando(false);
    }
  }, [termoBusca, filtroUF, filtroEsp]);

  const selecionarMedico = (m: MedicoDB) => {
    setForm((p) => ({
      ...p,
      medico: m.nome_medico.toUpperCase(),
      crm: `CRM/${m.uf_crm || m.uf_local} ${m.crm}`,
      especialidade: (m.especialidade || "CLÍNICO GERAL").toUpperCase(),
      instituicao: (m.local_trabalho || "CONSULTÓRIO MÉDICO").toUpperCase(),
      enderecoEmitente: [m.endereco, m.bairro, m.cidade, m.uf_local]
        .filter(Boolean)
        .join(", ")
        .toUpperCase(),
    }));
    setShowResultados(false);
    setTermoBusca("");
    setShowEditar(true);
  };

  // ── Upload de logos ─────────────────────────────────────────────────────────
  const handleLogoUpload = async (
    side: "left" | "right",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
      "data do atestado": "dataAssinatura",
      "data": "dataAssinatura",
      "horario": "horaAssinatura",
      "hora": "horaAssinatura",
    };
    const normalize = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const updates: Partial<typeof form> = {};
    importTexto.split("\n").forEach((linha) => {
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
            (updates as any)[field] =
              d.length === 8
                ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4, 8)}`
                : valor;
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
      logoUrl: logoLeft || DEFAULT_LOGO_URL,
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
      alert(`Erro ao emitir: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Preview ─────────────────────────────────────────────────────────────────
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
    dataEmissaoFormatada: (() => {
      if (!form.dataEmissao || form.dataEmissao.length < 8) return "";
      const [dd, mm, yyyy] = form.dataEmissao.split("/");
      const meses = ["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
      const m = parseInt(mm) - 1;
      const cidade = form.cidade || form.instituicao.split("-")[0].trim() || "";
      return `${cidade}, ${parseInt(dd)} DE ${meses[m] || mm} DE ${yyyy}`;
    })(),
    logoUrl: logoLeft,
    instituicao: form.instituicao,
    unidade: form.unidade,
    enderecoEmitente: form.enderecoEmitente,
    signatureColor,
    signatureImage,
    textoAtestado: (() => {
      const base = form.textoAtestado || `Atesto para os devidos fins que o(a) paciente acima identificado(a) foi atendido(a) nesta unidade de saúde na data de hoje.`;
      if (form.afastamento) return base + `\n\nO(A) paciente necessita de afastamento de suas atividades por ${form.afastamento} dia(s) a partir desta data.`;
      return base;
    })(),
    cidDisplay: form.cidDisplay || form.cid,
    cidNome: form.cidNome,
    cidade: form.cidade,
    modoCarimbo: form.modoCarimbo,
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
    color: "#374151",
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
    color: "#475569",
    border: "1px solid #cbd5e1",
    borderRadius: 7,
    padding: "8px 16px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "Roboto, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#d97706", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/"><button style={{ ...btnGray, padding: "5px 12px", fontSize: 11 }}>← VOLTAR</button></Link>
          <h1 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>IDAB — EMITIR ATESTADO</h1>
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", background: "rgba(0,0,0,0.15)", padding: "4px 12px", borderRadius: 6, fontWeight: 600 }}>
          🔒 Dados excluídos automaticamente após 60 dias
        </span>
      </div>

      <div style={{ display: "flex", gap: 14, padding: 14, maxWidth: 1800, margin: "0 auto" }}>

        {/* ═══ COLUNA ESQUERDA — FORMULÁRIO ═══ */}
        <div style={{ width: 500, flexShrink: 0, overflowY: "auto", maxHeight: "calc(100vh - 70px)" }}>
          <form onSubmit={handleSubmit}>

            {/* Código gerado */}
            {createdCode && (
              <div style={{ ...card, background: "#f0fdf4", border: "1px solid #86efac" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#166534", margin: 0 }}>✅ Código de Validação:</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: "#15803d", margin: "4px 0 0" }}>{createdCode}</p>
              </div>
            )}

            {/* ── Importação Rápida ── */}
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{ ...secTitle, margin: 0, border: "none", padding: 0 }}>📋 Importação Rápida</p>
                <button type="button" style={{ ...btnGray, padding: "3px 10px", fontSize: 11 }} onClick={() => setShowImport(!showImport)}>
                  {showImport ? "▲" : "▼"}
                </button>
              </div>
              {showImport && (
                <>
                  <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
                    Cole os dados no formato <code>Campo: Valor</code> (um por linha):
                  </p>
                  <textarea
                    value={importTexto}
                    onChange={(e) => setImportTexto(e.target.value)}
                    rows={7}
                    placeholder={"Nome Completo: JOÃO DA SILVA\nCPF: 123.456.789-00\nNascimento: 01/01/1990\nSexo: M\nNome da Mae: MARIA\nEndereço: RUA X, 100\nCID: A09\nData: 19/03/2026\nHorario: 14:30"}
                    style={{ ...inp, resize: "vertical", fontFamily: "monospace", fontSize: 11 }}
                  />
                  <button type="button" style={{ ...btnBlue, width: "100%", marginTop: 8 }} onClick={processarImportacao}>
                    ⚡ PROCESSAR DADOS
                  </button>
                </>
              )}
            </div>

            {/* ── 1. Buscar Médico ── */}
            <div style={card}>
              <p style={secTitle}>🔍 1. Buscar Médico</p>

              {/* Filtros */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                <div>
                  <label style={lbl}>UF</label>
                  <select style={sel} value={filtroUF} onChange={(e) => setFiltroUF(e.target.value)}>
                    <option value="">UF...</option>
                    {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Cidade</label>
                  <select style={sel} value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)}>
                    <option value="">Cidade...</option>
                    {cidades.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Bairro</label>
                  <select style={sel} value={filtroBairro} onChange={(e) => setFiltroBairro(e.target.value)}>
                    <option value="">Bairro...</option>
                    {bairros.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Especialidade</label>
                  <select style={sel} value={filtroEsp} onChange={(e) => setFiltroEsp(e.target.value)}>
                    {ESPECIALIDADES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Campo de busca */}
              <input
                style={{ ...inp, marginBottom: 8 }}
                placeholder="DIGITE NOME OU CRM..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), buscarMedicos())}
              />
              <button type="button" style={{ ...btnBlue, width: "100%" }} onClick={buscarMedicos} disabled={buscando}>
                {buscando ? "🔄 Buscando..." : "🔍 BUSCAR NO BANCO DE DADOS"}
              </button>

              {erroBusca && (
                <p style={{ fontSize: 11, color: "#dc2626", marginTop: 6, padding: "5px 8px", background: "#fef2f2", borderRadius: 6 }}>
                  {erroBusca}
                </p>
              )}

              {/* Resultados */}
              {showResultados && resultados.length > 0 && (
                <div style={{ marginTop: 8, maxHeight: 220, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                  {resultados.map((m, i) => (
                    <div
                      key={m.id}
                      onClick={() => selecionarMedico(m)}
                      style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid #f3f4f6",
                        cursor: "pointer",
                        fontSize: 12,
                        background: i % 2 === 0 ? "#fff" : "#f9fafb",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#f9fafb")}
                    >
                      <strong style={{ color: "#005CA9", fontSize: 13 }}>{m.nome_medico}</strong>
                      <span style={{ color: "#6b7280", marginLeft: 8 }}>CRM/{m.uf_crm} {m.crm}</span>
                      <br />
                      <span style={{ color: "#059669", fontSize: 11 }}>{m.especialidade}</span>
                      {m.local_trabalho && <span style={{ color: "#9ca3af", fontSize: 11, marginLeft: 8 }}>• {m.local_trabalho}</span>}
                      {m.cidade && <span style={{ color: "#9ca3af", fontSize: 11, marginLeft: 8 }}>📍 {m.cidade}/{m.uf_local}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Editar Médico / Local / Assinatura */}
              <details open={showEditar} style={{ marginTop: 10 }}>
                <summary
                  style={{ cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#005CA9", padding: "6px 0", listStyle: "none" }}
                  onClick={() => setShowEditar(!showEditar)}
                >
                  ✏️ EDITAR MÉDICO / LOCAL / ASSINATURA
                </summary>
                <div style={{ paddingTop: 10, display: "grid", gap: 8 }}>

                  {/* Seletor rápido (banco) */}
                  <div>
                    <label style={lbl}>🔄 Puxar do Banco de Dados</label>
                    <select style={sel} onChange={(e) => {
                      const idx = parseInt(e.target.value);
                      if (!isNaN(idx) && resultados[idx]) selecionarMedico(resultados[idx]);
                    }} value="">
                      <option value="">Selecione um médico da lista...</option>
                      {resultados.map((m, i) => (
                        <option key={m.id} value={i}>{m.nome_medico} — CRM/{m.uf_crm} {m.crm}</option>
                      ))}
                    </select>
                  </div>

                  <p style={{ ...secTitle, fontSize: 10 }}>Dados do Local</p>
                  <div>
                    <label style={lbl}>Nome da Instituição</label>
                    <input style={inp} value={form.instituicao} onChange={(e) => setForm(p => ({ ...p, instituicao: e.target.value }))} placeholder="Ex: PREFEITURA DE..." />
                  </div>
                  <div>
                    <label style={lbl}>Unidade / Setor</label>
                    <input style={inp} value={form.unidade} onChange={(e) => setForm(p => ({ ...p, unidade: e.target.value }))} placeholder="Ex: UBS CENTRO" />
                  </div>
                  <div>
                    <label style={lbl}>Especialidade</label>
                    <input style={inp} value={form.especialidade} onChange={(e) => setForm(p => ({ ...p, especialidade: e.target.value }))} placeholder="Ex: PEDIATRA" />
                  </div>
                  <div>
                    <label style={lbl}>Endereço Completo</label>
                    <input style={inp} value={form.enderecoEmitente} onChange={(e) => setForm(p => ({ ...p, enderecoEmitente: e.target.value }))} placeholder="Rua, Número, Bairro..." />
                  </div>

                  <p style={{ ...secTitle, fontSize: 10 }}>Dados do Médico</p>
                  <div>
                    <label style={lbl}>Nome Completo</label>
                    <input style={inp} value={form.medico} onChange={(e) => setForm(p => ({ ...p, medico: e.target.value }))} />
                  </div>
                  <div>
                    <label style={lbl}>CRM (Ex: CRM/SP 12345)</label>
                    <input style={inp} value={form.crm} onChange={(e) => setForm(p => ({ ...p, crm: e.target.value }))} />
                  </div>

                  <p style={{ ...secTitle, fontSize: 10 }}>ASSINATURA & CARIMBO</p>
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
                            style={{ position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 10, cursor: "pointer", lineHeight: 1 }}>
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
                  <label style={lbl}>Nome Completo</label>
                  <input style={inp} value={form.paciente} onChange={(e) => setForm(p => ({ ...p, paciente: e.target.value }))} placeholder="Nome Completo" required />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={lbl}>Sexo</label>
                    <select style={sel} value={form.sexo} onChange={(e) => setForm(p => ({ ...p, sexo: e.target.value as "MALE" | "FEMALE" }))}>
                      <option value="FEMALE">Feminino</option>
                      <option value="MALE">Masculino</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Data de Nascimento</label>
                    <input style={inp} value={form.nascimento} onChange={(e) => setForm(p => ({ ...p, nascimento: handleDateInput(e.target.value) }))} placeholder="DD/MM/AAAA" maxLength={10} inputMode="numeric" required />
                  </div>
                </div>
                <div>
                  <label style={lbl}>CPF / CNS</label>
                  <input style={inp} value={form.cpf} onChange={(e) => setForm(p => ({ ...p, cpf: e.target.value }))} placeholder="XXX.XXX.XXX-XX" required />
                </div>
                <div>
                  <label style={lbl}>Nome da Mãe</label>
                  <input style={inp} value={form.nomeMae} onChange={(e) => setForm(p => ({ ...p, nomeMae: e.target.value }))} placeholder="Nome da Mãe" required />
                </div>
                <div>
                  <label style={lbl}>Endereço do Paciente</label>
                  <input style={inp} value={form.endereco} onChange={(e) => setForm(p => ({ ...p, endereco: e.target.value }))} placeholder="Rua, Número, Bairro, Cidade/UF" required />
                </div>
              </div>
            </div>

            {/* ── Dados Médicos ── */}
            <div style={card}>
              <p style={secTitle}>🩺 Dados Médicos</p>
              <div style={{ display: "grid", gap: 8 }}>

                {/* Texto do Atestado */}
                <div>
                  <label style={lbl}>Texto do Atestado</label>
                  <textarea
                    value={form.textoAtestado}
                    onChange={(e) => setForm(p => ({ ...p, textoAtestado: e.target.value }))}
                    rows={4}
                    style={{ ...inp, resize: "vertical" }}
                    placeholder="Atesto para os devidos fins que o(a) paciente acima identificado(a) foi atendido(a) nesta unidade de saúde na data de hoje."
                  />
                </div>

                {/* CID */}
                <div>
                  <label style={lbl}>CID — Diagnóstico Rápido</label>
                  <select style={{ ...sel, marginBottom: 6 }} value="" onChange={(e) => {
                    if (!e.target.value) return;
                    const [code, ...rest] = e.target.value.split(" ");
                    setForm(p => ({ ...p, cidDisplay: code, cidNome: rest.join(" "), cid: e.target.value }));
                  }}>
                    <option value="">Selecione um diagnóstico...</option>
                    {CIDS_CATEGORIZADOS.map((g) => (
                      <optgroup key={g.grupo} label={g.grupo}>
                        {g.itens.map((c) => (
                          <option key={c.code} value={`${c.code} ${c.desc.toUpperCase()}`}>
                            {c.code} — {c.desc}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 6 }}>
                    <input
                      style={inp}
                      value={form.cidDisplay}
                      onChange={(e) => setForm(p => ({ ...p, cidDisplay: e.target.value }))}
                      placeholder="Código (Ex: H16.0)"
                    />
                    <input
                      style={inp}
                      value={form.cidNome}
                      onChange={(e) => setForm(p => ({ ...p, cidNome: e.target.value }))}
                      placeholder="Nome do CID (Ex: Úlcera de Córnea)"
                    />
                  </div>
                </div>

                {/* Afastamento */}
                <div>
                  <label style={lbl}>Dias de Afastamento (opcional)</label>
                  <input
                    style={inp}
                    type="number"
                    min="0"
                    max="365"
                    value={form.afastamento}
                    onChange={(e) => setForm(p => ({ ...p, afastamento: e.target.value }))}
                    placeholder="Ex: 3"
                  />
                </div>

                {/* Passaporte */}
                <div>
                  <label style={lbl}>Passaporte (opcional)</label>
                  <input style={inp} value={form.passaporte} onChange={(e) => setForm(p => ({ ...p, passaporte: e.target.value }))} placeholder="Ex: FX255093" />
                </div>

                {/* Modo Carimbo */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                  <label style={{ ...lbl, margin: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={form.modoCarimbo}
                      onChange={(e) => setForm(p => ({ ...p, modoCarimbo: e.target.checked }))}
                      style={{ width: 16, height: 16 }}
                    />
                    Modo Carimbo (rodapé com assinatura cursiva)
                  </label>
                </div>

              </div>
            </div>

            {/* ── 3. Detalhes Finais ── */}
            <div style={card}>
              <p style={secTitle}>📅 3. Detalhes Finais</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={lbl}>Cidade de Emissão</label>
                  <input style={inp} value={form.cidade} onChange={(e) => setForm(p => ({ ...p, cidade: e.target.value.toUpperCase() }))} placeholder="Ex: SALVADOR" />
                </div>
                <div>
                  <label style={lbl}>Data da Assinatura</label>
                  <input style={inp} value={form.dataAssinatura} onChange={(e) => setForm(p => ({ ...p, dataAssinatura: handleDateInput(e.target.value) }))} placeholder="DD/MM/AAAA" maxLength={10} inputMode="numeric" required />
                </div>
                <div>
                  <label style={lbl}>Hora da Assinatura</label>
                  <input style={inp} type="time" value={form.horaAssinatura} onChange={(e) => setForm(p => ({ ...p, horaAssinatura: e.target.value }))} required />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={lbl}>Data de Emissão</label>
                  <input style={inp} value={form.dataEmissao} onChange={(e) => setForm(p => ({ ...p, dataEmissao: handleDateInput(e.target.value) }))} placeholder="DD/MM/AAAA" maxLength={10} inputMode="numeric" required />
                </div>
              </div>

              {/* Logos Esquerda / Direita */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>

                {/* Logo Esquerda */}
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Esquerda (Logo)</p>
                  <div style={{
                    width: "100%", height: 70, border: "2px dashed #d1d5db", borderRadius: 8,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", background: "#f9fafb", marginBottom: 6,
                  }}>
                    {logoLeft ? (
                      <img src={logoLeft} alt="Logo Esq" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    ) : (
                      <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700 }}>SEM LOGO</span>
                    )}
                  </div>
                  <label style={{ ...btnBlue, display: "block", textAlign: "center", padding: "6px 0", cursor: "pointer", fontSize: 11 }}>
                    📁 ENVIAR LOGO
                    <input ref={logoLeftRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleLogoUpload("left", e)} />
                  </label>
                  <button type="button" style={{ ...btnGray, width: "100%", marginTop: 4, fontSize: 10, padding: "4px 0" }}
                    onClick={() => { setLogoLeft(""); if (logoLeftRef.current) logoLeftRef.current.value = ""; }}>
                    ✕ SEM LOGO
                  </button>
                </div>

                {/* Logo Direita */}
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Direita (Logo)</p>
                  <div style={{
                    width: "100%", height: 70, border: "2px dashed #d1d5db", borderRadius: 8,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", background: "#f9fafb", marginBottom: 6,
                  }}>
                    {logoRight ? (
                      <img src={logoRight} alt="Logo Dir" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    ) : (
                      <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700 }}>SEM LOGO</span>
                    )}
                  </div>
                  <label style={{ ...btnBlue, display: "block", textAlign: "center", padding: "6px 0", cursor: "pointer", fontSize: 11 }}>
                    📁 ENVIAR LOGO
                    <input ref={logoRightRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleLogoUpload("right", e)} />
                  </label>
                  <button type="button" style={{ ...btnGray, width: "100%", marginTop: 4, fontSize: 10, padding: "4px 0" }}
                    onClick={() => { setLogoRight(""); if (logoRightRef.current) logoRightRef.current.value = ""; }}>
                    ✕ SEM LOGO
                  </button>
                </div>

              </div>

              {/* Galeria de Logos Padrão */}
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Logos Padrão — Clique para selecionar</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {LOGOS_PADRAO.map((logo) => (
                    <div key={logo.id} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <div
                        onClick={() => setLogoLeft(logo.src)}
                        title={`Esq: ${logo.label}`}
                        style={{
                          border: logoLeft === logo.src ? "2px solid #005CA9" : "1px solid #e5e7eb",
                          borderRadius: 6, padding: 4, cursor: "pointer", background: "#fff",
                          height: 44, display: "flex", alignItems: "center", justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        <img src={logo.src} alt={logo.label} style={{ maxWidth: "100%", maxHeight: 36, objectFit: "contain" }} />
                      </div>
                      <div style={{ display: "flex", gap: 3 }}>
                        <button type="button"
                          onClick={() => setLogoLeft(logo.src)}
                          style={{ flex: 1, fontSize: 9, padding: "2px 0", background: logoLeft === logo.src ? "#005CA9" : "#e2e8f0",
                            color: logoLeft === logo.src ? "#fff" : "#374151", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}>
                          ESQ
                        </button>
                        <button type="button"
                          onClick={() => setLogoRight(logo.src)}
                          style={{ flex: 1, fontSize: 9, padding: "2px 0", background: logoRight === logo.src ? "#005CA9" : "#e2e8f0",
                            color: logoRight === logo.src ? "#fff" : "#374151", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}>
                          DIR
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div style={{ display: "flex", gap: 10, paddingBottom: 20 }}>
              <Link href="/"><button type="button" style={{ ...btnGray, flex: 1 }}>CANCELAR</button></Link>
              <button type="submit" disabled={isLoading} style={{ ...btnGreen, flex: 2, opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? "⏳ Emitindo..." : "✅ CONFIRMAR E EMITIR"}
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
            <div style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <AttestationDocument
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
