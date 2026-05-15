import { type SubstitutionField, type HistoricoDisponivelKey } from "@/lib/documentData_uninter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  UserRoundPen, RotateCcw, ChevronDown, ChevronRight, 
  Copy, FileText, WandSparkles, Sparkles, School, 
  GraduationCap, LayoutGrid, Search, X, TableProperties
} from "lucide-react";
import { useState, useMemo } from "react";
import { UNINTER_IMPORT_TEMPLATE, HISTORICOS_DISPONIVEIS } from "@/lib/documentData_uninter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  onGenerateGrade: () => void;
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
  onGenerateGrade
}: Props) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    pessoal: true,
    academico: true,
    institucional: true,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    Icon: CATEGORY_ICONS[cat],
    items: fields.filter((f) => f.category === cat),
  }));

  const filteredCursos = useMemo(() => {
    return HISTORICOS_DISPONIVEIS.filter(c => 
      c.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.shortLabel.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const activeCursoLabel = useMemo(() => {
    return HISTORICOS_DISPONIVEIS.find(c => c.key === activeHistorico)?.label || "SELECIONE O CURSO";
  }, [activeHistorico]);

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

  const handleSelectCurso = (key: HistoricoDisponivelKey) => {
    onApplyHistorico(key);
    setIsModalOpen(false);
    toast.success(`Curso alterado para: ${HISTORICOS_DISPONIVEIS.find(c => c.key === key)?.label}`);
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
            <RotateCcw size={12} className="mr-1" /> Resetar Tudo
          </Button>
        </div>
        {modifiedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 w-fit">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-sm" />
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">{modifiedCount} campos preenchidos</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2">
        {/* Escolha do Curso (Modal Expansivo) */}
        <div className="p-3 mb-2 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-3 ml-1">Tipo de Curso</p>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <button className="w-full text-left px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-[#005CA9] transition-all flex items-center gap-3 group">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 text-[#005CA9] shadow-sm group-hover:bg-[#005CA9] group-hover:text-white transition-all">
                  <LayoutGrid size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 truncate uppercase">{activeCursoLabel}</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Clique para alterar</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
              <DialogHeader className="p-6 bg-[#005CA9] text-white shrink-0">
                <DialogTitle className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
                  <School className="w-5 h-5" /> Selecionar Tipo de Curso
                </DialogTitle>
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 w-4 h-4" />
                  <Input 
                    placeholder="Pesquisar curso..." 
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-10 pl-10 rounded-xl focus-visible:ring-white/30"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50 dark:bg-slate-950">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCursos.map((curso) => {
                    const isActive = curso.key === activeHistorico;
                    return (
                      <button
                        key={curso.key}
                        onClick={() => handleSelectCurso(curso.key)}
                        className={`text-left p-4 rounded-2xl border transition-all flex items-start gap-3 group ${
                          isActive 
                            ? "bg-blue-50 dark:bg-blue-900/20 border-[#005CA9] shadow-md shadow-blue-500/10" 
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-lg"
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 ${isActive ? "bg-[#005CA9] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-[#005CA9] group-hover:bg-blue-50"}`}>
                          <GraduationCap size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-black uppercase leading-tight ${isActive ? "text-[#005CA9] dark:text-blue-400" : "text-slate-700 dark:text-slate-200"}`}>{curso.label}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{curso.shortLabel} MODEL</p>
                        </div>
                      </button>
                    );
                  })}
                  {filteredCursos.length === 0 && (
                    <div className="col-span-full py-12 text-center">
                       <School className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                       <p className="text-sm font-bold text-slate-400 uppercase">Nenhum curso encontrado</p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Gerador de Grade */}
        <div className="p-4 mb-2 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-between group hover:border-emerald-300 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <TableProperties size={14} />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-200 uppercase tracking-tighter">Componentes Curriculares</p>
              <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/50 font-bold uppercase italic">Gerador Automático</p>
            </div>
          </div>
          <Button
            size="sm"
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] px-3 rounded-lg shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            onClick={onGenerateGrade}
          >
            <Sparkles size={11} className="mr-1.5" /> GERAR GRADE
          </Button>
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
