import { type SubstitutionField, type HistoricoDisponivelKey } from "@/lib/documentData_uninter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UserRoundPen, RotateCcw, ArrowRightLeft, ChevronDown, ChevronRight, Copy, FileText, WandSparkles, Sparkles, School, GraduationCap, FileSignature } from "lucide-react";
import { useState } from "react";
import { UNINTER_IMPORT_TEMPLATE, HISTORICOS_DISPONIVEIS } from "@/lib/documentData_uninter";

interface Props {
  fields: SubstitutionField[];
  activeHistorico: HistoricoDisponivelKey;
  modifiedCount: number;
  importText: string;
  onUpdateImportText: (value: string) => void;
  onApplyImportText: () => void;
  onApplyHistorico: (historico: HistoricoDisponivelKey) => void;
  onUpdateField: (fieldId: string, value: string) => void;
  onGenerateMatricula: () => void;
  onReset: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  pessoal: "Dados Pessoais",
  academico: "Dados Acadêmicos",
  institucional: "Dados Institucionais",
};

const CATEGORY_ICONS: Record<string, any> = {
  pessoal: UserRoundPen,
  academico: GraduationCap,
  institucional: School,
};

const CATEGORY_ORDER = ["pessoal", "academico", "institucional"];

export default function SubstitutionPanel({
  fields,
  activeHistorico,
  modifiedCount,
  importText,
  onUpdateImportText,
  onApplyImportText,
  onApplyHistorico,
  onUpdateField,
  onGenerateMatricula,
  onReset,
}: Props) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    pessoal: true,
    academico: true,
    institucional: true,
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    Icon: CATEGORY_ICONS[cat],
    items: fields.filter((f) => f.category === cat),
  }));

  const handleCopyTemplate = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(UNINTER_IMPORT_TEMPLATE);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = UNINTER_IMPORT_TEMPLATE;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      toast.success("Modelo de importação copiado.");
    } catch {
      toast.error("Erro ao copiar modelo.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 border-r dark:border-slate-800">
      {/* Header do Painel */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 uppercase tracking-tight">
             <div className="w-1.5 h-4 bg-[#005CA9] rounded-full shadow-sm shadow-blue-500/50" />
             Painel de Edição Elite
          </h3>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-[10px] h-7 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-2 font-bold" 
            onClick={onReset}
          >
            <RotateCcw size={12} className="mr-1" /> Resetar
          </Button>
        </div>
        {modifiedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 w-fit">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-sm" />
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">{modifiedCount} campos customizados</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2">
        {/* Escolha do Curso */}
        <div className="p-3 mb-2 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-4 ml-1">Modelo Acadêmico</p>
          <div className="space-y-2">
            {HISTORICOS_DISPONIVEIS.map((pb) => {
              const isActive = activeHistorico === pb.key;
              return (
                <button
                  key={pb.key}
                  onClick={() => onApplyHistorico(pb.key)}
                  className={`w-full text-left px-4 py-3 rounded-2xl border text-[10px] font-black transition-all flex items-center gap-3 group relative overflow-hidden ${
                    isActive
                      ? "border-[#005CA9] bg-blue-50/50 dark:bg-blue-900/10 text-[#005CA9] dark:text-blue-400 shadow-sm"
                      : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:border-blue-200 dark:hover:border-blue-800"
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-all ${isActive ? "bg-[#005CA9] text-white shadow-md shadow-blue-300/30" : "bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:text-blue-500"}`}>
                    <ArrowRightLeft size={13} />
                  </div>
                  <span className="flex-1 truncate uppercase">{pb.label}</span>
                  {isActive && <Sparkles size={14} className="text-blue-400 animate-pulse" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Importação Rápida */}
        <div className="p-4 mb-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] flex items-center gap-2">
            <FileText size={13} className="text-[#005CA9]" /> Importação Inteligente
          </h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">1. Modelo para o Cliente</label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[10px] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 font-black"
                onClick={handleCopyTemplate}
              >
                <Copy size={11} className="mr-1" />
                Copiar
              </Button>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[10px] leading-relaxed text-slate-500 font-mono h-24 overflow-y-auto whitespace-pre select-all custom-scrollbar">
              {UNINTER_IMPORT_TEMPLATE}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block">2. Resposta Preenchida</label>
            <Textarea
              value={importText}
              onChange={(e) => onUpdateImportText(e.target.value)}
              placeholder="Cole os dados aqui para preencher automaticamente aluno, notas e informações institucionais..."
              className="min-h-24 text-[11px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 resize-none focus-visible:ring-[#005CA9] rounded-xl"
            />
            <Button
              type="button"
              className="w-full h-10 text-xs bg-[#005CA9] hover:bg-[#004a8a] text-white font-black shadow-lg shadow-blue-500/20 rounded-xl transition-all active:scale-95"
              onClick={onApplyImportText}
            >
              <Sparkles size={14} className="mr-2" /> PROCESSAR E PREENCHER
            </Button>
          </div>
        </div>

        {/* Categorias */}
        <div className="space-y-3 pb-12 px-1">
          {grouped.map((group) => {
            const isExpanded = expandedCategories[group.category];
            const modifiedInGroup = group.items.filter((i) => i.currentValue !== i.originalValue && i.currentValue !== "").length;
            const { Icon } = group;

            return (
              <div key={group.category} className={`rounded-2xl border transition-all ${isExpanded ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/10 shadow-sm" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950"}`}>
                <button
                  type="button"
                  className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-colors rounded-t-2xl ${isExpanded ? "bg-slate-50/50 dark:bg-slate-900/50" : "hover:bg-slate-50 dark:hover:bg-slate-900/30"}`}
                  onClick={() => toggleCategory(group.category)}
                >
                  <div className={`p-2 rounded-xl ${isExpanded ? "bg-[#005CA9] text-white shadow-md shadow-blue-300/30" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                    <Icon size={14} className="shrink-0" />
                  </div>
                  <span className={`text-[11px] font-black uppercase tracking-tight flex-1 ${isExpanded ? "text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}>{group.label}</span>
                  <div className="flex items-center gap-2">
                     {modifiedInGroup > 0 && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-500 text-white shadow-sm">{modifiedInGroup}</span>}
                     {isExpanded ? <ChevronDown size={14} className="text-blue-500" /> : <ChevronRight size={14} className="text-slate-300 dark:text-slate-700" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 space-y-5">
                    {group.items.map((field) => {
                      const isModified = field.currentValue !== field.originalValue && field.currentValue !== "";
                      const isMatricula = field.id === "matricula";
                      const isTextArea = ["reconhecimento", "credenciamento", "instituicao_polo", "endereco"].includes(field.id);

                      return (
                        <div key={field.id} className="space-y-1.5 group/field">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide group-hover/field:text-blue-500 transition-colors">{field.label}</label>
                            <span className="text-[9px] text-slate-300 dark:text-slate-700 font-black">PÁG: {field.pages.join(", ")}</span>
                          </div>

                          {isMatricula ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={field.currentValue}
                                onChange={(e) => onUpdateField(field.id, e.target.value)}
                                className={`h-10 text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus-visible:ring-[#005CA9] transition-all rounded-xl ${
                                  isModified ? "border-blue-400 dark:border-blue-600 bg-blue-50/20 shadow-sm" : ""
                                }`}
                                placeholder="1022071"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-10 px-3 text-[10px] border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 font-black hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-xl"
                                onClick={onGenerateMatricula}
                              >
                                <WandSparkles size={12} />
                              </Button>
                            </div>
                          ) : isTextArea ? (
                            <Textarea
                              value={field.currentValue}
                              onChange={(e) => onUpdateField(field.id, e.target.value)}
                              className={`min-h-[60px] text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus-visible:ring-[#005CA9] transition-all rounded-xl resize-none ${
                                isModified ? "border-blue-400 dark:border-blue-600 bg-blue-50/20 shadow-sm" : ""
                              }`}
                            />
                          ) : (
                            <Input
                              value={field.currentValue}
                              onChange={(e) => onUpdateField(field.id, e.target.value)}
                              className={`h-10 text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus-visible:ring-[#005CA9] transition-all rounded-xl ${
                                isModified ? "border-blue-400 dark:border-blue-600 bg-blue-50/20 shadow-sm" : ""
                              }`}
                            />
                          )}
                          {isModified && (
                            <div className="text-[9px] text-slate-400 dark:text-slate-600 italic flex items-center gap-1.5 ml-1">
                              <span className="font-black text-[8px] uppercase not-italic">Original:</span>
                              <span className="line-through truncate max-w-[200px]">{field.originalValue || "(vazio)"}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
