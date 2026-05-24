import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import DashboardLayout from "@/components/DashboardLayout";
import EmissionModal from "@/components/EmissionModal";
import { toast } from "sonner";
import { ArrowLeft, Copy, RefreshCw, Wand2, Save, Download } from "lucide-react";
import { validarCPF, formatarCPF } from "@/lib/utils";

/* ── Constantes ── */
const LOCAIS_EMISSAO = [
  { code: "CPSP", label: "CPSP (SP)", num: "381" },
  { code: "CPRJ", label: "CPRJ (RJ)", num: "391" },
  { code: "CPES", label: "CPES (ES)", num: "401" },
  { code: "CPPR", label: "CPPR (PR)", num: "382" },
  { code: "CPSC", label: "CPSC (SC)", num: "441" },
  { code: "CPRS", label: "CPRS (RS)", num: "461" },
  { code: "CPBA", label: "CPBA (BA)", num: "481" },
  { code: "CPSE", label: "CPSE (SE)", num: "491" },
  { code: "CPAL", label: "CPAL (AL)", num: "541" },
  { code: "CPPE", label: "CPPE (PE)", num: "531" },
  { code: "CPPB", label: "CPPB (PB)", num: "551" },
  { code: "CPRN", label: "CPRN (RN)", num: "521" },
  { code: "CPCE", label: "CPCE (CE)", num: "561" },
  { code: "CPPI", label: "CPPI (PI)", num: "571" },
  { code: "CPMA", label: "CPMA (MA)", num: "511" },
  { code: "CFB",  label: "CFB (DF)",  num: "861" },
  { code: "CFAOC",label: "CFAOC (AM)",num: "661" },
  { code: "CPAOR",label: "CPAOR (PA)",num: "611" },
  { code: "CPAP", label: "CPAP (AP)", num: "621" },
  { code: "CFMT", label: "CFMT (MT)", num: "671" },
];

const CATEGORIAS = ["ARRAIS-AMADOR", "MOTONAUTA", "MESTRE-AMADOR", "CAPITÃO-AMADOR", "VELEIRO"];
const CATEGORIAS2 = ["NENHUMA", ...CATEGORIAS];
const TRADUCOES: Record<string, string> = {
  "ARRAIS-AMADOR": "AMATEUR SKIPPER",
  "MOTONAUTA": "PERSONAL WATERCRAFT PILOT",
  "MESTRE-AMADOR": "COASTAL SKIPPER",
  "CAPITÃO-AMADOR": "AMATEUR CAPTAIN",
  "VELEIRO": "SAILBOAT SKIPPER",
};

const MODELO_TEXTO = `Nome Completo:
CPF:
Senha de Acesso:
Nascimento:
Emissão:
Validade:
Categoria 1:
Categoria 2:
Local de Emissão:`;

/* ── Canvas field maps ── */
const jsonFrente = {
  width: 1600, height: 952,
  fields: [
    { label: "NOME", x: 55, y: 272, w: 920, h: 58, size: 32 },
    { label: "NASCIMENTO", x: 55, y: 382, w: 320, h: 58, size: 32 },
    { label: "CPF", x: 445, y: 382, w: 530, h: 58, size: 32 },
    { label: "CATEGORIA", x: 55, y: 492, w: 920, h: 58, size: 32 },
    { label: "VALIDADE", x: 55, y: 602, w: 320, h: 58, size: 32 },
    { label: "INSCRICAO", x: 445, y: 602, w: 530, h: 58, size: 32 },
    { label: "FOTO", x: 1025, y: 250, w: 530, h: 420 },
  ],
};
const jsonVerso = {
  width: 1600, height: 952,
  fields: [
    { label: "LIMITES DA NAVEGAÇÃO", x: 55, y: 52, w: 1140, h: 148, size: 30 },
    { label: "REQUISITOS", x: 55, y: 242, w: 1140, h: 148, size: 30 },
    { label: "ORGÃO DE EMISSÃO", x: 55, y: 432, w: 660, h: 58, size: 32 },
    { label: "DATA DE EMISSAO", x: 785, y: 432, w: 410, h: 58, size: 32 },
  ],
};

