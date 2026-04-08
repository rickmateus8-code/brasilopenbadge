import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { ArrowLeft, Download, GraduationCap, AlertCircle, Plus, Trash2 } from "lucide-react";
import { exportElementToPDF } from "@/lib/pdfExport";
import { validarCPF } from "@/lib/utils";
import EmissionModal from "@/components/EmissionModal";

interface Disciplina {
  nome: string;
  nota1: string;
  nota2: string;
  nota3: string;
  nota4: string;
  media: string;
  faltas: string;
  situacao: string;
}

interface HistoricoSPData {
  nomeAluno: string;
  rg: string;
  cpf: string;
  dataNascimento: string;
  nomeMae: string;
  nomePai: string;
  naturalidade: string;
  escola: string;
  diretoriaEnsino: string;
  municipio: string;
  curso: string;
  serie: string;
  anoLetivo: string;
  turma: string;
  turno: string;
  disciplinas: Disciplina[];
}

const DISCIPLINA_VAZIA: Disciplina = {
  nome: "", nota1: "", nota2: "", nota3: "", nota4: "", media: "", faltas: "", situacao: "APROVADO"
};

const DISCIPLINAS_PADRAO = [
  "Língua Portuguesa", "Matemática", "História", "Geografia", "Ciências",
  "Educação Física", "Arte", "Inglês", "Biologia", "Física", "Química"
];

const EMPTY: HistoricoSPData = {
  nomeAluno: "", rg: "", cpf: "", dataNascimento: "", nomeMae: "", nomePai: "",
  naturalidade: "", escola: "", diretoriaEnsino: "Diretoria de Ensino — Região",
  municipio: "", curso: "Ensino Médio", serie: "3ª", anoLetivo: "2024", turma: "A", turno: "Manhã",
  disciplinas: DISCIPLINAS_PADRAO.slice(0, 6).map(nome => ({ ...DISCIPLINA_VAZIA, nome })),
};

