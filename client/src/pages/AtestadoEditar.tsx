import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import AttestationDocument from "@/components/AttestationDocument";
import type { AttestationData } from "@/data/attestations";
import { exportElementToPDF, generatePDFFilename } from "@/lib/pdfExport";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { validarCPF } from "@/lib/utils";

// ─── SearchSelect ──────────────────────────────────────────────────────────────
function SearchSelect({
  label, value, options, placeholder, disabled, onChange
}: {
  label: string; value: string; options: string[];
  placeholder?: string; disabled?: boolean; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(""); }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  const filtered = options.filter(o => !search || o.toUpperCase().includes(search.toUpperCase()));
  const triggerStyle: React.CSSProperties = {
    width: "100%", padding: "6px 28px 6px 10px", border: "1px solid #d1d5db",
    borderRadius: 6, fontSize: 13, background: disabled ? "#f3f4f6" : "#fff",
    color: value ? "#000" : "#9ca3af", cursor: disabled ? "not-allowed" : "pointer",
    boxSizing: "border-box", fontFamily: "inherit", position: "relative",
    userSelect: "none", display: "flex", alignItems: "center", justifyContent: "space-between",
  };
  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div style={triggerStyle} onClick={() => { if (!disabled) { setOpen(o => !o); setSearch(""); } }}>
        <span>{value || placeholder || label + "..."}</span>
        <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 4 }}>▼</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 9999, background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxHeight: 220, overflowY: "auto" }}>
          <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder={"Buscar " + label + "..."} style={{ width: "100%", padding: "6px 10px", border: "none", borderBottom: "1px solid #e5e7eb", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
          {value && <div style={{ padding: "6px 12px", fontSize: 13, color: "#9ca3af", cursor: "pointer" }} onMouseDown={() => { onChange(""); setOpen(false); setSearch(""); }}>{placeholder || label + "..."}</div>}
          {filtered.length === 0 && <div style={{ padding: "6px 12px", fontSize: 12, color: "#9ca3af" }}>Nenhum resultado</div>}
          {filtered.map(o => (
            <div key={o} style={{ padding: "6px 12px", fontSize: 13, cursor: "pointer", background: o === value ? "#dbeafe" : "transparent", fontWeight: o === value ? 700 : 400, color: "#000" }}
              onMouseDown={() => { onChange(o); setOpen(false); setSearch(""); }}
              onMouseEnter={e => (e.currentTarget.style.background = o === value ? "#dbeafe" : "#f3f4f6")}
              onMouseLeave={e => (e.currentTarget.style.background = o === value ? "#dbeafe" : "transparent")}
            >{o}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── API de Médicos ────────────────────────────────────────────────────────────
async function apiFetch(path: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(`/api/medicos${path}`, { signal: controller.signal, headers: { "Content-Type": "application/json" } });
    if (!res.ok) throw new Error(`API HTTP ${res.status}`);
    return res.json();
  } catch (e: any) {
    if (e?.name === "AbortError") throw new Error("Timeout. Tente novamente.");
    throw e;
  } finally { clearTimeout(timer); }
}

function maskCPF(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

// ─── Constantes ────────────────────────────────────────────────────────────────
const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
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
  { id: "logo1", label: "Logo 1", src: "/logos/logo1.png" },
  { id: "logo2", label: "Logo 2", src: "/logos/logo2.png" },
  { id: "logo3", label: "Logo 3", src: "/logos/logo3.jpg" },
  { id: "amil", label: "Amil", src: "/logos/amil.png" },
  { id: "hapvida", label: "Hapvida", src: "/logos/hapvida.png" },
  { id: "notredame", label: "Notre Dame", src: "/logos/notredame.png" },
  { id: "sulamerica", label: "Sul América", src: "/logos/sulamerica.png" },
  { id: "unimed", label: "Unimed", src: "/logos/unimed.png" },
];
const TEXTO_PADRAO = `Atesto para os devidos fins que o(a) paciente acima identificado(a) compareceu a esta unidade de saúde na data de hoje para atendimento médico. Necessita de 03 (três) dias de afastamento de suas atividades laborais para repouso e tratamento de saúde.`;
function gerarTextoAfastamento(dias: number): string {
  const DIAS_EXT: Record<number,{num:string;ext:string}> = {1:{num:"01",ext:"um"},2:{num:"02",ext:"dois"},3:{num:"03",ext:"três"},4:{num:"04",ext:"quatro"},5:{num:"05",ext:"cinco"},6:{num:"06",ext:"seis"},7:{num:"07",ext:"sete"},8:{num:"08",ext:"oito"},9:{num:"09",ext:"nove"},10:{num:"10",ext:"dez"},11:{num:"11",ext:"onze"},12:{num:"12",ext:"doze"},13:{num:"13",ext:"treze"},14:{num:"14",ext:"quatorze"},15:{num:"15",ext:"quinze"}};
  const d = DIAS_EXT[dias];
  if (!d) return TEXTO_PADRAO;
  const unidade = dias === 1 ? "dia" : "dias";
  return `Atesto para os devidos fins que o(a) paciente acima identificado(a) compareceu a esta unidade de saúde na data de hoje para atendimento médico. Necessita de ${d.num} (${d.ext}) ${unidade} de afastamento de suas atividades laborais para repouso e tratamento de saúde.`;
}
interface MedicoDB {
  id: number; nome_medico: string; crm: string; uf_crm: string;
  especialidade: string; local_trabalho: string; cidade: string;
  uf_local: string; endereco: string; bairro: string;
}
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

function handleDateInput(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0,2)}/${d.slice(2)}`;
  return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Componente ────────────────────────────────────────────────────────────────
export default function AtestadoEditar() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  const previewRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // ── Logos ──────────────────────────────────────────────────────────────────
  const [logoLeft, setLogoLeft] = useState<string>("");
  const [logoRight, setLogoRight] = useState<string>("");
  const logoLeftRef = useRef<HTMLInputElement>(null);
  const logoRightRef = useRef<HTMLInputElement>(null);

  // ── Assinatura ─────────────────────────────────────────────────────────────
  const [signatureColor, setSignatureColor] = useState<string>("#0b109f");
  const [signatureImage, setSignatureImage] = useState<string>("");
  const signatureRef = useRef<HTMLInputElement>(null);

  // ── CPF original (bloqueado se já preenchido) ─────────────────────────────
  const [cpfOriginal, setCpfOriginal] = useState<string>("");
  const [cpfEditable, setCpfEditable] = useState<boolean>(false);
  const [cpfInput, setCpfInput] = useState<string>("");
  const [codigoQR, setCodigoQR] = useState<string>("");
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
  // ── CEP do paciente ─────────────────────────────────────────────────────────
  const [cepPaciente, setCepPaciente] = useState("");
  const [cepNumero, setCepNumero] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  // ── CEP para UPA ─────────────────────────────────────────────────────────────
  const [cepUPA, setCepUPA] = useState("");
  const [cepUPALoading, setCepUPALoading] = useState(false);
  const [cepUPAErro, setCepUPAErro] = useState("");
  const [upaResultados, setUpaResultados] = useState<Array<{nome:string;tipo:string;endereco:string;rua:string;numero:string;bairro:string;cidade:string;uf:string;cep:string;cnes:number;}>>([]);
  const [showUpaResultados, setShowUpaResultados] = useState(false);
  const [upaExpandido, setUpaExpandido] = useState(false);
  const [logoSide, setLogoSide] = useState<"left"|"right">("left");
  // ── Formulário ──────────────────────────────────────────────────────────────
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
    nomeMae: "",
    endereco: "",
    cid: "",
    cidDisplay: "",
    cidNome: "",
    afastamento: "3",
    textoAtestado: "",
    dataAssinatura: "",
    horaAssinatura: "",
    dataEmissao: "",
    cidade: "",
    modoCarimbo: false,
  });

  // ── Carregar dados do atestado ─────────────────────────────────────────────
  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch(`/api/attestations/${id}`, { credentials: "include" });
        if (!res.ok) { setNotFound(true); setLoading(false); return; }
        const json = await res.json();
        const d = json.data || json;
        if (!d || !d.id) { setNotFound(true); setLoading(false); return; }

        const loadedCpf = d.cpf || "";
        setCpfOriginal(loadedCpf);
        setCpfEditable(!loadedCpf); // Se CPF vazio, permitir edição
        setCpfInput(loadedCpf);
        setCodigoQR(d.codigo_qr || d.codigoQR || "");
        setLogoLeft(d.logo_url || d.logoUrl || "");
        setLogoRight(d.logo_right || d.logoRight || "");
        setSignatureColor(d.signature_color || d.signatureColor || "#0b109f");
        setSignatureImage(d.signature_image || d.signatureImage || "");

        setForm({
          instituicao: d.instituicao || "",
          unidade: d.unidade || "",
          enderecoEmitente: d.endereco_emitente || d.enderecoEmitente || "",
          medico: d.medico || "",
          crm: d.crm || "",
          especialidade: d.especialidade || "",
          paciente: d.paciente || "",
          sexo: (d.sexo || "FEMALE") as "MALE" | "FEMALE",
          nascimento: d.nascimento || "",
          nomeMae: d.nome_mae || d.nomeMae || "",
          endereco: d.endereco || "",
          cid: d.cid || "",
          cidDisplay: d.cid_display || d.cidDisplay || d.cid || "",
          cidNome: d.cid_nome || d.cidNome || "",
          afastamento: d.afastamento || "3",
          textoAtestado: (() => { const t = d.texto_atestado || d.textoAtestado || ""; if (t) return t; const dias = parseInt(d.afastamento || "3"); return gerarTextoAfastamento(isNaN(dias) ? 3 : dias); })(),
          dataAssinatura: d.data_assinatura || d.dataAssinatura || "",
          horaAssinatura: d.hora_assinatura || d.horaAssinatura || "",
          dataEmissao: d.data_emissao || d.dataEmissao || "",
          cidade: d.cidade || "",
          modoCarimbo: d.modo_carimbo === 1 || d.modoCarimbo === true,
        });
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ── Auto-download quando vem de "Baixar PDF" nos Salvos ───────────────────
  useEffect(() => {
    if (loading || notFound) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("download") === "1" && previewRef.current) {
      // Aguardar renderização do preview e disparar download
      const timer = setTimeout(async () => {
        try {
          const nomePacEd = (form.paciente || "PACIENTE").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
          const filename = `ATESTADO_${nomePacEd}.pdf`;
          await exportElementToPDF(previewRef.current!, { filename, scale: 2, quality: 0.92 });
        } catch (err) {
          console.error("Auto-download falhou:", err);
        }
      }, 1500); // Esperar imagens e fontes carregarem
      return () => clearTimeout(timer);
    }
  }, [loading, notFound]);

  // ── Atualizar texto quando dias de afastamento mudam ──────────────────────────────────────────────────────────────────
  const afastamentoInitialized = useRef(false);
  useEffect(() => {
    if (!afastamentoInitialized.current) { afastamentoInitialized.current = true; return; }
    const dias = parseInt(form.afastamento);
    if (!isNaN(dias) && dias >= 1 && dias <= 15) {
      setForm(p => ({ ...p, textoAtestado: gerarTextoAfastamento(dias) }));
    }
  }, [form.afastamento]);
  // ── Carregar cidades quando UF muda ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!filtroUF) { setCidades([]); setBairros([]); return; }
    apiFetch(`?action=cidades&uf=${filtroUF}`).then((data: string[]) => setCidades(data || [])).catch(() => setCidades([]));
    setFiltroCidade(""); setFiltroBairro(""); setBairros([]); setLocais([]);
  }, [filtroUF]);
  // ── Carregar bairros/locais quando cidade muda ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!filtroUF || !filtroCidade) { setBairros([]); setLocais([]); return; }
    apiFetch(`?action=bairros&uf=${filtroUF}&cidade=${encodeURIComponent(filtroCidade)}`).then((data: string[]) => setBairros(data || [])).catch(() => setBairros([]));
    apiFetch(`?action=locais&uf=${filtroUF}&cidade=${encodeURIComponent(filtroCidade)}`).then((data: string[]) => setLocais(data || [])).catch(() => setLocais([]));
    setFiltroBairro(""); setFiltroLocal("");
    if (skipClearUnidade.current) {
      skipClearUnidade.current = false;
      setForm(p => ({ ...p, instituicao: `PREFEITURA DE ${filtroCidade.toUpperCase()}`, cidade: filtroCidade.toUpperCase() }));
    } else {
      setForm(p => ({ ...p, instituicao: `PREFEITURA DE ${filtroCidade.toUpperCase()}`, unidade: "", cidade: filtroCidade.toUpperCase() }));
    }
  }, [filtroUF, filtroCidade]);
  // ── Busca automática ao selecionar cidade ──────────────────────────────────────────────────────────────────
  const buscarMedicos = useCallback(async (autoSearch = false) => {
    const termo = termoBusca.trim().toUpperCase().replace(/[.\-]/g, "");
    if (!filtroUF) { if (!autoSearch) setErroBusca("Selecione a UF antes de buscar."); return; }
    if (termo.length < 3 && !filtroCidade) { if (!autoSearch) setErroBusca("Digite ao menos 3 caracteres ou selecione uma Cidade."); return; }
    setBuscando(true); setErroBusca(""); setShowResultados(true);
    try {
      let params = `?uf=${filtroUF}&limit=50`;
      if (termo.length >= 3) params += `&q=${encodeURIComponent(termo)}`;
      else if (filtroCidade) { params += `&cidade=${encodeURIComponent(filtroCidade)}`; if (filtroBairro) params += `&bairro=${encodeURIComponent(filtroBairro)}`; }
      if (filtroEsp) params += `&esp=${encodeURIComponent(filtroEsp)}`;
      const data: MedicoDB[] = await apiFetch(params);
      setResultados(data);
      if (data.length === 0) setErroBusca("Nenhum médico encontrado. Preencha manualmente.");
    } catch { setErroBusca("Erro ao buscar. Verifique a conexão."); }
    finally { setBuscando(false); }
  }, [termoBusca, filtroUF, filtroEsp, filtroCidade, filtroBairro]);
  useEffect(() => {
    if (filtroUF && filtroCidade) { const timer = setTimeout(() => buscarMedicos(true), 300); return () => clearTimeout(timer); }
  }, [filtroUF, filtroCidade, buscarMedicos]);
  const selecionarMedico = (m: MedicoDB) => {
    const localTrabalho = m.local_trabalho?.toUpperCase() || "";
    const cidadeMedico = m.cidade?.toUpperCase() || "";
    setForm(p => ({
      ...p,
      medico: m.nome_medico.toUpperCase(),
      crm: `CRM/${m.uf_crm || m.uf_local} ${m.crm}`,
      especialidade: (m.especialidade || "CLÍNICO GERAL").toUpperCase(),
      instituicao: cidadeMedico ? `PREFEITURA DE ${cidadeMedico}` : (p.instituicao || "CONSULTÓRIO MÉDICO"),
      unidade: localTrabalho || p.unidade,
      enderecoEmitente: (() => { const rua = (m.endereco || "").toUpperCase(); const bairroM = (m.bairro || "").toUpperCase(); const cidadeM = (m.cidade || "").toUpperCase(); const ufM = (m.uf_local || "").toUpperCase(); const parteFinal = bairroM ? `${bairroM}, ${cidadeM}/${ufM}` : `${cidadeM}/${ufM}`; return rua ? `${rua} - ${parteFinal}` : parteFinal; })(),
      cidade: cidadeMedico || p.cidade,
    }));
    setShowResultados(false); setTermoBusca(""); setShowEditar(true);
  };
  const buscarCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (data.erro) return;
      const numero = cepNumero.trim();
      const parteRua = [data.logradouro, numero].filter(Boolean).join(", ");
      const parteBairro = data.bairro || "";
      const parteCidade = `${data.localidade}/${data.uf}`;
      const endFormatado = [parteRua, parteBairro ? `${parteBairro}, ${parteCidade}` : parteCidade].filter(Boolean).join(" - ").toUpperCase();
      setForm(p => ({ ...p, endereco: endFormatado }));
    } catch { /* silencioso */ } finally { setCepLoading(false); }
  };
  const buscarUPAProxima = async () => {
    const cepLimpo = cepUPA.replace(/\D/g, "");
    if (cepLimpo.length !== 8) { setCepUPAErro("CEP inválido."); return; }
    setCepUPALoading(true); setCepUPAErro(""); setUpaResultados([]); setShowUpaResultados(false);
    try {
      const res = await fetch(`/api/upa-proxima?cep=${cepLimpo}`);
      const data = await res.json() as any;
      if (!res.ok || data.error) { setCepUPAErro(data.error || "Erro ao buscar UPAs."); return; }
      if (!data.upas || data.upas.length === 0) { setCepUPAErro("Nenhuma UPA encontrada."); return; }
      setUpaResultados(data.upas); setShowUpaResultados(true);
    } catch { setCepUPAErro("Erro ao buscar."); } finally { setCepUPALoading(false); }
  };
  const selecionarUPA = (upa: typeof upaResultados[0]) => {
    const endFormatado = [`${upa.rua}, ${upa.numero}`, upa.bairro ? `${upa.bairro}, ${upa.cidade}/${upa.uf}` : `${upa.cidade}/${upa.uf}`].join(" - ");
    setForm(p => ({ ...p, unidade: upa.nome, instituicao: `PREFEITURA DE ${upa.cidade}`, enderecoEmitente: endFormatado, cidade: upa.cidade }));
    skipClearUnidade.current = true; setFiltroUF(upa.uf); setFiltroCidade(upa.cidade); setShowUpaResultados(false); setShowEditar(true);
  };
  // ── Salvar edição ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSavedMsg("");
    try {
      // Validar CPF se editável e preenchido
      if (cpfEditable && cpfInput && !validarCPF(cpfInput)) {
        alert("CPF inválido! Verifique os dígitos informados.");
        setSaving(false);
        return;
      }

      const payload: any = {
        paciente: form.paciente.toUpperCase(),
        sexo: form.sexo,
        nascimento: form.nascimento,
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

      // Se CPF era vazio e agora foi preenchido, enviar para salvar
      if (cpfEditable && cpfInput) {
        payload.cpf = cpfInput;
        payload.fillCpf = true; // Flag para o backend saber que deve preencher o CPF
      }

      const res = await fetch(`/api/attestations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao salvar");
      }
      setSavedMsg("Atestado atualizado com sucesso!");
      setTimeout(() => setSavedMsg(""), 4000);
    } catch (error) {
      alert(`Erro ao salvar: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Download PDF ────────────────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    try {
      const nomePacEd2 = (form.paciente || "PACIENTE").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
      const filename = `ATESTADO_${nomePacEd2}.pdf`;
      await exportElementToPDF(previewRef.current, { filename, scale: 2, quality: 0.92 });
    } catch (err) {
      alert(`Erro ao gerar PDF: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    }
  };

  // ── Upload de logos ─────────────────────────────────────────────────────────
  const handleLogoUpload = async (side: "left" | "right", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await readFileAsBase64(file);
    if (side === "left") setLogoLeft(b64);
    else setLogoRight(b64);
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await readFileAsBase64(file);
    setSignatureImage(b64);
  };

  // ── Preview data ────────────────────────────────────────────────────────────
  const previewData: AttestationData & Record<string, any> = {
    id: id,
    paciente: form.paciente || "NOME DO PACIENTE",
    sexo: form.sexo,
    nascimento: form.nascimento || "DD/MM/AAAA",
    cpf: cpfInput || cpfOriginal || "",
    cns: "",
    tipoDoc: "CPF",
    nomeMae: form.nomeMae || "NOME DA MÃE",
    endereco: form.endereco || "ENDEREÇO COMPLETO",
    condicao: "",
    vacinacao: "",
    cid: form.cid,
    codigoQR: codigoQR || "XXXX.XXXX",
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
    instituicao: form.instituicao || "INSTITUIÇÃO",
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
    background: isDark ? "#1e293b" : "#fff", borderRadius: 10,
    boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.08)",
    padding: "14px 16px", marginBottom: 12,
    border: isDark ? "1px solid #334155" : "none",
  };
  const secTitle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, textTransform: "uppercase",
    letterSpacing: 1, color: isDark ? "#60a5fa" : "#005CA9",
    borderBottom: isDark ? "2px solid #3b82f6" : "2px solid #005CA9", paddingBottom: 5, marginBottom: 10,
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 600,
    color: isDark ? "#cbd5e1" : "#000", marginBottom: 3,
  };
  const inp: React.CSSProperties = {
    width: "100%", padding: "6px 10px", border: isDark ? "1px solid #475569" : "1px solid #d1d5db",
    borderRadius: 6, fontSize: 13, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit",
    color: isDark ? "#e2e8f0" : "#000", background: isDark ? "#0f172a" : "#fff",
  };
  const sel: React.CSSProperties = { ...inp, background: isDark ? "#0f172a" : "#fff" };
  const btnBlue: React.CSSProperties = {
    background: "#005CA9", color: "#fff", border: "none",
    borderRadius: 7, padding: "8px 16px", fontWeight: 700,
    fontSize: 12, cursor: "pointer", letterSpacing: 0.5,
  };
  const btnGreen: React.CSSProperties = {
    background: "#16a34a", color: "#fff", border: "none",
    borderRadius: 7, padding: "8px 16px", fontWeight: 700,
    fontSize: 12, cursor: "pointer",
  };
  const btnGray: React.CSSProperties = {
    background: isDark ? "#334155" : "#e2e8f0", color: isDark ? "#e2e8f0" : "#000",
    border: isDark ? "1px solid #475569" : "1px solid #cbd5e1",
    borderRadius: 7, padding: "8px 16px", fontWeight: 700,
    fontSize: 12, cursor: "pointer",
  };

  // ── Loading / Not Found ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #d97706", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: "#6b7280", fontSize: 14 }}>Carregando atestado...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>📄</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Atestado não encontrado</h2>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 20 }}>O atestado solicitado não existe ou você não tem permissão.</p>
          <button style={btnBlue} onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</button>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: isDark ? "#0f172a" : "#f1f5f9", fontFamily: "Roboto, sans-serif", color: isDark ? "#e2e8f0" : "#1e293b" }}>

      {/* Header */}
      <div style={{ background: "#d97706", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}>←</button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Editar Atestado</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...btnGreen, fontSize: 11, padding: "6px 14px" }} onClick={handleDownloadPdf}>BAIXAR PDF</button>
          <button
            style={{ background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 11, padding: "6px 14px", cursor: "pointer", fontWeight: 600 }}
            onClick={() => navigate("/dashboard")}
          >
            CANCELAR
          </button>
          <button
            style={{ ...btnBlue, fontSize: 11, padding: "6px 14px", opacity: saving ? 0.7 : 1 }}
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
          </button>
        </div>
      </div>

      {/* Mensagem de sucesso */}
      {savedMsg && (
        <div style={{ background: "#dcfce7", color: "#166534", padding: "10px 20px", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
          {savedMsg}
        </div>
      )}

      <div style={{ display: "flex", gap: 16, padding: 16, maxWidth: 1400, margin: "0 auto" }}>
        {/* ── Formulário (esquerda) ── */}
        <div style={{ flex: "0 0 420px", maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>

          {/* CPF - Bloqueado se já preenchido, editável se vazio */}
          <div style={card}>
            <div style={secTitle}>{cpfEditable ? "CPF do Paciente (Preencher)" : `CPF ${cpfOriginal}`}</div>
            {cpfEditable ? (
              <>
                <input
                  style={{ ...inp, border: "2px solid #f59e0b", fontWeight: 700, fontSize: 14 }}
                  value={cpfInput}
                  onChange={e => setCpfInput(maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
                <p style={{ fontSize: 10, color: "#f59e0b", marginTop: 4, fontWeight: 600 }}>
                  O CPF não foi informado na emissão. Preencha agora para salvar no documento.
                </p>
              </>
            ) : (
              <>
                <div style={{
                  background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 6,
                  padding: "8px 12px", fontSize: 14, fontWeight: 700, color: "#6b7280",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  {cpfOriginal}
                </div>

              </>
            )}
          </div>

          {/* Dados do Paciente */}
          <div style={card}>
            <div style={secTitle}>Dados do Paciente</div>
            <div style={{ display: "grid", gap: 8 }}>
              <div>
                <label style={lbl}>Nome Completo</label>
                <input style={inp} value={form.paciente} onChange={e => setForm(p => ({ ...p, paciente: e.target.value.toUpperCase() }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={lbl}>Sexo</label>
                  <select style={sel} value={form.sexo} onChange={e => setForm(p => ({ ...p, sexo: e.target.value as "MALE" | "FEMALE" }))}>
                    <option value="FEMALE">Feminino</option>
                    <option value="MALE">Masculino</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Nascimento</label>
                  <input style={inp} value={form.nascimento} onChange={e => setForm(p => ({ ...p, nascimento: handleDateInput(e.target.value) }))} placeholder="DD/MM/AAAA" />
                </div>
              </div>
              <div>
                <label style={lbl}>Nome da Mãe</label>
                <input style={inp} value={form.nomeMae} onChange={e => setForm(p => ({ ...p, nomeMae: e.target.value.toUpperCase() }))} />
              </div>
              {/* CEP do paciente */}
              <div style={{ background: "#f8fafc", borderRadius: 6, padding: 8, border: "1px solid #e2e8f0" }}>
                <label style={{ ...lbl, fontWeight: 700 }}>Buscar Endereço por CEP</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input style={{ ...inp, flex: 1 }} value={cepPaciente}
                    onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 8); setCepPaciente(v.length > 5 ? `${v.slice(0,5)}-${v.slice(5)}` : v); }}
                    onBlur={e => buscarCEP(e.target.value)}
                    placeholder="00000-000" maxLength={9} />
                  <input style={{ ...inp, width: 60 }} value={cepNumero} onChange={e => setCepNumero(e.target.value)} placeholder="Nº" />
                  <button style={{ ...btnGray, fontSize: 11, padding: "6px 10px", whiteSpace: "nowrap" as const }}
                    onClick={() => buscarCEP(cepPaciente)} disabled={cepLoading}>
                    {cepLoading ? "..." : "🔍"}
                  </button>
                </div>
              </div>
              <div>
                <label style={lbl}>Endereço do Paciente</label>
                <input style={inp} value={form.endereco} onChange={e => setForm(p => ({ ...p, endereco: e.target.value.toUpperCase() }))} />
              </div>
            </div>
          </div>
          {/* CID */}
          <div style={card}>
            <div style={secTitle}>CID — Classificação da Doença</div>
            <select style={sel} value={form.cid} onChange={e => {
              const code = e.target.value;
              const allCids = CIDS_CATEGORIZADOS.flatMap(g => g.itens);
              const found = allCids.find(c => c.code === code);
              setForm(p => ({
                ...p,
                cid: code,
                cidDisplay: found ? `${code} — ${found.desc}` : code,
                cidNome: found?.desc || "",
              }));
            }}>
              <option value="">Selecione o CID</option>
              {CIDS_CATEGORIZADOS.map(g => (
                <optgroup key={g.grupo} label={g.grupo}>
                  {g.itens.map(c => (
                    <option key={c.code} value={c.code}>{c.code} — {c.desc}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Texto do Atestado */}
          <div style={card}>
            <div style={secTitle}>Texto do Atestado</div>
            <div style={{ marginBottom: 8 }}>
              <label style={lbl}>Dias de Afastamento</label>
              <select style={sel} value={form.afastamento} onChange={e => {
                // Na edição, só atualiza o número de dias sem sobrescrever o texto original
                setForm(p => ({ ...p, afastamento: e.target.value }));
              }}>
                {Array.from({ length: 15 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? "dia" : "dias"}</option>
                ))}
              </select>
            </div>
            <textarea
              style={{ ...inp, minHeight: 100, resize: "vertical" }}
              value={form.textoAtestado}
              onChange={e => setForm(p => ({ ...p, textoAtestado: e.target.value }))}
            />
          </div>

          {/* Médico */}
          <div style={card}>
            <div style={secTitle}>1. Buscar Médico</div>
            <div style={{ display: "grid", gap: 8 }}>
              {/* Filtros de UF, Cidade, Bairro, Especialidade */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
                <div>
                  <label style={lbl}>UF *</label>
                  <SearchSelect label="UF" value={filtroUF} options={UFS} onChange={v => setFiltroUF(v)} />
                </div>
                <div>
                  <label style={lbl}>Cidade</label>
                  <SearchSelect label="Cidade" value={filtroCidade} options={cidades} disabled={!filtroUF} onChange={v => setFiltroCidade(v)} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={lbl}>Bairro</label>
                  <SearchSelect label="Bairro" value={filtroBairro} options={bairros} disabled={!filtroCidade} onChange={v => setFiltroBairro(v)} />
                </div>
                <div>
                  <label style={lbl}>Especialidade</label>
                  <select style={sel} value={filtroEsp} onChange={e => setFiltroEsp(e.target.value)}>
                    {ESPECIALIDADES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                </div>
              </div>
              {/* Campo de busca por nome */}
              <div style={{ display: "flex", gap: 6 }}>
                <input style={{ ...inp, flex: 1 }} value={termoBusca} onChange={e => setTermoBusca(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && buscarMedicos()}
                  placeholder="Buscar por nome do médico..." />
                <button style={{ ...btnBlue, fontSize: 11, padding: "6px 12px", whiteSpace: "nowrap" as const }}
                  onClick={() => buscarMedicos()} disabled={buscando}>
                  {buscando ? "..." : "🔍 Buscar"}
                </button>
              </div>
              {erroBusca && <div style={{ fontSize: 11, color: "#dc2626", padding: "4px 8px", background: "#fef2f2", borderRadius: 4 }}>{erroBusca}</div>}
              {/* Resultados */}
              {showResultados && resultados.length > 0 && (
                <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 6 }}>
                  {resultados.map(m => (
                    <div key={m.id} onClick={() => selecionarMedico(m)}
                      style={{ padding: "8px 10px", cursor: "pointer", borderBottom: "1px solid #f3f4f6", fontSize: 12 }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f0f9ff")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <div style={{ fontWeight: 700, color: "#1e293b" }}>{m.nome_medico}</div>
                      <div style={{ color: "#6b7280", fontSize: 11 }}>CRM/{m.uf_crm} {m.crm} • {m.especialidade} • {m.local_trabalho}</div>
                    </div>
                  ))}
                </div>
              )}
              {/* Campos manuais do médico */}
              {showEditar && (
                <div style={{ display: "grid", gap: 8, paddingTop: 4, borderTop: "1px dashed #e5e7eb" }}>
                  <div>
                    <label style={lbl}>Nome do Médico</label>
                    <input style={inp} value={form.medico} onChange={e => setForm(p => ({ ...p, medico: e.target.value.toUpperCase() }))} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={lbl}>CRM</label>
                      <input style={inp} value={form.crm} onChange={e => setForm(p => ({ ...p, crm: e.target.value }))} />
                    </div>
                    <div>
                      <label style={lbl}>Especialidade</label>
                      <input style={inp} value={form.especialidade} onChange={e => setForm(p => ({ ...p, especialidade: e.target.value.toUpperCase() }))} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Emitente */}
          <div style={card}>
            <div style={secTitle}>2. Dados do Emitente</div>
            <div style={{ display: "grid", gap: 8 }}>
              {/* Busca por CEP de UPA */}
              <div style={{ background: "#f0f9ff", borderRadius: 6, padding: 8, border: "1px solid #bae6fd" }}>
                <label style={{ ...lbl, color: "#0369a1", fontWeight: 700 }}>Buscar UPA/Clínica por CEP</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input style={{ ...inp, flex: 1 }} value={cepUPA}
                    onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 8); setCepUPA(v.length > 5 ? `${v.slice(0,5)}-${v.slice(5)}` : v); }}
                    placeholder="00000-000" maxLength={9} />
                  <button style={{ ...btnBlue, fontSize: 11, padding: "6px 12px", whiteSpace: "nowrap" as const }}
                    onClick={buscarUPAProxima} disabled={cepUPALoading}>
                    {cepUPALoading ? "..." : "🏥 Buscar"}
                  </button>
                </div>
                {cepUPAErro && <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>{cepUPAErro}</div>}
                {showUpaResultados && upaResultados.length > 0 && (
                  <div style={{ marginTop: 6, maxHeight: 150, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff" }}>
                    {(upaExpandido ? upaResultados : upaResultados.slice(0, 3)).map((upa, i) => (
                      <div key={i} onClick={() => selecionarUPA(upa)}
                        style={{ padding: "7px 10px", cursor: "pointer", borderBottom: "1px solid #f3f4f6", fontSize: 11 }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f0f9ff")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <div style={{ fontWeight: 700, color: "#1e293b" }}>{upa.nome}</div>
                        <div style={{ color: "#6b7280" }}>{upa.rua}, {upa.numero} • {upa.bairro} • {upa.cidade}/{upa.uf}</div>
                      </div>
                    ))}
                    {upaResultados.length > 3 && (
                      <div style={{ padding: "6px 10px", fontSize: 11, color: "#2563eb", cursor: "pointer", textAlign: "center" as const }}
                        onClick={() => setUpaExpandido(e => !e)}>
                        {upaExpandido ? "Ver menos" : `Ver mais ${upaResultados.length - 3} resultados`}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label style={lbl}>Instituição</label>
                <input style={inp} value={form.instituicao} onChange={e => setForm(p => ({ ...p, instituicao: e.target.value.toUpperCase() }))} />
              </div>
              <div>
                <label style={lbl}>Unidade</label>
                <input style={inp} value={form.unidade} onChange={e => setForm(p => ({ ...p, unidade: e.target.value.toUpperCase() }))} />
              </div>
              <div>
                <label style={lbl}>Endereço do Emitente</label>
                <input style={inp} value={form.enderecoEmitente} onChange={e => setForm(p => ({ ...p, enderecoEmitente: e.target.value.toUpperCase() }))} />
              </div>
              <div>
                <label style={lbl}>Cidade</label>
                <input style={inp} value={form.cidade} onChange={e => setForm(p => ({ ...p, cidade: e.target.value.toUpperCase() }))} />
              </div>
            </div>
          </div>

          {/* Data e Hora */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={secTitle}>Data e Hora</div>
              <button style={{ fontSize: 10, padding: "3px 8px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 4, cursor: "pointer", color: "#166534", fontWeight: 600 }}
                onClick={() => {
                  const now = new Date();
                  const dd = String(now.getDate()).padStart(2, "0");
                  const mm = String(now.getMonth() + 1).padStart(2, "0");
                  const yyyy = now.getFullYear();
                  const hh = String(now.getHours()).padStart(2, "0");
                  const min = String(now.getMinutes()).padStart(2, "0");
                  setForm(p => ({ ...p, dataAssinatura: `${dd}/${mm}/${yyyy}`, horaAssinatura: `${hh}:${min}`, dataEmissao: `${dd}/${mm}/${yyyy}` }));
                }}>
                ⏰ Preencher Agora
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div>
                <label style={lbl}>Data Assinatura</label>
                <input style={inp} value={form.dataAssinatura} onChange={e => setForm(p => ({ ...p, dataAssinatura: handleDateInput(e.target.value) }))} placeholder="DD/MM/AAAA" />
              </div>
              <div>
                <label style={lbl}>Hora</label>
                <input style={inp} value={form.horaAssinatura} onChange={e => setForm(p => ({ ...p, horaAssinatura: e.target.value }))} placeholder="HH:MM" />
              </div>
              <div>
                <label style={lbl}>Data Emissão</label>
                <input style={inp} value={form.dataEmissao} onChange={e => setForm(p => ({ ...p, dataEmissao: handleDateInput(e.target.value) }))} placeholder="DD/MM/AAAA" />
              </div>
            </div>
          </div>

          {/* Logos e Assinatura */}
          <div style={card}>
            <div style={secTitle}>Logos e Assinatura</div>
            <div style={{ display: "grid", gap: 8 }}>
              {/* Seletor de lado */}
              <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                <button style={{ flex: 1, padding: "5px 0", fontSize: 11, fontWeight: 700, borderRadius: 5, border: logoSide === "left" ? "2px solid #d97706" : "1px solid #d1d5db", background: logoSide === "left" ? "#fef3c7" : "#f9fafb", cursor: "pointer", color: logoSide === "left" ? "#92400e" : "#374151" }} onClick={() => setLogoSide("left")}>
                  {logoLeft ? "Logo Esq. ✓" : "Logo Esquerda"}
                </button>
                <button style={{ flex: 1, padding: "5px 0", fontSize: 11, fontWeight: 700, borderRadius: 5, border: logoSide === "right" ? "2px solid #d97706" : "1px solid #d1d5db", background: logoSide === "right" ? "#fef3c7" : "#f9fafb", cursor: "pointer", color: logoSide === "right" ? "#92400e" : "#374151" }} onClick={() => setLogoSide("right")}>
                  {logoRight ? "Logo Dir. ✓" : "Logo Direita"}
                </button>
              </div>
              {/* Galeria de logos padrão */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                {LOGOS_PADRAO.map(logo => {
                  const currentLogo = logoSide === "left" ? logoLeft : logoRight;
                  const isSelected = currentLogo === logo.src;
                  return (
                    <div key={logo.id} onClick={() => { if (logoSide === "left") setLogoLeft(isSelected ? "" : logo.src); else setLogoRight(isSelected ? "" : logo.src); }}
                      style={{ border: isSelected ? "2px solid #d97706" : "1px solid #e5e7eb", borderRadius: 6, padding: 4, cursor: "pointer", background: isSelected ? "#fef3c7" : "#fff", textAlign: "center" as const }}>
                      <img src={logo.src} alt={logo.label} style={{ width: "100%", height: 32, objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <span style={{ fontSize: 9, color: isSelected ? "#92400e" : "#6b7280", display: "block", marginTop: 2 }}>{logo.label}</span>
                    </div>
                  );
                })}
              </div>
              {/* Upload personalizado */}
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <input ref={logoLeftRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleLogoUpload("left", e)} />
                  <button style={{ ...btnGray, width: "100%", fontSize: 10, padding: "5px 0" }} onClick={() => { setLogoSide("left"); logoLeftRef.current?.click(); }}>
                    {logoLeft ? "📎 Alterar Esq." : "📎 Upload Esq."}
                  </button>
                </div>
                <div style={{ flex: 1 }}>
                  <input ref={logoRightRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleLogoUpload("right", e)} />
                  <button style={{ ...btnGray, width: "100%", fontSize: 10, padding: "5px 0" }} onClick={() => { setLogoSide("right"); logoRightRef.current?.click(); }}>
                    {logoRight ? "📎 Alterar Dir." : "📎 Upload Dir."}
                  </button>
                </div>
                {(logoLeft || logoRight) && (
                  <button style={{ ...btnGray, fontSize: 10, padding: "5px 8px", color: "#dc2626" }} onClick={() => { setLogoLeft(""); setLogoRight(""); }}>✕ Remover</button>
                )}
              </div>
              <div>
                <label style={lbl}>Assinatura</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input ref={signatureRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleSignatureUpload} />
                  <button style={{ ...btnGray, fontSize: 11 }} onClick={() => signatureRef.current?.click()}>
                    {signatureImage ? "Alterar Assinatura" : "Upload Assinatura"}
                  </button>
                  <input type="color" value={signatureColor} onChange={e => setSignatureColor(e.target.value)} style={{ width: 32, height: 28, border: "none", cursor: "pointer" }} />
                  <span style={{ fontSize: 10, color: "#6b7280" }}>Cor do texto</span>
                </div>
              </div>
              <div>
                <label style={{ ...lbl, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.modoCarimbo} onChange={e => setForm(p => ({ ...p, modoCarimbo: e.target.checked }))} />
                  Modo Carimbo (assinatura em caixa)
                </label>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button
              style={{ ...btnGreen, flex: 1, padding: "12px 0", fontSize: 14, opacity: saving ? 0.7 : 1 }}
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "Salvando..." : "SALVAR ALTERAÇÕES"}
            </button>
            <button style={{ ...btnGray, flex: 1, padding: "12px 0", fontSize: 14 }} onClick={() => navigate("/dashboard")}>
              CANCELAR
            </button>
          </div>
        </div>

        {/* ── Preview (direita) ── */}
        <div style={{ flex: 1, position: "sticky", top: 16, alignSelf: "flex-start" }}>
          <div ref={previewRef} style={{ background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
            <AttestationDocument
              data={previewData}
              logoLeft={logoLeft}
              logoRight={logoRight}
              signatureColor={signatureColor}
              signatureImage={signatureImage}
            />
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
