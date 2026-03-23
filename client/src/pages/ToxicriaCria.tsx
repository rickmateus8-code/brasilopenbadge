/**
 * ToxicriaCria — Emissão de Laudo Toxicológico Sodré
 *
 * Layout baseado no LAUDO_GLADEMIR_PARAY.pdf
 * Domínio de validação: valida-laudo-sodretox.online
 * Fluxo: Preencher dados → Emitir → QR Code gerado → Salvar em /toxicriasalvos
 */
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import DashboardLayout from "@/components/DashboardLayout";
import EmissionModal from "@/components/EmissionModal";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { FlaskConical, Save, Download, ArrowLeft } from "lucide-react";

// ─── Substâncias pesquisadas ──────────────────────────────────────────────────
const SUBSTANCIAS = [
  { grupo: "ANFETAMINAS", itens: [
    { nome: "ANFEPRAMONA", triagem: "0,2ng/mg", confirmacao: "0,2ng/mg" },
    { nome: "ANFETAMINA", triagem: "0,2ng/mg", confirmacao: "0,2ng/mg" },
    { nome: "FEMPROPOREX", triagem: "0,2ng/mg", confirmacao: "0,2ng/mg" },
    { nome: "MAZINDOL", triagem: "0,5ng/mg", confirmacao: "0,5ng/mg" },
  ]},
  { grupo: "CANABINOIDES", itens: [
    { nome: "CARBOXY THC (THC-COOH)", triagem: "0,0002 ng/mg", confirmacao: "0,0002 ng/mg" },
    { nome: "THC", triagem: "0,05ng/mg", confirmacao: "0,05ng/mg" },
  ]},
  { grupo: "COCAINICOS", itens: [
    { nome: "BENZOILECGONINA", triagem: "0,05ng/mg", confirmacao: "0,05ng/mg" },
    { nome: "COCAETILENO", triagem: "0,05ng/mg", confirmacao: "0,05ng/mg" },
    { nome: "COCAÍNA", triagem: "0,5ng/mg", confirmacao: "0,5ng/mg" },
    { nome: "NORCOCAINA", triagem: "0,05ng/mg", confirmacao: "0,05ng/mg" },
  ]},
  { grupo: "METANFETAMINAS", itens: [
    { nome: "MDA", triagem: "0,2ng/mg", confirmacao: "0,2ng/mg" },
    { nome: "MDMA", triagem: "0,2ng/mg", confirmacao: "0,2ng/mg" },
    { nome: "METANFETAMINA", triagem: "0,2ng/mg", confirmacao: "0,2ng/mg" },
  ]},
  { grupo: "OPIOIDES E OPIACEOS", itens: [
    { nome: "6-ACETIL MORFINA (HEROINA)", triagem: "0,2ng/mg", confirmacao: "0,2ng/mg" },
    { nome: "CODEINA", triagem: "0,2ng/mg", confirmacao: "0,2ng/mg" },
    { nome: "MORFINA", triagem: "0,2ng/mg", confirmacao: "0,2ng/mg" },
  ]},
];

function todayBR() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}
function maskCPF(v: string) {
  const d = v.replace(/\D/g,"").slice(0,11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}
function handleDateInput(v: string) {
  const d = v.replace(/\D/g,"").slice(0,8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0,2)}/${d.slice(2)}`;
  return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`;
}
function addDays(dateStr: string, days: number): string {
  if (!dateStr || dateStr.length < 10) return "";
  const [dd, mm, yyyy] = dateStr.split("/");
  const d = new Date(Number(yyyy), Number(mm)-1, Number(dd));
  d.setDate(d.getDate() + days);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}
function addYears(dateStr: string, years: number): string {
  if (!dateStr || dateStr.length < 10) return "";
  const [dd, mm, yyyy] = dateStr.split("/");
  return `${dd}/${mm}/${Number(yyyy)+years}`;
}

