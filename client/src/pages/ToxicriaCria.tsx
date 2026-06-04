/**
 * ToxicriaCria — Emissão de Laudo Toxicológico Innovatox (MOTOR ABSOLUTO 1:1)
 * 
 * Este arquivo utiliza o motor de posicionamento absoluto para garantir
 * paridade forense total com o documento de referência.
 */
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import DashboardLayout from "@/components/DashboardLayout";
import EmissionModal from "@/components/EmissionModal";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { FlaskConical, Save, Download, ArrowLeft, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

// ─── Substâncias pesquisadas (Innovatox) ──────────────────────────────────────
const SUBSTANCIAS = [
  { grupo: "ANFEPRAMONA", itens: [
    { nome: "ANFEPRAMONA", triagem: "0.2", confirmacao: "0.2" },
  ]},
  { grupo: "ANFETAMINAS", itens: [
    { nome: "ANFETAMINA", triagem: "0.2", confirmacao: "0.2" },
    { nome: "MDA", triagem: "0.2", confirmacao: "0.2" },
  ]},
  { grupo: "COCAÍNA", itens: [
    { nome: "COCAÍNA", triagem: "0.5", confirmacao: "0.5" },
    { nome: "BENZOILECGONINA", triagem: "-", confirmacao: "0.05" },
    { nome: "COCAETILENO", triagem: "-", confirmacao: "0.05" },
    { nome: "NORCOCAINA", triagem: "-", confirmacao: "0.05" },
  ]},
  { grupo: "FEMPROPOREX", itens: [
    { nome: "FEMPROPOREX", triagem: "0.2", confirmacao: "0.2" },
  ]},
  { grupo: "CANABINOIDES", itens: [
    { nome: "THC", triagem: "0.1", confirmacao: "-" },
    { nome: "CARBOXI THC", triagem: "-", confirmacao: "0.0002" },
  ]},
  { grupo: "MAZINDOL", itens: [
    { nome: "MAZINDOL", triagem: "0.5", confirmacao: "0.5" },
  ]},
  { grupo: "METANFETAMINAS", itens: [
    { nome: "METANFETAMINA", triagem: "0.2", confirmacao: "0.2" },
    { nome: "MDMA", triagem: "0.2", confirmacao: "0.2" },
  ]},
  { grupo: "OPIÁCEOS", itens: [
    { nome: "MORFINA", triagem: "0.2", confirmacao: "0.2" },
    { nome: "CODEÍNA", triagem: "0.2", confirmacao: "0.2" },
    { nome: "6-ACETILMORFINA", triagem: "0.2", confirmacao: "0.2" },
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

interface ToxicriaForm {
  nome: string;
  cpf: string;
  telefone: string;
  laudoNumero: string;
  nf: string;
  codigoAmostra: string;
  dataColeta: string;
  dataRecebimento: string;
  dataEmissao: string;
  material: string;
  comprimentoColetado: string;
  comprimentoAnalisado: string;
  postoColeta: string;
  postoEndereco: string;
  analisadoPor: string;
  metodoAnalitico: string;
  janelaDeteccao: string;
  resultadoGeral: string;
}

const EMPTY: ToxicriaForm = {
  nome: "",
  cpf: "",
  telefone: "",
  laudoNumero: "0GTN60IX000" + Math.floor(Math.random() * 90000000),
  nf: "",
  codigoAmostra: "0002C" + Math.floor(Math.random() * 900000),
  dataColeta: todayBR(),
  dataRecebimento: todayBR(),
  dataEmissao: todayBR(),
  material: "Pelo - Tórax",
  comprimentoColetado: "1.0 cm",
  comprimentoAnalisado: "1.0 cm",
  postoColeta: "",
  postoEndereco: "",
  analisadoPor: "Innovatox Análises e Pesquisas Ltda",
  metodoAnalitico: "LC-MS/MS",
  janelaDeteccao: "mínimo 90 dias",
  resultadoGeral: "NEGATIVO",
};

// ─── Componente de Preview com Motor Absoluto ──────────────────────────────
function LaudoPreview({ form, codigoValidacao, validationUrl }: {
  form: ToxicriaForm;
  codigoValidacao: string | null;
  validationUrl: string | null;
}) {
  const FONT_REGULAR = "Arial, Helvetica, sans-serif";

  return (
    <div style={{
      width: 794,
      height: 1123,
      background: "#fff",
      position: "relative",
      color: "#000",
      fontFamily: FONT_REGULAR,
      overflow: "hidden",
      boxSizing: "border-box"
    }}>
      {/* ── Top Info (Y: 25px) ── */}
      <div style={{ position: "absolute", top: 25, right: 40, textAlign: "right", fontSize: 11, fontWeight: 700 }}>
        <div>www.innovatox.com.br</div>
        <div>Central de Relacionamento: (15) 3359-1768</div>
      </div>

      {/* ── Logo Innovatox (Y: 45px) ── */}
      <div style={{ position: "absolute", top: 45, left: 40 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 22, height: 22, border: "3.5px solid #00aeef", borderRadius: "50% 50% 0 50%", transform: "rotate(-15deg)", position: "relative" }}>
            <div style={{ position: "absolute", top: 4, left: 4, width: 8, height: 8, background: "#00aeef", borderRadius: "50%" }}></div>
          </div>
          <div style={{ marginLeft: 6, fontSize: 32, fontWeight: 900, color: "#004a80", letterSpacing: -1, display: "flex", alignItems: "baseline" }}>
            innova<span style={{ color: "#00aeef" }}>tox</span>
          </div>
        </div>
        <div style={{ fontSize: 8.5, color: "#004a80", fontWeight: 700, letterSpacing: 3, marginTop: -6, marginLeft: 25 }}>ANÁLISES E PESQUISAS</div>
      </div>

      {/* ── Laudo Box (Y: 70px) ── */}
      <div style={{ position: "absolute", top: 75, right: 40, border: "2px solid #004a80", borderRadius: 6, padding: "4px 15px", background: "#f8f8f8" }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "#004a80" }}>Laudo n°: {form.laudoNumero}</div>
      </div>

      {/* ── CRL Box (Y: 75px) ── */}
      <div style={{ position: "absolute", top: 45, right: 235, border: "1px solid #004a80", width: 45, height: 45, display: "flex", flexDirection: "column" }}>
        <div style={{ height: "60%", background: "#004a80", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12 }}>CRL</div>
        <div style={{ height: "40%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#004a80", fontWeight: 700 }}>CRL 1487</div>
      </div>

      {/* ── Título Principal (Y: 125px) ── */}
      <div style={{ position: "absolute", top: 125, left: 40, right: 40, height: 28, background: "#f0f0f0", borderLeft: "5px solid #00aeef", display: "flex", alignItems: "center", paddingLeft: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#000" }}>LAUDO DE ANÁLISE TOXICOLÓGICA</div>
      </div>

      {/* ── Seção 1: Dados do Doador / NF (Y: 165px) ── */}
      <div style={{ position: "absolute", top: 165, left: 40, right: 40, height: 75, borderTop: "1.5px solid #000", borderBottom: "1.5px solid #000" }}>
        <div style={{ position: "absolute", left: 0, top: 8, width: 350 }}>
          <div style={{ fontWeight: 900, fontSize: 11, marginBottom: 5 }}>Dados do doador</div>
          <div style={{ fontSize: 10, lineHeight: 1.3 }}>
            <div><span style={{ fontWeight: 700 }}>Nome:</span> {form.nome || "—"}</div>
            <div><span style={{ fontWeight: 700 }}>CPF:</span> {form.cpf || "—"}</div>
            <div><span style={{ fontWeight: 700 }}>Telefone:</span> {form.telefone || "—"}</div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 350, top: 0, bottom: 0, width: 1.5, background: "#000" }}></div>
        <div style={{ position: "absolute", left: 365, top: 8 }}>
          <div style={{ fontWeight: 900, fontSize: 11, marginBottom: 5 }}>NF</div>
          <div style={{ fontSize: 10 }}>
            <div><span style={{ fontWeight: 700 }}>Número Doc. Fiscal:</span> {form.nf || "—"}</div>
          </div>
        </div>
      </div>

      {/* ── Seção 2: Características da Amostra (Y: 255px) ── */}
      <div style={{ position: "absolute", top: 255, left: 40, right: 40, height: 75, borderBottom: "1.5px solid #000" }}>
        <div style={{ fontWeight: 900, fontSize: 11, marginBottom: 6 }}>Características da Amostra</div>
        <div style={{ display: "flex", fontSize: 10 }}>
          <div style={{ width: 350, display: "flex", flexDirection: "column", gap: 3 }}>
            <div><span style={{ fontWeight: 700 }}>Código da amostra:</span> {form.codigoAmostra || "—"}</div>
            <div><span style={{ fontWeight: 700 }}>Data da coleta:</span> {form.dataColeta || "—"}</div>
            <div><span style={{ fontWeight: 700 }}>Data do recebimento:</span> {form.dataRecebimento || "—"}</div>
            <div><span style={{ fontWeight: 700 }}>Data da emissão do laudo:</span> {form.dataEmissao || "—"}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingLeft: 15 }}>
            <div><span style={{ fontWeight: 700 }}>Material:</span> {form.material || "—"}</div>
            <div><span style={{ fontWeight: 700 }}>Comprimento mínimo coletado:</span> {form.comprimentoColetado || "—"}</div>
            <div><span style={{ fontWeight: 700 }}>Comprimento mínimo analisado:</span> {form.comprimentoAnalisado || "—"}</div>
          </div>
        </div>
      </div>

      {/* ── Seção 3: Dados do Posto / Método (Y: 345px) ── */}
      <div style={{ position: "absolute", top: 345, left: 40, right: 40, height: 65, borderBottom: "1.5px solid #000" }}>
        <div style={{ display: "flex" }}>
          <div style={{ width: 350 }}>
            <div style={{ fontWeight: 900, fontSize: 11, marginBottom: 6 }}>Dados do Posto de Coleta</div>
            <div style={{ fontSize: 10, display: "flex", flexDirection: "column", gap: 3 }}>
              <div><span style={{ fontWeight: 700 }}>Coletado por:</span> {form.postoColeta || "—"}</div>
              <div><span style={{ fontWeight: 700 }}>Analisado por:</span> {form.analisadoPor || "—"}</div>
            </div>
          </div>
          <div style={{ paddingLeft: 15 }}>
            <div style={{ fontWeight: 900, fontSize: 11, marginBottom: 6, color: "#00aeef" }}>Característica do Método</div>
            <div style={{ fontSize: 10, display: "flex", flexDirection: "column", gap: 3 }}>
              <div><span style={{ fontWeight: 700 }}>Método Analítico (triagem e confirmatório):</span> {form.metodoAnalitico || "—"}</div>
              <div><span style={{ fontWeight: 700 }}>Janela de Detecção:</span> {form.janelaDeteccao || "—"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabela de Resultados (Y: 425px) ── */}
      <div style={{ position: "absolute", top: 425, left: 40, right: 40, height: 24, background: "#004a80", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, letterSpacing: 1.5 }}>
        RESULTADO DE ANÁLISE TOXICOLÓGICA
      </div>

      <div style={{ position: "absolute", top: 449, left: 40, right: 40 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #000" }}>
              <th style={{ textAlign: "left", padding: "4px 8px", fontSize: 9.5, width: "35%" }}>SUBSTÂNCIA</th>
              <th style={{ textAlign: "center", padding: "4px 8px", fontSize: 9.5, width: "15%" }}>RESULTADO</th>
              <th style={{ textAlign: "center", padding: "4px 8px", fontSize: 9.5, width: "15%" }}>VALOR OBTIDO</th>
              <th colSpan={2} style={{ textAlign: "center", padding: "2px 8px", fontSize: 9.5, borderBottom: "1px solid #000" }}>VALORES DE CORTE</th>
            </tr>
            <tr style={{ borderBottom: "1px solid #000" }}>
              <th colSpan={3}></th>
              <th style={{ textAlign: "center", padding: "2px 8px", fontSize: 8.5, fontWeight: 700 }}>TRIAGEM (ng/mg)</th>
              <th style={{ textAlign: "center", padding: "2px 8px", fontSize: 8.5, fontWeight: 700 }}>CONFIRMATÓRIO (ng/mg)</th>
            </tr>
          </thead>
          <tbody>
            {SUBSTANCIAS.map((grupo, gIdx) => (
              <>
                <tr key={grupo.grupo} style={{ background: gIdx % 2 !== 0 ? "#f8f8f8" : "#fff" }}>
                  <td style={{ padding: "4px 8px", fontWeight: 900, fontSize: 9.5 }}>{grupo.grupo}</td>
                  <td colSpan={4}></td>
                </tr>
                {grupo.itens.map(item => (
                  <tr key={item.nome} style={{ background: gIdx % 2 !== 0 ? "#f8f8f8" : "#fff" }}>
                    <td style={{ padding: "2.5px 8px", paddingLeft: 18, fontSize: 9, fontWeight: 400 }}>{item.nome}</td>
                    <td style={{ padding: "2.5px 8px", textAlign: "center", fontSize: 9, fontWeight: 700 }}>{form.resultadoGeral}</td>
                    <td style={{ padding: "2.5px 8px", textAlign: "center", fontSize: 9 }}>-</td>
                    <td style={{ padding: "2.5px 8px", textAlign: "center", fontSize: 9 }}>{item.triagem}</td>
                    <td style={{ padding: "2.5px 8px", textAlign: "center", fontSize: 9 }}>{item.confirmacao}</td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Informações Gerais (Y: 825px) ── */}
      <div style={{ position: "absolute", top: 825, left: 40, right: 40 }}>
        <div style={{ fontWeight: 900, fontSize: 11, marginBottom: 5 }}>Informações Gerais</div>
        <div style={{ fontSize: 8.4, lineHeight: 1.35, textAlign: "justify", color: "#222" }}>
          Resultado negativo significa que não foi encontrada substância na quantidade maior do que o valor de corte (cut-off). Resultado positivo significa que foi encontrada substância na quantidade maior ou igual do que o valor de corte (cut-off). Este laudo não pode ser reproduzido parcialmente. A coleta foi realizada pelo posto de coleta: <span style={{ fontWeight: 700 }}>{form.postoColeta || "—"}</span>, <span style={{ fontWeight: 700 }}>{form.postoEndereco || "—"}</span>, não acreditado para esta atividade. O laboratório é responsável por todas as informações fornecidas neste relatório, exceto aquelas fornecidas pelo cliente ou seus representantes. Os resultados acima apresentados referem-se apenas as substâncias analisadas nesta amostra. Análise realizada por {form.metodoAnalitico} e plano de amostragem de acordo com os procedimentos em vigência.
        </div>
      </div>

      {/* ── Caixa de Validade (Y: 920px) ── */}
      <div style={{ position: "absolute", top: 920, left: 40, right: 40, height: 35, border: "2px solid #00aeef", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 900 }}>
          Validade do Exame: <span style={{ color: "#00aeef" }}>90 dias para finalidade CNH e 60 dias para finalidade CLT (Contados a partir da coleta)</span>
        </div>
      </div>

      {/* ── Rodapé / Assinatura (Y: 980px) ── */}
      <div style={{ position: "absolute", top: 980, left: 40, right: 40 }}>
        <div style={{ position: "absolute", left: 0, bottom: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 11 }}>INNOVATOX Análises e Pesquisas Ltda.</div>
          <div style={{ fontSize: 9.5, lineHeight: 1.4, marginTop: 4 }}>
            Rua Levindo Lima, 55 - Pq. Campolim, Sorocaba - SP<br />
            CNPJ: 28.256.904/0001-00<br />
            FOR.TOX.019.V00
          </div>
        </div>

        <div style={{ position: "absolute", right: 0, bottom: 0, width: 230, textAlign: "center" }}>
           <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 19, marginBottom: 4, color: "#111" }}>
              Rafael Menck de Almeida
           </div>
           <div style={{ height: 1.5, background: "#000", width: "100%" }}></div>
           <div style={{ fontWeight: 900, fontSize: 11, marginTop: 5 }}>Rafael Menck de Almeida, PhD</div>
           <div style={{ fontSize: 10, fontWeight: 700 }}>CRF-SP 38295</div>
        </div>
      </div>

      {/* ── Hash e QR Code (Y: 1085px) ── */}
      <div style={{ position: "absolute", bottom: 20, left: 40, right: 40, height: 1, background: "#eee" }}></div>
      <div style={{ position: "absolute", bottom: 10, left: 40, right: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 8.5, fontFamily: "monospace", color: "#777", letterSpacing: 1 }}>
            {codigoValidacao ? codigoValidacao.replace(/-/g, "").toUpperCase() : "000000000000000000000000000000000"}
          </div>
          <div style={{ fontSize: 7, fontWeight: 900, color: "#999", marginTop: 2 }}>ASSINATURA DIGITAL</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700 }}>Pag. 1 de 1</div>
          {validationUrl && (
            <div style={{ padding: 2, background: "#fff", border: "1px solid #ccc" }}>
              <QRCodeSVG value={validationUrl} size={42} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ToxicriaCria() {
  const { user, updateBalance } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [, navigate] = useLocation();
  const previewRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<ToxicriaForm>({ ...EMPTY });
  const [codigoValidacao, setCodigoValidacao] = useState<string | null>(null);
  const [validationUrl, setValidationUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoom, setZoom] = useState(0.65);

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
        body: JSON.stringify({ ...form, tipo: "toxicria" }),
      });
      const data = await res.json() as any;
      if (!data.success) throw new Error(data.error || "Erro ao emitir");

      const codigo = data.data.codigoValidacao;
      const url = `https://valida-laudo-sodretox.online/?codigo=${codigo}`;
      setCodigoValidacao(codigo);
      setValidationUrl(url);
      setSaved(true);
      setShowConfirmModal(false);
      setShowSuccessModal(true);
      if (updateBalance && data.newBalance !== undefined) updateBalance(data.newBalance);
      toast.success("Laudo Innovatox emitido com sucesso!");
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
      const filename = `LAUDO_INNOVATOX_${(form.nome || "PACIENTE").replace(/\s+/g, "_").toUpperCase()}.pdf`;
      await exportElementToPDF(previewRef.current, { filename, scale: 3, quality: 1.0 });
    } catch (err: any) {
      toast.error("Erro ao gerar PDF: " + err.message);
    }
  };

  return (
    <div style={{ height: "100vh", width: "100%", overflow: "hidden", background: isDark ? "#0f172a" : "#f1f5f9", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#004a80", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="group flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold tracking-widest">VOLTAR</span>
          </button>
          <div className="h-8 w-[1px] bg-white/20 mx-2" />
          <FlaskConical size={24} color="#00aeef" />
          <div>
            <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>DocMaster Elite</h1>
            <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em]">Laudo Toxicológico Innovatox (ABSOLUTO)</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-black/20 rounded-2xl border border-white/5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Motor Forense 1:1 Ativo</span>
            </div>
            <span className="text-xs font-bold text-white/90 bg-indigo-500 px-4 py-2 rounded-xl shadow-lg">VALOR: R$ 18,00</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6 max-w-[1800px] mx-auto overflow-hidden w-full">
        <div className="w-full lg:w-[420px] lg:flex-shrink-0 lg:overflow-y-auto lg:max-h-[calc(100vh-140px)] custom-scrollbar pr-2">
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-black text-gray-800 dark:text-gray-100 uppercase mb-4">Identificação</h2>
              <div className="space-y-4">
                <input className="w-full h-12 px-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50/50 text-sm font-bold outline-none focus:border-indigo-500 uppercase" value={form.nome} onChange={e => handleChange("nome", e.target.value.toUpperCase())} placeholder="NOME DO DOADOR" />
                <div className="grid grid-cols-2 gap-4">
                  <input className="w-full h-12 px-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 text-sm font-bold" value={form.cpf} onChange={e => handleChange("cpf", maskCPF(e.target.value))} placeholder="CPF" maxLength={14} />
                  <input className="w-full h-12 px-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 text-sm font-bold" value={form.telefone} onChange={e => handleChange("telefone", e.target.value)} placeholder="TELEFONE" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-black text-gray-800 dark:text-gray-100 uppercase mb-4">Laudo & NF</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input className="w-full h-12 px-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 text-sm font-bold" value={form.laudoNumero} onChange={e => handleChange("laudoNumero", e.target.value)} placeholder="LAUDO N°" />
                  <input className="w-full h-12 px-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 text-sm font-bold" value={form.nf} onChange={e => handleChange("nf", e.target.value)} placeholder="NF" />
                </div>
                <input className="w-full h-12 px-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 text-sm font-bold uppercase" value={form.codigoAmostra} onChange={e => handleChange("codigoAmostra", e.target.value.toUpperCase())} placeholder="CÓDIGO DA AMOSTRA" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Local de Coleta</h2>
              <div className="space-y-4">
                <input className="w-full h-12 px-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 text-sm font-bold uppercase" value={form.postoColeta} onChange={e => handleChange("postoColeta", e.target.value.toUpperCase())} placeholder="NOME DO POSTO" />
                <input className="w-full h-12 px-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 text-sm font-bold uppercase" value={form.postoEndereco} onChange={e => handleChange("postoEndereco", e.target.value.toUpperCase())} placeholder="ENDEREÇO DO POSTO" />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-4 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-2xl z-20">
              <button className="w-full py-5 bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-black text-sm rounded-[1.5rem] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest" onClick={() => setShowConfirmModal(true)}>
                <Save size={18} /> Emitir Innovatox 1:1
              </button>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 flex-col min-w-0 h-full relative group">
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10 pointer-events-none">
            <div className="px-6 py-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl pointer-events-auto flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-sky-500 rounded-full animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-widest">Motor Forense Estrito</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setZoom(z => Math.max(0.4, z - 0.05))} className="p-1 hover:bg-gray-100 rounded-lg pointer-events-auto"><ZoomOut size={16} /></button>
                    <span className="text-[11px] font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(1.5, z + 0.05))} className="p-1 hover:bg-gray-100 rounded-lg pointer-events-auto"><ZoomIn size={16} /></button>
                </div>
            </div>
            <div className="flex gap-2 pointer-events-auto">
                <button className={`p-3 rounded-2xl shadow-xl transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white cursor-not-allowed'}`} onClick={() => { setIsDownloading(true); handleExport().finally(() => setIsDownloading(false)); }} disabled={!saved}>
                  <Download size={20} />
                </button>
            </div>
          </div>
          <div className="flex-1 bg-slate-200 dark:bg-gray-950 rounded-[3rem] p-12 overflow-auto shadow-inner flex items-start justify-center custom-scrollbar">
            <div ref={previewRef} className="bg-white shadow-[0_0_100px_rgba(0,0,0,0.3)] transition-transform duration-300" style={{ width: 794, height: 1123, flexShrink: 0, transform: `scale(${zoom})`, transformOrigin: "top center", marginBottom: 200 }}>
              <LaudoPreview form={form} codigoValidacao={codigoValidacao} validationUrl={validationUrl} />
            </div>
          </div>
        </div>
      </div>

      <EmissionModal docLabel="Laudo Toxicológico Innovatox" documentPrice={1800} userBalance={user?.balance ?? 0} showConfirm={showConfirmModal} showSuccess={showSuccessModal} isEmitting={loading} isDownloading={isDownloading} onConfirm={handleSave} onCancel={() => setShowConfirmModal(false)} onDownload={async () => { setIsDownloading(true); await handleExport(); setIsDownloading(false); }} onClose={() => { setShowSuccessModal(false); navigate("/dashboard"); }} historyPath="/dashboard" isFree={user?.role === 'admin' || (Array.isArray(user?.free_documents) && (user.free_documents.includes('toxicria') || user.free_documents.includes('laudocria')))} />
    </div>
  );
}
