/**
 * CNHCria — Emissão de CNH Digital
 *
 * Formulário completo com:
 * - Dados Pessoais (nome, cpf, sexo, rg, órgão, uf, nacionalidade, nascimento, filiação)
 * - Dados da CNH (registro, espelho, categoria, tipo, validade, emissão, 1ª hab, local, uf)
 * - Código de Segurança (ass. digital 1 e 2 com AUTO)
 * - Fotos e Acesso (foto rosto, assinatura digitada ou upload, senha app, observações)
 * - Preview em tempo real com CNHDocument
 * - QR Code com blur anti-fraude antes da emissão
 * - Exportação PDF
 */
import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import CNHDocument from "@/components/CNHDocument";
import { exportElementToPDF, generatePDFFilename } from "@/lib/pdfExport";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { ArrowLeft, Download, Car, AlertCircle, Zap, Upload, Type } from "lucide-react";

// ─── Máscaras ────────────────────────────────────────────────────────────────
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

const UFS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

const CATEGORIAS = ["A", "B", "AB", "C", "D", "E", "AC", "AD", "AE"];
const TIPOS = ["Definitiva", "Permissão"];
const ESTILOS_ASS = ["Estilo 1 (Cursiva Elegante)", "Estilo 2 (Bradley Hand)"];

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
  assinaturaEstilo: string;
  senhaApp: string;
  observacoes: string;
}

const EMPTY: CNHFormData = {
  nome: "", cpf: "", sexo: "", rg: "", orgaoEmissor: "", ufRG: "",
  nacionalidade: "BRASILEIRA", dataNascimento: "", localNascimento: "",
  ufNascimento: "", nomePai: "", nomeMae: "",
  registro: "", espelho: "", categoria: "B", tipo: "Definitiva",
  validade: "", validadeCNH2: "", dataEmissao: todayISO(),
  primeiraHabilitacao: "", localEmissao: "", ufEmissao: "",
  assDigital1: "", assDigital2: "",
  fotoUrl: "", assinaturaUrl: "",
  assinaturaTipo: "digitar", assinaturaTexto: "", assinaturaEstilo: ESTILOS_ASS[0],
  senhaApp: "", observacoes: "EAR",
};