interface ToxicriaForm {
  nome: string;
  cpf: string;
  labColetor: string;
  comprimento: string;
  dataColeta: string;
  dataRecebimento: string;
  dataLiberacao: string;
  validadeExame: string;
  os: string;
  // Campos adicionais
  numeroLaudo: string;
  tituloExame: string;
  realizadoPor: string;
  material: string;
  jDeteccao: string;
  metodo: string;
  procedimento: string;
  valorReferencia: string;
}

const EMPTY: ToxicriaForm = {
  nome: "",
  cpf: "",
  labColetor: "",
  comprimento: "3,00",
  dataColeta: todayBR(),
  dataRecebimento: todayBR(),
  dataLiberacao: "",
  validadeExame: "",
  os: "",
  // Campos adicionais com defaults
  numeroLaudo: "",
  tituloExame: "EXAME TOXICOLÓGICO DE LONGA JANELA DE DETECÇÃO",
  realizadoPor: "LABORATÓRIO SODRÉ",
  material: "CABELO",
  jDeteccao: "90 DIAS",
  metodo: "LC-MS/MS",
  procedimento: "IMUNOENSAIO / CROMATOGRAFIA LÍQUIDA ACOPLADA À ESPECTROMETRIA DE MASSAS",
  valorReferencia: "NEGATIVO",
};

