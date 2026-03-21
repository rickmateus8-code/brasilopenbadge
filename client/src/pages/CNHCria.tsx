/**
 * CNHCria — Emissão de CNH Digital (Réplica fiel do elitedoc.store/cnhcria)
 *
 * Fluxo completo:
 * 1. Sistema de Importação (Copiar Modelo + Processar Dados)
 * 2. Formulário completo com 4 seções
 * 3. Preview em tempo real via Canvas (CNHDocument)
 * 4. Geração de imagem JPEG via Canvas
 * 5. QR Code com blur anti-fraude (antes da emissão)
 * 6. Botão WhatsApp para entrega após emissão
 * 7. Exportação PDF/JPEG
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import CNHDocument, { type CNHDocumentHandle, type CNHDocumentProps } from "@/components/CNHDocument";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import {
  ArrowLeft, Download, Car, AlertCircle, Zap, Upload, Type,
  Copy, FileText, Lock, MessageCircle, Save
} from "lucide-react";

// ─── Máscaras e Helpers ─────────────────────────────────────────────────────
function maskCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function generateAutoNum(len = 10): string {
  let r = "";
  for (let i = 0; i < len; i++) r += Math.floor(Math.random() * 10);
  return r;
}

function generateAssDigital1(): string {
  return generateAutoNum(10);
}

function generateAssDigital2(uf: string): string {
  return `${uf.toUpperCase()}${generateAutoNum(8)}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// ─── Modelo de texto para importação ────────────────────────────────────────
const MODELO_TEXTO = `Nome Completo:
CPF:
Sexo:
RG:
Órgão Emissor:
UF RG:
Nacionalidade:
Data Nascimento:
Local Nascimento:
UF Nasc:
Nome do Pai:
Nome da Mãe:
Categoria:
Tipo:
Validade:
Emissão:
1ª Habilitação:
Local Emissão:
UF Emissão:
Senha App:
Observações:`;

// ─── Mapa de importação ─────────────────────────────────────────────────────
const MAPA_IMPORTACAO: Record<string, string> = {
  "nome completo": "nome",
  "cpf": "cpf",
  "sexo": "sexo",
  "rg": "rg",
  "orgao emissor": "orgaoEmissor",
  "uf rg": "ufRG",
  "nacionalidade": "nacionalidade",
  "data nascimento": "dataNascimento",
  "local nascimento": "localNascimento",
  "uf nasc": "ufNascimento",
  "nome do pai": "nomePai",
  "nome da mae": "nomeMae",
  "categoria": "categoria",
  "tipo": "tipo",
  "validade": "validade",
  "emissao": "dataEmissao",
  "1a habilitacao": "primeiraHabilitacao",
  "1ª habilitacao": "primeiraHabilitacao",
  "local emissao": "localEmissao",
  "uf emissao": "ufEmissao",
  "senha app": "senhaApp",
  "observacoes": "observacoes",
};

const UFS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

const ESTILOS_ASS = [
  { label: "Estilo 1 (Cursiva Elegante)", font: "'Brush Script MT', 'Segoe Script', cursive" },
  { label: "Estilo 2 (Bradley Hand)", font: "'Bradley Hand', cursive" },
];

interface CNHFormData {
  nome: string;
  cpf: string;
  sexo: string;
  rg: string;
  orgaoEmissor: string;
  ufRG: string;
  nacionalidade: string;
  dataNascimento: string;
  localNascimento: string;
  ufNascimento: string;
  nomePai: string;
  nomeMae: string;
  registro: string;
  espelho: string;
  categoria: string;
  tipo: string;
  validade: string;
  validadeCNH2: string;
  dataEmissao: string;
  primeiraHabilitacao: string;
  localEmissao: string;
  ufEmissao: string;
  assDigital1: string;
  assDigital2: string;
  fotoUrl: string;
  assinaturaUrl: string;
  assinaturaTipo: "digitar" | "upload";
  assinaturaTexto: string;
  assinaturaEstilo: number;
  senhaApp: string;
  observacoes: string;
}

const EMPTY: CNHFormData = {
  nome: "", cpf: "", sexo: "", rg: "", orgaoEmissor: "", ufRG: "",
  nacionalidade: "BRASILEIRA", dataNascimento: "", localNascimento: "",
  ufNascimento: "", nomePai: "", nomeMae: "",
  registro: "", espelho: "", categoria: "", tipo: "Definitiva",
  validade: "", validadeCNH2: "", dataEmissao: todayISO(),
  primeiraHabilitacao: "", localEmissao: "", ufEmissao: "",
  assDigital1: "", assDigital2: "",
  fotoUrl: "", assinaturaUrl: "",
  assinaturaTipo: "digitar", assinaturaTexto: "", assinaturaEstilo: 0,
  senhaApp: "", observacoes: "EAR",
};

export default function CNHCria() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<CNHFormData>(EMPTY);
  const [codigoQR, setCodigoQR] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importText, setImportText] = useState("");
  const docRef = useRef<CNHDocumentHandle>(null);

  const update = useCallback((k: keyof CNHFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let val = e.target.value;
    if (k === "cpf") val = maskCPF(val);
    if (k === "nome" || k === "nomePai" || k === "nomeMae" || k === "localNascimento" || k === "localEmissao" || k === "orgaoEmissor")
      val = val.toUpperCase();
    if (k === "ufRG" || k === "ufNascimento" || k === "ufEmissao")
      val = val.toUpperCase().slice(0, 2);
    setData(d => ({ ...d, [k]: val }));
  }, []);

  // ─── Funções AUTO ─────────────────────────────────────────────────────────
  const handleAutoRegistro = () => setData(d => ({ ...d, registro: generateAutoNum(10) }));
  const handleAutoEspelho = () => setData(d => ({ ...d, espelho: generateAutoNum(10) }));
  const handleAutoAss1 = () => setData(d => ({ ...d, assDigital1: generateAssDigital1() }));
  const handleAutoAss2 = () => setData(d => ({ ...d, assDigital2: generateAssDigital2(d.ufEmissao || "SP") }));

  // ─── Copiar Modelo ────────────────────────────────────────────────────────
  const handleCopiarModelo = () => {
    navigator.clipboard.writeText(MODELO_TEXTO).then(() => {
      toast.success("Modelo copiado para a área de transferência!");
    }).catch(() => {
      toast.error("Erro ao copiar modelo");
    });
  };

  // ─── Processar Importação ─────────────────────────────────────────────────
  const handleProcessarImportacao = () => {
    if (!importText.trim()) {
      toast.error("Cole os dados antes de processar!");
      return;
    }

    const normalizar = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    const converterData = (val: string): string => {
      val = val.trim();
      // dd/mm/yyyy -> yyyy-mm-dd
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
        const [dd, mm, yyyy] = val.split("/");
        return `${yyyy}-${mm}-${dd}`;
      }
      return val;
    };

    const linhas = importText.split("\n");
    const newData = { ...data };
    let count = 0;

    linhas.forEach((linha) => {
      const idx = linha.indexOf(":");
      if (idx === -1) return;
      const chave = normalizar(linha.substring(0, idx));
      const valor = linha.substring(idx + 1).trim();

      const campo = MAPA_IMPORTACAO[chave];
      if (campo && valor) {
        if (campo === "dataNascimento" || campo === "dataEmissao" || campo === "primeiraHabilitacao" || campo === "validade") {
          (newData as any)[campo] = converterData(valor);
        } else if (campo === "cpf") {
          (newData as any)[campo] = maskCPF(valor.replace(/\D/g, ""));
        } else if (campo === "nome" || campo === "nomePai" || campo === "nomeMae" || campo === "localNascimento" || campo === "localEmissao" || campo === "orgaoEmissor") {
          (newData as any)[campo] = valor.toUpperCase();
        } else if (campo === "ufRG" || campo === "ufNascimento" || campo === "ufEmissao") {
          (newData as any)[campo] = valor.toUpperCase().slice(0, 2);
        } else {
          (newData as any)[campo] = valor;
        }
        count++;
      }
    });

    setData(newData);
    toast.success(`${count} campos preenchidos automaticamente!`);
  };

  // ─── Upload Foto ──────────────────────────────────────────────────────────
  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await readFileAsBase64(file);
    setData(d => ({ ...d, fotoUrl: b64 }));
  };

  // ─── Upload Assinatura ────────────────────────────────────────────────────
  const handleAssinaturaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await readFileAsBase64(file);
    setData(d => ({ ...d, assinaturaUrl: b64, assinaturaTipo: "upload" }));
  };

  // ─── Gerar Assinatura Texto ───────────────────────────────────────────────
  const gerarAssinaturaTexto = useCallback(() => {
    if (!data.assinaturaTexto) return;
    const canvas = document.createElement("canvas");
    const estilo = ESTILOS_ASS[data.assinaturaEstilo] || ESTILOS_ASS[0];
    const isStyle2 = estilo.font.includes("Bradley");
    const fontSize = isStyle2 ? 48 : 38;

    const tempCtx = canvas.getContext("2d");
    if (!tempCtx) return;
    tempCtx.font = `${fontSize}px ${estilo.font}`;
    const metrics = tempCtx.measureText(data.assinaturaTexto);
    canvas.width = Math.ceil(metrics.width) + 20;
    canvas.height = fontSize + 30;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${fontSize}px ${estilo.font}`;
    ctx.fillStyle = "#1a1a6e";
    ctx.textBaseline = "middle";
    ctx.fillText(data.assinaturaTexto, 10, canvas.height / 2);

    const b64 = canvas.toDataURL("image/png");
    setData(d => ({ ...d, assinaturaUrl: b64, assinaturaTipo: "digitar" }));
    toast.success("Assinatura gerada!");
  }, [data.assinaturaTexto, data.assinaturaEstilo]);

  // ─── Salvar Documento ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!data.nome || !data.cpf) {
      toast.error("Preencha Nome e CPF obrigatoriamente!");
      return;
    }
    if ((user?.balance || 0) <= 0) {
      toast.error("Saldo insuficiente. Recarregue para emitir documentos.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/documents/cnh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          type: "cnh",
        }),
      });
      const result = await res.json();
      if (result.success) {
        const codigo = result.data?.codigoValidacao || result.data?.codigo_validacao || result.data?.id || "CNH-" + Date.now();
        setCodigoQR(codigo);
        setSaved(true);
        toast.success("CNH Digital emitida com sucesso!");
      } else {
        toast.error(result.error || "Erro ao gerar CNH");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  // ─── Exportar como JPEG ───────────────────────────────────────────────────
  const handleExportJPEG = async () => {
    if (!docRef.current) return;
    setLoading(true);
    try {
      const blob = await docRef.current.exportAsBlob();
      if (!blob) throw new Error("Falha ao gerar imagem");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CNH_${data.nome.replace(/\s+/g, "_") || "DOCUMENTO"}_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Imagem JPEG exportada!");
    } catch {
      toast.error("Erro ao exportar imagem");
    } finally {
      setLoading(false);
    }
  };

  // ─── WhatsApp Share ───────────────────────────────────────────────────────
  const handleWhatsApp = () => {
    const texto = encodeURIComponent(
      `*DocMaster - CNH Digital*\n\nOlá! Segue sua CNH Digital gerada pelo DocMaster.\n\nNome: ${data.nome}\nCPF: ${data.cpf}\nCategoria: ${data.categoria}\n\nAcesse o documento: https://docmaster.store/v/${codigoQR}\n\nSenha App: ${data.senhaApp || "Não definida"}\n\n_Documento gerado por DocMaster_`
    );
    window.open(`https://wa.me/?text=${texto}`, "_blank");
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
  const labelCls = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1";
  const sectionCls = "text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide flex items-center gap-2";
  const autoBtnCls = "px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap";

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/dashboard")} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                (Criação de CNH) <span className="text-black dark:text-white">DOCMASTER</span><span className="text-blue-500">.STORE</span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Carteira Nacional de Habilitação Digital</p>
            </div>
          </div>
          <div className="flex gap-2">
            {saved && (
              <>
                <button onClick={handleExportJPEG} disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-60">
                  <Download className="w-4 h-4" />
                  BAIXAR JPEG
                </button>
                <button onClick={handleWhatsApp}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl text-sm transition-all">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
              </>
            )}
          </div>
        </div>

        {/* Balance Warning */}
        {(user?.balance || 0) <= 0 && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">
              Saldo insuficiente. <button onClick={() => setLocation("/recargas")} className="font-semibold underline">Recarregue aqui</button>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* ===== FORMULÁRIO ===== */}
          <div className="space-y-6">

            {/* IMPORTAÇÃO DE DADOS */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className={sectionCls}>
                <FileText className="w-4 h-4 text-blue-500" /> Importação Rápida
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Col 1: Envie para o Cliente */}
                <div>
                  <label className={labelCls}>1. Envie para o Cliente</label>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap h-40 overflow-auto border border-gray-200 dark:border-gray-700">
                    {MODELO_TEXTO}
                  </div>
                  <button onClick={handleCopiarModelo}
                    className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs transition-colors">
                    <Copy className="w-3 h-3" /> COPIAR MODELO
                  </button>
                </div>
                {/* Col 2: Cole o texto preenchido */}
                <div>
                  <label className={labelCls}>2. Cole o texto preenchido</label>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Cole aqui os dados preenchidos pelo cliente..."
                    className={inputCls + " h-40 resize-none border-blue-300 dark:border-blue-700 border-dashed"}
                  />
                  <button onClick={handleProcessarImportacao}
                    className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg text-xs transition-colors">
                    <Zap className="w-3 h-3" /> PROCESSAR DADOS
                  </button>
                </div>
              </div>
            </div>

            {/* 1. DADOS PESSOAIS */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className={sectionCls}>
                <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">1</span>
                DADOS PESSOAIS
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className={labelCls}>Nome Completo *</label>
                    <input type="text" value={data.nome} onChange={update("nome")} placeholder="NOME COMPLETO" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>CPF *</label>
                    <input type="text" value={data.cpf} onChange={update("cpf")} placeholder="000.000.000-00" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className={labelCls}>Sexo</label>
                    <select value={data.sexo} onChange={update("sexo")} className={inputCls}>
                      <option value="">Escolha</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>RG</label>
                    <input type="text" value={data.rg} onChange={update("rg")} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Órgão Emissor</label>
                    <input type="text" value={data.orgaoEmissor} onChange={update("orgaoEmissor")} placeholder="SSP" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>UF RG</label>
                    <input type="text" value={data.ufRG} onChange={update("ufRG")} placeholder="SP" maxLength={2} className={inputCls + " uppercase"} />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className={labelCls}>Nacionalidade</label>
                    <input type="text" value={data.nacionalidade} onChange={update("nacionalidade")} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Data Nascimento</label>
                    <input type="date" value={data.dataNascimento} onChange={update("dataNascimento")} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Local Nascimento</label>
                    <input type="text" value={data.localNascimento} onChange={update("localNascimento")} placeholder="CIDADE" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>UF Nasc.</label>
                    <input type="text" value={data.ufNascimento} onChange={update("ufNascimento")} placeholder="SP" maxLength={2} className={inputCls + " uppercase"} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nome do Pai</label>
                    <input type="text" value={data.nomePai} onChange={update("nomePai")} placeholder="NOME DO PAI" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Nome da Mãe</label>
                    <input type="text" value={data.nomeMae} onChange={update("nomeMae")} placeholder="NOME DA MÃE" className={inputCls} />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. DADOS DA CNH */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className={sectionCls}>
                <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">2</span>
                DADOS DA CNH
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className={labelCls}>Nº Registro</label>
                    <div className="flex gap-1">
                      <input type="text" value={data.registro} onChange={update("registro")} placeholder="AUTO" className={inputCls + " flex-1"} />
                      <button onClick={handleAutoRegistro} className={autoBtnCls}>AUTO</button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Nº CNH (Espelho)</label>
                    <div className="flex gap-1">
                      <input type="text" value={data.espelho} onChange={update("espelho")} placeholder="AUTO" className={inputCls + " flex-1"} />
                      <button onClick={handleAutoEspelho} className={autoBtnCls}>AUTO</button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Categoria</label>
                    <input type="text" value={data.categoria} onChange={update("categoria")} placeholder="Ex: AB" className={inputCls + " uppercase"} />
                  </div>
                  <div>
                    <label className={labelCls}>Tipo</label>
                    <select value={data.tipo} onChange={update("tipo")} className={inputCls}>
                      <option value="Definitiva">Definitiva</option>
                      <option value="Permissão">Permissão</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Validade</label>
                    <input type="date" value={data.validade} onChange={update("validade")} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Emissão</label>
                    <input type="date" value={data.dataEmissao} onChange={update("dataEmissao")} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>1ª Habilitação</label>
                    <input type="date" value={data.primeiraHabilitacao} onChange={update("primeiraHabilitacao")} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Local Emissão</label>
                    <input type="text" value={data.localEmissao} onChange={update("localEmissao")} placeholder="CIDADE" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>UF Emissão</label>
                    <select value={data.ufEmissao} onChange={update("ufEmissao")} className={inputCls}>
                      <option value="">UF</option>
                      {UFS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. CÓDIGO DE SEGURANÇA */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className={sectionCls}>
                <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">3</span>
                <Lock className="w-4 h-4 text-gray-500" /> CÓDIGO DE SEGURANÇA
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Ass. Digital 1</label>
                  <div className="flex gap-1">
                    <input type="text" value={data.assDigital1} onChange={update("assDigital1")} placeholder="AUTO" className={inputCls + " flex-1"} />
                    <button onClick={handleAutoAss1} className={autoBtnCls}>AUTO</button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Ass. Digital 2</label>
                  <div className="flex gap-1">
                    <input type="text" value={data.assDigital2} onChange={update("assDigital2")} placeholder="UF + Dígitos" className={inputCls + " flex-1"} />
                    <button onClick={handleAutoAss2} className={autoBtnCls}>AUTO</button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. FOTOS E ACESSO */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className={sectionCls}>
                <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">4</span>
                FOTOS E ACESSO
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Foto do Rosto */}
                <div>
                  <label className={labelCls}>Foto do Rosto</label>
                  <p className="text-[10px] text-blue-500 mb-2">
                    <a href="https://www.remove.bg/pt-br" target="_blank" rel="noopener noreferrer" className="underline">
                      Remova o fundo AQUI
                    </a>
                  </p>
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors text-sm border border-dashed border-gray-300 dark:border-gray-600">
                    <Upload className="w-4 h-4" />
                    Escolher Arquivo
                    <input type="file" accept="image/*" onChange={handleFotoUpload} className="hidden" />
                  </label>
                  {/* Prévia Rosto */}
                  <div className="mt-3">
                    <p className="text-[10px] text-gray-400 mb-1">Prévia Rosto</p>
                    <div className="w-[120px] h-[160px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                      {data.fotoUrl ? (
                        <img src={data.fotoUrl} alt="Rosto" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-gray-400">Sem foto</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assinatura */}
                <div>
                  <label className={labelCls}>Assinatura (Foto ou Digite)</label>
                  {/* Opção 1: Digitar */}
                  <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800 mb-3">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">
                      <Type className="w-3 h-3" /> Opção 1: Digite o Nome
                    </p>
                    <p className="text-[10px] text-gray-500 mb-2">Escolha um estilo e escreva o nome para gerar a assinatura.</p>
                    <select
                      value={data.assinaturaEstilo}
                      onChange={(e) => setData(d => ({ ...d, assinaturaEstilo: parseInt(e.target.value) }))}
                      className={inputCls + " mb-2"}
                    >
                      {ESTILOS_ASS.map((e, i) => <option key={i} value={i}>{e.label}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <input type="text" value={data.assinaturaTexto} onChange={update("assinaturaTexto")}
                        placeholder="Digite o nome..." className={inputCls + " flex-1"} />
                      <button onClick={gerarAssinaturaTexto}
                        className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap">
                        Gerar
                      </button>
                    </div>
                  </div>
                  {/* Opção 2: Upload */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800 mb-3">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1">
                      <Upload className="w-3 h-3" /> Opção 2: Envie uma Foto
                    </p>
                    <p className="text-[10px] text-gray-500 mb-2">Use uma imagem com fundo transparente ou branco.</p>
                    <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg cursor-pointer transition-colors text-sm border border-dashed border-blue-300 dark:border-blue-600">
                      <Upload className="w-4 h-4" />
                      Escolher Arquivo
                      <input type="file" accept="image/*" onChange={handleAssinaturaUpload} className="hidden" />
                    </label>
                  </div>
                  {/* Prévia Assinatura */}
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">Prévia Assinatura</p>
                    <div className="h-14 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                      {data.assinaturaUrl ? (
                        <img src={data.assinaturaUrl} alt="Assinatura" className="h-10 object-contain" />
                      ) : (
                        <span className="text-[10px] text-gray-400">Sem assinatura</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Senha App + Observações */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <label className={labelCls}>Senha App Cliente</label>
                  <input type="text" value={data.senhaApp} onChange={update("senhaApp")} placeholder="Senha para acesso" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Observações (EAR)</label>
                  <textarea value={data.observacoes} onChange={update("observacoes")} rows={2}
                    placeholder="EAR" className={inputCls + " resize-none border-blue-300 dark:border-blue-700 border-dashed"} />
                </div>
              </div>
            </div>

            {/* BOTÃO SALVAR */}
            <button onClick={handleSave} disabled={loading || saved}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg">
              {loading ? (
                <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Gerando Documento...</>
              ) : saved ? (
                <><Lock className="w-4 h-4" /> DOCUMENTO EMITIDO</>
              ) : (
                <><Save className="w-4 h-4" /> SALVAR DOCUMENTO</>
              )}
            </button>

            {/* Resultado pós-emissão */}
            {saved && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl space-y-2">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">CNH Digital emitida com sucesso!</p>
                <p className="text-xs text-green-600 dark:text-green-500">Código: <span className="font-mono font-bold">{codigoQR}</span></p>
                <p className="text-xs text-green-600 dark:text-green-500">Validação: docmaster.store/v/{codigoQR}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={handleExportJPEG}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-xs transition-all">
                    <Download className="w-3 h-3" /> Baixar JPEG
                  </button>
                  <button onClick={handleWhatsApp}
                    className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold rounded-lg text-xs transition-all">
                    <MessageCircle className="w-3 h-3" /> Enviar via WhatsApp
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ===== PREVIEW ===== */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
              Pré-visualização do Documento
            </h2>
            <div className="sticky top-4">
              <div style={{ width: 595, overflow: "hidden" }}>
                <CNHDocument
                  ref={docRef}
                  nome={data.nome}
                  cpf={data.cpf}
                  rg={data.rg}
                  orgaoEmissor={data.orgaoEmissor}
                  ufRG={data.ufRG}
                  sexo={data.sexo}
                  nacionalidade={data.nacionalidade}
                  dataNascimento={data.dataNascimento}
                  localNascimento={data.localNascimento}
                  ufNascimento={data.ufNascimento}
                  nomePai={data.nomePai}
                  nomeMae={data.nomeMae}
                  categoria={data.categoria}
                  tipo={data.tipo}
                  registro={data.registro}
                  espelho={data.espelho}
                  validade={data.validade}
                  validadeCNH2={data.validadeCNH2}
                  dataEmissao={data.dataEmissao}
                  primeiraHabilitacao={data.primeiraHabilitacao}
                  localEmissao={data.localEmissao}
                  ufEmissao={data.ufEmissao}
                  assDigital1={data.assDigital1}
                  assDigital2={data.assDigital2}
                  senhaApp={data.senhaApp}
                  observacoes={data.observacoes}
                  fotoUrl={data.fotoUrl}
                  assinaturaUrl={data.assinaturaUrl}
                  codigoQR={saved ? codigoQR : "PREVIEW"}
                  blurred={!saved}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
