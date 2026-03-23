import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import AttestationDocument from "@/components/AttestationDocument";
import type { AttestationData } from "@/data/attestations";
import { exportElementToPDF, generatePDFFilename } from "@/lib/pdfExport";
import { useAuth } from "@/contexts/AuthContext";
import { validarCPF } from "@/lib/utils";

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

function gerarTextoAfastamento(dias: number): string {
  const d = DIAS_EXTENSO[dias];
  if (!d) return "";
  const unidade = dias === 1 ? "dia" : "dias";
  return `Necessita de ${d.num} (${d.ext}) ${unidade} de afastamento de suas atividades laborais para repouso e tratamento de saúde.`;
}

// ─── Texto padrão do atestado ─────────────────────────────────────────────────
const TEXTO_PADRAO = `Atesto para os devidos fins que o(a) paciente acima identificado(a) compareceu a esta unidade de saúde na data de hoje para atendimento médico. Necessita de 03 (três) dia(s) de afastamento de suas atividades laborais para repouso e tratamento de saúde.`;

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
export default function AtestadoCria() {
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

  // ── Tipo de documento do paciente ──────────────────────────────────────────
  const [tipoDoc, setTipoDoc] = useState<"CPF" | "CNS">("CPF");

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
  const [cepEnabled, setCepEnabled] = useState(false);
  const [cepValue, setCepValue] = useState("");
  const [cepLoading, setCepLoading] = useState(false);

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
    docValue: "",  // CPF ou CNS conforme tipoDoc
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

  // ── Importação rápida ───────────────────────────────────────────────────────
  const [importTexto, setImportTexto] = useState("");
  const [showImport, setShowImport] = useState(false);

  // ── Atualizar texto do atestado quando dias mudam ──────────────────────────
  useEffect(() => {
    const dias = parseInt(form.afastamento);
    if (!isNaN(dias) && dias >= 1 && dias <= 15) {
      const d = DIAS_EXTENSO[dias];
      const unidade = dias === 1 ? "dia" : "dias";
      const textoBase = `Atesto para os devidos fins que o(a) paciente acima identificado(a) compareceu a esta unidade de saúde na data de hoje para atendimento médico. Necessita de ${d.num} (${d.ext}) ${unidade} de afastamento de suas atividades laborais para repouso e tratamento de saúde.`;
      setForm(p => ({ ...p, textoAtestado: textoBase }));
    }
  }, [form.afastamento]);

  // ── Carregar cidades quando UF muda ────────────────────────────────────────
  useEffect(() => {
    if (!filtroUF) { setCidades([]); setBairros([]); return; }
    apiFetch(`?action=cidades&uf=${filtroUF}`)
      .then((data: string[]) => {
        setCidades(data || []);
      })
      .catch(() => setCidades([]));
    setFiltroCidade("");
    setFiltroBairro("");
    setBairros([]);
    setLocais([]);
  }, [filtroUF]);

  // ── Carregar bairros e locais quando cidade muda ─────────────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!filtroUF || !filtroCidade) { setBairros([]); setLocais([]); return; }
    apiFetch(`?action=bairros&uf=${filtroUF}&cidade=${encodeURIComponent(filtroCidade)}`)
      .then((data: string[]) => setBairros(data || []))
      .catch(() => setBairros([]));
    // Carregar locais de trabalho
    apiFetch(`?action=locais&uf=${filtroUF}&cidade=${encodeURIComponent(filtroCidade)}`)
      .then((data: string[]) => setLocais(data || []))
      .catch(() => setLocais([]));
    setFiltroBairro("");
    setFiltroLocal("");
    // Preencher automaticamente instituicao como PREFEITURA DE {CIDADE}
    // unidade será preenchida ao selecionar o médico (local_trabalho)
    setForm(p => ({
      ...p,
      instituicao: `PREFEITURA DE ${filtroCidade.toUpperCase()}`,
      unidade: "", // Limpar unidade ao trocar cidade — será preenchida pelo médico selecionado
      cidade: filtroCidade.toUpperCase(),
    }));
  }, [filtroUF, filtroCidade]);

  // ── Busca de médicos ─────────────────────────────────────────────────────────────────────────────────────
  const buscarMedicos = useCallback(async (autoSearch = false) => {
    const termo = termoBusca.trim().toUpperCase().replace(/[.\-]/g, "");
    if (!filtroUF) { if (!autoSearch) setErroBusca("Selecione a UF antes de buscar."); return; }
    // Permite busca sem termo se tiver cidade selecionada (igual ao elitedoc)
    if (termo.length < 3 && !filtroCidade) {
      if (!autoSearch) setErroBusca("Digite ao menos 3 caracteres do nome/CRM, ou selecione uma Cidade.");
      return;
    }
    setBuscando(true);
    setErroBusca("");
    setShowResultados(true);
    try {
      let params = `?uf=${filtroUF}&limit=50`;
      if (termo.length >= 3) {
        // Busca por nome ou CRM (igual ao elitedoc)
        params += `&q=${encodeURIComponent(termo)}`;
      } else if (filtroCidade) {
        // Sem termo: lista médicos da cidade (igual ao elitedoc)
        params += `&cidade=${encodeURIComponent(filtroCidade)}`;
        if (filtroBairro) params += `&bairro=${encodeURIComponent(filtroBairro)}`;
      }
      if (filtroEsp) params += `&esp=${encodeURIComponent(filtroEsp)}`;
      const data: MedicoDB[] = await apiFetch(params);
      setResultados(data);
      if (data.length === 0) setErroBusca("Nenhum médico encontrado. Tente outro nome ou preencha manualmente.");
    } catch {
      setErroBusca("Erro ao buscar. Verifique a conexão ou preencha manualmente.");
    } finally {
      setBuscando(false);
    }
  }, [termoBusca, filtroUF, filtroEsp, filtroCidade, filtroBairro]);

  // ── Busca automática ao selecionar cidade (igual ao elitedoc) ────────────────────────
  useEffect(() => {
    if (filtroUF && filtroCidade) {
      const timer = setTimeout(() => buscarMedicos(true), 300);
      return () => clearTimeout(timer);
    }
  }, [filtroUF, filtroCidade, buscarMedicos]);

  const selecionarMedico = (m: MedicoDB) => {
    const localTrabalho = m.local_trabalho?.toUpperCase() || "";
    const cidadeMedico = m.cidade?.toUpperCase() || "";
    setForm((p) => ({
      ...p,
      medico: m.nome_medico.toUpperCase(),
      crm: `CRM/${m.uf_crm || m.uf_local} ${m.crm}`,
      especialidade: (m.especialidade || "CLÍNICO GERAL").toUpperCase(),
      // instituicao = PREFEITURA DE {CIDADE} (sempre, pois é o órgão empregador pública)
      // unidade = local_trabalho do médico (UBS, UPA, Hospital, Clínica etc.)
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

  // ── Máscara do documento do paciente ───────────────────────────────────────
  const handleDocInput = (v: string) => {
    const masked = tipoDoc === "CPF" ? maskCPF(v) : maskCNS(v);
    setForm(p => ({ ...p, docValue: masked }));
  };

  // ── Importação rápida ───────────────────────────────────────────────────────
  const processarImportacao = () => {
    if (!importTexto.trim()) return;
    const mapa: Record<string, string> = {
      "nome completo": "paciente",
      "nome": "paciente",
      "cpf": "docValue",
      "cns": "docValue",
      "numero do doc": "docValue",
      "nascimento": "nascimento",
      "data de nascimento": "nascimento",
      "sexo": "sexo",
      "nome da mae": "nomeMae",
      "mae": "nomeMae",
      "endereco do paciente": "endereco",
      "endereco": "endereco",
      "cid": "cid",
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
            (updates as any)[field] = d.length === 8 ? `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4,8)}` : valor;
          } else if (field === "docValue") {
            const isCNS = valor.replace(/\D/g, "").length > 11;
            if (isCNS) { setTipoDoc("CNS"); (updates as any)[field] = maskCNS(valor); }
            else { setTipoDoc("CPF"); (updates as any)[field] = maskCPF(valor); }
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

  // ── Submit — EMISSÃO REAL (backend gera QR Code) ────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { alert("Você precisa estar logado para emitir."); return; }
    // Validação de CPF universal
    if (tipoDoc === "CPF" && form.docValue && !validarCPF(form.docValue)) {
      alert("CPF inválido! Verifique os dígitos informados.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        paciente: form.paciente.toUpperCase(),
        sexo: form.sexo,
        nascimento: form.nascimento,
        cpf: tipoDoc === "CPF" ? form.docValue : "",
        cns: tipoDoc === "CNS" ? form.docValue : "",
        tipoDoc,
        nomeMae: form.nomeMae.toUpperCase(),
        endereco: form.endereco.toUpperCase(),
        cid: form.cid.toUpperCase(),
        cidDisplay: form.cidDisplay,
        cidNome: form.cidNome,
        medico: form.medico.toUpperCase(),
        crm: form.crm,
        especialidade: form.especialidade.toUpperCase(),
        dataAssinatura: form.dataAssinatura,
        horaAssinatura: form.horaAssinatura,
        dataEmissao: form.dataEmissao,
        logoUrl: logoLeft || "",
        logoRight: logoRight || "",
        instituicao: form.instituicao,
        unidade: form.unidade,
        enderecoEmitente: form.enderecoEmitente,
        textoAtestado: form.textoAtestado,
        afastamento: form.afastamento,
        cidade: form.cidade,
        signatureColor,
        signatureImage,
        modoCarimbo: form.modoCarimbo,
      };

      const res = await fetch("/api/attestations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao emitir atestado");
      }

      const emittedCode = data.codigoQR || data.data?.codigoQR;
      setCreatedCode(emittedCode);
      if (data.newBalance !== undefined) updateBalance(data.newBalance);
      // Atualizar o preview com o código real para desbloquear o QR Code
      if (emittedCode) {
        setForm(prev => ({ ...prev, _emittedCode: emittedCode }));
      }
      setShowSuccessModal(true);
    } catch (error) {
      alert(`Erro ao emitir: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Preview data ────────────────────────────────────────────────────────────
  const previewData: AttestationData & Record<string, any> = {
    id: "XXXX.XXXX",
    paciente: form.paciente || "NOME DO PACIENTE",
    sexo: form.sexo,
    nascimento: form.nascimento || "DD/MM/AAAA",
    cpf: tipoDoc === "CPF" ? (form.docValue || "XXX.XXX.XXX-XX") : "",
    cns: tipoDoc === "CNS" ? (form.docValue || "XXX XXXX XXXX XXXX") : "",
    tipoDoc,
    nomeMae: form.nomeMae || "NOME DA MÃE",
    endereco: form.endereco || "ENDEREÇO COMPLETO",
    condicao: "",
    vacinacao: "",
    cid: form.cid,
    codigoQR: (form as any)._emittedCode || createdCode || "XXXX.XXXX",
    dataAssinatura: form.dataAssinatura || "DD/MM/AAAA",
    horaAssinatura: form.horaAssinatura || "HH:MM",
    medico: form.medico || "NOME DO MÉDICO",
    crm: form.crm || "CRM/UF 00000",
    especialidade: form.especialidade || "ESPECIALIDADE",
    dataEmissao: form.dataEmissao || "DD/MM/AAAA",
    dataEmissaoFormatada: (() => {
      if (!form.dataEmissao || form.dataEmissao.length < 10) return "";
      const [dd, mm, yyyy] = form.dataEmissao.split("/");
      const meses = ["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
      const m = parseInt(mm) - 1;
      const cidade = form.cidade || "";
      return cidade ? `${cidade}, ${parseInt(dd)} DE ${meses[m] || mm} DE ${yyyy}` : `${parseInt(dd)} DE ${meses[m] || mm} DE ${yyyy}`;
    })(),
    logoUrl: logoLeft,
    logoRight: logoRight,
    instituicao: form.instituicao || (form.cidade ? `PREFEITURA DE ${form.cidade.toUpperCase()}` : "INSTITUIÇÃO"),
    unidade: form.unidade || "LOCAL DE ATENDIMENTO",
    enderecoEmitente: form.enderecoEmitente || "ENDEREÇO DA CLÍNICA",
    signatureColor,
    signatureImage,
    textoAtestado: form.textoAtestado,
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
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "Roboto, sans-serif" }}>

      {/* ── Modal de Sucesso ── */}
      {showSuccessModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999,
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "40px 48px",
            textAlign: "center", maxWidth: 440, width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#15803d", margin: "0 0 20px" }}>
              DOCUMENTO EMITIDO COM SUCESSO!
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                style={{ ...btnGreen, width: "100%", padding: "14px 0", fontSize: 15, fontWeight: 700, opacity: isDownloadingPdf ? 0.7 : 1 }}
                disabled={isDownloadingPdf}
                onClick={async () => {
                  if (previewRef.current) {
                    setIsDownloadingPdf(true);
                    try {
                      await new Promise(r => setTimeout(r, 300));
                      const filename = generatePDFFilename(form.paciente || "ATESTADO", "EMITIDO");
                      await exportElementToPDF(previewRef.current, { filename, scale: 2, quality: 0.92 });
                    } catch {}
                    setIsDownloadingPdf(false);
                  }
                }}
              >
                {isDownloadingPdf ? "Gerando PDF..." : "BAIXAR ATESTADO"}
              </button>
              <button
                style={{ ...btnBlue, width: "100%", padding: "12px 0", fontSize: 13, fontWeight: 600 }}
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate("/dashboard");
                  setTimeout(() => {
                    const el = document.getElementById("historico-atestados");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }, 300);
                }}
              >
                IR PARA HISTÓRICO DE ATESTADOS
              </button>
              <button
                style={{ ...btnGray, width: "100%", padding: "10px 0", fontSize: 12 }}
                onClick={() => setShowSuccessModal(false)}
              >
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: "#d97706", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button style={{ ...btnGray, padding: "5px 12px", fontSize: 11 }} onClick={() => navigate("/dashboard")}>← VOLTAR</button>
          <h1 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>DocMaster — EMITIR ATESTADO</h1>
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", background: "rgba(0,0,0,0.15)", padding: "4px 12px", borderRadius: 6, fontWeight: 600 }}>
          🔒 Dados excluídos automaticamente após 60 dias
        </span>
      </div>

      <div style={{ display: "flex", gap: 14, padding: 14, maxWidth: 2000, margin: "0 auto" }}>

        {/* ═══ COLUNA ESQUERDA — FORMULÁRIO ═══ */}
        <div style={{ width: 612, flexShrink: 0, overflowY: "auto", maxHeight: "calc(100vh - 70px)" }}>
          <form onSubmit={handleSubmit}>

            {/* ── Importação Rápida ── */}
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{ ...secTitle, margin: 0, border: "none", padding: 0 }}>📋 Importação Rápida de Dados</p>
                <button type="button" style={{ ...btnGray, padding: "3px 10px", fontSize: 11 }} onClick={() => setShowImport(!showImport)}>
                  {showImport ? "▲" : "▼"}
                </button>
              </div>
              {showImport && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {/* Painel 1 — Modelo para enviar ao cliente */}
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#005CA9", marginBottom: 6, textTransform: "uppercase" as const }}>1. Envie para o Cliente</p>
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "8px 10px", fontFamily: "monospace", fontSize: 11, color: "#374151", lineHeight: 1.8, whiteSpace: "pre" as const }}>{`Nome Completo: \nTipo de Doc (CPF ou CNS): \nNúmero do Doc: \nNascimento: \nSexo (M/F): \nNome da Mãe: \nEndereço do Paciente: \nCID (Código da Doença): \nCidade de Emissão: \nData do Atestado: \nHorário do Atendimento:`}</div>
                    <button
                      type="button"
                      style={{ ...btnBlue, width: "100%", marginTop: 8, fontSize: 11 }}
                      onClick={() => {
                        const modelo = `Nome Completo: \nTipo de Doc (CPF ou CNS): \nNúmero do Doc: \nNascimento: \nSexo (M/F): \nNome da Mãe: \nEndereço do Paciente: \nCID (Código da Doença): \nCidade de Emissão: \nData do Atestado: \nHorário do Atendimento: `;
                        navigator.clipboard.writeText(modelo)
                          .then(() => alert("✅ Modelo copiado! Envie para o cliente preencher."))
                          .catch(() => {
                            const el = document.createElement("textarea");
                            el.value = modelo;
                            document.body.appendChild(el);
                            el.select();
                            document.execCommand("copy");
                            document.body.removeChild(el);
                            alert("✅ Modelo copiado!");
                          });
                      }}
                    >
                      📋 COPIAR MODELO
                    </button>
                  </div>
                  {/* Painel 2 — Colar resposta do cliente */}
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#005CA9", marginBottom: 6, textTransform: "uppercase" as const }}>2. Cole a Resposta</p>
                    <textarea
                      value={importTexto}
                      onChange={(e) => setImportTexto(e.target.value)}
                      rows={9}
                      placeholder={"Cole aqui os dados preenchidos..."}
                      style={{ ...inp, resize: "none", fontFamily: "monospace", fontSize: 11, height: 180 }}
                    />
                    <button type="button" style={{ ...btnBlue, width: "100%", marginTop: 8, fontSize: 11, background: "#16a34a" }} onClick={processarImportacao}>
                      ⚡ PROCESSAR DADOS
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── 1. Buscar Médico ── */}
            <div style={card}>
              <p style={secTitle}>🔍 1. Buscar Médico</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                <div>
                  <label style={lbl}>UF *</label>
                  <select style={sel} value={filtroUF} onChange={(e) => setFiltroUF(e.target.value)}>
                    <option value="">Selecione a UF...</option>
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
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={lbl}>Local (UPA, Clínica, Hospital...)</label>
                  <select style={sel} value={filtroLocal} onChange={(e) => setFiltroLocal(e.target.value)}>
                    <option value="">Todos os locais...</option>
                    {locais.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
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
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#f9fafb")}
                    >
                      <strong style={{ color: "#005CA9", fontSize: 13 }}>{m.nome_medico}</strong>
                      <span style={{ color: "#333", marginLeft: 8 }}>CRM/{m.uf_crm} {m.crm}</span>
                      <br />
                      <span style={{ color: "#059669", fontSize: 11 }}>{m.especialidade}</span>
                      {m.local_trabalho && <span style={{ color: "#333", fontSize: 11, marginLeft: 8 }}>• {m.local_trabalho}</span>}
                      {m.cidade && <span style={{ color: "#333", fontSize: 11, marginLeft: 8 }}>📍 {m.cidade}/{m.uf_local}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Editar Médico */}
              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  style={{ cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#005CA9", padding: "6px 0", background: "none", border: "none", display: "flex", alignItems: "center", gap: 4 }}
                  onClick={(e) => { e.preventDefault(); setShowEditar(!showEditar); }}
                >
                  ✏️ EDITAR MÉDICO / LOCAL / ASSINATURA {showEditar ? "▲" : "▼"}
                </button>
                {showEditar && <div style={{ paddingTop: 10, display: "grid", gap: 8 }}>
                  <p style={{ ...secTitle, fontSize: 10 }}>Dados do Local</p>
                  {/* Instituição: preenchida automaticamente como PREFEITURA DE {CIDADE} — não exibida no formulário */}
                  {/* Campo oculto — valor gerenciado pelo useEffect de filtroCidade e selecionarMedico */}
                  <div>
                    <label style={lbl}>Local de Atendimento</label>
                    <input style={inp} value={form.unidade} onChange={(e) => setForm(p => ({ ...p, unidade: e.target.value }))} placeholder="Ex: UBS CENTRO, UPA NORTE, HOSPITAL MUNICIPAL" />
                  </div>
                  <div>
                    <label style={lbl}>Endereço Completo / Emitente</label>
                    <input
                      style={{ ...inp, background: form.enderecoEmitente ? "#fff" : "#f8fafc" }}
                      value={form.enderecoEmitente}
                      onChange={(e) => setForm(p => ({ ...p, enderecoEmitente: e.target.value }))}
                      placeholder="Ex: RUA ANTÔNIO WALTER, 66 – CENTRO, VOTORANTIM/SP"
                    />
                    <span style={{ fontSize: 10, color: "#666", marginTop: 2, display: "block" }}>Preenchido automaticamente ao selecionar médico. Edite se necessário.</span>
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
                </div>}
              </div>
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
                    <label style={lbl}>Sexo</label>
                    <select style={sel} value={form.sexo} onChange={(e) => setForm(p => ({ ...p, sexo: e.target.value as "MALE" | "FEMALE" }))}>
                      <option value="FEMALE">Feminino</option>
                      <option value="MALE">Masculino</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Data de Nascimento *</label>
                    <input style={inp} value={form.nascimento} onChange={(e) => setForm(p => ({ ...p, nascimento: handleDateInput(e.target.value) }))} placeholder="DD/MM/AAAA" maxLength={10} inputMode="numeric" required />
                  </div>
                </div>

                {/* CPF ou CNS */}
                <div>
                  <label style={lbl}>Tipo de Documento *</label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <button
                      type="button"
                      onClick={() => { setTipoDoc("CPF"); setForm(p => ({ ...p, docValue: "" })); }}
                      style={{
                        flex: 1, padding: "7px 0", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer",
                        background: tipoDoc === "CPF" ? "#005CA9" : "#e2e8f0",
                        color: tipoDoc === "CPF" ? "#fff" : "#374151",
                        border: tipoDoc === "CPF" ? "2px solid #005CA9" : "2px solid #d1d5db",
                      }}
                    >
                      CPF
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTipoDoc("CNS"); setForm(p => ({ ...p, docValue: "" })); }}
                      style={{
                        flex: 1, padding: "7px 0", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer",
                        background: tipoDoc === "CNS" ? "#005CA9" : "#e2e8f0",
                        color: tipoDoc === "CNS" ? "#fff" : "#374151",
                        border: tipoDoc === "CNS" ? "2px solid #005CA9" : "2px solid #d1d5db",
                      }}
                    >
                      CNS — Cartão Nacional de Saúde
                    </button>
                  </div>
                  <input
                    style={inp}
                    value={form.docValue}
                    onChange={(e) => handleDocInput(e.target.value)}
                    placeholder={tipoDoc === "CPF" ? "000.000.000-00" : "000 0000 0000 0000"}
                    inputMode="numeric"
                    required
                  />
                </div>

                <div>
                  <label style={lbl}>Nome da Mãe *</label>
                  <input style={inp} value={form.nomeMae} onChange={(e) => setForm(p => ({ ...p, nomeMae: e.target.value }))} placeholder="Nome da Mãe" required />
                </div>
                <div>
                  <label style={lbl}>Endereço do Paciente *</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <label style={{ fontSize: 11, color: "#555", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={!!cepEnabled}
                        onChange={(e) => setCepEnabled(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: "#005CA9" }}
                      />
                      Preencher por CEP
                    </label>
                  </div>
                  {cepEnabled && (
                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                      <input
                        style={{ ...inp, width: 120 }}
                        value={cepValue}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                          setCepValue(v.length > 5 ? `${v.slice(0,5)}-${v.slice(5)}` : v);
                        }}
                        placeholder="00000-000"
                        maxLength={9}
                        inputMode="numeric"
                      />
                      <button
                        type="button"
                        style={{ padding: "6px 12px", fontSize: 11, fontWeight: 700, background: "#005CA9", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", opacity: cepLoading ? 0.6 : 1 }}
                        disabled={cepLoading}
                        onClick={async () => {
                          const cepClean = cepValue.replace(/\D/g, "");
                          if (cepClean.length !== 8) return;
                          setCepLoading(true);
                          try {
                            const res = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
                            const data = await res.json();
                            if (!data.erro) {
                              const endFormatado = `${data.logradouro?.toUpperCase() || ""}, ${data.bairro?.toUpperCase() || ""}, ${data.localidade?.toUpperCase() || ""}/${data.uf?.toUpperCase() || ""}`;
                              setForm(p => ({ ...p, endereco: endFormatado, cidade: data.localidade?.toUpperCase() || p.cidade }));
                            }
                          } catch {} finally { setCepLoading(false); }
                        }}
                      >
                        {cepLoading ? "..." : "Buscar"}
                      </button>
                    </div>
                  )}
                  <input style={inp} value={form.endereco} onChange={(e) => setForm(p => ({ ...p, endereco: e.target.value }))} placeholder="RUA ITAJAI, 322 - JARDIM SAO BENTO DO RECREIO, VALINHOS/SP" required />
                </div>
              </div>
            </div>

            {/* ── 3. Dados Médicos ── */}
            <div style={card}>
              <p style={secTitle}>🩺 3. Dados Médicos</p>
              <div style={{ display: "grid", gap: 8 }}>

                {/* Dias de Afastamento */}
                <div>
                  <label style={lbl}>Dias de Afastamento (1-15)</label>
                  <select
                    style={sel}
                    value={form.afastamento}
                    onChange={(e) => setForm(p => ({ ...p, afastamento: e.target.value }))}
                  >
                    {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => {
                      const d = DIAS_EXTENSO[n];
                      const unidade = n === 1 ? "dia" : "dias";
                      return (
                        <option key={n} value={String(n)}>
                          {d.num} ({d.ext}) {unidade}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Texto do Atestado */}
                <div>
                  <label style={lbl}>Texto do Atestado</label>
                  <textarea
                    value={form.textoAtestado}
                    onChange={(e) => setForm(p => ({ ...p, textoAtestado: e.target.value }))}
                    rows={5}
                    style={{ ...inp, resize: "vertical", lineHeight: 1.6 }}
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
                    <input style={inp} value={form.cidDisplay} onChange={(e) => setForm(p => ({ ...p, cidDisplay: e.target.value }))} placeholder="Código (Ex: J11)" />
                    <input style={inp} value={form.cidNome} onChange={(e) => setForm(p => ({ ...p, cidNome: e.target.value }))} placeholder="Nome do CID" />
                  </div>
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

            {/* ── 4. Data de Emissão ── */}
            <div style={card}>
              <p style={secTitle}>📅 4. Data de Emissão</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={lbl}>Cidade de Emissão</label>
                  <input style={inp} value={form.cidade} onChange={(e) => setForm(p => ({ ...p, cidade: e.target.value.toUpperCase() }))} placeholder="Ex: SÃO PAULO" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={lbl}>Data de Emissão *</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input
                      style={{ ...inp, width: 60, textAlign: "center", letterSpacing: 2 }}
                      value={form.dataEmissao?.split("/")[0] || ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                        const parts = (form.dataEmissao || "//").split("/");
                        parts[0] = v;
                        const full = parts.join("/");
                        setForm(p => ({ ...p, dataEmissao: full, dataAssinatura: full }));
                        if (v.length === 2) {
                          const next = e.target.parentElement?.querySelectorAll("input")[1] as HTMLInputElement;
                          next?.focus();
                        }
                      }}
                      placeholder="DD" maxLength={2} inputMode="numeric"
                    />
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#666" }}>/</span>
                    <input
                      style={{ ...inp, width: 60, textAlign: "center", letterSpacing: 2 }}
                      value={form.dataEmissao?.split("/")[1] || ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                        const parts = (form.dataEmissao || "//").split("/");
                        parts[1] = v;
                        const full = parts.join("/");
                        setForm(p => ({ ...p, dataEmissao: full, dataAssinatura: full }));
                        if (v.length === 2) {
                          const next = e.target.parentElement?.querySelectorAll("input")[2] as HTMLInputElement;
                          next?.focus();
                        }
                      }}
                      placeholder="MM" maxLength={2} inputMode="numeric"
                    />
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#666" }}>/</span>
                    <input
                      style={{ ...inp, width: 80, textAlign: "center", letterSpacing: 2 }}
                      value={form.dataEmissao?.split("/")[2] || ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        const parts = (form.dataEmissao || "//").split("/");
                        parts[2] = v;
                        const full = parts.join("/");
                        setForm(p => ({ ...p, dataEmissao: full, dataAssinatura: full }));
                      }}
                      placeholder="AAAA" maxLength={4} inputMode="numeric"
                    />
                  </div>
                  <p style={{ fontSize: 10, color: "#000", marginTop: 3 }}>
                    A data de assinatura reflete automaticamente a data de emissão.
                  </p>
                </div>
                <div>
                  <label style={lbl}>Hora da Assinatura</label>
                  <input style={inp} type="time" value={form.horaAssinatura} onChange={(e) => setForm(p => ({ ...p, horaAssinatura: e.target.value }))} />
                </div>
              </div>

              {/* ── Logos ── */}
              <div style={{ marginTop: 16 }}>
                <p style={{ ...secTitle, marginBottom: 10 }}>🖼 Logos do Documento</p>

                {/* Seletor de lado */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <button
                    type="button"
                    onClick={() => setLogoSide("left")}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: "pointer",
                      background: logoSide === "left" ? "#005CA9" : "#e2e8f0",
                      color: logoSide === "left" ? "#fff" : "#374151",
                      border: "none",
                    }}
                  >
                    ← LOGO ESQUERDA
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoSide("right")}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: "pointer",
                      background: logoSide === "right" ? "#005CA9" : "#e2e8f0",
                      color: logoSide === "right" ? "#fff" : "#374151",
                      border: "none",
                    }}
                  >
                    LOGO DIREITA →
                  </button>
                </div>

                {/* Preview do lado selecionado */}
                <div style={{
                  width: "100%", height: 80, border: "2px dashed #d1d5db", borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", background: "#f9fafb", marginBottom: 8,
                }}>
                  {(logoSide === "left" ? logoLeft : logoRight) ? (
                    <img
                      src={logoSide === "left" ? logoLeft : logoRight}
                      alt="Logo"
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    />
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
                    <input
                      type="file" accept="image/*" style={{ display: "none" }}
                      onChange={(e) => handleLogoUpload(logoSide, e)}
                    />
                  </label>
                  <button
                    type="button"
                    style={{ ...btnGray, flex: 1, fontSize: 11, padding: "7px 0" }}
                    onClick={() => {
                      if (logoSide === "left") { setLogoLeft(""); if (logoLeftRef.current) logoLeftRef.current.value = ""; }
                      else { setLogoRight(""); if (logoRightRef.current) logoRightRef.current.value = ""; }
                    }}
                  >
                    ✕ REMOVER
                  </button>
                </div>

                {/* Galeria de Logos Padrão */}
                <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                  Logos Padrão — Clique para aplicar no lado selecionado ({logoSide === "left" ? "Esquerda" : "Direita"})
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                  {LOGOS_PADRAO.map((logo) => {
                    const currentLogo = logoSide === "left" ? logoLeft : logoRight;
                    const isSelected = currentLogo === logo.src;
                    return (
                      <div
                        key={logo.id}
                        onClick={() => logoSide === "left" ? setLogoLeft(logo.src) : setLogoRight(logo.src)}
                        style={{
                          border: isSelected ? "2px solid #005CA9" : "1px solid #e5e7eb",
                          borderRadius: 6, padding: 4, cursor: "pointer", background: isSelected ? "#eff6ff" : "#fff",
                          height: 44, display: "flex", alignItems: "center", justifyContent: "center",
                          overflow: "hidden",
                        }}
                        title={logo.label}
                      >
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
              <button
                type="submit"
                disabled={isLoading}
                style={{ ...btnGreen, flex: 2, opacity: isLoading ? 0.7 : 1, fontSize: 14, padding: "12px 0" }}
              >
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
            {/* A4: 794px x 1123px @ 96dpi */}
            <div style={{ width: 794, margin: "0 auto", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
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