// ─── Componente de Preview do Laudo ──────────────────────────────────────────
function LaudoPreview({ form, codigoLaudo, validationUrl }: {
  form: ToxicriaForm;
  codigoLaudo: string | null;
  validationUrl: string | null;
}) {
  return (
    <div style={{
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: 11,
      color: "#000",
      background: "#fff",
      width: "100%",
      maxWidth: 794,
      margin: "0 auto",
      padding: "20px 24px",
      boxSizing: "border-box",
    }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "2px solid #000", paddingBottom: 10, marginBottom: 10 }}>
        {/* Logo SODRÉ */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            background: "linear-gradient(135deg, #1a3a6b 0%, #2563eb 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 16, letterSpacing: -1 }}>S</span>
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: "#1a3a6b", letterSpacing: 1 }}>SODRÉ</div>
            <div style={{ fontSize: 9, color: "#555", fontWeight: 600 }}>LABORATÓRIO</div>
          </div>
          <div style={{ marginLeft: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 11 }}>SODRE SL DIAGNOSTICOS E PESQUISAS LABORATORIAIS LTDA</div>
            <div style={{ fontSize: 10, color: "#333" }}>05.934.885/0016-04</div>
            <div style={{ fontSize: 10, color: "#333", marginTop: 3 }}>CNES: 9778608</div>
          </div>
        </div>
        {/* Logo CAP ACCREDITED */}
        <div style={{
          border: "2px solid #1a3a6b", borderRadius: 6, padding: "4px 8px",
          textAlign: "center", fontSize: 9, color: "#1a3a6b", fontWeight: 700,
          minWidth: 80,
        }}>
          <div style={{ fontSize: 14, fontWeight: 900 }}>CAP</div>
          <div style={{ fontSize: 7 }}>ACCREDITED</div>
          <div style={{ fontSize: 7, fontWeight: 400 }}>COLLEGE of AMERICAN PATHOLOGISTS</div>
        </div>
      </div>

      {/* ── Dados do Paciente + Laudo ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        {/* Coluna esquerda - Dados do Paciente */}
        <div style={{ flex: 1, border: "1px solid #ccc", borderRadius: 4, padding: "8px 10px" }}>
          <div style={{ marginBottom: 5 }}>
            <span style={{ fontWeight: 700 }}>Nome: </span>
            <span>{form.nome || "—"}</span>
          </div>
          <div style={{ marginBottom: 5 }}>
            <span style={{ fontWeight: 700 }}>CPF: </span>
            <span>{form.cpf || "—"}</span>
          </div>
          <div style={{ marginBottom: 5, fontSize: 10 }}>
            <span style={{ fontWeight: 700 }}>Lab. Coletor: </span>
            <span>{form.labColetor || "—"}</span>
          </div>
          <div style={{ marginBottom: 5 }}>
            <span style={{ fontWeight: 700 }}>Material: </span>
            <span>QUERATINA ({form.material || "CABELO"})</span>
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 5 }}>
            <div>
              <span style={{ fontWeight: 700 }}>Comprimento: </span>
              <span>{form.comprimento || "3,00"} CM</span>
            </div>
            <div>
              <span style={{ fontWeight: 700 }}>J.Detecção: </span>
              <span>APROX. {form.jDeteccao || "90 DIAS"}</span>
            </div>
          </div>
          <div>
            <span style={{ fontWeight: 700 }}>Data da Coleta: </span>
            <span>{form.dataColeta || "—"}</span>
          </div>
        </div>

        {/* Coluna direita - Dados do Laudo + QR */}
        <div style={{ width: 280, border: "1px solid #ccc", borderRadius: 4, padding: "8px 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontWeight: 700 }}>Laudo: </span>
                <span style={{ fontWeight: 700 }}>{form.numeroLaudo || codigoLaudo || "—"}</span>
                {form.os && <span style={{ marginLeft: 6 }}>O.S {form.os}</span>}
              </div>
              <div style={{ marginBottom: 3, fontSize: 10 }}>
                <span style={{ fontWeight: 700 }}>Exame realizado por: </span>{form.realizadoPor || "LAB.SODRÉ"}
              </div>
              <div style={{ marginBottom: 3, fontSize: 10 }}>
                <span style={{ fontWeight: 700 }}>Data recebimento da amostra: </span>
                {form.dataRecebimento || "—"}
              </div>
              <div style={{ marginBottom: 3, fontSize: 10 }}>
                <span style={{ fontWeight: 700 }}>Data de liberação: </span>
                {form.dataLiberacao || "—"}
              </div>
              <div style={{ marginBottom: 3, fontSize: 10 }}>
                <span style={{ fontWeight: 700 }}>Validade do exame: </span>
                {form.validadeExame || "—"}
              </div>
              <div style={{ marginBottom: 3, fontSize: 10 }}>
                <span style={{ fontWeight: 700 }}>Realizado pelo laboratório em: </span>{form.realizadoPor || "SODRÉ"}
              </div>
              <div style={{ marginTop: 6, fontSize: 10 }}>
                <span style={{ fontWeight: 700 }}>Informações de segurança: </span>
                <div style={{ background: "#000", height: 20, width: 100, marginTop: 2, display: "inline-block", verticalAlign: "middle" }}>
                  {/* Barcode placeholder */}
                  <div style={{ display: "flex", height: "100%", gap: 1, padding: "0 2px" }}>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} style={{ flex: i % 3 === 0 ? 2 : 1, background: i % 2 === 0 ? "#000" : "#fff", height: "100%" }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* QR Code */}
            <div style={{ marginLeft: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ border: "2px solid #333", padding: 3, borderRadius: 3, background: "#fff" }}>
                {validationUrl ? (
                  <QRCodeSVG value={validationUrl} size={60} />
                ) : (
                  <div style={{ width: 60, height: 60, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#999", textAlign: "center" }}>
                    QR após emissão
                  </div>
                )}
              </div>
              <div style={{ fontSize: 8, marginTop: 3, textAlign: "center", color: "#555", fontWeight: 700 }}>VALIDAÇÃO</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Título do Exame ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #ccc", borderRadius: 4, padding: "8px 12px", marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 0.5 }}>
          {form.tituloExame || "EXAME TOXICOLÓGICO DE LONGA JANELA DE DETECÇÃO"}
        </div>
        <div style={{ textAlign: "right", fontSize: 10 }}>
          <div><span style={{ fontWeight: 700 }}>Procedimento: </span>{form.procedimento || "IT.TOX.008/POP.TOX.022/POP.TOX.032/POP.TOX.033"}</div>
          <div style={{ marginTop: 3 }}>
            <span style={{ fontWeight: 700 }}>Método: </span>{form.metodo || "CLAE-EM/EM"}
            <span style={{ marginLeft: 16, fontWeight: 700 }}>Valor de referência: </span>{form.valorReferencia || "CUT OFF"}
          </div>
        </div>
      </div>

      {/* ── Tabela de Resultados ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, fontSize: 10 }}>
        <thead>
          <tr style={{ background: "#e8e8e8" }}>
            <th style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "left", fontWeight: 700, width: "50%" }}>SUBSTÂNCIAS (METABÓLITO)</th>
            <th style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center", fontWeight: 700, width: "20%" }}>RESULTADO</th>
            <th style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center", fontWeight: 700, width: "15%" }}>TRIAGEM</th>
            <th style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center", fontWeight: 700, width: "15%" }}>CONFIRMAÇÃO</th>
          </tr>
        </thead>
        <tbody>
          {SUBSTANCIAS.map(grupo => (
            <>
              <tr key={grupo.grupo} style={{ background: "#f5f5f5" }}>
                <td colSpan={4} style={{ border: "1px solid #ccc", padding: "4px 8px", fontWeight: 700, fontSize: 10 }}>
                  {grupo.grupo}
                </td>
              </tr>
              {grupo.itens.map(item => (
                <tr key={item.nome}>
                  <td style={{ border: "1px solid #ccc", padding: "3px 8px" }}>{item.nome}</td>
                  <td style={{ border: "1px solid #ccc", padding: "3px 8px", textAlign: "center", fontWeight: 700, color: "#16a34a" }}>NEGATIVO</td>
                  <td style={{ border: "1px solid #ccc", padding: "3px 8px", textAlign: "center" }}>{item.triagem}</td>
                  <td style={{ border: "1px solid #ccc", padding: "3px 8px", textAlign: "center" }}>{item.confirmacao}</td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>

      {/* ── Texto Legal ── */}
      <div style={{ fontSize: 9, color: "#333", lineHeight: 1.5, marginBottom: 12 }}>
        <p style={{ margin: "0 0 4px" }}>Este relatório de ensaio é válido exclusivamente para as amostras analisadas e só pode ser reproduzido na íntegra. Reprodução parcial requer aprovação por escrito do laboratório.</p>
        <p style={{ margin: "0 0 4px" }}>Um resultado negativo significa que a droga não foi detectada em quantidades que atinjam o valor de <em>cut off</em>.</p>
        <p style={{ margin: "0 0 4px" }}>Um resultado positivo significa que a droga foi identificada em quantidades que igualam ou excedam o valor de <em>cut off</em>.</p>
        <p style={{ margin: "0 0 4px" }}>Exame repetido e confirmado através de duas extrações.</p>
        <p style={{ margin: 0 }}>Exame realizado pelo Laboratório Sodré</p>
      </div>

      {/* ── Validação QR ── */}
      {validationUrl && (
        <div style={{ fontSize: 9, color: "#333", marginBottom: 16 }}>
          <p style={{ margin: 0 }}>
            Para garantir a autenticidade do laudo por meio do código QR, verifique se o link aberto pertence ao Laboratório Sodré. Nossos links seguem o seguinte padrão:
          </p>
          <p style={{ margin: "2px 0 0", fontFamily: "monospace", fontSize: 9 }}>{validationUrl}</p>
        </div>
      )}

      {/* ── Assinatura ── */}
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <div style={{ fontStyle: "italic", fontSize: 14, marginBottom: 4, fontFamily: "Georgia, serif", color: "#333" }}>
          Amadeu Cardoso Jr.
        </div>
        <div style={{ borderTop: "1px solid #333", width: 200, margin: "0 auto 6px" }} />
        <div style={{ fontSize: 10, fontWeight: 700 }}>DR. AMADEU CARDOSO JUNIOR - TOXICOLOGISTA - CRF-RJ 21698</div>
        <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>F9F5CEBDBAA0B0714AFA7AB21D10BE0F</div>
        <div style={{ fontSize: 9, color: "#555" }}>Laboratório – Divisão Toxicológica – REG.CRBM No. 2019-5802-08</div>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function ToxicriaCria() {
  const { user, updateBalance } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [, navigate] = useLocation();
  const previewRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<ToxicriaForm>({ ...EMPTY });
  const [codigoLaudo, setCodigoLaudo] = useState<string | null>(null);
  const [validationUrl, setValidationUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Auto-calcular datas
  useEffect(() => {
    if (form.dataColeta && form.dataColeta.length === 10) {
      const recebimento = addDays(form.dataColeta, 1);
      const liberacao = addDays(form.dataColeta, 5);
      const validade = addYears(form.dataColeta, 5);
      setForm(p => ({
        ...p,
        dataRecebimento: p.dataRecebimento === todayBR() || !p.dataRecebimento ? recebimento : p.dataRecebimento,
        dataLiberacao: p.dataLiberacao || liberacao,
        validadeExame: p.validadeExame || validade,
      }));
    }
  }, [form.dataColeta]);

  const handleChange = (field: keyof ToxicriaForm, value: string) => {
    setForm(p => ({ ...p, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) { toast.error("Faça login para emitir."); return; }
    if (!form.nome.trim()) { toast.error("Preencha o nome do paciente."); return; }
    if (!form.cpf.trim()) { toast.error("Preencha o CPF."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/documents/toxicria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.toUpperCase(),
          cpf: form.cpf,
          labColetor: form.labColetor,
          comprimento: form.comprimento,
          dataColeta: form.dataColeta,
          dataRecebimento: form.dataRecebimento,
          dataLiberacao: form.dataLiberacao,
          validadeExame: form.validadeExame,
          os: form.os,
          // Campos adicionais
          numeroLaudo: form.numeroLaudo,
          tituloExame: form.tituloExame,
          realizadoPor: form.realizadoPor,
          material: form.material,
          jDeteccao: form.jDeteccao,
          metodo: form.metodo,
          procedimento: form.procedimento,
          valorReferencia: form.valorReferencia,
          tipo: "toxicria",
        }),
      });
      const data = await res.json() as any;
      if (!data.success) throw new Error(data.error || "Erro ao emitir");

      const codigo = data.data.codigoValidacao;
      const url = `https://valida-laudo-sodretox.online/?codigo=${codigo}`;
      setCodigoLaudo(codigo);
      setValidationUrl(url);
      setSaved(true);
      setShowConfirmModal(false);
      setShowSuccessModal(true);
      if (updateBalance) updateBalance();
      toast.success("Laudo emitido com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao emitir laudo");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!previewRef.current) return;
    try {
      const { exportElementToPDF } = await import("@/lib/pdfExport");
      const filename = `LAUDO_TOXICOLOGICO_${(form.nome || "PACIENTE").replace(/\s+/g, "_").toUpperCase()}.pdf`;
      await exportElementToPDF(previewRef.current, { filename, scale: 2, quality: 0.92 });
    } catch (err: any) {
      toast.error("Erro ao gerar PDF: " + err.message);
    }
  };

  // ── Estilos ─────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: isDark ? "#1e293b" : "#fff",
    borderRadius: 10,
    boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.08)",
    padding: "14px 16px",
    marginBottom: 12,
    border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
  };
  const secTitle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const,
    letterSpacing: 1, color: isDark ? "#60a5fa" : "#1a3a6b",
    borderBottom: isDark ? "2px solid #3b82f6" : "2px solid #1a3a6b",
    paddingBottom: 5, marginBottom: 10,
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 600,
    color: isDark ? "#cbd5e1" : "#374151", marginBottom: 3,
  };
  const inp: React.CSSProperties = {
    width: "100%", padding: "6px 10px",
    border: isDark ? "1px solid #475569" : "1px solid #d1d5db",
    borderRadius: 6, fontSize: 13, outline: "none",
    boxSizing: "border-box" as const, fontFamily: "inherit",
    color: isDark ? "#e2e8f0" : "#000",
    background: isDark ? "#0f172a" : "#fff",
  };
  const btnBlue: React.CSSProperties = {
    background: "#1a3a6b", color: "#fff", border: "none",
    borderRadius: 7, padding: "8px 16px", fontWeight: 700,
    fontSize: 12, cursor: "pointer", letterSpacing: 0.5,
  };
  const btnGreen: React.CSSProperties = {
    background: "#16a34a", color: "#fff", border: "none",
    borderRadius: 7, padding: "8px 16px", fontWeight: 700,
    fontSize: 12, cursor: "pointer",
  };
  const btnGray: React.CSSProperties = {
    background: isDark ? "#334155" : "#e2e8f0",
    color: isDark ? "#e2e8f0" : "#000",
    border: isDark ? "1px solid #475569" : "1px solid #cbd5e1",
    borderRadius: 7, padding: "8px 16px", fontWeight: 700,
    fontSize: 12, cursor: "pointer",
  };

  return (
    <DashboardLayout>
      <div style={{ minHeight: "100vh", background: isDark ? "#0f172a" : "#f1f5f9", fontFamily: "Roboto, sans-serif", color: isDark ? "#e2e8f0" : "#1e293b" }}>
        {/* Header */}
        <div style={{ background: "#1a3a6b", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button style={{ ...btnGray, padding: "5px 12px", fontSize: 11 }} onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={12} style={{ display: "inline", marginRight: 4 }} />VOLTAR
            </button>
            <FlaskConical size={18} color="#fff" />
            <h1 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>DocMaster — EMITIR LAUDO TOXICOLÓGICO SODRÉ</h1>
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", background: "rgba(0,0,0,0.15)", padding: "4px 12px", borderRadius: 6, fontWeight: 600 }}>
            🔒 Dados excluídos automaticamente após 60 dias
          </span>
        </div>

        <div style={{ display: "flex", gap: 14, padding: 14, maxWidth: 2000, margin: "0 auto" }}>
          {/* ═══ COLUNA ESQUERDA — FORMULÁRIO ═══ */}
          <div style={{ width: 340, flexShrink: 0 }}>

            {/* Dados do Paciente */}
            <div style={card}>
              <div style={secTitle}>Dados do Paciente</div>
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>Nome Completo *</label>
                <input style={inp} value={form.nome} onChange={e => handleChange("nome", e.target.value.toUpperCase())} placeholder="NOME DO PACIENTE" />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>CPF *</label>
                <input style={inp} value={form.cpf} onChange={e => handleChange("cpf", maskCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>Lab. Coletor (Endereço)</label>
                <input style={inp} value={form.labColetor} onChange={e => handleChange("labColetor", e.target.value.toUpperCase())} placeholder="RUA CORONEL JOAO ANTONIO XAVIER, 757..." />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Comprimento (CM)</label>
                  <input style={inp} value={form.comprimento} onChange={e => handleChange("comprimento", e.target.value)} placeholder="3,00" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Data da Coleta</label>
                  <input style={inp} value={form.dataColeta} onChange={e => handleChange("dataColeta", handleDateInput(e.target.value))} placeholder="DD/MM/AAAA" maxLength={10} />
                </div>
              </div>
            </div>

            {/* Dados do Laudo */}
            <div style={card}>
              <div style={secTitle}>Dados do Laudo</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Número O.S</label>
                  <input style={inp} value={form.os} onChange={e => handleChange("os", e.target.value)} placeholder="56392178" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Nº do Laudo</label>
                  <input style={inp} value={form.numeroLaudo} onChange={e => handleChange("numeroLaudo", e.target.value)} placeholder="2024001234" />
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>Data Recebimento da Amostra</label>
                <input style={inp} value={form.dataRecebimento} onChange={e => handleChange("dataRecebimento", handleDateInput(e.target.value))} placeholder="DD/MM/AAAA" maxLength={10} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>Data de Liberação</label>
                <input style={inp} value={form.dataLiberacao} onChange={e => handleChange("dataLiberacao", handleDateInput(e.target.value))} placeholder="DD/MM/AAAA" maxLength={10} />
              </div>
              <div>
                <label style={lbl}>Validade do Exame</label>
                <input style={inp} value={form.validadeExame} onChange={e => handleChange("validadeExame", handleDateInput(e.target.value))} placeholder="DD/MM/AAAA" maxLength={10} />
              </div>
            </div>

            {/* Informações Técnicas */}
            <div style={card}>
              <div style={secTitle}>Informações Técnicas</div>
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>Título do Exame</label>
                <input style={inp} value={form.tituloExame} onChange={e => handleChange("tituloExame", e.target.value.toUpperCase())} placeholder="EXAME TOXICOLÓGICO DE LONGA JANELA DE DETECÇÃO" />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>Realizado por</label>
                <input style={inp} value={form.realizadoPor} onChange={e => handleChange("realizadoPor", e.target.value.toUpperCase())} placeholder="LABORATÓRIO SODRÉ" />
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Material</label>
                  <input style={inp} value={form.material} onChange={e => handleChange("material", e.target.value.toUpperCase())} placeholder="CABELO" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>J. Detecção</label>
                  <input style={inp} value={form.jDeteccao} onChange={e => handleChange("jDeteccao", e.target.value.toUpperCase())} placeholder="90 DIAS" />
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>Método</label>
                <input style={inp} value={form.metodo} onChange={e => handleChange("metodo", e.target.value.toUpperCase())} placeholder="LC-MS/MS" />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>Procedimento</label>
                <input style={inp} value={form.procedimento} onChange={e => handleChange("procedimento", e.target.value.toUpperCase())} placeholder="IMUNOENSAIO / CROMATOGRAFIA LÍQUIDA..." />
              </div>
              <div>
                <label style={lbl}>Valor de Referência</label>
                <input style={inp} value={form.valorReferencia} onChange={e => handleChange("valorReferencia", e.target.value.toUpperCase())} placeholder="NEGATIVO" />
              </div>
            </div>

            {/* Botões de ação */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              <button style={{ ...btnBlue, flex: 1 }} onClick={() => setShowConfirmModal(true)}>
                <Save size={13} style={{ display: "inline", marginRight: 5 }} />EMITIR LAUDO
              </button>
              {saved && (
                <button style={{ ...btnGreen, flex: 1 }} onClick={() => { setIsDownloading(true); handleExport().finally(() => setIsDownloading(false)); }}>
                  <Download size={13} style={{ display: "inline", marginRight: 5 }} />BAIXAR PDF
                </button>
              )}
            </div>

            {saved && codigoLaudo && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: isDark ? "#0d2d1a" : "#f0fdf4", border: "1px solid #16a34a", borderRadius: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", margin: "0 0 4px" }}>✅ Laudo emitido com sucesso!</p>
                <p style={{ fontSize: 11, margin: "0 0 2px", color: isDark ? "#86efac" : "#166534" }}>Código: <strong style={{ fontFamily: "monospace" }}>{codigoLaudo}</strong></p>
                <p style={{ fontSize: 10, margin: 0, color: isDark ? "#86efac" : "#166534", wordBreak: "break-all" as const }}>
                  Validação: {validationUrl}
                </p>
              </div>
            )}
          </div>

          {/* ═══ COLUNA DIREITA — PREVIEW ═══ */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...card, padding: "8px 12px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: isDark ? "#e2e8f0" : "#374151", fontSize: 14 }}>📄 Preview em Tempo Real</span>
              <span style={{ fontSize: 11, color: isDark ? "#94a3b8" : "#6b7280" }}>Laudo Toxicológico Sodré</span>
            </div>
            <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 2px 12px rgba(0,0,0,0.12)", overflow: "hidden" }}>
              <div ref={previewRef}>
                <LaudoPreview form={form} codigoLaudo={codigoLaudo} validationUrl={validationUrl} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação + Sucesso */}
      <EmissionModal
        docLabel="Laudo Toxicológico Sodré"
        showConfirm={showConfirmModal}
        showSuccess={showSuccessModal}
        isEmitting={loading}
        isDownloading={isDownloading}
        onConfirm={handleSave}
        onCancel={() => setShowConfirmModal(false)}
        onDownload={async () => {
          setIsDownloading(true);
          await handleExport();
          setIsDownloading(false);
        }}
        onClose={() => {
          setShowSuccessModal(false);
          navigate("/toxicriasalvos");
        }}
        historyPath="/toxicriasalvos"
      />
    </DashboardLayout>
  );
}
