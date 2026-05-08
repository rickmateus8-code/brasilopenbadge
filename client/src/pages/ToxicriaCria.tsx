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
  labColetor: "MAIA POSTO OFICIAL DE COLETAS TOXICOLOGICAS",
  comprimento: "3,00",
  dataColeta: todayBR(),
  dataRecebimento: todayBR(),
  dataLiberacao: addDays(todayBR(), 1),
  validadeExame: addYears(todayBR(), 5),
  os: "2501151896",
  // Campos adicionais com defaults
  numeroLaudo: "QY19VGYPIP7G8XF5F",
  tituloExame: "EXAME TOXICOLÓGICO - CNH",
  realizadoPor: "LAB.SODRÉ",
  material: "QUERATINA (CABELO)",
  jDeteccao: "APROX. 90 DIAS",
  metodo: "LC-MS/MS",
  procedimento: "IT.TOX.008/POP.TOX.022/POP.TOX.032/POP.TOX.033",
  valorReferencia: "CUT OFF",
};

// ─── Componente de Preview do Laudo ──────────────────────────────────────────
function LaudoPreview({ form, codigoLaudo, validationUrl }: {
  form: ToxicriaForm;
  codigoLaudo: string | null;
  validationUrl: string | null;
}) {
  const calibriBold: React.CSSProperties = { fontFamily: "'Calibri', sans-serif", fontWeight: 700 };
  const calibri: React.CSSProperties = { fontFamily: "'Calibri', sans-serif", fontWeight: 400 };
  const times: React.CSSProperties = { fontFamily: "'Times New Roman', serif" };

  return (
    <div style={{
      ...calibri,
      fontSize: "12px",
      color: "#000",
      background: "#fff",
      width: "100%",
      maxWidth: 794,
      minHeight: 1123, // A4 aspect ratio
      margin: "0 auto",
      padding: "30px 40px",
      boxSizing: "border-box",
      position: "relative",
    }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 15 }}>
        {/* Logo SODRÉ Simulado */}
        <div style={{ marginRight: 20 }}>
          <div style={{
            width: 75, height: 75, borderRadius: "50%",
            background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 32 }}>S</span>
          </div>
        </div>
        <div style={{ flex: 1, paddingTop: 10 }}>
          <div style={{ ...calibriBold, fontSize: "14px", color: "#000", marginBottom: 2 }}>
            SODRE SL DIAGNOSTICOS E PESQUISAS LABORATORIAIS LTDA
          </div>
          <div style={{ ...calibri, fontSize: "11px", color: "#333" }}>
            05.934.885/0016-04 - Rua Luiz Gama, 1801. Lins/SP
          </div>
          <div style={{ ...calibri, fontSize: "9px", color: "#666", marginTop: 4 }}>
            LS.TOX.017 - REV. 3 – 25/11/2024
            <span style={{ marginLeft: 30 }}>CNES: 9778608</span>
          </div>
        </div>
      </div>

      <div style={{ borderBottom: "1px solid #000", marginBottom: 20 }} />

      {/* ── Seção de Dados do Paciente e Laudo ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 30, marginBottom: 20 }}>
        {/* Coluna Esquerda */}
        <div style={{ spaceY: 8 }}>
          <div style={{ marginBottom: 6 }}>
            <span style={{ ...calibriBold }}>Nome: </span>
            <span style={{ ...calibriBold, fontSize: "14px", textTransform: "uppercase" }}>{form.nome || "MARCOS PAULO PORTO"}</span>
          </div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ ...calibriBold }}>CPF: </span>
            <span style={{ ...calibriBold }}>{form.cpf || "000.000.000-00"}</span>
          </div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ ...calibriBold }}>Lab. Coletor: </span>
            <span style={{ fontSize: "10px", textTransform: "uppercase" }}>{form.labColetor || "—"}</span>
          </div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ ...calibriBold }}>Material: </span>
            <span style={{ ...calibriBold, textTransform: "uppercase" }}>{form.material || "QUERATINA (CABELO)"}</span>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <div><span style={{ ...calibriBold }}>Comprimento: </span>{form.comprimento || "3,00"} CM</div>
            <div><span style={{ ...calibriBold }}>Data da Coleta: </span>{form.dataColeta || todayBR()}</div>
          </div>
        </div>

        {/* Coluna Direita (Laudo + QR) */}
        <div style={{ position: "relative" }}>
          <div style={{ borderLeft: "1px solid #eee", paddingLeft: 15 }}>
            <div style={{ marginBottom: 4 }}>
              <span style={{ ...calibriBold }}>O.S: </span>
              <span style={{ ...calibriBold }}>{form.os || "—"}</span>
            </div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ ...calibriBold }}>Laudo: </span>
              <span style={{ ...calibriBold }}>{form.numeroLaudo || codigoLaudo || "—"}</span>
            </div>
            <div style={{ marginBottom: 4, fontSize: "11px" }}>
              <span style={{ ...calibriBold }}>Exame realizado por: </span>{form.realizadoPor || "LAB.SODRÉ"}
            </div>
            <div style={{ marginBottom: 4, fontSize: "11px" }}>
              <span style={{ ...calibriBold }}>Data recebimento da amostra: </span>{form.dataRecebimento || todayBR()}
            </div>
            <div style={{ marginBottom: 4, fontSize: "11px" }}>
              <span style={{ ...calibriBold }}>Data de liberação: </span>{form.dataLiberacao || todayBR()}
            </div>
            <div style={{ marginBottom: 4, fontSize: "11px" }}>
              <span style={{ ...calibriBold }}>Validade do exame: </span>{form.validadeExame || todayBR()}
            </div>
          </div>

          {/* QR Code de Validação Flutuante */}
          <div style={{ position: "absolute", top: 0, right: 0, textAlign: "center" }}>
            <div style={{ border: "2px solid #000", padding: 3, background: "#fff" }}>
              {validationUrl ? (
                <QRCodeSVG value={validationUrl} size={65} />
              ) : (
                <div style={{ width: 65, height: 65, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", color: "#64748b", textAlign: "center" }}>
                  QR CODE<br/>VALIDAÇÃO
                </div>
              )}
            </div>
            <div style={{ ...calibriBold, fontSize: "9px", marginTop: 4 }}>VALIDAÇÃO</div>
          </div>
        </div>
      </div>

      {/* ── Título do Exame ── */}
      <div style={{ 
        ...calibriBold, 
        fontSize: "15px", 
        borderTop: "2px solid #000", 
        borderBottom: "2px solid #000", 
        padding: "8px 0", 
        marginBottom: 15,
        textAlign: "left"
      }}>
        {form.tituloExame || "EXAME TOXICOLÓGICO - CNH"}
        <div style={{ float: "right", textAlign: "right", fontSize: "10px", fontWeight: 400 }}>
          <div><span style={{ ...calibriBold }}>Procedimento: </span>{form.procedimento}</div>
          <div>
            <span style={{ ...calibriBold }}>Método: </span>{form.metodo}
            <span style={{ ...calibriBold, marginLeft: 15 }}>Valor de referência: </span>{form.valorReferencia}
          </div>
        </div>
      </div>

      <div style={{ ...calibriBold, fontSize: "11px", marginBottom: 5 }}>J.Detecção: {form.jDeteccao || "APROX. 90 DIAS"}</div>

      {/* ── Tabela de Resultados ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, fontSize: "11px" }}>
        <thead>
          <tr style={{ background: "#f3f4f6" }}>
            <th style={{ border: "1px solid #000", padding: "6px 10px", textAlign: "left", width: "45%" }}>SUBSTÂNCIAS (METABÓLITO)</th>
            <th style={{ border: "1px solid #000", padding: "6px 10px", textAlign: "center", width: "20%" }}>RESULTADO</th>
            <th style={{ border: "1px solid #000", padding: "6px 10px", textAlign: "center", width: "17.5%" }}>TRIAGEM</th>
            <th style={{ border: "1px solid #000", padding: "6px 10px", textAlign: "center", width: "17.5%" }}>CONFIRMAÇÃO</th>
          </tr>
        </thead>
        <tbody>
          {SUBSTANCIAS.map(grupo => (
            <React.Fragment key={grupo.grupo}>
              <tr>
                <td colSpan={4} style={{ border: "1px solid #000", padding: "4px 10px", background: "#fafafa" }}>
                  <span style={{ ...calibriBold }}>{grupo.grupo}</span>
                </td>
              </tr>
              {grupo.itens.map(item => (
                <tr key={item.nome}>
                  <td style={{ border: "1px solid #000", padding: "3px 10px" }}>{item.nome}</td>
                  <td style={{ border: "1px solid #000", padding: "3px 10px", textAlign: "center", ...calibriBold, color: "#16a34a" }}>NEGATIVO</td>
                  <td style={{ border: "1px solid #000", padding: "3px 10px", textAlign: "center" }}>{item.triagem}</td>
                  <td style={{ border: "1px solid #000", padding: "3px 10px", textAlign: "center" }}>{item.confirmacao}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* ── Notas de Rodapé ── */}
      <div style={{ fontSize: "10px", color: "#333", lineHeight: 1.4, marginBottom: 20 }}>
        <p style={{ margin: "0 0 3px" }}>Este relatório de ensaio é válido exclusivamente para as amostras analisadas e só pode ser reproduzido na íntegra. Reprodução parcial requer aprovação por escrito do laboratório.</p>
        <p style={{ margin: "0 0 3px" }}>Um resultado negativo significa que a droga não foi detectada em quantidades que atinjam o valor de <strong>cut off</strong>.</p>
        <p style={{ margin: "0 0 3px" }}>Um resultado positivo significa que a droga foi identificada em quantidades que igualam ou excedam o valor de <strong>cut off</strong>.</p>
        <p style={{ margin: "0 0 3px" }}>Exame repetido e confirmado através de duas extrações.</p>
        <p style={{ margin: 0 }}>Exame realizado pelo Laboratório Sodré - CAP Number: 8313438</p>
      </div>

      {/* ── Link de Validação Real ── */}
      {validationUrl && (
        <div style={{ fontSize: "10px", color: "#333", borderTop: "1px dashed #ccc", paddingTop: 10, marginBottom: 30 }}>
          <p style={{ margin: 0 }}>
            Para garantir a autenticidade do laudo por meio do código QR, verifique se o link aberto pertence ao Laboratório Sodré. Nossos links seguem o seguinte padrão:
          </p>
          <p style={{ margin: "3px 0 0", color: "#2563eb", fontWeight: 700 }}>{validationUrl}</p>
        </div>
      )}

      {/* ── Assinatura Forense ── */}
      <div style={{ marginTop: 40, textAlign: "center" }}>
        <div style={{ width: "300px", margin: "0 auto" }}>
          <div style={{ fontStyle: "italic", fontSize: "16px", marginBottom: 5, fontFamily: "'Caveat', cursive", color: "#1a3a6b" }}>
            Amadeu Cardoso Jr.
          </div>
          <div style={{ borderTop: "1.5px solid #000", paddingBottom: 5 }} />
          <div style={{ ...calibriBold, fontSize: "11px", textTransform: "uppercase" }}>
            DR. AMADEU CARDOSO JUNIOR - TOXICOLOGISTA - CRF-RJ 21698
          </div>
          <div style={{ fontSize: "10px", color: "#666", marginTop: 2 }}>
            F9F5CEBDBAA0B0714AFA7AB21D10BE0F
          </div>
          <div style={{ fontSize: "10px", color: "#666" }}>
            Laboratório – Divisão Toxicológica – REG.CRBM No. 2019-5802-08
          </div>
          <div style={{ fontSize: "10px", color: "#000", marginTop: 10, ...calibriBold }}>
            www.sodretox.com.br – 0800 777 8547
          </div>
        </div>
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
      if (updateBalance && data.newBalance !== undefined) updateBalance(data.newBalance);
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
    <div style={{ height: "100vh", width: "100%", overflow: "hidden", background: isDark ? "#0f172a" : "#f1f5f9", fontFamily: "Roboto, sans-serif", color: isDark ? "#e2e8f0" : "#1e293b", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "#1a3a6b", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
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

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-3 md:p-4 max-w-[1600px] mx-auto overflow-hidden">
        {/* ═══ COLUNA ESQUERDA — FORMULÁRIO ═══ */}
        <div className="w-full lg:w-[340px] xl:w-[400px] lg:flex-shrink-0 lg:overflow-y-auto lg:max-h-[calc(100vh-100px)] custom-scrollbar">
          <div className="space-y-4">
            {/* Dados do Paciente */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
              <p className="text-xs font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest mb-4 border-b pb-2">Dados do Paciente</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 uppercase ml-1">Nome Completo *</label>
                  <input className="w-full h-10 px-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-sm outline-none uppercase" value={form.nome} onChange={e => handleChange("nome", e.target.value.toUpperCase())} placeholder="NOME DO PACIENTE" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 uppercase ml-1">CPF *</label>
                  <input className="w-full h-10 px-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-sm outline-none" value={form.cpf} onChange={e => handleChange("cpf", maskCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 uppercase ml-1">Lab. Coletor</label>
                  <input className="w-full h-10 px-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-sm outline-none uppercase" value={form.labColetor} onChange={e => handleChange("labColetor", e.target.value.toUpperCase())} placeholder="ENDEREÇO DO LABORATÓRIO" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 uppercase ml-1">Comprimento</label>
                    <input className="w-full h-10 px-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-sm outline-none" value={form.comprimento} onChange={e => handleChange("comprimento", e.target.value)} placeholder="3,00 CM" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 uppercase ml-1">Data Coleta</label>
                    <input className="w-full h-10 px-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-sm outline-none" value={form.dataColeta} onChange={e => handleChange("dataColeta", handleDateInput(e.target.value))} placeholder="DD/MM/AAAA" maxLength={10} />
                  </div>
                </div>
              </div>
            </div>

            {/* Dados do Laudo */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
              <p className="text-xs font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest mb-4 border-b pb-2">Dados do Laudo</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 uppercase ml-1">Número O.S</label>
                    <input className="w-full h-10 px-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-sm outline-none" value={form.os} onChange={e => handleChange("os", e.target.value)} placeholder="56392178" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 uppercase ml-1">Nº Laudo</label>
                    <input className="w-full h-10 px-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-sm outline-none" value={form.numeroLaudo} onChange={e => handleChange("numeroLaudo", e.target.value)} placeholder="2024001234" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 uppercase ml-1">Recebimento Amostra</label>
                  <input className="w-full h-10 px-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-sm outline-none" value={form.dataRecebimento} onChange={e => handleChange("dataRecebimento", handleDateInput(e.target.value))} placeholder="DD/MM/AAAA" maxLength={10} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 uppercase ml-1">Data Liberação</label>
                  <input className="w-full h-10 px-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-sm outline-none" value={form.dataLiberacao} onChange={e => handleChange("dataLiberacao", handleDateInput(e.target.value))} placeholder="DD/MM/AAAA" maxLength={10} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 uppercase ml-1">Validade Exame</label>
                  <input className="w-full h-10 px-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-sm outline-none font-bold text-indigo-600" value={form.validadeExame} onChange={e => handleChange("validadeExame", handleDateInput(e.target.value))} placeholder="DD/MM/AAAA" maxLength={10} />
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-2 pt-2">
              <button 
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none active:scale-95 transition-all"
                onClick={() => setShowConfirmModal(true)}
              >
                <Save size={16} className="inline mr-2" /> EMITIR LAUDO
              </button>
              {saved && (
                <button 
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-100 dark:shadow-none active:scale-95 transition-all"
                  onClick={() => { setIsDownloading(true); handleExport().finally(() => setIsDownloading(false)); }}
                >
                  <Download size={16} className="inline mr-2" /> BAIXAR PDF
                </button>
              )}
            </div>

            {saved && codigoLaudo && (
              <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500 rounded-2xl animate-in zoom-in-95">
                <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">✅ Sucesso!</p>
                <p className="text-xs text-emerald-900 dark:text-emerald-100 mb-2">Código: <strong className="font-mono">{codigoLaudo}</strong></p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-500 break-all opacity-80">{validationUrl}</p>
              </div>
            )}
          </div>
        </div>

        {/* ═══ COLUNA DIREITA — PREVIEW ═══ */}
        <div className="hidden lg:flex flex-1 flex-col min-w-0 h-full">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-4 flex items-center justify-between">
            <span className="text-sm font-black text-gray-800 dark:text-gray-200 italic uppercase">Preview Realtime</span>
            <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-[10px] font-black rounded-lg">
              LAUDO SODRÉ
            </div>
          </div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-800 rounded-3xl p-6 overflow-auto shadow-inner flex items-start justify-center">
            <div 
              ref={previewRef} 
              className="bg-white shadow-2xl origin-top transition-transform"
              style={{ width: 794, flexShrink: 0 }}
            >
              <LaudoPreview form={form} codigoLaudo={codigoLaudo} validationUrl={validationUrl} />
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
          navigate("/dashboard");
        }}
        historyPath="/dashboard"
      />
    </div>
  );
}