export default function HistoricoSP() {
  const { user, updateBalance } = useAuth();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<HistoricoSPData>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  const update = (k: keyof HistoricoSPData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setData(d => ({ ...d, [k]: e.target.value }));

  const updateDisciplina = (idx: number, k: keyof Disciplina, val: string) =>
    setData(d => ({ ...d, disciplinas: d.disciplinas.map((disc, i) => i === idx ? { ...disc, [k]: val } : disc) }));

  const addDisciplina = () =>
    setData(d => ({ ...d, disciplinas: [...d.disciplinas, { ...DISCIPLINA_VAZIA }] }));

  const removeDisciplina = (idx: number) =>
    setData(d => ({ ...d, disciplinas: d.disciplinas.filter((_, i) => i !== idx) }));

  const handleRequestEmit = () => {
    if (!data.nomeAluno || !data.escola) { toast.error("Preencha Nome do Aluno e Escola"); return; }
    if (data.cpf && !validarCPF(data.cpf)) { toast.error("CPF inválido! Verifique os dígitos informados."); return; }
    if ((user?.balance || 0) <= 0) {
      toast.error("Saldo insuficiente. Recarregue para emitir documentos.");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents/historico-sp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        if (result.newBalance !== undefined) updateBalance(result.newBalance);
        setSaved(true);
        setShowConfirmModal(false);
        setShowSuccessModal(true);
      } else {
        toast.error(result.error || "Erro ao gerar histórico");
        setShowConfirmModal(false);
      }
    } catch { toast.error("Erro de conexão"); setShowConfirmModal(false); }
    finally { setLoading(false); }
  };

  const handleExport = async () => {
    if (!docRef.current) return;
    setLoading(true);
    try {
      const nomeHistSP = (data.nomeAluno || "DOCUMENTO").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
      await exportElementToPDF(docRef.current, `HISTORICO_SP_${nomeHistSP}.pdf`);
      toast.success("PDF exportado!");
    } catch { toast.error("Erro ao exportar PDF"); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setLocation("/dashboard")} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Histórico Escolar SP</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Secretaria de Educação do Estado de São Paulo</p>
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Dados do Aluno</h2>
              <div className="space-y-3">
                {[
                  { key: "nomeAluno", label: "Nome do Aluno *", placeholder: "NOME COMPLETO DO ALUNO" },
                  { key: "rg", label: "RG", placeholder: "00.000.000-0" },
                  { key: "cpf", label: "CPF", placeholder: "000.000.000-00" },
                  { key: "dataNascimento", label: "Data de Nascimento", placeholder: "DD/MM/AAAA" },
                  { key: "nomeMae", label: "Nome da Mãe", placeholder: "NOME DA MÃE" },
                  { key: "nomePai", label: "Nome do Pai", placeholder: "NOME DO PAI" },
                  { key: "naturalidade", label: "Naturalidade", placeholder: "Cidade - UF" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                    <input type="text" value={data[key as keyof HistoricoSPData] as string} onChange={update(key as keyof HistoricoSPData)} placeholder={placeholder}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Dados da Escola</h2>
              <div className="space-y-3">
                {[
                  { key: "escola", label: "Nome da Escola *", placeholder: "E.E. NOME DA ESCOLA" },
                  { key: "diretoriaEnsino", label: "Diretoria de Ensino", placeholder: "Diretoria de Ensino — Região" },
                  { key: "municipio", label: "Município", placeholder: "São Paulo" },
                  { key: "curso", label: "Curso", placeholder: "Ensino Médio" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                    <input type="text" value={data[key as keyof HistoricoSPData] as string} onChange={update(key as keyof HistoricoSPData)} placeholder={placeholder}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "serie", label: "Série", placeholder: "3ª" },
                    { key: "anoLetivo", label: "Ano Letivo", placeholder: "2024" },
                    { key: "turno", label: "Turno", placeholder: "Manhã" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                      <input type="text" value={data[key as keyof HistoricoSPData] as string} onChange={update(key as keyof HistoricoSPData)} placeholder={placeholder}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Disciplinas */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Disciplinas</h2>
                <button onClick={addDisciplina} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-medium hover:bg-green-200 dark:hover:bg-green-900/40">
                  <Plus className="w-3.5 h-3.5" />Adicionar
                </button>
              </div>
              <div className="space-y-3">
                {data.disciplinas.map((disc, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <input type="text" value={disc.nome} onChange={e => updateDisciplina(idx, "nome", e.target.value)}
                        placeholder="Nome da disciplina"
                        className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
                      <button onClick={() => removeDisciplina(idx)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {["nota1", "nota2", "nota3", "nota4"].map((k, i) => (
                        <div key={k}>
                          <label className="block text-[10px] text-gray-500 mb-0.5">{i + 1}º Bim.</label>
                          <input type="text" value={disc[k as keyof Disciplina]} onChange={e => updateDisciplina(idx, k as keyof Disciplina, e.target.value)}
                            placeholder="0.0"
                            className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-green-500" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-0.5">Média</label>
                        <input type="text" value={disc.media} onChange={e => updateDisciplina(idx, "media", e.target.value)} placeholder="0.0"
                          className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-green-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-0.5">Faltas</label>
                        <input type="text" value={disc.faltas} onChange={e => updateDisciplina(idx, "faltas", e.target.value)} placeholder="0"
                          className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-green-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-0.5">Situação</label>
                        <select value={disc.situacao} onChange={e => updateDisciplina(idx, "situacao", e.target.value)}
                          className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-green-500">
                          <option>APROVADO</option>
                          <option>REPROVADO</option>
                          <option>RECUPERAÇÃO</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleRequestEmit} disabled={loading || saved}
                className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-60">
                {loading ? "Gerando..." : saved ? "✅ Histórico Emitido" : "✓ CONFIRMAR E EMITIR"}
              </button>
            </div>
            {saved && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">✅ Histórico Escolar SP emitido com sucesso!</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">🔒 Dados excluídos automaticamente após 60 dias</p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Pré-visualização</h2>
            <div ref={docRef} className="bg-white rounded-xl shadow-lg overflow-hidden text-gray-900 text-[10px]" style={{ fontFamily: "Arial, sans-serif" }}>
              {/* Header */}
              <div className="bg-blue-800 text-white p-3 text-center">
                <p className="font-bold text-xs">SECRETARIA DE ESTADO DA EDUCAÇÃO</p>
                <p className="opacity-80 text-[9px]">{data.diretoriaEnsino || "Diretoria de Ensino"}</p>
                <p className="font-bold mt-1">{data.escola || "NOME DA ESCOLA"}</p>
                <p className="opacity-70 text-[9px]">{data.municipio || "Município"} - SP</p>
              </div>
              <div className="p-3">
                <p className="text-center font-bold text-xs mb-2 uppercase">Histórico Escolar</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div><span className="text-gray-500">Aluno: </span><span className="font-bold">{data.nomeAluno || "—"}</span></div>
                  <div><span className="text-gray-500">RG: </span><span>{data.rg || "—"}</span></div>
                  <div><span className="text-gray-500">Curso: </span><span>{data.curso}</span></div>
                  <div><span className="text-gray-500">Série: </span><span>{data.serie} — {data.anoLetivo}</span></div>
                  <div><span className="text-gray-500">Turno: </span><span>{data.turno}</span></div>
                  <div><span className="text-gray-500">Nasc.: </span><span>{data.dataNascimento || "—"}</span></div>
                </div>

                {/* Table */}
                <table className="w-full border-collapse text-[9px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-1.5 py-1 text-left">Disciplina</th>
                      <th className="border border-gray-300 px-1 py-1">1º</th>
                      <th className="border border-gray-300 px-1 py-1">2º</th>
                      <th className="border border-gray-300 px-1 py-1">3º</th>
                      <th className="border border-gray-300 px-1 py-1">4º</th>
                      <th className="border border-gray-300 px-1 py-1">Méd.</th>
                      <th className="border border-gray-300 px-1 py-1">Falt.</th>
                      <th className="border border-gray-300 px-1 py-1">Sit.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.disciplinas.map((disc, i) => (
                      <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                        <td className="border border-gray-300 px-1.5 py-0.5">{disc.nome || "—"}</td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">{disc.nota1 || "—"}</td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">{disc.nota2 || "—"}</td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">{disc.nota3 || "—"}</td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">{disc.nota4 || "—"}</td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center font-bold">{disc.media || "—"}</td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">{disc.faltas || "0"}</td>
                        <td className={`border border-gray-300 px-1 py-0.5 text-center text-[8px] font-bold ${disc.situacao === "APROVADO" ? "text-green-600" : disc.situacao === "REPROVADO" ? "text-red-600" : "text-yellow-600"}`}>
                          {disc.situacao === "APROVADO" ? "APR" : disc.situacao === "REPROVADO" ? "REP" : "REC"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-3 flex justify-between items-end">
                  <div>
                    <p className="text-gray-500">Mãe: {data.nomeMae || "—"}</p>
                    <p className="text-gray-500">Pai: {data.nomePai || "—"}</p>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-gray-400 pt-1 w-32">
                      <p className="text-[8px] text-gray-500">Diretor(a)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {saved && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400">Histórico gerado com sucesso!</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal de Confirmação + Sucesso */}
      <EmissionModal
        docLabel="Historico Escolar SP"
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
        onClose={() => setShowSuccessModal(false)}
        historyPath="/historico-sp-salvos"
      />
    </DashboardLayout>
  );
}
