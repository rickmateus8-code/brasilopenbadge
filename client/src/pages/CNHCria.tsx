import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { ArrowLeft, Download, Car, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { exportElementToPDF } from "@/lib/pdfExport";

const CATEGORIAS = ["A", "B", "AB", "C", "D", "E", "ACC"];
const SITUACOES = ["1ª HABILITAÇÃO", "RENOVAÇÃO", "ADIÇÃO DE CATEGORIA", "MUDANÇA DE CATEGORIA"];

interface CNHData {
  nome: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  nomeMae: string;
  nomePai: string;
  naturalidade: string;
  uf: string;
  categoria: string;
  registro: string;
  validade: string;
  dataEmissao: string;
  situacao: string;
  renach: string;
  espelho: string;
  observacoes: string;
}

const EMPTY: CNHData = {
  nome: "", cpf: "", rg: "", dataNascimento: "", nomeMae: "", nomePai: "",
  naturalidade: "", uf: "SP", categoria: "B", registro: "", validade: "",
  dataEmissao: "", situacao: "1ª HABILITAÇÃO", renach: "", espelho: "", observacoes: "",
};

export default function CNHCria() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<CNHData>(EMPTY);
  const [codigoQR, setCodigoQR] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  const update = (k: keyof CNHData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setData(d => ({ ...d, [k]: e.target.value }));

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
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        setCodigoQR(result.data?.codigoValidacao || result.data?.id || "CNH-" + Date.now());
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
      await exportElementToPDF(docRef.current, `CNH_${data.nome.replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF exportado!");
    } catch {
      toast.error("Erro ao exportar PDF");
    } finally {
      setLoading(false);
    }
  };

  const qrUrl = codigoQR ? `https://docmaster.store/v/${codigoQR}` : "";

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
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

        {/* Balance Warning */}
        {(user?.balance || 0) <= 0 && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">
              Saldo insuficiente. <button onClick={() => setLocation("/recargas")} className="font-semibold underline">Recarregue aqui</button> para emitir documentos.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Dados do Condutor</h2>
            <div className="space-y-4">
              {[
                { key: "nome", label: "Nome Completo *", placeholder: "NOME COMPLETO DO CONDUTOR" },
                { key: "cpf", label: "CPF *", placeholder: "000.000.000-00" },
                { key: "rg", label: "RG", placeholder: "00.000.000-0" },
                { key: "dataNascimento", label: "Data de Nascimento", placeholder: "DD/MM/AAAA" },
                { key: "nomeMae", label: "Nome da Mãe", placeholder: "NOME DA MÃE" },
                { key: "nomePai", label: "Nome do Pai", placeholder: "NOME DO PAI" },
                { key: "naturalidade", label: "Naturalidade", placeholder: "Cidade de nascimento" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                  <input
                    type="text"
                    value={data[key as keyof CNHData]}
                    onChange={update(key as keyof CNHData)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">UF</label>
                  <input type="text" maxLength={2} value={data.uf} onChange={update("uf")}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Categoria</label>
                  <select value={data.categoria} onChange={update("categoria")}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm">
                    {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {[
                { key: "registro", label: "Nº Registro", placeholder: "00000000000" },
                { key: "renach", label: "RENACH", placeholder: "SP000000000" },
                { key: "espelho", label: "Nº Espelho", placeholder: "00000000000" },
                { key: "dataEmissao", label: "Data de Emissão", placeholder: "DD/MM/AAAA" },
                { key: "validade", label: "Validade", placeholder: "DD/MM/AAAA" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                  <input type="text" value={data[key as keyof CNHData]} onChange={update(key as keyof CNHData)} placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Situação</label>
                <select value={data.situacao} onChange={update("situacao")}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm">
                  {SITUACOES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Observações</label>
                <textarea value={data.observacoes} onChange={update("observacoes")} rows={2} placeholder="Observações opcionais"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={loading || saved}
                className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-60">
                {loading ? "Gerando..." : saved ? "✅ CNH Emitida" : "✓ CONFIRMAR E EMITIR"}
              </button>
            </div>
            {saved && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">✅ CNH Digital emitida com sucesso!</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">🔒 Dados excluídos automaticamente após 60 dias</p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Pré-visualização</h2>
            <div ref={docRef} className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ fontFamily: "Arial, sans-serif" }}>
              {/* CNH Front */}
              <div className="bg-gradient-to-r from-blue-800 to-blue-600 p-4 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest opacity-80">REPÚBLICA FEDERATIVA DO BRASIL</p>
                    <p className="text-[10px] opacity-70">CARTEIRA NACIONAL DE HABILITAÇÃO</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">CAT. {data.categoria || "B"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <p className="text-[10px] opacity-70">NOME</p>
                    <p className="text-xs font-bold">{data.nome || "NOME DO CONDUTOR"}</p>
                    <p className="text-[10px] opacity-70 mt-1">CPF</p>
                    <p className="text-xs">{data.cpf || "000.000.000-00"}</p>
                    <p className="text-[10px] opacity-70 mt-1">DATA NASC.</p>
                    <p className="text-xs">{data.dataNascimento || "DD/MM/AAAA"}</p>
                    <p className="text-[10px] opacity-70 mt-1">VALIDADE</p>
                    <p className="text-xs font-bold text-yellow-300">{data.validade || "DD/MM/AAAA"}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    {saved && codigoQR ? (
                      <div className="bg-white p-1 rounded">
                        <QRCodeSVG value={qrUrl} size={64} />
                      </div>
                    ) : (
                      <div className="w-16 h-20 bg-blue-700 rounded flex items-center justify-center">
                        <Car className="w-8 h-8 opacity-30" />
                      </div>
                    )}
                    {saved && <p className="text-[8px] opacity-60 mt-1 text-center">Validar QR</p>}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-500 grid grid-cols-3 gap-2 text-[9px]">
                  <div><p className="opacity-70">REGISTRO</p><p>{data.registro || "—"}</p></div>
                  <div><p className="opacity-70">RENACH</p><p>{data.renach || "—"}</p></div>
                  <div><p className="opacity-70">EMISSÃO</p><p>{data.dataEmissao || "—"}</p></div>
                </div>
              </div>
              {/* CNH Back */}
              <div className="bg-gray-100 p-4">
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div><p className="text-gray-500">MÃE</p><p className="font-medium">{data.nomeMae || "—"}</p></div>
                  <div><p className="text-gray-500">PAI</p><p className="font-medium">{data.nomePai || "—"}</p></div>
                  <div><p className="text-gray-500">NATURALIDADE</p><p className="font-medium">{data.naturalidade || "—"} - {data.uf}</p></div>
                  <div><p className="text-gray-500">SITUAÇÃO</p><p className="font-medium">{data.situacao}</p></div>
                  <div><p className="text-gray-500">ESPELHO</p><p className="font-medium">{data.espelho || "—"}</p></div>
                  <div><p className="text-gray-500">RG</p><p className="font-medium">{data.rg || "—"}</p></div>
                </div>
                {data.observacoes && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-[9px] text-gray-500">OBS: {data.observacoes}</p>
                  </div>
                )}
              </div>
            </div>

            {saved && codigoQR && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400">CNH gerada com sucesso!</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">Código de validação: <span className="font-mono font-bold">{codigoQR}</span></p>
                <p className="text-xs text-green-600 dark:text-green-500">URL: docmaster.store/v/{codigoQR}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
