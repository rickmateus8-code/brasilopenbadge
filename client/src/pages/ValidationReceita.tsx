/**
 * ValidationReceita.tsx
 * Réplica visual 100% fiel do verificamed.online para verificamed.digital
 * 
 * 2 tipos de validação:
 *   1. Manual: acessar verificamed.digital → modal → digitar código
 *   2. QR Code: verificamed.digital/verificar/receita/RX-XXXX-XXXX
 */
import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface MedicamentoValidado {
  uso_tipo: "interno" | "externo";
  nome: string;
  quantidade: string;
  posologia: string;
}

interface ReceitaValidada {
  codigo: string;
  tipo_receituario: string;
  paciente_nome: string;
  paciente_cpf?: string;
  paciente_nascimento?: string;
  paciente_identidade?: string;
  paciente_endereco?: string;
  paciente_telefone?: string;
  paciente_cidade?: string;
  medico_nome: string;
  medico_crm: string;
  medico_uf: string;
  medico_especialidade?: string;
  medicamentos: MedicamentoValidado[];
  data_emissao: string;
  validade?: string;
  nome_unidade?: string;
}

// ─── Utilitários ──────────────────────────────────────────────────────────────
function formatDate(d: string): string {
  if (!d) return "";
  if (d.includes("/")) return d;
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function formatDateLong(d: string): string {
  if (!d) return "";
  const months = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  try {
    let day: string, month: string, year: string;
    if (d.includes("/")) { [day, month, year] = d.split("/"); }
    else { [year, month, day] = d.split("-"); }
    return `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`;
  } catch { return d; }
}

function addDays(dateStr: string, days: number): string {
  try {
    let d: Date;
    if (dateStr.includes("/")) {
      const [day, month, year] = dateStr.split("/");
      d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else { d = new Date(dateStr); }
    d.setDate(d.getDate() + days);
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  } catch { return ""; }
}

// ─── Ícones SVG (Lucide — idênticos ao verificamed.online) ──────────────────
const ShieldCheck = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);
const CheckCircle = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
  </svg>
);
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const PillIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>
  </svg>
);
const StethoscopeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>
  </svg>
);
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const SparklesIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
);
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>
  </svg>
);
const QrCodeIcon = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/>
    <path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>
  </svg>
);
// Stats icons (matching verificamed.online exactly)
const ClipboardListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
  </svg>
);
const FileCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/>
  </svg>
);
const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
// Feature icons
const CheckBadgeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 12 2 2 4-4"/><path d="M12 3c-1.2 0-2.4.6-3 1.7A3.6 3.6 0 0 0 4.6 9c-1 .6-1.7 1.8-1.7 3s.7 2.4 1.7 3c-.3 1.2 0 2.5 1 3.4.8.8 2.1 1.2 3.3 1 .6 1 1.8 1.6 3 1.6s2.4-.6 3-1.7c1.2.3 2.5 0 3.4-1 .8-.8 1.2-2 1-3.3 1-.6 1.6-1.8 1.6-3s-.6-2.4-1.7-3c.3-1.2 0-2.5-1-3.4a3.7 3.7 0 0 0-3.3-1c-.6-1-1.8-1.6-3-1.6Z"/>
  </svg>
);
const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
  </svg>
);
const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
  </svg>
);

