import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { ArrowLeft, Download, GraduationCap, AlertCircle, Plus, Trash2 } from "lucide-react";
import { exportElementToPDF } from "@/lib/pdfExport";
import { validarCPF } from "@/lib/utils";

interface Disciplina {
  nome: string;
  cargaHoraria: string;
  nota: string;
  situacao: string;
  periodo: string;
}

interface HistoricoUNINTERData {
  nomeAluno: string;
  ra: string;
  cpf: string;
  dataNascimento: string;
  curso: string;
  modalidade: string;
  polo: string;
  municipio: string;
  uf: string;
  dataIngresso: string;
  previsaoConclusao: string;
  cargaHorariaTotal: string;
  disciplinas: Disciplina[];
}

const DISCIPLINA_VAZIA: Disciplina = {
  nome: "", cargaHoraria: "60", nota: "", situacao: "APROVADO", periodo: "1"
};

const DISCIPLINAS_PADRAO = [
  { nome: "Fundamentos de Administração", cargaHoraria: "60" },
  { nome: "Comunicação Empresarial", cargaHoraria: "60" },
  { nome: "Matemática Financeira", cargaHoraria: "60" },
  { nome: "Gestão de Pessoas", cargaHoraria: "60" },
  { nome: "Marketing", cargaHoraria: "60" },
  { nome: "Contabilidade Geral", cargaHoraria: "60" },
];

const EMPTY: HistoricoUNINTERData = {
  nomeAluno: "", ra: "", cpf: "", dataNascimento: "", curso: "Administração",
  modalidade: "EAD", polo: "", municipio: "", uf: "SP",
  dataIngresso: "", previsaoConclusao: "", cargaHorariaTotal: "1600",
  disciplinas: DISCIPLINAS_PADRAO.map((d, i) => ({
    ...DISCIPLINA_VAZIA, nome: d.nome, cargaHoraria: d.cargaHoraria, periodo: String(Math.floor(i / 2) + 1)
  })),
};