export default function CNHCria() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<CNHFormData>(EMPTY);
  const [codigoQR, setCodigoQR] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  const update = useCallback((k: keyof CNHFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let val = e.target.value;
    if (k === "cpf") val = maskCPF(val);
    if (k === "nome" || k === "nomePai" || k === "nomeMae" || k === "localNascimento" || k === "localEmissao")
      val = val.toUpperCase();
    if (k === "ufRG" || k === "ufNascimento" || k === "ufEmissao")
      val = val.toUpperCase().slice(0, 2);
    setData(d => ({ ...d, [k]: val }));
  }, []);

  const handleAutoRegistro = () => setData(d => ({ ...d, registro: generateAutoNum(10) }));
  const handleAutoEspelho = () => setData(d => ({ ...d, espelho: generateAutoNum(10) }));
  const handleAutoAss1 = () => setData(d => ({ ...d, assDigital1: generateAssDigital1() }));
  const handleAutoAss2 = () => setData(d => ({ ...d, assDigital2: generateAssDigital2(d.ufEmissao || "SP") }));

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await readFileAsBase64(file);
    setData(d => ({ ...d, fotoUrl: b64 }));
  };

  const handleAssinaturaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await readFileAsBase64(file);
    setData(d => ({ ...d, assinaturaUrl: b64, assinaturaTipo: "upload" }));
  };

  // Gera assinatura como texto estilizado em canvas
  const gerarAssinaturaTexto = useCallback(() => {
    if (!data.assinaturaTexto) return;
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 400, 100);
    const fontFamily = data.assinaturaEstilo.includes("Bradley") ? "'Bradley Hand', cursive" : "'Brush Script MT', 'Segoe Script', cursive";
    ctx.font = `32px ${fontFamily}`;
    ctx.fillStyle = "#1a1a6e";
    ctx.textBaseline = "middle";
    ctx.fillText(data.assinaturaTexto, 10, 50);
    const b64 = canvas.toDataURL("image/png");
    setData(d => ({ ...d, assinaturaUrl: b64, assinaturaTipo: "digitar" }));
  }, [data.assinaturaTexto, data.assinaturaEstilo]);

  const handleSave = async () => {
    if (!data.nome || !data.cpf) {
      toast.error("Preencha Nome e CPF");
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
        setCodigoQR(result.data?.codigoValidacao || result.data?.codigo_validacao || result.data?.id || "CNH-" + Date.now());
        setSaved(true);
        toast.success("CNH Digital gerada com sucesso!");
      } else {
        toast.error(result.error || "Erro ao gerar CNH");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!docRef.current) return;
    setLoading(true);
    try {
      await exportElementToPDF(docRef.current, {
        filename: generatePDFFilename(data.nome || "CNH", "cnh"),
        docType: "cnh",
      });
      toast.success("PDF exportado!");
    } catch {
      toast.error("Erro ao exportar PDF");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm";
  const labelCls = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1";
  const sectionCls = "text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide flex items-center gap-2";

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/dashboard")} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <Car className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">CNH Digital</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Carteira Nacional de Habilitação</p>
            </div>
          </div>
          <div className="flex gap-2">
            {saved && (
              <button onClick={handleExport} disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-60">
                <Download className="w-4 h-4" />
                BAIXAR PDF
              </button>
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
            {/* 1. Dados Pessoais */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className={sectionCls}>1. Dados Pessoais</h2>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Nome Completo *</label>
                  <input type="text" value={data.nome} onChange={update("nome")} placeholder="NOME COMPLETO" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>CPF *</label>
                    <input type="text" value={data.cpf} onChange={update("cpf")} placeholder="000.000.000-00" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Sexo</label>
                    <select value={data.sexo} onChange={update("sexo")} className={inputCls}>
                      <option value="">ESCOLHA</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nacionalidade</label>
                    <input type="text" value={data.nacionalidade} onChange={update("nacionalidade")} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Data Nascimento</label>
                    <input type="date" value={data.dataNascimento} onChange={update("dataNascimento")} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Local Nascimento</label>
                    <input type="text" value={data.localNascimento} onChange={update("localNascimento")} placeholder="CIDADE" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>UF Nasc.</label>
                    <input type="text" value={data.ufNascimento} onChange={update("ufNascimento")} placeholder="SP" maxLength={2} className={inputCls + " uppercase"} />
                  </div>
                </div>
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

            {/* 2. Dados da CNH */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className={sectionCls}>2. Dados da CNH</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nº Registro</label>
                    <div className="flex gap-1">
                      <input type="text" value={data.registro} onChange={update("registro")} placeholder="Digite ou AUTO" className={inputCls + " flex-1"} />
                      <button onClick={handleAutoRegistro} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap">
                        AUTO
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Nº CNH (Espelho)</label>
                    <div className="flex gap-1">
                      <input type="text" value={data.espelho} onChange={update("espelho")} placeholder="Digite ou AUTO" className={inputCls + " flex-1"} />
                      <button onClick={handleAutoEspelho} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap">
                        AUTO
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Categoria</label>
                    <select value={data.categoria} onChange={update("categoria")} className={inputCls}>
                      {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Tipo</label>
                    <select value={data.tipo} onChange={update("tipo")} className={inputCls}>
                      {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
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

            {/* 3. Código de Segurança */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className={sectionCls}>3. Código de Segurança</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Ass. Digital 1</label>
                  <div className="flex gap-1">
                    <input type="text" value={data.assDigital1} onChange={update("assDigital1")} placeholder="Digite ou AUTO" className={inputCls + " flex-1"} />
                    <button onClick={handleAutoAss1} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap">
                      AUTO
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Ass. Digital 2</label>
                  <div className="flex gap-1">
                    <input type="text" value={data.assDigital2} onChange={update("assDigital2")} placeholder="UF + 8 Dígitos" className={inputCls + " flex-1"} />
                    <button onClick={handleAutoAss2} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap">
                      AUTO
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Fotos e Acesso */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className={sectionCls}>4. Fotos e Acesso</h2>
              <div className="space-y-4">
                {/* Foto do Rosto */}
                <div>
                  <label className={labelCls}>Foto do Rosto (3x4)</label>
                  <div className="flex items-start gap-4">
                    <div>
                      <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors text-sm">
                        <Upload className="w-4 h-4" />
                        Enviar Foto
                        <input type="file" accept="image/*" onChange={handleFotoUpload} className="hidden" />
                      </label>
                      <p className="text-[10px] text-gray-400 mt-1">Para melhor qualidade, remova o fundo</p>
                    </div>
                    {data.fotoUrl && (
                      <div className="w-16 h-20 rounded border border-gray-200 overflow-hidden flex-shrink-0">
                        <img src={data.fotoUrl} alt="Prévia" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Assinatura */}
                <div>
                  <label className={labelCls}>Assinatura (Foto ou Digite)</label>
                  <div className="space-y-3">
                    {/* Opção 1: Digitar */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                        <Type className="w-3 h-3" /> Opção 1: Digite o Nome
                      </p>
                      <select value={data.assinaturaEstilo} onChange={update("assinaturaEstilo")} className={inputCls + " mb-2"}>
                        {ESTILOS_ASS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <input type="text" value={data.assinaturaTexto} onChange={update("assinaturaTexto")}
                          placeholder="Digite o nome para assinar..." className={inputCls + " flex-1"} />
                        <button onClick={gerarAssinaturaTexto}
                          className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap">
                          Gerar
                        </button>
                      </div>
                    </div>
                    {/* Opção 2: Upload */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                        <Upload className="w-3 h-3" /> Opção 2: Envie uma Foto
                      </p>
                      <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg cursor-pointer transition-colors text-sm border border-gray-200 dark:border-gray-600 w-fit">
                        Escolher Arquivo
                        <input type="file" accept="image/*" onChange={handleAssinaturaUpload} className="hidden" />
                      </label>
                    </div>
                    {/* Preview assinatura */}
                    {data.assinaturaUrl && (
                      <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-[10px] text-gray-400 mb-1">Prévia Assinatura</p>
                        <img src={data.assinaturaUrl} alt="Assinatura" className="h-10 object-contain" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Senha App */}
                <div>
                  <label className={labelCls}>Senha App Cliente</label>
                  <input type="text" value={data.senhaApp} onChange={update("senhaApp")} placeholder="Senha para acesso" className={inputCls} />
                </div>

                {/* Observações */}
                <div>
                  <label className={labelCls}>Observações (EAR)</label>
                  <textarea value={data.observacoes} onChange={update("observacoes")} rows={2}
                    placeholder="Digite as observações..." className={inputCls + " resize-none"} />
                </div>
              </div>
            </div>

            {/* Botão Salvar */}
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={loading || saved}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? (
                  <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Gerando...</>
                ) : saved ? (
                  "CNH Emitida"
                ) : (
                  <><Zap className="w-4 h-4" /> CONFIRMAR E EMITIR</>
                )}
              </button>
            </div>
            {saved && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">CNH Digital emitida com sucesso!</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">Código: <span className="font-mono font-bold">{codigoQR}</span></p>
                <p className="text-xs text-green-600 dark:text-green-500">URL: docmaster.store/v/{codigoQR}</p>
              </div>
            )}
          </div>

          {/* ===== PREVIEW ===== */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
              Pré-visualização do Documento
            </h2>
            <div className="sticky top-4">
              <div
                ref={docRef}
                style={{ transform: "scale(0.75)", transformOrigin: "top left", width: 595 }}
              >
                <CNHDocument
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