// ─── CSS ─────────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  :root {
    --vm-bg: hsl(210, 25%, 97%);
    --vm-fg: hsl(215, 25%, 12%);
    --vm-card: #ffffff;
    --vm-primary: hsl(215, 90%, 25%);
    --vm-primary-light: hsl(215, 90%, 32%);
    --vm-primary-fg: #ffffff;
    --vm-secondary: hsl(210, 20%, 94%);
    --vm-muted: hsl(210, 15%, 91%);
    --vm-muted-fg: hsl(215, 15%, 42%);
    --vm-accent: hsl(152, 60%, 38%);
    --vm-accent-fg: #ffffff;
    --vm-border: hsl(210, 20%, 88%);
  }
  * { box-sizing: border-box; }
  body { margin: 0; }
  .vm-hero {
    background: linear-gradient(135deg, hsl(215, 90%, 18%) 0%, hsl(215, 90%, 28%) 50%, hsl(215, 70%, 36%) 100%);
    background-image:
      radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px),
      linear-gradient(135deg, hsl(215, 90%, 18%) 0%, hsl(215, 90%, 28%) 50%, hsl(215, 70%, 36%) 100%);
    background-size: 24px 24px, 100% 100%;
  }
  .vm-stat-card { transition: transform 0.2s, box-shadow 0.2s; }
  .vm-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.12); }
  .vm-feature-card { transition: transform 0.2s; }
  .vm-feature-card:hover { transform: translateY(-3px); }
  .vm-field-box { border: 1px solid var(--vm-border); border-radius: 8px; padding: 10px 14px; min-height: 56px; background: var(--vm-card); }
  .vm-field-label { font-size: 11px; color: var(--vm-muted-fg); font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px; text-transform: uppercase; }
  .vm-field-value { font-size: 14px; font-weight: 700; color: var(--vm-fg); word-break: break-word; }
  @keyframes vm-spin { to { transform: rotate(360deg); } }
  @keyframes vm-fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .vm-animate { animation: vm-fade-in 0.4s ease-out; }
  .vm-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(4px); }
  .vm-wave { position: relative; }
  .vm-wave::after { content: ''; position: absolute; bottom: -60px; left: -5%; right: -5%; width: 110%; height: 100px; background: var(--vm-bg); border-radius: 50% 50% 0 0 / 100% 100% 0 0; }
  @media (max-width: 768px) {
    .vm-hero h1 { font-size: 28px !important; }
    .vm-hero p { font-size: 14px !important; }
    .vm-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .vm-docs-grid { grid-template-columns: 1fr !important; }
    .vm-features-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .vm-footer-grid { grid-template-columns: 1fr !important; }
    .vm-nav-links { display: none !important; }
    .vm-result-grid-3 { grid-template-columns: 1fr !important; }
    .vm-result-grid-med { grid-template-columns: 1fr !important; }
  }
