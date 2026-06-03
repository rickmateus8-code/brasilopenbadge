/**
 * ToxicriaCria — Emissão de Laudo Toxicológico Innovatox
 *
 * Layout baseado no Laudo Innovatox (Alison Alander Castiglione)
 * Domínio de validação: valida-laudo-sodretox.online (a ser atualizado)
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

// ─── Componente de Preview do Laudo (Innovatox) ─────────────────────────────
function LaudoPreview({ form, codigoValidacao, validationUrl }: {
  form: ToxicriaForm;
  codigoValidacao: string | null;
  validationUrl: string | null;
}) {
  return (
    <div style={{
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: 10,
      color: "#000",
      background: "#fff",
      width: 794,
      minHeight: 1123,
      margin: "0 auto",
      padding: "30px 40px",
      boxSizing: "border-box",
      position: "relative",
    }}>
      {/* ── Top Info ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 5 }}>
        <div style={{ textAlign: "right", fontSize: 11, fontWeight: 700 }}>
          <div style={{ color: "#000" }}>www.innovatox.com.br</div>
          <div style={{ color: "#000" }}>Central de Relacionamento: (15) 3359-1768</div>
        </div>
      </div>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          {/* Logo Innovatox Placeholder */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: 22, height: 22, border: "3px solid #00aeef", borderRadius: "50% 50% 0 50%", transform: "rotate(-15deg)", position: "relative" }}>
                <div style={{ position: "absolute", top: 4, left: 4, width: 8, height: 8, background: "#00aeef", borderRadius: "50%" }}></div>
              </div>
              <div style={{ marginLeft: 6, fontSize: 32, fontWeight: 900, color: "#004a80", letterSpacing: -1, display: "flex", alignItems: "baseline" }}>
                innova<span style={{ color: "#00aeef" }}>tox</span>
              </div>
            </div>
            <div style={{ fontSize: 8, color: "#004a80", fontWeight: 700, letterSpacing: 3, marginTop: -5, marginLeft: 25 }}>ANÁLISES E PESQUISAS</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
           <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ border: "2px solid #004a80", borderRadius: 4, padding: "2px 10px", textAlign: "center", background: "#f8f8f8" }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#004a80" }}>Laudo n°: {form.laudoNumero}</div>
              </div>
              <div style={{ border: "1px solid #004a80", padding: 2, display: "flex", flexDirection: "column", alignItems: "center", width: 50 }}>
                <div style={{ width: "100%", height: 30, background: "#004a80", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12 }}>CRL</div>
                <div style={{ fontSize: 8, color: "#004a80", fontWeight: 700, marginTop: 2 }}>CRL 1487</div>
              </div>
           </div>
        </div>
      </div>

      <div style={{ background: "#f0f0f0", padding: "6px 12px", marginBottom: 12, borderLeft: "4px solid #00aeef" }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#000" }}>LAUDO DE ANÁLISE TOXICOLÓGICA</div>
      </div>

      {/* ── Dados do Doador / NF ── */}
      <div style={{ display: "flex", gap: 0, borderTop: "1.5px solid #000", borderBottom: "1.5px solid #000", marginBottom: 15 }}>
        <div style={{ flex: 1, padding: "8px 0" }}>
          <div style={{ fontWeight: 900, fontSize: 11, marginBottom: 5 }}>Dados do doador</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div><span style={{ fontWeight: 700 }}>Nome:</span> {form.nome || "—"}</div>
            <div><span style={{ fontWeight: 700 }}>CPF:</span> {form.cpf || "—"}</div>
            <div><span style={{ fontWeight: 700 }}>Telefone:</span> {form.telefone || "—"}</div>
          </div>
        </div>
        <div style={{ width: 1.5, background: "#000" }}></div>
        <div style={{ flex: 1, padding: "8px 15px" }}>
          <div style={{ fontWeight: 900, fontSize: 11, marginBottom: 5 }}>NF</div>
          <div><span style={{ fontWeight: 700 }}>Número Doc. Fiscal:</span> {form.nf || "—"}</div>
        </div>
      </div>

      {/* ── Características da Amostra ── */}
      <div style={{ borderBottom: "1.5px solid #000", paddingBottom: 10, marginBottom: 15 }}>
        <div style={{ fontWeight: 900, fontSize: 11, marginBottom: 8 }}>Características da Amostra</div>
        <div style={{ display: "flex" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            <div><span style={{ fontWeight: 700 }}>Código da amostra:</span> {form.codigoAmostra || "—"}</div>
            <div><span style={{ fontWeight: 700 }}>Data da coleta:</span> {form.dataColeta || "—"}</div>
            <div><span style={{ fontWeight: 700 }}>Data do recebimento:</span> {form.dataRecebimento || "—"}</div>
            <div><span style={{ fontWeight: 700 }}>Data da emissão do laudo:</span> {form.dataEmissao || "—"}</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            <div><span style={{ fontWeight: 700 }}>Material:</span> {form.material || "—"}</div>
            <div><span style={{ fontWeight: 700 }}>Comprimento mínimo coletado:</span> {form.comprimentoColetado || "—"}</div>
            <div><span style={{ fontWeight: 700 }}>Comprimento mínimo analisado:</span> {form.comprimentoAnalisado || "—"}</div>
          </div>
        </div>
      </div>

      {/* ── Dados do Posto / Características do Método ── */}
      <div style={{ display: "flex", borderBottom: "1.5px solid #000", paddingBottom: 10, marginBottom: 15 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 11, marginBottom: 8 }}>Dados do Posto de Coleta</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div><span style={{ fontWeight: 700 }}>Coletado por:</span> {form.postoColeta || "—"}</div>
            <div><span style={{ fontWeight: 700 }}>Analisado por:</span> {form.analisadoPor || "—"}</div>
          </div>
        </div>
        <div style={{ flex: 1, paddingLeft: 15 }}>
          <div style={{ fontWeight: 900, fontSize: 11, marginBottom: 8, color: "#00aeef" }}>Característica do Método</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div><span style={{ fontWeight: 700 }}>Método Analítico (triagem e confirmatório):</span> {form.metodoAnalitico || "—"}</div>
            <div><span style={{ fontWeight: 700 }}>Janela de Detecção:</span> {form.janelaDeteccao || "—"}</div>
          </div>
        </div>
      </div>

      <div style={{ background: "#004a80", color: "#fff", textAlign: "center", padding: "4px 0", fontWeight: 900, fontSize: 12, letterSpacing: 1, marginBottom: 1 }}>
        RESULTADO DE ANÁLISE TOXICOLÓGICA
      </div>

      {/* ── Tabela de Resultados ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #000" }}>
            <th style={{ textAlign: "left", padding: "5px 8px", fontWeight: 900, fontSize: 10, width: "35%" }}>SUBSTÂNCIA</th>
            <th style={{ textAlign: "center", padding: "5px 8px", fontWeight: 900, fontSize: 10, width: "15%" }}>RESULTADO</th>
            <th style={{ textAlign: "center", padding: "5px 8px", fontWeight: 900, fontSize: 10, width: "15%" }}>VALOR OBTIDO</th>
            <th colSpan={2} style={{ textAlign: "center", padding: "5px 8px", fontWeight: 900, fontSize: 10, borderBottom: "1px solid #000" }}>VALORES DE CORTE</th>
          </tr>
          <tr style={{ borderBottom: "1px solid #000" }}>
             <th colSpan={3}></th>
             <th style={{ textAlign: "center", padding: "2px 8px", fontWeight: 900, fontSize: 9 }}>TRIAGEM (ng/mg)</th>
             <th style={{ textAlign: "center", padding: "2px 8px", fontWeight: 900, fontSize: 9 }}>CONFIRMATÓRIO (ng/mg)</th>
          </tr>
        </thead>
        <tbody>
          {SUBSTANCIAS.map((grupo, idx) => (
            <>
              <tr key={grupo.grupo} style={{ background: idx % 2 === 0 ? "#fff" : "#f5f5f5" }}>
                <td style={{ padding: "4px 8px", fontWeight: 900, fontSize: 10 }}>{grupo.grupo}</td>
                <td colSpan={4}></td>
              </tr>
              {grupo.itens.map(item => (
                <tr key={item.nome} style={{ background: idx % 2 === 0 ? "#fff" : "#f5f5f5" }}>
                  <td style={{ padding: "3px 8px", paddingLeft: 15, fontSize: 9 }}>{item.nome}</td>
                  <td style={{ padding: "3px 8px", textAlign: "center", fontSize: 9, fontWeight: 700 }}>{form.resultadoGeral}</td>
                  <td style={{ padding: "3px 8px", textAlign: "center", fontSize: 9 }}>-</td>
                  <td style={{ padding: "3px 8px", textAlign: "center", fontSize: 9 }}>{item.triagem}</td>
                  <td style={{ padding: "3px 8px", textAlign: "center", fontSize: 9 }}>{item.confirmacao}</td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>

      {/* ── Informações Gerais ── */}
      <div style={{ marginBottom: 15 }}>
        <div style={{ fontWeight: 900, fontSize: 11, marginBottom: 5 }}>Informações Gerais</div>
        <div style={{ fontSize: 8.5, lineHeight: 1.4, textAlign: "justify" }}>
          Resultado negativo significa que não foi encontrada substância na quantidade maior do que o valor de corte (cut-off). Resultado positivo significa que foi encontrada substância na quantidade maior ou igual do que o valor de corte (cut-off). Este laudo não pode ser reproduzido parcialmente. A coleta foi realizada pelo posto de coleta: {form.postoColeta || "—"}, {form.postoEndereco || "—"}, não acreditado para esta atividade. O laboratório é responsável por todas as informações fornecidas neste relatório, exceto aquelas fornecidas pelo cliente ou seus representantes. Os resultados acima apresentados referem-se apenas as substâncias analisadas nesta amostra. Análise realizada por {form.metodoAnalitico} e plano de amostragem de acordo com os procedimentos em vigência.
        </div>
      </div>

      <div style={{ border: "2px solid #00aeef", padding: "10px", textAlign: "center", marginBottom: 25 }}>
        <div style={{ fontSize: 13, fontWeight: 900 }}>Validade do Exame: <span style={{ color: "#00aeef" }}>90 dias para finalidade CNH e 60 dias para finalidade CLT (Contados a partir da coleta)</span></div>
      </div>

      {/* ── Footer / Assinatura ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 20 }}>
        <div style={{ fontSize: 9, lineHeight: 1.4 }}>
          <div style={{ fontWeight: 900, fontSize: 11 }}>INNOVATOX Análises e Pesquisas Ltda.</div>
          <div>Rua Levindo Lima, 55 - Pq. Campolim, Sorocaba - SP</div>
          <div>CNPJ: 28.256.904/0001-00</div>
          <div>FOR.TOX.019.V00</div>
        </div>

        <div style={{ textAlign: "center" }}>
           {/* Assinatura Placeholder */}
           <div style={{ position: "relative", width: 220 }}>
             <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 18, marginBottom: 5, color: "#333" }}>
                Rafael Menck de Almeida
             </div>
             <div style={{ borderTop: "1.5px solid #000", width: "100%", margin: "0 auto" }}></div>
             <div style={{ fontWeight: 900, fontSize: 11, marginTop: 4 }}>Rafael Menck de Almeida, PhD</div>
             <div style={{ fontSize: 10, fontWeight: 700 }}>CRF-SP 38295</div>
           </div>
        </div>
      </div>

      {/* QR Code de Validação e Hash */}
      <div style={{ position: "absolute", bottom: 40, left: 40, right: 40, borderTop: "1px solid #eee", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 8, fontFamily: "monospace", color: "#666" }}>
            {codigoValidacao ? codigoValidacao.replace(/-/g, "").toUpperCase() : "AGUARDANDO EMISSÃO"}
          </div>
          <div style={{ fontSize: 7, fontWeight: 700, color: "#aaa" }}>ASSINATURA DIGITAL</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
           <div style={{ fontSize: 8, fontWeight: 700, color: "#333" }}>Pag. 1 de 1</div>
           {validationUrl && (
             <div style={{ padding: 2, background: "#fff", border: "1px solid #ccc" }}>
               <QRCodeSVG value={validationUrl} size={45} />
             </div>
           )}
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
  const [codigoValidacao, setCodigoValidacao] = useState<string | null>(null);
  const [validationUrl, setValidationUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoom, setZoom] = useState(0.7);

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
          ...form,
          tipo: "toxicria",
        }),
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
      await exportElementToPDF(previewRef.current, { filename, scale: 2.5, quality: 1.0 });
    } catch (err: any) {
      toast.error("Erro ao gerar PDF: " + err.message);
    }
  };

  return (
    <div style={{ height: "100vh", width: "100%", overflow: "hidden", background: isDark ? "#0f172a" : "#f1f5f9", fontFamily: "Inter, sans-serif", color: isDark ? "#e2e8f0" : "#1e293b", display: "flex", flexDirection: "column" }}>
      {/* Header Estilo DocMaster Elite */}
      <div style={{ background: "#004a80", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button 
            className="group flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10" 
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold tracking-widest">VOLTAR</span>
          </button>
          <div className="h-8 w-[1px] bg-white/20 mx-2" />
          <FlaskConical size={24} color="#00aeef" />
          <div>
            <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>DocMaster Elite</h1>
            <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em]">Laudo Toxicológico Innovatox</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-black/20 rounded-2xl border border-white/5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Sistema Forense Ativo</span>
            </div>
            <span className="text-xs font-bold text-white/90 bg-indigo-500 px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/20">
              VALOR: R$ 18,00
            </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6 max-w-[1800px] mx-auto overflow-hidden w-full">
        {/* ═══ COLUNA ESQUERDA — FORMULÁRIO ═══ */}
        <div className="w-full lg:w-[420px] lg:flex-shrink-0 lg:overflow-y-auto lg:max-h-[calc(100vh-140px)] custom-scrollbar pr-2">
          <div className="space-y-6">
            {/* Dados do Paciente */}
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-2xl shadow-black/5 border border-gray-100 dark:border-gray-800 transition-all hover:shadow-indigo-500/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Save size={20} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Seção 01</p>
                    <h2 className="text-sm font-black text-gray-800 dark:text-gray-100 uppercase">Identificação</h2>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo do Doador</label>
                  <input className="w-full h-12 px-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-sm font-bold outline-none focus:border-indigo-500 transition-all uppercase" value={form.nome} onChange={e => handleChange("nome", e.target.value.toUpperCase())} placeholder="ALISON ALANDER CASTIGLIONE" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CPF</label>
                    <input className="w-full h-12 px-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-sm font-bold outline-none focus:border-indigo-500 transition-all" value={form.cpf} onChange={e => handleChange("cpf", maskCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Telefone</label>
                    <input className="w-full h-12 px-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-sm font-bold outline-none focus:border-indigo-500 transition-all" value={form.telefone} onChange={e => handleChange("telefone", e.target.value)} placeholder="(00) 0000-0000" />
                  </div>
                </div>
              </div>
            </div>

            {/* Dados Administrativos */}
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-2xl shadow-black/5 border border-gray-100 dark:border-gray-800 transition-all hover:shadow-sky-500/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-sky-50 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center text-sky-600">
                    <FlaskConical size={20} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em]">Seção 02</p>
                    <h2 className="text-sm font-black text-gray-800 dark:text-gray-100 uppercase">Laudo & NF</h2>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Laudo N°</label>
                      <input className="w-full h-12 px-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-sm font-bold outline-none focus:border-sky-500 transition-all" value={form.laudoNumero} onChange={e => handleChange("laudoNumero", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">N° Doc. Fiscal (NF)</label>
                      <input className="w-full h-12 px-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-sm font-bold outline-none focus:border-sky-500 transition-all" value={form.nf} onChange={e => handleChange("nf", e.target.value)} placeholder="00177779" />
                    </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Código da Amostra</label>
                  <input className="w-full h-12 px-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-sm font-bold outline-none focus:border-sky-500 transition-all uppercase" value={form.codigoAmostra} onChange={e => handleChange("codigoAmostra", e.target.value.toUpperCase())} />
                </div>
              </div>
            </div>

            {/* Datas e Coleta */}
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-2xl shadow-black/5 border border-gray-100 dark:border-gray-800">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 border-b border-gray-50 dark:border-gray-800 pb-4">Datas e Local de Coleta</p>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Coleta</label>
                      <input className="w-full h-10 px-3 rounded-xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50/50 text-xs font-bold outline-none" value={form.dataColeta} onChange={e => handleChange("dataColeta", handleDateInput(e.target.value))} maxLength={10} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Recimento</label>
                      <input className="w-full h-10 px-3 rounded-xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50/50 text-xs font-bold outline-none" value={form.dataRecebimento} onChange={e => handleChange("dataRecebimento", handleDateInput(e.target.value))} maxLength={10} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Emissão</label>
                      <input className="w-full h-10 px-3 rounded-xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50/50 text-xs font-bold outline-none" value={form.dataEmissao} onChange={e => handleChange("dataEmissao", handleDateInput(e.target.value))} maxLength={10} />
                    </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Posto de Coleta (Nome Fantasia)</label>
                  <input className="w-full h-12 px-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-sm font-bold outline-none focus:border-indigo-500 transition-all uppercase" value={form.postoColeta} onChange={e => handleChange("postoColeta", e.target.value.toUpperCase())} placeholder="CENTRAL DOM JOAO VI ANALISES CLINICAS EIRELI" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Endereço Completo do Posto</label>
                  <input className="w-full h-12 px-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-sm font-bold outline-none focus:border-indigo-500 transition-all uppercase" value={form.postoEndereco} onChange={e => handleChange("postoEndereco", e.target.value.toUpperCase())} placeholder="AVENIDA DOM JOÃO VI, 494, DIADEMA - SP" />
                </div>
              </div>
            </div>

            {/* Botão de Ação */}
            <div className="sticky bottom-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-4 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-2xl z-20">
              <button 
                className="w-full py-5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-black text-sm rounded-[1.5rem] shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                onClick={() => setShowConfirmModal(true)}
              >
                <Save size={18} />
                <span className="tracking-[0.2em] uppercase">Emitir Laudo Innovatox</span>
              </button>
            </div>
          </div>
        </div>

        {/* ═══ COLUNA DIREITA — PREVIEW INTELIGENTE ═══ */}
        <div className="hidden lg:flex flex-1 flex-col min-w-0 h-full relative group">
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10 pointer-events-none">
            <div className="px-6 py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl pointer-events-auto flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                    <span className="text-[10px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest">Preview Forense 1:1</span>
                </div>
                <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center gap-1">
                    <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors pointer-events-auto"><ZoomOut size={16} /></button>
                    <span className="text-[10px] font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(1.2, z + 0.1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors pointer-events-auto"><ZoomIn size={16} /></button>
                </div>
            </div>

            <div className="flex gap-2 pointer-events-auto">
                <button 
                  className={`p-3 rounded-2xl shadow-xl transition-all ${saved ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-gray-400 text-white cursor-not-allowed'}`}
                  onClick={() => { setIsDownloading(true); handleExport().finally(() => setIsDownloading(false)); }}
                  disabled={!saved}
                >
                  <Download size={20} />
                </button>
                <button className="p-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50">
                  <Maximize2 size={20} />
                </button>
            </div>
          </div>

          <div className="flex-1 bg-[#d1d5db] dark:bg-gray-800/50 rounded-[3rem] p-12 overflow-auto shadow-inner custom-scrollbar-thin flex items-start justify-center">
            <div 
              ref={previewRef} 
              className="bg-white shadow-[0_0_80px_rgba(0,0,0,0.2)] transition-all duration-500 ease-out"
              style={{ 
                width: 794, 
                flexShrink: 0, 
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                marginBottom: 100,
              }}
            >
              <LaudoPreview form={form} codigoValidacao={codigoValidacao} validationUrl={validationUrl} />
            </div>
          </div>
        </div>
      </div>

      <EmissionModal
        docLabel="Laudo Toxicológico Innovatox"
        documentPrice={1800}
        userBalance={user?.balance ?? 0}
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
        isFree={user?.role === 'admin' || (Array.isArray(user?.free_documents) && (user.free_documents.includes('toxicria') || user.free_documents.includes('laudocria')))}
      />
    </div>
  );
}
