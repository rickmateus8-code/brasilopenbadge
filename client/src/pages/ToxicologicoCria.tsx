import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { ArrowLeft, Download, FlaskConical, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { exportElementToPDF } from "@/lib/pdfExport";

const LABORATORIOS = [
  "SODRÉ LABORATÓRIO DE ANÁLISES CLÍNICAS",
  "LABORATÓRIO SODRÉ",
  "LABORATÓRIO CENTRAL",
  "LABORATÓRIO CLÍNICO",
];

const SUBSTANCIAS = [
  "Cocaína e Metabólitos",
  "Anfetaminas e Derivados",
  "Maconha (THC)",
  "Opiáceos",
  "Benzodiazepínicos",
];

interface ToxData {
  nome: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  cnh: string;
  categoriaCNH: string;
  laboratorio: string;
  crf: string;
  responsavel: string;
  dataColeta: string;
  dataEmissao: string;
  resultado: "NEGATIVO" | "POSITIVO";
  protocolo: string;
  validade: string;
  observacoes: string;
}

const EMPTY: ToxData = {
  nome: "", cpf: "", rg: "", dataNascimento: "", cnh: "", categoriaCNH: "B",
  laboratorio: LABORATORIOS[0], crf: "", responsavel: "", dataColeta: "",
  dataEmissao: "", resultado: "NEGATIVO", protocolo: "", validade: "", observacoes: "",
};

export default function ToxicologicoCria() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<ToxData>(EMPTY);
  const [codigoQR, setCodigoQR] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  const update = (k: keyof ToxData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setData(d => ({ ...d, [k]: e.target.value as any }));

  const handleSave = async () => {
    if (!data.nome || !data.cpf) { toast.error("Preencha Nome e CPF"); return; }
    if ((user?.balance || 0) <= 0) {
      toast.error("Saldo insuficiente. Recarregue para emitir documentos.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/documents/toxicologico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        setCodigoQR(result.data?.codigoValidacao || "TOX-" + Date.now());
        setSaved(true);
        toast.success("Laudo Toxicológico gerado com sucesso!");
      } else {
        toast.error(result.error || "Erro ao gerar laudo");
      }
    } catch { toast.error("Erro de conexão"); }
    finally { setLoading(false); }
  };

  const handleExport = async () => {
    if (!docRef.current) return;
    setLoading(true);
    try {
      await exportElementToPDF(docRef.current, `Toxicologico_${data.nome.replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF exportado!");
    } catch { toast.error("Erro ao exportar PDF"); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setLocation("/dashboard")} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Exame Toxicológico</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Laudo de Exame Toxicológico de Longa Janela</p>
          </div>
        </div>

        {(user?.balance || 0) <= 0 && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">
              Saldo insuficiente. <button onClick={() => setLocation("/recargas")} className="font-semibold underline">Recarregue aqui</button>.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Dados do Examinado</h2>
            <div className="space-y-4">
              {[
                { key: "nome", label: "Nome Completo *", placeholder: "NOME COMPLETO" },
                { key: "cpf", label: "CPF *", placeholder: "000.000.000-00" },
                { key: "rg", label: "RG", placeholder: "00.000.000-0" },
                { key: "dataNascimento", label: "Data de Nascimento", placeholder: "DD/MM/AAAA" },
                { key: "cnh", label: "Nº CNH", placeholder: "00000000000" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                  <input type="text" value={data[key as keyof ToxData] as string} onChange={update(key as keyof ToxData)} placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Laboratório</label>
                <select value={data.laboratorio} onChange={update("laboratorio")}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm">
                  {LABORATORIOS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>

              {[
                { key: "responsavel", label: "Responsável Técnico (Farmacêutico)", placeholder: "Nome do Farmacêutico" },
                { key: "crf", label: "CRF", placeholder: "CRF/SP 00000" },
                { key: "protocolo", label: "Nº Protocolo", placeholder: "000000000" },
                { key: "dataColeta", label: "Data da Coleta", placeholder: "DD/MM/AAAA" },
                { key: "dataEmissao", label: "Data de Emissão", placeholder: "DD/MM/AAAA" },
                { key: "validade", label: "Validade do Laudo", placeholder: "DD/MM/AAAA" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                  <input type="text" value={data[key as keyof ToxData] as string} onChange={update(key as keyof ToxData)} placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Resultado</label>
                <div className="flex gap-3">
                  {(["NEGATIVO", "POSITIVO"] as const).map(r => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="resultado" value={r} checked={data.resultado === r} onChange={update("resultado")} className="accent-purple-500" />
                      <span className={`text-sm font-medium ${r === "NEGATIVO" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{r}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={loading || saved}
                className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-60">
                {loading ? "Gerando..." : saved ? "✅ Laudo Emitido" : "✓ CONFIRMAR E EMITIR"}
              </button>
            </div>
            {saved && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">✅ Laudo Toxicológico emitido com sucesso!</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">🔒 Dados excluídos automaticamente após 60 dias</p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Pré-visualização</h2>
            <div ref={docRef} className="bg-white rounded-xl shadow-lg overflow-hidden text-gray-900" style={{ fontFamily: "Arial, sans-serif" }}>
              {/* Header */}
              <div className="bg-purple-700 p-4 text-white text-center">
                <p className="text-xs font-bold tracking-widest">{data.laboratorio}</p>
                <p className="text-[10px] opacity-70 mt-0.5">LAUDO DE EXAME TOXICOLÓGICO DE LONGA JANELA DE DETECÇÃO</p>
              </div>
              {/* Body */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div><p className="text-gray-500 font-medium">NOME</p><p className="font-bold">{data.nome || "—"}</p></div>
                  <div><p className="text-gray-500 font-medium">CPF</p><p>{data.cpf || "—"}</p></div>
                  <div><p className="text-gray-500 font-medium">RG</p><p>{data.rg || "—"}</p></div>
                  <div><p className="text-gray-500 font-medium">DATA NASC.</p><p>{data.dataNascimento || "—"}</p></div>
                  <div><p className="text-gray-500 font-medium">CNH Nº</p><p>{data.cnh || "—"}</p></div>
                  <div><p className="text-gray-500 font-medium">PROTOCOLO</p><p>{data.protocolo || "—"}</p></div>
                  <div><p className="text-gray-500 font-medium">DATA COLETA</p><p>{data.dataColeta || "—"}</p></div>
                  <div><p className="text-gray-500 font-medium">EMISSÃO</p><p>{data.dataEmissao || "—"}</p></div>
                </div>

                {/* Substances */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-3 py-1.5">
                    <p className="text-[10px] font-bold text-gray-700">SUBSTÂNCIAS PESQUISADAS</p>
                  </div>
                  {SUBSTANCIAS.map(s => (
                    <div key={s} className="flex items-center justify-between px-3 py-1.5 border-t border-gray-100 text-[10px]">
                      <span>{s}</span>
                      <span className={`font-bold ${data.resultado === "NEGATIVO" ? "text-green-600" : "text-red-600"}`}>
                        {data.resultado}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Result Banner */}
                <div className={`rounded-lg p-3 text-center ${data.resultado === "NEGATIVO" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                  <p className={`text-sm font-bold ${data.resultado === "NEGATIVO" ? "text-green-700" : "text-red-700"}`}>
                    RESULTADO GERAL: {data.resultado}
                  </p>
                  <p className="text-[9px] text-gray-500 mt-0.5">Validade: {data.validade || "—"}</p>
                </div>

                {/* QR + Signature */}
                <div className="flex items-end justify-between">
                  <div className="text-[9px] text-gray-500">
                    <p className="font-medium">{data.responsavel || "Responsável Técnico"}</p>
                    <p>{data.crf || "CRF/—"}</p>
                  </div>
                  {saved && codigoQR ? (
                    <div className="flex flex-col items-center">
                      <div className="bg-white border border-gray-200 p-1 rounded">
                        <QRCodeSVG value={`https://docmaster.store/v/${codigoQR}`} size={48} />
                      </div>
                      <p className="text-[8px] text-gray-400 mt-0.5">Validar</p>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <FlaskConical className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {saved && codigoQR && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400">Laudo gerado com sucesso!</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">Código: <span className="font-mono font-bold">{codigoQR}</span></p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