`;

const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ValidationReceita() {
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [receita, setReceita] = useState<ReceitaValidada | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [codigoInput, setCodigoInput] = useState("");
  const [showHome, setShowHome] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<"camera" | "manual">("camera");

  // ── Validar receita ────────────────────────────────────────────────────────
  const validarReceita = useCallback(async (codeOverride?: string) => {
    const code = (codeOverride || codigoInput).trim().toUpperCase();
    if (!code) { setErrorMsg("Informe o código da receita."); return; }
    setIsLoading(true); setErrorMsg(null); setReceita(null); setShowHome(false); setShowModal(false);
    try {
      const res = await fetch(`/api/validate/${encodeURIComponent(code)}`);
      const json = await res.json();
      if (json.valid && json.data) {
        const d = json.data;
        let meds: MedicamentoValidado[] = [];
        const rawMeds = d.medicamentos || d.prescricao || [];
        if (Array.isArray(rawMeds)) {
          meds = rawMeds.map((m: any) => ({
            uso_tipo: m.uso_tipo || m.tipo || "interno",
            nome: m.nome || m.medicamento || "",
            quantidade: m.quantidade || m.qtd || "",
            posologia: m.posologia || m.uso || "",
          }));
        }
        let crmNum = d.medico_crm || d.crm || "";
        let crmUf = d.medico_uf || d.uf || "";
        if (crmNum.includes("/") && !crmUf) {
          const parts = crmNum.split("/");
          crmNum = parts[0]; crmUf = parts[1] || "";
        }
        setReceita({
          codigo: code,
          tipo_receituario: d.tipo_receituario || d.tipoReceituario || "simples",
          paciente_nome: d.paciente_nome || d.paciente || "",
          paciente_cpf: d.paciente_cpf || d.cpf || "",
          paciente_nascimento: d.paciente_nascimento || d.nascimento || "",
          paciente_identidade: d.paciente_identidade || d.identidade || "",
          paciente_endereco: d.paciente_endereco || d.endereco || "",
          paciente_telefone: d.paciente_telefone || d.telefone || "",
          paciente_cidade: d.paciente_cidade || d.cidade || "",
          medico_nome: d.medico_nome || d.medico || "",
          medico_crm: crmNum,
          medico_uf: crmUf,
          medico_especialidade: d.medico_especialidade || d.especialidade || "",
          medicamentos: meds,
          data_emissao: d.data_emissao || d.dataEmissao || "",
          validade: d.validade || "",
          nome_unidade: d.nome_unidade || d.unidade || d.instituicao || "",
        });
      } else {
        setErrorMsg(json.message || "Documento não encontrado na base de dados oficial.");
      }
    } catch { setErrorMsg("Erro ao conectar com o servidor. Tente novamente."); }
    finally { setIsLoading(false); }
  }, [codigoInput]);

  // ── Definir título da página ──────────────────────────────────────────────
  useEffect(() => {
    document.title = "VerificaMed - Sistema de Verificação de Documentos Médicos";
  }, []);

  // ── Auto-validar se vier código na URL ────────────────────────────────────
  useEffect(() => {
    const codeFromPath = params.id ? (params.id as string).trim().toUpperCase() : "";
    if (codeFromPath) {
      setCodigoInput(codeFromPath); setShowHome(false);
      setTimeout(() => validarReceita(codeFromPath), 100);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const validadeStr = receita?.validade ? formatDate(receita.validade) : receita?.data_emissao ? addDays(receita.data_emissao, 30) : "";

  // ─── HOMEPAGE ──────────────────────────────────────────────────────────────
  if (showHome && !receita && !isLoading) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div style={{ minHeight: "100vh", background: "var(--vm-bg)", fontFamily: FONT, color: "var(--vm-fg)" }}>

          {/* Top bar */}
          <div style={{ background: "hsl(215, 90%, 18%)", padding: "6px 0", fontSize: 12, color: "rgba(255,255,255,0.8)", textAlign: "center", letterSpacing: 0.3 }}>
            Sistema oficial de verificação de documentos médicos &bull; Brasil
          </div>

          {/* Navbar */}
          <header style={{ background: "var(--vm-primary)", padding: "0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#fff", fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>VerificaMed</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, borderLeft: "1px solid rgba(255,255,255,0.25)", paddingLeft: 10 }}>Sistema Nacional de Verificação</span>
              </div>
              <nav className="vm-nav-links" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <a href="#" style={{
                  color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 500,
                  background: "rgba(255,255,255,0.15)", padding: "6px 16px", borderRadius: 20,
                }}>Início</a>
                <a href="#sobre" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 14, padding: "6px 16px" }}>Sobre</a>
                <a href="#instituicoes" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 14, padding: "6px 16px" }}>Instituições</a>
              </nav>
            </div>
          </header>

          {/* Hero */}
          <section className="vm-hero" style={{ padding: "80px 20px 140px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ maxWidth: 700, margin: "0 auto", position: "relative", zIndex: 1 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.18)", borderRadius: 20, padding: "6px 16px", marginBottom: 24, fontSize: 13, color: "rgba(255,255,255,0.9)",
              }}>
                <SparklesIcon size={14} /> Sistema Oficial de Verificação
              </div>
              <h1 style={{ fontSize: 44, fontWeight: 800, color: "#fff", lineHeight: 1.12, marginBottom: 18, letterSpacing: -0.5 }}>
                Verificação de Documentos<br />Médicos em Tempo Real
              </h1>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, maxWidth: 560, margin: "0 auto 32px" }}>
                Sistema utilizado por hospitais, UPAs, prontos-socorros e clínicas em todo o Brasil para validar atestados e receitas médicas com total segurança.
              </p>
              <button onClick={() => { setShowModal(true); setModalTab("camera"); }} style={{
                background: "#fff", color: "var(--vm-primary)", border: "none",
                padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              }}>
                <SparklesIcon size={16} /> Verificar Documento <span style={{ marginLeft: 4 }}>&rarr;</span>
              </button>
            </div>
          </section>

          {/* Stats — wave transition */}
          <div style={{ background: "var(--vm-bg)", marginTop: -70, paddingTop: 90, paddingBottom: 40, position: "relative" }}>
            <svg viewBox="0 0 1440 120" style={{ display: "block", width: "100%", marginTop: -90, position: "relative", zIndex: 1 }} preserveAspectRatio="none">
              <path d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z" fill="var(--vm-bg)" />
            </svg>
            <div className="vm-stats-grid" style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {[
                { icon: <ClipboardListIcon />, num: "2.500+", label: "Unidades de Saúde" },
                { icon: <FileCheckIcon />, num: "15M+", label: "Documentos Verificados" },
                { icon: <MapPinIcon />, num: "27", label: "Estados Atendidos" },
                { icon: <UsersIcon />, num: "50k+", label: "Profissionais" },
              ].map((s, i) => (
                <div key={i} className="vm-stat-card" style={{
                  background: "#fff", borderRadius: 12, padding: "24px 16px", textAlign: "center",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid var(--vm-border)",
                }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, color: "var(--vm-primary)" }}>{s.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--vm-fg)", marginBottom: 4 }}>{s.num}</div>
                  <div style={{ fontSize: 13, color: "var(--vm-muted-fg)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tipos de Documentos */}
          <section style={{ padding: "40px 20px 50px", maxWidth: 1000, margin: "0 auto" }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 8, color: "var(--vm-fg)" }}>Tipos de Documentos</h2>
            <p style={{ textAlign: "center", color: "var(--vm-muted-fg)", marginBottom: 32, fontSize: 15 }}>
              Nosso sistema suporta a verificação de diversos tipos de documentos médicos, garantindo segurança em todas as modalidades.
            </p>
            <div className="vm-docs-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { icon: <ClipboardListIcon />, title: "Atestados Médicos", desc: "Verificação de atestados de afastamento, comparecimento e aptidão." },
                { icon: <PillIcon size={28} />, title: "Receitas Médicas", desc: "Validação de receitas simples, especiais e de controle especial." },
              ].map((d, i) => (
                <div key={i} className="vm-feature-card" style={{
                  background: "#fff", borderRadius: 12, padding: "24px", border: "1px solid var(--vm-border)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)", display: "flex", alignItems: "flex-start", gap: 16,
                }}>
                  <div style={{ width: 48, height: 48, background: "hsl(215, 90%, 95%)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--vm-primary)", flexShrink: 0 }}>
                    {d.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, margin: "0 0 6px", color: "var(--vm-fg)" }}>{d.title}</h3>
                    <p style={{ fontSize: 14, color: "var(--vm-muted-fg)", margin: 0, lineHeight: 1.6 }}>{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Por que usar */}
          <section id="sobre" style={{ padding: "40px 20px 50px", background: "#fff" }}>
            <div style={{ maxWidth: 1000, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "hsl(152, 60%, 95%)", color: "var(--vm-accent)", fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 20 }}>
                  <GlobeIcon /> Cobertura Nacional
                </span>
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: "var(--vm-fg)", textAlign: "center" }}>Por que usar o VerificaMed?</h2>
              <p style={{ color: "var(--vm-muted-fg)", marginBottom: 32, fontSize: 15, textAlign: "center" }}>
                Tecnologia de ponta para garantir a autenticidade dos documentos médicos em todo o território brasileiro.
              </p>
              <div className="vm-features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {[
                  { icon: <QrCodeIcon size={24} />, title: "QR Code Único", desc: "Cada documento recebe um código exclusivo criptografado para verificação instantânea." },
                  { icon: <CheckBadgeIcon />, title: "Validação em Segundos", desc: "Confirme a autenticidade de atestados e receitas em menos de 5 segundos." },
                  { icon: <ShieldIcon />, title: "Segurança Total", desc: "Sistema certificado com criptografia de ponta a ponta contra fraudes." },
                  { icon: <LockIcon />, title: "LGPD Compliant", desc: "Dados protegidos seguindo todas as normas da Lei Geral de Proteção de Dados." },
                ].map((f, i) => (
                  <div key={i} className="vm-feature-card" style={{
                    background: "var(--vm-bg)", borderRadius: 12, padding: "24px 20px", border: "1px solid var(--vm-border)", textAlign: "center",
                  }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, color: "var(--vm-primary)" }}>{f.icon}</div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, margin: "0 0 8px", color: "var(--vm-fg)" }}>{f.title}</h3>
                    <p style={{ fontSize: 13, color: "var(--vm-muted-fg)", margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Final */}
          <section style={{ padding: "60px 20px 70px", textAlign: "center", background: "linear-gradient(135deg, hsl(215, 90%, 18%), hsl(215, 90%, 28%))" }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, color: "#fff" }}>Verifique agora a autenticidade</h2>
            <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 28, fontSize: 15, maxWidth: 560, margin: "0 auto 28px" }}>
              Basta escanear o QR Code do documento ou digitar o código de verificação para confirmar sua autenticidade instantaneamente.
            </p>
            <button onClick={() => { setShowModal(true); setModalTab("camera"); }} style={{
              background: "#fff", color: "var(--vm-primary)", border: "none",
              padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            }}>
              <SparklesIcon size={16} /> Verificar Documento
            </button>
          </section>

          {/* Footer */}
          <footer style={{ background: "hsl(215, 90%, 14%)", padding: "40px 20px 20px", color: "rgba(255,255,255,0.7)" }}>
            <div className="vm-footer-grid" style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 40, marginBottom: 30 }}>
              <div>
                <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, marginBottom: 8 }}>VerificaMed</div>
                <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>Sistema Nacional de Verificação de Documentos Médicos. Garantindo a autenticidade de atestados e receitas em todo o Brasil.</p>
              </div>
              <div>
                <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Links Rápidos</div>
                <a href="#sobre" style={{ display: "block", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 13, marginBottom: 6 }}>Sobre o Sistema</a>
                <a href="#instituicoes" style={{ display: "block", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 13 }}>Instituições Parceiras</a>
              </div>
              <div>
                <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Suporte</div>
                <p style={{ fontSize: 13, margin: "0 0 4px" }}>suporte@verificamed.digital</p>
                <p style={{ fontSize: 13, margin: 0 }}>0800 123 4567</p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              &copy; {new Date().getFullYear()} VerificaMed - Sistema de Verificação de Documentos Médicos. Todos os direitos reservados.
            </div>
          </footer>

          {/* ── Modal de Verificação ── */}
          {showModal && (
            <div className="vm-modal-overlay" onClick={() => setShowModal(false)}>
              <div onClick={e => e.stopPropagation()} style={{
                background: "#fff", borderRadius: 16, width: "90%", maxWidth: 420,
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden",
              }}>
                {/* Modal header */}
                <div style={{
                  background: "linear-gradient(135deg, hsl(215, 90%, 18%), hsl(215, 90%, 28%))",
                  padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff" }}>
                    <QrCodeIcon size={20} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>Verificar Documento</div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>Escaneie o QR Code ou digite o código</div>
                    </div>
                  </div>
                  <button onClick={() => setShowModal(false)} style={{
                    background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
                    width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <XIcon />
                  </button>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", borderBottom: "1px solid var(--vm-border)" }}>
                  <button onClick={() => setModalTab("camera")} style={{
                    flex: 1, padding: "12px 0", border: "none", background: "transparent",
                    fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    color: modalTab === "camera" ? "var(--vm-primary)" : "var(--vm-muted-fg)",
                    borderBottom: modalTab === "camera" ? "2px solid var(--vm-primary)" : "2px solid transparent",
                  }}>
                    <CameraIcon /> Câmera
                  </button>
                  <button onClick={() => setModalTab("manual")} style={{
                    flex: 1, padding: "12px 0", border: "none", background: "transparent",
                    fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    color: modalTab === "manual" ? "var(--vm-primary)" : "var(--vm-muted-fg)",
                    borderBottom: modalTab === "manual" ? "2px solid var(--vm-primary)" : "2px solid transparent",
                  }}>
                    <QrCodeIcon size={16} /> Código Manual
                  </button>
                </div>

                {/* Tab content */}
                <div style={{ padding: "24px 20px" }}>
                  {modalTab === "camera" ? (
                    <div>
                      <div style={{
                        background: "var(--vm-bg)", borderRadius: 12, padding: "40px 20px", textAlign: "center", marginBottom: 16,
                        border: "1px solid var(--vm-border)",
                      }}>
                        <div style={{ width: 56, height: 56, background: "hsl(215, 20%, 88%)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "var(--vm-primary)" }}>
                          <CameraIcon />
                        </div>
                        <p style={{ fontSize: 13, color: "var(--vm-muted-fg)", margin: 0, lineHeight: 1.5 }}>
                          Clique no botão abaixo para iniciar a câmera e escanear o QR Code do documento
                        </p>
                      </div>
                      <button style={{
                        width: "100%", background: "var(--vm-primary)", color: "#fff", border: "none",
                        padding: "14px 0", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      }}>
                        <CameraIcon /> Iniciar Câmera
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "var(--vm-fg)", display: "block", marginBottom: 8 }}>
                        Código de Verificação
                      </label>
                      <input
                        style={{
                          width: "100%", padding: "12px 14px", borderRadius: 8, border: "1.5px solid var(--vm-border)",
                          fontSize: 15, outline: "none", fontFamily: "monospace", letterSpacing: 1.5,
                          textTransform: "uppercase", marginBottom: 6,
                        }}
                        value={codigoInput}
                        onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
                        placeholder="Ex: XXXX-XXXX-XXXX ou RX-XXXX-XXXX"
                        onKeyDown={(e) => e.key === "Enter" && validarReceita()}
                      />
                      <p style={{ fontSize: 12, color: "var(--vm-muted-fg)", margin: "0 0 16px" }}>
                        Digite o código que aparece no documento
                      </p>
                      {errorMsg && (
                        <div style={{
                          padding: "10px 14px", background: "hsl(0, 80%, 97%)", border: "1px solid hsl(0, 70%, 90%)",
                          borderRadius: 8, color: "hsl(0, 72%, 51%)", fontSize: 13, fontWeight: 600, marginBottom: 12,
                        }}>
                          {errorMsg}
                        </div>
                      )}
                      <button
                        onClick={() => validarReceita()}
                        disabled={isLoading}
                        style={{
                          width: "100%", background: "var(--vm-primary)", color: "#fff", border: "none",
                          padding: "14px 0", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                          opacity: isLoading ? 0.7 : 1,
                        }}
                      >
                        {isLoading ? "Verificando..." : "Verificar Documento"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // ─── PÁGINA DE VERIFICAÇÃO ────────────────────────────────────────────────
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight: "100vh", background: "var(--vm-bg)", fontFamily: FONT }}>

        {/* Header */}
        <header style={{ background: "linear-gradient(135deg, hsl(215, 90%, 18%), hsl(215, 90%, 28%))", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>Verificação de Receita</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Sistema de Validação Digital</div>
          </div>
        </header>

        {/* Conteúdo */}
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 40px" }} className="vm-animate">

          {/* Formulário de busca (sem receita) */}
          {!receita && !isLoading && (
            <div style={{ background: "var(--vm-card)", borderRadius: 12, padding: "28px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--vm-primary)", margin: "0 0 20px", textAlign: "center" }}>
                Verificar Receita Médica
              </h2>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--vm-fg)", display: "block", marginBottom: 6 }}>
                Código de Verificação
              </label>
              <input
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 8, border: "1.5px solid var(--vm-border)",
                  fontSize: 16, outline: "none", fontFamily: "monospace", letterSpacing: 2,
                  textTransform: "uppercase", marginBottom: 6,
                }}
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
                placeholder="Ex: XXXX-XXXX-XXXX ou RX-XXXX-XXXX"
                onKeyDown={(e) => e.key === "Enter" && validarReceita()}
              />
              <p style={{ fontSize: 12, color: "var(--vm-muted-fg)", margin: "0 0 14px" }}>
                Digite o código que aparece no documento
              </p>
              {errorMsg && (
                <div style={{
                  padding: "12px 16px", background: "hsl(0, 80%, 97%)", border: "1px solid hsl(0, 70%, 90%)",
                  borderRadius: 8, color: "hsl(0, 72%, 51%)", fontSize: 13, fontWeight: 600, marginBottom: 14,
                }}>
                  {errorMsg}
                </div>
              )}
              <button
                onClick={() => validarReceita()}
                style={{
                  width: "100%", background: "var(--vm-primary)", color: "#fff", border: "none",
                  padding: "14px 0", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                Verificar Documento
              </button>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ width: 40, height: 40, border: "4px solid var(--vm-border)", borderTopColor: "var(--vm-primary)", borderRadius: "50%", animation: "vm-spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              <div style={{ color: "var(--vm-muted-fg)", fontSize: 14 }}>Verificando documento...</div>
            </div>
          )}

          {/* Resultado */}
          {receita && (
            <>
              {/* Badge: RECEITA VÁLIDA */}
              <div style={{
                background: "hsl(152, 50%, 95%)", border: "1px solid hsl(152, 50%, 85%)",
                borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, marginBottom: 16,
              }}>
                <div style={{
                  width: 48, height: 48, background: "var(--vm-accent)", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0,
                }}>
                  <CheckCircle size={28} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: "hsl(152, 60%, 25%)", letterSpacing: 0.5 }}>RECEITA VÁLIDA</div>
                  <div style={{ fontSize: 14, color: "hsl(152, 40%, 35%)" }}>Esta receita foi verificada e está ativa.</div>
                </div>
              </div>

              {/* Card principal */}
              <div style={{
                background: "var(--vm-card)", borderRadius: 12, overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid var(--vm-border)", marginBottom: 16,
              }}>
                {/* Header verde */}
                <div style={{
                  background: "var(--vm-accent)", padding: "14px 20px",
                  display: "flex", alignItems: "center", gap: 12, color: "#fff",
                }}>
                  <PillIcon size={22} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>Receita Médica -</div>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>Código: <span style={{ fontFamily: "monospace" }}>{receita.codigo}</span></div>
                  </div>
                </div>

                {/* Paciente */}
                <section style={{ padding: "20px", background: "hsl(210, 20%, 97%)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: "var(--vm-primary)" }}>
                    <UserIcon /><span style={{ fontWeight: 700, fontSize: 16, color: "var(--vm-fg)" }}>Paciente</span>
                  </div>
                  <div className="vm-result-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div className="vm-field-box"><div className="vm-field-label">NOME</div><div className="vm-field-value">{receita.paciente_nome}</div></div>
                    {receita.paciente_cpf && <div className="vm-field-box"><div className="vm-field-label">CPF</div><div className="vm-field-value">{receita.paciente_cpf}</div></div>}
                    {receita.paciente_nascimento && <div className="vm-field-box"><div className="vm-field-label">NASCIMENTO</div><div className="vm-field-value">{formatDate(receita.paciente_nascimento)}</div></div>}
                  </div>
                </section>

                <hr style={{ border: "none", borderTop: "1px solid var(--vm-border)", margin: 0 }} />

                {/* Medicamentos */}
                <section style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: "var(--vm-accent)" }}>
                    <PillIcon /><span style={{ fontWeight: 700, fontSize: 16, color: "var(--vm-fg)" }}>Medicamentos Prescritos</span>
                  </div>
                  {(receita.medicamentos || []).map((med, idx) => (
                    <div key={idx} style={{
                      background: "hsl(152, 40%, 97%)", border: "1px solid hsl(152, 40%, 90%)",
                      borderRadius: 10, padding: "14px 16px", marginBottom: 10,
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--vm-fg)", marginBottom: 8 }}>
                        {med.nome} {med.quantidade ? `Quantidade: ${med.quantidade}` : ""}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 10, fontSize: 13 }}>
                        <div><span style={{ color: "var(--vm-muted-fg)" }}>Dosagem:</span> {med.quantidade || "—"}</div>
                        <div><span style={{ color: "var(--vm-muted-fg)" }}>Qtd:</span> 1</div>
                        <div><span style={{ color: "var(--vm-muted-fg)" }}>Posologia:</span> Uso: {med.posologia}</div>
                      </div>
                    </div>
                  ))}
                  {validadeStr && (
                    <div style={{ display: "inline-block", border: "2px solid var(--vm-primary)", borderRadius: 8, padding: "8px 16px", marginTop: 8 }}>
                      <div style={{ fontSize: 10, color: "var(--vm-primary)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>Válida até</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--vm-primary)" }}>{validadeStr}</div>
                    </div>
                  )}
                </section>

                <hr style={{ border: "none", borderTop: "1px solid var(--vm-border)", margin: 0 }} />

                {/* Médico */}
                <section style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: "var(--vm-primary)" }}>
                    <StethoscopeIcon /><span style={{ fontWeight: 700, fontSize: 16, color: "var(--vm-fg)" }}>Médico Responsável</span>
                  </div>
                  <div className="vm-result-grid-med" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div className="vm-field-box"><div className="vm-field-label">NOME</div><div className="vm-field-value">{receita.medico_nome}</div></div>
                    <div className="vm-field-box"><div className="vm-field-label">CRM</div><div className="vm-field-value">{receita.medico_crm}{receita.medico_uf ? `/${receita.medico_uf}` : ""}</div></div>
                    {receita.medico_especialidade && <div className="vm-field-box"><div className="vm-field-label">ESPECIALIDADE</div><div className="vm-field-value">{receita.medico_especialidade}</div></div>}
                  </div>
                </section>

                {/* Data de emissão */}
                <div style={{ padding: "12px 20px", borderTop: "1px solid var(--vm-border)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "var(--vm-muted-fg)" }}><ClockIcon /></span>
                  <span style={{ fontSize: 13, color: "var(--vm-muted-fg)" }}>Emitida em {formatDateLong(receita.data_emissao)}</span>
                </div>
              </div>

              {/* Documento Credenciado */}
              <div style={{
                background: "var(--vm-card)", border: "1px solid var(--vm-border)", borderRadius: 12,
                padding: "18px 20px", marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, background: "var(--vm-accent)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "var(--vm-fg)" }}>Documento Credenciado</div>
                    <div style={{ fontSize: 12, color: "var(--vm-muted-fg)" }}>Verificado pelo Sistema VerificaMed</div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "var(--vm-muted-fg)", margin: 0, lineHeight: 1.6 }}>
                  Esta receita foi verificada eletronicamente e é reconhecida pelo{" "}
                  <strong style={{ color: "var(--vm-fg)" }}>Sistema Nacional de Verificação de Documentos Médicos</strong>.
                </p>
              </div>

              {/* Voltar */}
              <div style={{ textAlign: "center" }}>
                <a href="/" style={{
                  background: "var(--vm-card)", border: "1.5px dashed var(--vm-border)", color: "var(--vm-fg)",
                  padding: "11px 28px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none",
                }}>
                  <HomeIcon /> Voltar ao Início
                </a>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid var(--vm-border)", padding: "16px 20px", textAlign: "center", fontSize: 12, color: "var(--vm-muted-fg)", background: "var(--vm-card)" }}>
          &copy; {new Date().getFullYear()} VerificaMed - Sistema de Verificação de Documentos Médicos
        </footer>
      </div>
    </>
  );
}
