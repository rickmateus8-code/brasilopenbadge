/**
 * ValidationReceita.tsx
 * Réplica visual 100% fiel do verificamed.online para verificamed.digital
 * Inclui homepage + página de verificação de receita
 *
 * Fluxo: verificamed.digital/verificar/receita/RX-XXXX-XXXX
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

// ─── Ícones SVG (Lucide) ─────────────────────────────────────────────────────
const ShieldCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);
const CheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
  </svg>
);
const ClipboardPen = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5.5"/><path d="M4 13.5V6a2 2 0 0 1 2-2h2"/><path d="m14 19.5-4.5 1 1-4.5L16 10.5l3.5 3.5Z"/>
  </svg>
);
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const PillIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>
  </svg>
);
const StethoscopeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
);
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
);

// ─── CSS Variables (replicando verificamed.online) ───────────────────────────
const CSS_VARS = `
  :root {
    --vm-bg: hsl(210, 25%, 97%);
    --vm-fg: hsl(215, 25%, 12%);
    --vm-card: #ffffff;
    --vm-card-fg: hsl(215, 25%, 12%);
    --vm-primary: hsl(215, 90%, 32%);
    --vm-primary-fg: #ffffff;
    --vm-secondary: hsl(210, 20%, 94%);
    --vm-muted: hsl(210, 15%, 91%);
    --vm-muted-fg: hsl(215, 15%, 42%);
    --vm-accent: hsl(152, 60%, 38%);
    --vm-accent-fg: #ffffff;
    --vm-border: hsl(210, 20%, 88%);
    --vm-input: hsl(210, 20%, 88%);
  }
`;

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ValidationReceita() {
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [receita, setReceita] = useState<ReceitaValidada | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [codigoInput, setCodigoInput] = useState("");
  const [showHome, setShowHome] = useState(true);

  // ── Validar receita ────────────────────────────────────────────────────────
  const validarReceita = useCallback(async (codeOverride?: string) => {
    const code = (codeOverride || codigoInput).trim().toUpperCase();
    if (!code) { setErrorMsg("Informe o código da receita."); return; }
    setIsLoading(true); setErrorMsg(null); setReceita(null); setShowHome(false);
    try {
      const res = await fetch(`/api/validate/${encodeURIComponent(code)}`);
      const json = await res.json();
      if (json.valid && json.data) {
        const d = json.data;
        // Mapear prescrição (API retorna 'prescricao' como array de objetos)
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
        // Extrair CRM e UF (API retorna crm como "123456/SP" ou separado)
        let crmNum = d.medico_crm || d.crm || "";
        let crmUf = d.medico_uf || d.uf || "";
        if (crmNum.includes("/") && !crmUf) {
          const parts = crmNum.split("/");
          crmNum = parts[0];
          crmUf = parts[1] || "";
        }
        setReceita({
          codigo: code,
          tipo_receituario: d.tipo_receituario || d.tipoReceituario || "controle_especial",
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
        setErrorMsg(json.message || "Receita não encontrada na base de dados oficial.");
      }
    } catch { setErrorMsg("Erro ao conectar com o servidor. Tente novamente."); }
    finally { setIsLoading(false); }
  }, [codigoInput]);

  // ── Auto-validar se vier código na URL ────────────────────────────────────
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromQuery = urlParams.get("codigo") || urlParams.get("code") || "";
    const codeFromPath = params.id ? (params.id as string) : "";
    const code = (codeFromQuery || codeFromPath).trim().toUpperCase();
    if (code) {
      setCodigoInput(code); setShowHome(false);
      setTimeout(() => validarReceita(code), 100);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tipoLabel = (tipo: string) => {
    if (tipo === "controle_especial") return "Receituário Controle Especial";
    if (tipo === "antimicrobiano") return "Receituário Antimicrobiano";
    return "Receita Médica";
  };

  const validadeStr = receita?.validade ? formatDate(receita.validade) : receita?.data_emissao ? addDays(receita.data_emissao, 30) : "";

  // ── Homepage ──────────────────────────────────────────────────────────────
  if (showHome && !receita && !isLoading) {
    return (
      <>
        <style>{CSS_VARS}{`
          .vm-hero { background: linear-gradient(135deg, hsl(215, 90%, 20%) 0%, hsl(215, 90%, 32%) 50%, hsl(215, 70%, 40%) 100%); }
          .vm-stat-card { transition: transform 0.2s, box-shadow 0.2s; }
          .vm-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.12); }
          .vm-feature-card { transition: transform 0.2s; }
          .vm-feature-card:hover { transform: translateY(-3px); }
          @keyframes vm-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        `}</style>
        <div style={{ minHeight: "100vh", background: "var(--vm-bg)", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "var(--vm-fg)" }}>

          {/* Top bar */}
          <div style={{ background: "hsl(215, 90%, 22%)", padding: "6px 0", fontSize: 12, color: "rgba(255,255,255,0.8)", textAlign: "center", letterSpacing: 0.3 }}>
            Sistema oficial de verificação de documentos médicos &bull; Brasil
          </div>

          {/* Header */}
          <header style={{ background: "var(--vm-primary)", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#fff", fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>VerificaMed</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, borderLeft: "1px solid rgba(255,255,255,0.3)", paddingLeft: 10 }}>Sistema Nacional de Verificação</span>
              </div>
              <nav style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <a href="#" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: 14 }}>Início</a>
                <a href="#sobre" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 14 }}>Sobre</a>
                <a href="#instituicoes" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 14 }}>Instituições</a>
                <button onClick={() => setShowHome(false)} style={{
                  background: "transparent", border: "1.5px solid rgba(255,255,255,0.5)", color: "#fff",
                  padding: "7px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>Verificar Documento</button>
              </nav>
            </div>
          </header>

          {/* Hero */}
          <section className="vm-hero" style={{ padding: "80px 20px 100px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ maxWidth: 700, margin: "0 auto", position: "relative", zIndex: 1 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, padding: "6px 16px", marginBottom: 24, fontSize: 13, color: "rgba(255,255,255,0.9)",
              }}>
                <SparklesIcon /> Sistema Oficial de Verificação
              </div>
              <h1 style={{ fontSize: 42, fontWeight: 800, color: "#fff", lineHeight: 1.15, marginBottom: 18, letterSpacing: -0.5 }}>
                Verificação de Documentos<br />Médicos em Tempo Real
              </h1>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, maxWidth: 560, margin: "0 auto 32px" }}>
                Sistema utilizado por hospitais, UPAs, prontos-socorros e clínicas em todo o Brasil para validar atestados e receitas médicas com total segurança.
              </p>
              <button onClick={() => setShowHome(false)} style={{
                background: "#fff", color: "var(--vm-primary)", border: "none",
                padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              }}>
                <SparklesIcon /> Verificar Documento <span style={{ marginLeft: 4 }}>&rarr;</span>
              </button>
            </div>
          </section>

          {/* Stats wave */}
          <div style={{ background: "var(--vm-bg)", marginTop: -40, paddingTop: 60, paddingBottom: 40 }}>
            <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {[
                { icon: "📋", num: "2.500+", label: "Unidades de Saúde" },
                { icon: "📄", num: "15M+", label: "Documentos Verificados" },
                { icon: "📍", num: "27", label: "Estados Atendidos" },
                { icon: "👨‍⚕️", num: "50k+", label: "Profissionais" },
              ].map((s, i) => (
                <div key={i} className="vm-stat-card" style={{
                  background: "#fff", borderRadius: 12, padding: "24px 16px", textAlign: "center",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid var(--vm-border)",
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--vm-primary)", marginBottom: 4 }}>{s.num}</div>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { title: "Atestados Médicos", desc: "Verificação de atestados de afastamento, comparecimento e aptidão." },
                { title: "Receitas Médicas", desc: "Validação de receitas simples, especiais e de controle especial." },
              ].map((d, i) => (
                <div key={i} className="vm-feature-card" style={{
                  background: "#fff", borderRadius: 12, padding: "24px", border: "1px solid var(--vm-border)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: "var(--vm-fg)" }}>{d.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--vm-muted-fg)", margin: 0, lineHeight: 1.6 }}>{d.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Por que usar */}
          <section id="sobre" style={{ padding: "40px 20px 50px", background: "#fff" }}>
            <div style={{ maxWidth: 1000, margin: "0 auto" }}>
              <div style={{ display: "inline-block", background: "hsl(152, 60%, 95%)", color: "var(--vm-accent)", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, marginBottom: 12 }}>Cobertura Nacional</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: "var(--vm-fg)" }}>Por que usar o VerificaMed?</h2>
              <p style={{ color: "var(--vm-muted-fg)", marginBottom: 32, fontSize: 15 }}>
                Tecnologia de ponta para garantir a autenticidade dos documentos médicos em todo o território brasileiro.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {[
                  { title: "QR Code Único", desc: "Cada documento recebe um código exclusivo criptografado para verificação instantânea." },
                  { title: "Validação em Segundos", desc: "Confirme a autenticidade de atestados e receitas em menos de 5 segundos." },
                  { title: "Segurança Total", desc: "Sistema certificado com criptografia de ponta a ponta contra fraudes." },
                  { title: "LGPD Compliant", desc: "Dados protegidos seguindo todas as normas da Lei Geral de Proteção de Dados." },
                ].map((f, i) => (
                  <div key={i} className="vm-feature-card" style={{
                    background: "var(--vm-bg)", borderRadius: 12, padding: "20px", border: "1px solid var(--vm-border)",
                  }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: "var(--vm-fg)" }}>{f.title}</h3>
                    <p style={{ fontSize: 13, color: "var(--vm-muted-fg)", margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Final */}
          <section style={{ padding: "50px 20px 60px", textAlign: "center" }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12, color: "var(--vm-fg)" }}>Verifique agora a autenticidade</h2>
            <p style={{ color: "var(--vm-muted-fg)", marginBottom: 24, fontSize: 15, maxWidth: 560, margin: "0 auto 24px" }}>
              Basta escanear o QR Code do documento ou digitar o código de verificação para confirmar sua autenticidade instantaneamente.
            </p>
            <button onClick={() => setShowHome(false)} style={{
              background: "var(--vm-primary)", color: "#fff", border: "none",
              padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              <SparklesIcon /> Verificar Documento <span>&rarr;</span>
            </button>
          </section>

          {/* Footer */}
          <footer style={{ borderTop: "1px solid var(--vm-border)", padding: "16px 20px", textAlign: "center", fontSize: 13, color: "var(--vm-muted-fg)", background: "#fff" }}>
            &copy; {new Date().getFullYear()} VerificaMed &mdash; Sistema de Verificação de Documentos Médicos
          </footer>
        </div>
      </>
    );
  }

  // ── Página de Verificação ─────────────────────────────────────────────────
  return (
    <>
      <style>{CSS_VARS}{`
        @keyframes vm-spin { to { transform: rotate(360deg); } }
        .vm-field-box { border: 1px solid var(--vm-border); border-radius: 8px; padding: 10px 14px; min-height: 56px; }
        .vm-field-label { font-size: 11px; color: var(--vm-muted-fg); font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px; text-transform: uppercase; }
        .vm-field-value { font-size: 14px; font-weight: 700; color: var(--vm-fg); word-break: break-word; }
      `}</style>
      <div style={{ minHeight: "100vh", background: "var(--vm-bg)", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

        {/* Header */}
        <header style={{ background: "linear-gradient(135deg, hsl(215, 90%, 20%), hsl(215, 90%, 32%))", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <ShieldCheck />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>Verificação de Receita</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Sistema de Validação Digital</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button onClick={() => { setShowHome(true); setReceita(null); setCodigoInput(""); setErrorMsg(null); }} style={{
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff",
              padding: "6px 14px", borderRadius: 7, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
              <HomeIcon /> Voltar ao Início
            </button>
          </div>
        </header>

        {/* Conteúdo */}
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 40px" }}>

          {/* Formulário de busca (sem receita) */}
          {!receita && (
            <div style={{ background: "var(--vm-card)", borderRadius: 12, padding: "28px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--vm-primary)", margin: "0 0 20px", textAlign: "center" }}>
                Verificar Receita Médica
              </h2>

              {isLoading ? (
                <div style={{ textAlign: "center", padding: "30px 0" }}>
                  <div style={{ width: 40, height: 40, border: "4px solid var(--vm-border)", borderTopColor: "var(--vm-primary)", borderRadius: "50%", animation: "vm-spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                  <div style={{ color: "var(--vm-muted-fg)", fontSize: 14 }}>Verificando receita...</div>
                </div>
              ) : (
                <>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--vm-fg)", display: "block", marginBottom: 6 }}>
                    Código da Receita
                  </label>
                  <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                    <input
                      style={{
                        flex: 1, padding: "12px 14px", borderRadius: 8, border: "1.5px solid var(--vm-input)",
                        fontSize: 16, outline: "none", fontFamily: "monospace", letterSpacing: 2,
                        textTransform: "uppercase", boxSizing: "border-box",
                      }}
                      value={codigoInput}
                      onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
                      placeholder="RX-XXXX-XXXX"
                      onKeyDown={(e) => e.key === "Enter" && validarReceita()}
                    />
                    <button
                      style={{
                        background: "var(--vm-primary)", color: "#fff", border: "none",
                        padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                      }}
                      onClick={() => validarReceita()}
                    >
                      <SearchIcon /> VERIFICAR
                    </button>
                  </div>

                  {errorMsg && (
                    <div style={{
                      padding: "12px 16px", background: "hsl(0, 80%, 97%)", border: "1px solid hsl(0, 70%, 90%)",
                      borderRadius: 8, color: "hsl(0, 72%, 51%)", fontSize: 13, fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                      {errorMsg}
                    </div>
                  )}
                </>
              )}
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
                  width: 42, height: 42, background: "var(--vm-accent)", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0,
                }}>
                  <CheckCircle />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: "hsl(152, 60%, 25%)", letterSpacing: 0.5 }}>RECEITA VÁLIDA</div>
                  <div style={{ fontSize: 13, color: "hsl(152, 40%, 35%)" }}>Esta receita foi verificada e está ativa.</div>
                </div>
              </div>

              {/* Tipo de receituário */}
              <div style={{
                background: "var(--vm-accent)", borderRadius: 12, padding: "14px 20px", marginBottom: 16,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ color: "#fff" }}><ClipboardPen /></div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{tipoLabel(receita.tipo_receituario)} —</div>
                  <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>Código: {receita.codigo}</div>
                </div>
              </div>

              {/* Paciente */}
              <div style={{ background: "var(--vm-card)", borderRadius: 12, padding: "18px 20px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: "var(--vm-fg)" }}>
                  <UserIcon /><span style={{ fontWeight: 700, fontSize: 16 }}>Paciente</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div className="vm-field-box"><div className="vm-field-label">NOME</div><div className="vm-field-value">{receita.paciente_nome}</div></div>
                  {receita.paciente_cpf && <div className="vm-field-box"><div className="vm-field-label">CPF</div><div className="vm-field-value">{receita.paciente_cpf}</div></div>}
                  {receita.paciente_nascimento && <div className="vm-field-box"><div className="vm-field-label">NASCIMENTO</div><div className="vm-field-value">{formatDate(receita.paciente_nascimento)}</div></div>}
                </div>
                {(receita.paciente_endereco || receita.paciente_cidade) && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                    {receita.paciente_endereco && <div className="vm-field-box"><div className="vm-field-label">ENDEREÇO</div><div className="vm-field-value">{receita.paciente_endereco}</div></div>}
                    {receita.paciente_cidade && <div className="vm-field-box"><div className="vm-field-label">CIDADE</div><div className="vm-field-value">{receita.paciente_cidade}</div></div>}
                  </div>
                )}
              </div>

              {/* Medicamentos */}
              <div style={{ background: "var(--vm-card)", borderRadius: 12, padding: "18px 20px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: "var(--vm-fg)" }}>
                  <PillIcon /><span style={{ fontWeight: 700, fontSize: 16 }}>Medicamentos Prescritos</span>
                </div>
                {(receita.medicamentos || []).map((med, idx) => (
                  <div key={idx} style={{ border: "1px solid var(--vm-border)", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--vm-fg)", marginBottom: 8 }}>
                      {med.nome} {med.quantidade ? `Quantidade: ${med.quantidade}` : ""}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 10 }}>
                      <div><span style={{ color: "var(--vm-muted-fg)", fontSize: 11, display: "block" }}>Dosagem</span><span style={{ fontSize: 13, color: "var(--vm-fg)" }}>{med.quantidade || "—"}</span></div>
                      <div><span style={{ color: "var(--vm-muted-fg)", fontSize: 11, display: "block" }}>Qtd</span><span style={{ fontSize: 13, color: "var(--vm-fg)" }}>1</span></div>
                      <div><span style={{ color: "var(--vm-muted-fg)", fontSize: 11, display: "block" }}>Posologia</span><span style={{ fontSize: 13, color: "var(--vm-fg)" }}>Uso: {med.posologia}</span></div>
                    </div>
                  </div>
                ))}
                {validadeStr && (
                  <div style={{ display: "inline-block", border: "2px solid var(--vm-primary)", borderRadius: 8, padding: "8px 16px", marginTop: 8 }}>
                    <div style={{ fontSize: 10, color: "var(--vm-muted-fg)", fontWeight: 700, letterSpacing: 0.5 }}>VÁLIDA ATÉ</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--vm-primary)" }}>{validadeStr}</div>
                  </div>
                )}
              </div>

              {/* Médico */}
              <div style={{ background: "var(--vm-card)", borderRadius: 12, padding: "18px 20px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: "var(--vm-fg)" }}>
                  <StethoscopeIcon /><span style={{ fontWeight: 700, fontSize: 16 }}>Médico Responsável</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div className="vm-field-box"><div className="vm-field-label">NOME</div><div className="vm-field-value">{receita.medico_nome}</div></div>
                  <div className="vm-field-box"><div className="vm-field-label">CRM</div><div className="vm-field-value">{receita.medico_crm}/{receita.medico_uf}</div></div>
                  {receita.medico_especialidade && <div className="vm-field-box"><div className="vm-field-label">ESPECIALIDADE</div><div className="vm-field-value">{receita.medico_especialidade}</div></div>}
                </div>
              </div>

              {/* Data de emissão */}
              <div style={{
                background: "var(--vm-card)", borderRadius: 12, padding: "14px 20px", marginBottom: 16,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ color: "var(--vm-muted-fg)" }}><ClockIcon /></span>
                <span style={{ fontSize: 13, color: "var(--vm-muted-fg)" }}>Emitida em {formatDateLong(receita.data_emissao)}</span>
              </div>

              {/* Documento Credenciado */}
              <div style={{
                background: "var(--vm-card)", border: "1px solid var(--vm-border)", borderRadius: 12,
                padding: "18px 20px", marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, background: "var(--vm-accent)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                    <ShieldCheck />
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
                <button onClick={() => { setReceita(null); setCodigoInput(""); setErrorMsg(null); setShowHome(true); }}
                  style={{
                    background: "var(--vm-card)", border: "1.5px solid var(--vm-border)", color: "var(--vm-fg)",
                    padding: "11px 28px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 8,
                  }}>
                  <HomeIcon /> Voltar ao Início
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid var(--vm-border)", padding: "16px 20px", textAlign: "center", fontSize: 13, color: "var(--vm-muted-fg)", background: "var(--vm-card)" }}>
          &copy; {new Date().getFullYear()} VerificaMed &mdash; Sistema de Verificação de Documentos Médicos
        </footer>
      </div>
    </>
  );
}