export default function HistoricoUNINTER() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<HistoricoUNINTERData>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  const update = (k: keyof HistoricoUNINTERData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setData(d => ({ ...d, [k]: e.target.value }));

  const updateDisciplina = (idx: number, k: keyof Disciplina, val: string) =>
    setData(d => ({ ...d, disciplinas: d.disciplinas.map((disc, i) => i === idx ? { ...disc, [k]: val } : disc) }));

  const addDisciplina = () =>
    setData(d => ({ ...d, disciplinas: [...d.disciplinas, { ...DISCIPLINA_VAZIA }] }));

  const removeDisciplina = (idx: number) =>
    setData(d => ({ ...d, disciplinas: d.disciplinas.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    if (!data.nomeAluno || !data.ra) { toast.error("Preencha Nome do Aluno e RA"); return; }
    if (data.cpf && !validarCPF(data.cpf)) { toast.error("CPF inválido! Verifique os dígitos informados."); return; }
    if ((user?.balance || 0) <= 0) {
      toast.error("Saldo insuficiente. Recarregue para emitir documentos.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/documents/historico-uninter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        setSaved(true);
        toast.success("Histórico UNINTER gerado com sucesso!");
      } else {
        toast.error(result.error || "Erro ao gerar histórico");
      }
    } catch { toast.error("Erro de conexão"); }
    finally { setLoading(false); }
  };

  const handleExport = async () => {
    if (!docRef.current) return;
    setLoading(true);
    try {
      await exportElementToPDF(docRef.current, `HistoricoUNINTER_${data.nomeAluno.replace(/\s+/g, "_")}.pdf`);
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
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Histórico UNINTER</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Centro Universitário Internacional UNINTER</p>
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
                  { key: "ra", label: "RA (Registro Acadêmico) *", placeholder: "000000000" },
                  { key: "cpf", label: "CPF", placeholder: "000.000.000-00" },
                  { key: "dataNascimento", label: "Data de Nascimento", placeholder: "DD/MM/AAAA" },
                  { key: "curso", label: "Curso", placeholder: "Ex: Administração" },
                  { key: "polo", label: "Polo", placeholder: "Nome do Polo" },
                  { key: "municipio", label: "Município", placeholder: "Cidade" },
                  { key: "dataIngresso", label: "Data de Ingresso", placeholder: "MM/AAAA" },
                  { key: "previsaoConclusao", label: "Previsão de Conclusão", placeholder: "MM/AAAA" },
                  { key: "cargaHorariaTotal", label: "Carga Horária Total (h)", placeholder: "1600" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                    <input type="text" value={data[key as keyof HistoricoUNINTERData] as string} onChange={update(key as keyof HistoricoUNINTERData)} placeholder={placeholder}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Modalidade</label>
                    <select value={data.modalidade} onChange={update("modalidade")}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                      <option>EAD</option>
                      <option>Presencial</option>
                      <option>Semipresencial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">UF</label>
                    <input type="text" maxLength={2} value={data.uf} onChange={update("uf")}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm uppercase" />
                  </div>
                </div>
              </div>
            </div>

            {/* Disciplinas */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Disciplinas</h2>
                <button onClick={addDisciplina} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/40">
                  <Plus className="w-3.5 h-3.5" />Adicionar
                </button>
              </div>
              <div className="space-y-3">
                {data.disciplinas.map((disc, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <input type="text" value={disc.nome} onChange={e => updateDisciplina(idx, "nome", e.target.value)}
                        placeholder="Nome da disciplina"
                        className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                      <button onClick={() => removeDisciplina(idx)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-0.5">Período</label>
                        <input type="text" value={disc.periodo} onChange={e => updateDisciplina(idx, "periodo", e.target.value)} placeholder="1"
                          className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-0.5">C.H. (h)</label>
                        <input type="text" value={disc.cargaHoraria} onChange={e => updateDisciplina(idx, "cargaHoraria", e.target.value)} placeholder="60"
                          className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-0.5">Nota</label>
                        <input type="text" value={disc.nota} onChange={e => updateDisciplina(idx, "nota", e.target.value)} placeholder="0.0"
                          className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-0.5">Situação</label>
                        <select value={disc.situacao} onChange={e => updateDisciplina(idx, "situacao", e.target.value)}
                          className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500">
                          <option>APROVADO</option>
                          <option>REPROVADO</option>
                          <option>CURSANDO</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleSave} disabled={loading || saved}
                className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-60">
                {loading ? "Gerando..." : saved ? "✅ Histórico Emitido" : "✓ CONFIRMAR E EMITIR"}
              </button>
            </div>
            {saved && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">✅ Histórico UNINTER emitido com sucesso!</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">🔒 Dados excluídos automaticamente após 60 dias</p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Pré-visualização</h2>
            <div ref={docRef} className="bg-white rounded-xl shadow-lg overflow-hidden text-gray-900 text-[10px]" style={{ fontFamily: "Arial, sans-serif" }}>
              {/* UNINTER Header */}
              <div className="bg-red-700 text-white p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">UNINTER</p>
                    <p className="text-[9px] opacity-80">Centro Universitário Internacional</p>
                  </div>
                  <div className="text-right text-[9px] opacity-80">
                    <p>Credenciado pelo MEC</p>
                    <p>Portaria nº 1.282/2010</p>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <p className="text-center font-bold text-xs mb-3 uppercase border-b border-gray-200 pb-2">Histórico Escolar</p>
                <div className="grid grid-cols-2 gap-2 mb-3 text-[9px]">
                  <div><span className="text-gray-500">Aluno: </span><span className="font-bold">{data.nomeAluno || "—"}</span></div>
                  <div><span className="text-gray-500">RA: </span><span className="font-bold">{data.ra || "—"}</span></div>
                  <div><span className="text-gray-500">Curso: </span><span>{data.curso}</span></div>
                  <div><span className="text-gray-500">Modalidade: </span><span>{data.modalidade}</span></div>
                  <div><span className="text-gray-500">Polo: </span><span>{data.polo || "—"}</span></div>
                  <div><span className="text-gray-500">Ingresso: </span><span>{data.dataIngresso || "—"}</span></div>
                  <div><span className="text-gray-500">Previsão: </span><span>{data.previsaoConclusao || "—"}</span></div>
                  <div><span className="text-gray-500">C.H. Total: </span><span>{data.cargaHorariaTotal}h</span></div>
                </div>

                <table className="w-full border-collapse text-[9px]">
                  <thead>
                    <tr className="bg-red-700 text-white">
                      <th className="px-1.5 py-1 text-left">Disciplina</th>
                      <th className="px-1 py-1">Per.</th>
                      <th className="px-1 py-1">C.H.</th>
                      <th className="px-1 py-1">Nota</th>
                      <th className="px-1 py-1">Sit.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.disciplinas.map((disc, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border border-gray-200 px-1.5 py-0.5">{disc.nome || "—"}</td>
                        <td className="border border-gray-200 px-1 py-0.5 text-center">{disc.periodo}</td>
                        <td className="border border-gray-200 px-1 py-0.5 text-center">{disc.cargaHoraria}h</td>
                        <td className="border border-gray-200 px-1 py-0.5 text-center font-bold">{disc.nota || "—"}</td>
                        <td className={`border border-gray-200 px-1 py-0.5 text-center font-bold text-[8px] ${
                          disc.situacao === "APROVADO" ? "text-green-600" : disc.situacao === "REPROVADO" ? "text-red-600" : "text-blue-600"
                        }`}>
                          {disc.situacao === "APROVADO" ? "APR" : disc.situacao === "REPROVADO" ? "REP" : "CUR"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-3 flex justify-between items-end">
                  <div className="text-[9px] text-gray-500">
                    <p>Emitido em: {new Date().toLocaleDateString("pt-BR")}</p>
                    <p>Documento gerado eletronicamente</p>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-gray-400 pt-1 w-32">
                      <p className="text-[8px] text-gray-500">Secretaria Acadêmica</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {saved && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400">Histórico UNINTER gerado com sucesso!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