interface CHAForm {
  cpf: string;
  senha: string;
  nome: string;
  localCode: string;
  inscricao: string;
  nascimento: string;
  emissao: string;
  validade: string;
  categoria1: string;
  categoria2: string;
  limites: string;
  requisitos: string;
}

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const EMPTY: CHAForm = {
  cpf: "", senha: "", nome: "", localCode: "CPSP",
  inscricao: "", nascimento: "", emissao: today(),
  validade: "", categoria1: "ARRAIS-AMADOR", categoria2: "NENHUMA",
  limites: "NAVEGAÇÃO INTERIOR\nINLAND NAVIGATION",
  requisitos: "******** / ********",
};

export default function CHACria() {
  const { user, updateBalance } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [, setLocation] = useLocation();
  const [form, setForm] = useState<CHAForm>({ ...EMPTY });
  const [loading, setSaving] = useState(false);
  const [importText, setImportText] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [documentPrice, setDocumentPrice] = useState(0);
  const canvasFrenteRef = useRef<HTMLCanvasElement>(null);
  const canvasVersoRef = useRef<HTMLCanvasElement>(null);
  const baseFrenteRef = useRef<HTMLImageElement | null>(null);
  const baseVersoRef = useRef<HTMLImageElement | null>(null);
  const fotoImgRef = useRef<HTMLImageElement | null>(null);
  const [basesLoaded, setBasesLoaded] = useState(0);

  const up = (k: keyof CHAForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let val = e.target.value;
    if (k === "cpf") val = formatarCPF(val);
    setForm(f => ({ ...f, [k]: val }));
  };

  /* ── Load base images ── */
  useEffect(() => {
    const f = new Image(); f.crossOrigin = "anonymous"; f.src = "/frentecha.png";
    const v = new Image(); v.crossOrigin = "anonymous"; v.src = "/versocha.png";
    f.onload = () => { baseFrenteRef.current = f; setBasesLoaded(p => p + 1); };
    v.onload = () => { baseVersoRef.current = v; setBasesLoaded(p => p + 1); };
  }, []);

  /* ── Generate inscription number ── */
  const gerarInscricao = useCallback(() => {
    const local = LOCAIS_EMISSAO.find(l => l.code === form.localCode);
    const prefix = local?.num || "381";
    const letter = "P";
    const year = new Date().getFullYear();
    const rand = String(Math.floor(1000000 + Math.random() * 9000000));
    return `${prefix}${letter}${year}${rand}`;
  }, [form.localCode]);

  useEffect(() => {
    if (!form.inscricao) setForm(f => ({ ...f, inscricao: gerarInscricao() }));
  }, []);

  /* ── Auto validade (+5 years from emissao) ── */
  const autoValidade = () => {
    const em = form.emissao;
    if (!em) { toast.error("Preencha a data de emissão primeiro"); return; }
    const parts = em.split("/");
    if (parts.length === 3) {
      const y = parseInt(parts[2]) + 5;
      setForm(f => ({ ...f, validade: `${parts[0]}/${parts[1]}/${y}` }));
    }
  };

  /* ── Process import text ── */
  const processImport = () => {
    if (!importText.trim()) { toast.error("Cole o texto primeiro"); return; }
    const lines = importText.split("\n").map(l => l.trim()).filter(Boolean);
    const extract = (key: string) => {
      const line = lines.find(l => l.toLowerCase().startsWith(key.toLowerCase()));
      return line ? line.split(":").slice(1).join(":").trim() : "";
    };
    setForm(f => ({
      ...f,
      nome: extract("Nome Completo") || extract("Nome") || f.nome,
      cpf: extract("CPF") || f.cpf,
      senha: extract("Senha") || extract("Senha de Acesso") || f.senha,
      nascimento: extract("Nascimento") || extract("Data de Nascimento") || f.nascimento,
      emissao: extract("Emissão") || extract("Emissao") || f.emissao,
      validade: extract("Validade") || f.validade,
      categoria1: extract("Categoria 1") || extract("Categoria") || f.categoria1,
      categoria2: extract("Categoria 2") || f.categoria2,
      localCode: extract("Local de Emissão") || extract("Local") || f.localCode,
    }));
    toast.success("Dados importados!");
  };

  /* ── Render canvas ── */
  const renderCanvas = useCallback(() => {
    if (basesLoaded < 2) return;
    const baseF = baseFrenteRef.current;
    const baseV = baseVersoRef.current;
    if (!baseF || !baseV) return;

    // Build data object
    const cat1 = form.categoria1;
    const cat2 = form.categoria2 !== "NENHUMA" ? form.categoria2 : "";
    const catText = cat2 ? `${cat1}\n${TRADUCOES[cat1] || ""}\n${cat2}\n${TRADUCOES[cat2] || ""}` : `${cat1}\n${TRADUCOES[cat1] || ""}`;

    const dados: Record<string, string> = {
      "NOME": form.nome.toUpperCase(),
      "INSCRICAO": form.inscricao,
      "CPF": form.cpf,
      "NASCIMENTO": form.nascimento,
      "VALIDADE": form.validade,
      "CATEGORIA": catText,
      "LIMITES DA NAVEGAÇÃO": form.limites,
      "REQUISITOS": form.requisitos,
      "ORGÃO DE EMISSÃO": form.localCode,
      "DATA DE EMISSAO": form.emissao,
    };

    // Render frente
    const cf = canvasFrenteRef.current;
    if (cf) {
      cf.width = jsonFrente.width;
      cf.height = jsonFrente.height;
      const ctx = cf.getContext("2d")!;
      ctx.drawImage(baseF, 0, 0, jsonFrente.width, jsonFrente.height);

      for (const f of jsonFrente.fields) {
        if (f.label === "FOTO") {
          if (fotoImgRef.current && fotoUrl) {
            ctx.drawImage(fotoImgRef.current, f.x, f.y, f.w, f.h);
          }
          continue;
        }
        const txt = dados[f.label];
        if (!txt) continue;
        ctx.fillStyle = "#333";
        ctx.textBaseline = "top";
        if (txt.includes("\n")) {
          const lines = txt.split("\n");
          const lineH = (f.size || 30) + 4;
          lines.forEach((line, i) => {
            ctx.font = `bold ${f.size || 30}px Arial`;
            ctx.fillText(line, f.x + 8, f.y + 8 + i * lineH, f.w - 16);
          });
        } else {
          ctx.font = `bold ${f.size || 30}px Arial`;
          ctx.fillText(txt, f.x + 8, f.y + 8, f.w - 16);
        }
      }
    }

    // Render verso
    const cv = canvasVersoRef.current;
    if (cv) {
      cv.width = jsonVerso.width;
      cv.height = jsonVerso.height;
      const ctx = cv.getContext("2d")!;
      ctx.drawImage(baseV, 0, 0, jsonVerso.width, jsonVerso.height);

      for (const f of jsonVerso.fields) {
        const txt = dados[f.label];
        if (!txt) continue;
        ctx.fillStyle = "#333";
        ctx.textBaseline = "top";
        if (txt.includes("\n")) {
          const lines = txt.split("\n");
          const lineH = (f.size || 30) + 4;
          lines.forEach((line, i) => {
            ctx.font = `bold ${f.size || 30}px Arial`;
            ctx.fillText(line, f.x + 8, f.y + 8 + i * lineH, f.w - 16);
          });
        } else {
          ctx.font = `bold ${f.size || 30}px Arial`;
          ctx.fillText(txt, f.x + 8, f.y + 8, f.w - 16);
        }
      }
    }
  }, [form, basesLoaded, fotoUrl]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  /* ── Photo upload ── */
  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setFotoUrl(url);
      const img = new Image();
      img.onload = () => { fotoImgRef.current = img; renderCanvas(); };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  /* ── Request emit (abre modal de confirmação) ── */
  const handleRequestEmit = async () => {
    if (!form.nome.trim()) { toast.error("Preencha o nome"); return; }
    if (!form.cpf.trim()) { toast.error("Preencha o CPF"); return; }
    if (!validarCPF(form.cpf)) { toast.error("CPF inválido"); return; }
    if (!form.senha.trim()) { toast.error("Crie uma senha de acesso"); return; }
    // Buscar preço antes de mostrar modal
    try {
      const pricingRes = await fetch("/api/pricing", { credentials: "include" });
      const pricingData = await pricingRes.json();
      if (pricingData.success && pricingData.pricing?.cha) setDocumentPrice(pricingData.pricing.cha.price);
    } catch { /* usa preço padrão 0 */ }
    setShowConfirmModal(true);
  };

  /* ── Save (chamado após confirmação) ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/documents/cha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome: form.nome.toUpperCase(),
          cpf: form.cpf,
          data: {
            ...form,
            nome: form.nome.toUpperCase(),
            fotoBase64: fotoUrl || "",
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setShowConfirmModal(false);
        setShowSuccessModal(true);
      } else {
        toast.error(json.error || "Erro ao salvar");
        setShowConfirmModal(false);
      }
    } catch {
      toast.error("Erro de conexão");
      setShowConfirmModal(false);
    } finally {
      setSaving(false);
    }
  };

  /* ── Download canvas as image ── */
  const handleDownloadCHA = async () => {
    setIsDownloading(true);
    try {
      const cf = canvasFrenteRef.current;
      const cv = canvasVersoRef.current;
      if (cf) {
        const link = document.createElement("a");
        const nomeCHA = (form.nome || "DOCUMENTO").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
        link.download = `CHA_NAUTICA_${nomeCHA}_FRENTE.png`; // CHA tem frente e verso - mantém sufixo para distinção
        link.href = cf.toDataURL("image/png");
        link.click();
      }
      if (cv) {
        await new Promise(r => setTimeout(r, 500));
        const link = document.createElement("a");
        const nomeCHAVerso = (form.nome || "DOCUMENTO").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
        link.download = `CHA_NAUTICA_${nomeCHAVerso}_VERSO.png`; // CHA tem frente e verso - mantém sufixo para distinção
        link.href = cv.toDataURL("image/png");
        link.click();
      }
    } catch {
      toast.error("Erro ao baixar imagens");
    } finally {
      setIsDownloading(false);
    }
  };

  /* ── Copy model ── */
  const copyModel = () => {
    navigator.clipboard.writeText(MODELO_TEXTO);
    toast.success("Modelo copiado!");
  };

  /* ── Clear ── */
  const limpar = () => {
    setForm({ ...EMPTY, inscricao: gerarInscricao() });
    setFotoUrl(null);
    fotoImgRef.current = null;
    setImportText("");
    toast.info("Formulário limpo");
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-white dark:bg-gray-950 font-sans transition-colors">
      <div className="flex-1 overflow-y-auto p-4 max-w-[1400px] mx-auto w-full custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-bold">
            <ArrowLeft className="w-4 h-4" /> VOLTAR
          </button>
          <button onClick={limpar} className="px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-gray-700 dark:text-gray-300">
            LIMPAR
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── LEFT: Form ── */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Dados do Cliente</h2>

            {/* Import section */}
            <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">1. ENVIAR PARA O CLIENTE</p>
                  <pre className="text-[10px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 h-28 overflow-auto whitespace-pre-wrap text-gray-600 dark:text-gray-400">{MODELO_TEXTO}</pre>
                  <button onClick={copyModel} className="mt-1 w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-200">
                    <Copy className="w-3 h-3" /> COPIAR MODELO
                  </button>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">2. COLAR RESPOSTA</p>
                  <textarea
                    value={importText}
                    onChange={e => setImportText(e.target.value)}
                    placeholder="Cole aqui..."
                    className="w-full h-28 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <button onClick={processImport} className="mt-1 w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                    <Wand2 className="w-3 h-3" /> PROCESSAR
                  </button>
                </div>
              </div>
            </div>

            {/* Access data */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">DADOS DE ACESSO (PARA O APP)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">CPF (LOGIN)</label>
                  <input type="text" value={form.cpf} onChange={up("cpf")} placeholder="000.000.000-00"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">SENHA DE ACESSO</label>
                  <input type="text" value={form.senha} onChange={up("senha")} placeholder="Crie uma senha"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-gray-500">NOME COMPLETO</label>
              <input type="text" value={form.nome} onChange={up("nome")}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>

            {/* Local + Inscricao */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500">1. LOCAL DE EMISSÃO</label>
                <select value={form.localCode} onChange={up("localCode") as any}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400">
                  {LOCAIS_EMISSAO.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
                <input type="text" value={form.localCode} readOnly className="mt-1 w-full px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">2. Nº INSCRIÇÃO</label>
                <input type="text" value={form.inscricao} onChange={up("inscricao")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div className="flex items-end">
                <button onClick={() => setForm(f => ({ ...f, inscricao: gerarInscricao() }))}
                  className="w-full px-3 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1">
                  <RefreshCw className="w-3 h-3" /> GERAR
                </button>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500">NASCIMENTO</label>
                <input type="text" value={form.nascimento} onChange={up("nascimento")} placeholder="DD/MM/AAAA"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">EMISSÃO</label>
                <input type="text" value={form.emissao} onChange={up("emissao")} placeholder="Hoje"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">VALIDADE</label>
                <input type="text" value={form.validade} onChange={up("validade")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div className="flex items-end">
                <button onClick={autoValidade}
                  className="w-full px-3 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  AUTO
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500">CATEGORIA 1</label>
                <select value={form.categoria1} onChange={up("categoria1") as any}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400">
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">CATEGORIA 2</label>
                <select value={form.categoria2} onChange={up("categoria2") as any}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400">
                  {CATEGORIAS2.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Limites */}
            <div>
              <label className="text-xs font-semibold text-gray-500">LIMITES DA NAVEGAÇÃO</label>
              <textarea value={form.limites} onChange={up("limites")} rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>

            {/* Requisitos */}
            <div>
              <label className="text-xs font-semibold text-gray-500">REQUISITOS</label>
              <input type="text" value={form.requisitos} onChange={up("requisitos")}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>

            {/* Photo */}
            <div>
              <label className="text-xs font-semibold text-gray-500">FOTO 3X4 (UPLOAD)</label>
              <input type="file" accept="image/*" onChange={handleFoto}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
            </div>

            {/* Save button */}
            {!saved && (
              <button
                onClick={handleRequestEmit}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-xl transition-colors"
              >
                <Save className="w-4 h-4" />
                {loading ? "SALVANDO..." : "EMITIR CHA NAUTICA"}
              </button>
            )}
            {saved && (
              <button
                onClick={handleDownloadCHA}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />
                {isDownloading ? "BAIXANDO..." : "BAIXAR CHA NAUTICA"}
              </button>
            )}
          </div>

          {/* ── RIGHT: Canvas Preview ── */}
          <div className="space-y-4">
            <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">PREVIEW</p>
            <div className="space-y-4">
              <canvas ref={canvasFrenteRef} className="w-full rounded-xl shadow-lg border border-gray-200 dark:border-gray-700" />
              <canvas ref={canvasVersoRef} className="w-full rounded-xl shadow-lg border border-gray-200 dark:border-gray-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação + Sucesso */}
      <EmissionModal
        docLabel="CHA Náutica"
        docEmoji="⚓"
        documentPrice={1800}
        userBalance={user?.balance ?? 0}
        showConfirm={showConfirmModal}
        showSuccess={showSuccessModal}
        isEmitting={loading}
        isDownloading={isDownloading}
        onConfirm={handleSave}
        onCancel={() => setShowConfirmModal(false)}
        onDownload={handleDownloadCHA}
        onClose={() => setShowSuccessModal(false)}
        historyPath="/chasalvas"
        isFree={user?.role === 'admin' || (Array.isArray(user?.free_documents) && user.free_documents.includes('cha'))}
      />
    </div>
  );
}
