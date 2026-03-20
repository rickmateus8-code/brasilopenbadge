import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { ArrowLeft, Download, Anchor, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { exportElementToPDF } from "@/lib/pdfExport";

const CATEGORIAS_CHA = ["Arrais-Amador", "Mestre-Amador", "Capitão-Amador", "Motonauta"];
const TIPOS_EMBARCACAO = ["Lancha", "Veleiro", "Jet Ski", "Barco a Motor", "Catamarã", "Iate"];

interface CHAData {
  nome: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  naturalidade: string;
  uf: string;
  categoria: string;
  registro: string;
  validade: string;
  dataEmissao: string;
  tipoEmbarcacao: string;
  comprimentoMax: string;
  potenciaMax: string;
  areaNavegazao: string;
  observacoes: string;
}

const EMPTY: CHAData = {
  nome: "", cpf: "", rg: "", dataNascimento: "", naturalidade: "", uf: "SP",
  categoria: "Arrais-Amador", registro: "", validade: "", dataEmissao: "",
  tipoEmbarcacao: "Lancha", comprimentoMax: "", potenciaMax: "", areaNavegazao: "", observacoes: "",
};

export default function CHACria() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<CHAData>(EMPTY);
  const [codigoQR, setCodigoQR] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  const update = (k: keyof CHAData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setData(d => ({ ...d, [k]: e.target.value }));

  const handleSave = async () => {
    if (!data.nome || !data.cpf) { toast.error("Preencha Nome e CPF"); return; }
    if ((user?.balance || 0) <= 0) {
      toast.error("Saldo insuficiente. Recarregue para emitir documentos.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/documents/cha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        setCodigoQR(result.data?.codigoValidacao || "CHA-" + Date.now());
        setSaved(true);
        toast.success("CHA Náutica gerada com sucesso!");
      } else {
        toast.error(result.error || "Erro ao gerar CHA");
      }
    } catch { toast.error("Erro de conexão"); }
    finally { setLoading(false); }
  };

  const handleExport = async () => {
    if (!docRef.current) return;
    setLoading(true);
    try {
      await exportElementToPDF(docRef.current, `CHA_${data.nome.replace(/\s+/g, "_")}.pdf`);
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
          <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/20 flex items-center justify-center">
            <Anchor className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">CHA Náutica</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Carteira de Habilitação Aquaviária</p>
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
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Dados do Aquaviário</h2>
            <div className="space-y-4">
              {[
                { key: "nome", label: "Nome Completo *", placeholder: "NOME COMPLETO" },
                { key: "cpf", label: "CPF *", placeholder: "000.000.000-00" },
                { key: "rg", label: "RG", placeholder: "00.000.000-0" },
                { key: "dataNascimento", label: "Data de Nascimento", placeholder: "DD/MM/AAAA" },
                { key: "naturalidade", label: "Naturalidade", placeholder: "Cidade" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                  <input type="text" value={data[key as keyof CHAData]} onChange={update(key as keyof CHAData)} placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm" />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">UF</label>
                  <input type="text" maxLength={2} value={data.uf} onChange={update("uf")}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Categoria</label>
                  <select value={data.categoria} onChange={update("categoria")}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm">
                    {CATEGORIAS_CHA.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {[
                { key: "registro", label: "Nº Registro", placeholder: "000000000" },
                { key: "dataEmissao", label: "Data de Emissão", placeholder: "DD/MM/AAAA" },
                { key: "validade", label: "Validade", placeholder: "DD/MM/AAAA" },
                { key: "comprimentoMax", label: "Comprimento Máx. (m)", placeholder: "Ex: 10" },
                { key: "potenciaMax", label: "Potência Máx. (HP)", placeholder: "Ex: 200" },
                { key: "areaNavegazao", label: "Área de Navegação", placeholder: "Ex: Interior, Mar Aberto" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                  <input type="text" value={data[key as keyof CHAData]} onChange={update(key as keyof CHAData)} placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm" />
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={loading || saved}
                className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-60">
                {loading ? "Gerando..." : saved ? "✅ CHA Emitida" : "✓ CONFIRMAR E EMITIR"}
              </button>
            </div>
            {saved && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">✅ CHA Náutica emitida com sucesso!</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">🔒 Dados excluídos automaticamente após 60 dias</p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Pré-visualização</h2>
            <div ref={docRef} className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ fontFamily: "Arial, sans-serif" }}>
              <div className="bg-gradient-to-r from-cyan-800 to-blue-700 p-4 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest opacity-80">MARINHA DO BRASIL</p>
                    <p className="text-[10px] opacity-70">CARTEIRA DE HABILITAÇÃO AQUAVIÁRIA</p>
                  </div>
                  <Anchor className="w-8 h-8 opacity-40" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <p className="text-[10px] opacity-70">NOME</p>
                    <p className="text-xs font-bold">{data.nome || "NOME DO AQUAVIÁRIO"}</p>
                    <p className="text-[10px] opacity-70 mt-1">CPF</p>
                    <p className="text-xs">{data.cpf || "000.000.000-00"}</p>
                    <p className="text-[10px] opacity-70 mt-1">CATEGORIA</p>
                    <p className="text-xs font-bold text-yellow-300">{data.categoria}</p>
                    <p className="text-[10px] opacity-70 mt-1">VALIDADE</p>
                    <p className="text-xs font-bold text-yellow-300">{data.validade || "DD/MM/AAAA"}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    {saved && codigoQR ? (
                      <div className="bg-white p-1 rounded">
                        <QRCodeSVG value={`https://docmaster.store/v/${codigoQR}`} size={64} />
                      </div>
                    ) : (
                      <div className="w-16 h-20 bg-cyan-700 rounded flex items-center justify-center">
                        <Anchor className="w-8 h-8 opacity-30" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-cyan-600 grid grid-cols-3 gap-2 text-[9px]">
                  <div><p className="opacity-70">REGISTRO</p><p>{data.registro || "—"}</p></div>
                  <div><p className="opacity-70">EMISSÃO</p><p>{data.dataEmissao || "—"}</p></div>
                  <div><p className="opacity-70">ÁREA</p><p>{data.areaNavegazao || "—"}</p></div>
                </div>
              </div>
              <div className="bg-gray-100 p-4 grid grid-cols-2 gap-3 text-[10px]">
                <div><p className="text-gray-500">NASC.</p><p className="font-medium">{data.dataNascimento || "—"}</p></div>
                <div><p className="text-gray-500">NATURALIDADE</p><p className="font-medium">{data.naturalidade || "—"} - {data.uf}</p></div>
                <div><p className="text-gray-500">COMP. MÁX.</p><p className="font-medium">{data.comprimentoMax ? `${data.comprimentoMax}m` : "—"}</p></div>
                <div><p className="text-gray-500">POT. MÁX.</p><p className="font-medium">{data.potenciaMax ? `${data.potenciaMax} HP` : "—"}</p></div>
              </div>
            </div>
            {saved && codigoQR && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400">CHA gerada com sucesso!</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">Código: <span className="font-mono font-bold">{codigoQR}</span></p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
