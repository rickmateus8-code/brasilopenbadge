import { type SubstitutionField, type HistoricoDisponivelKey } from "@/lib/documentData_uninter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UserRoundPen, RotateCcw, ArrowRightLeft, ChevronDown, ChevronRight, Copy, FileText, WandSparkles } from "lucide-react";
import { useState } from "react";
import { UNINTER_IMPORT_TEMPLATE } from "@/lib/documentData_uninter";

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

const CATEGORY_ORDER = ["pessoal", "academico", "institucional"];

const HISTORICO_BUTTONS: { key: HistoricoDisponivelKey; label: string; shortLabel: string }[] = [
  { key: "historia", label: "HISTÓRICO-UNINTER — HISTÓRIA", shortLabel: "HIST" },
  { key: "pedagogia", label: "HISTÓRICO-UNINTER — PEDAGOGIA", shortLabel: "PED" },
  { key: "engenharia_controle_automacao", label: "HISTÓRICO-UNINTER — ENG. CONTROLE E AUTOMAÇÃO", shortLabel: "ENG" },
];

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
    <div className="flex flex-col h-full bg-white">
      {/* Header do Painel */}
      <div className="p-4 border-b border-gray-100 space-y-3 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
             <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
             Edição de Conteúdo
          </h3>
          <Button size="sm" variant="ghost" className="text-[10px] h-7 text-gray-400 hover:text-red-500 hover:bg-red-50 px-2" onClick={onReset}>
            <RotateCcw size={12} className="mr-1" /> Resetar Tudo
          </Button>
        </div>
        {modifiedCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 border border-amber-100 w-fit">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[11px] font-bold text-amber-700">{modifiedCount} campos modificados</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {/* Escolha do Curso */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Selecione o Modelo Base</p>
          <div className="space-y-2">
            {HISTORICO_BUTTONS.map((pb) => {
              const isActive = activeHistorico === pb.key;
              return (
                <button
                  key={pb.key}
                  onClick={() => onApplyHistorico(pb.key)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                      : "border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className={`p-1 rounded-md ${isActive ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                    <ArrowRightLeft size={12} />
                  </div>
                  <span className="flex-1 truncate">{pb.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Importação Rápida */}
        <div className="p-4 border-b border-gray-100 space-y-4 bg-white">
          <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={13} className="text-amber-600" /> Importação Rápida
          </h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-400 uppercase">1. Modelo para Cliente</label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[10px] text-amber-600 hover:bg-amber-50 font-bold"
                onClick={handleCopyTemplate}
              >
                <Copy size={11} className="mr-1" />
                Copiar Modelo
              </Button>
            </div>
            <div className="p-2.5 rounded-lg border border-gray-100 bg-gray-50 text-[10px] leading-relaxed text-gray-600 font-mono h-24 overflow-y-auto whitespace-pre select-all">
              {UNINTER_IMPORT_TEMPLATE}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase block">2. Colar Resposta</label>
            <Textarea
              value={importText}
              onChange={(e) => onUpdateImportText(e.target.value)}
              placeholder="Cole os dados preenchidos aqui para preencher automaticamente aluno e notas..."
              className="min-h-24 text-[11px] bg-white border-gray-200 text-gray-800 resize-none focus-visible:ring-amber-500"
            />
            <Button
              type="button"
              className="w-full h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-200"
              onClick={onApplyImportText}
            >
              ⚡ PROCESSAR E PREENCHER
            </Button>
          </div>
        </div>

        {/* Categorias */}
        <div className="p-3 space-y-2 pb-10">
          {grouped.map((group) => {
            const isExpanded = expandedCategories[group.category];
            const modifiedCount = group.items.filter((i) => i.currentValue !== i.originalValue).length;

            return (
              <div key={group.category} className={`rounded-xl border transition-all ${isExpanded ? "border-amber-200 bg-amber-50/20 shadow-sm" : "border-gray-100 bg-white"}`}>
                <button
                  type="button"
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isExpanded ? "bg-amber-50/50" : "hover:bg-gray-50"}`}
                  onClick={() => toggleCategory(group.category)}
                >
                  <div className={`p-1.5 rounded-lg ${isExpanded ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                    <UserRoundPen size={14} className="shrink-0" />
                  </div>
                  <span className={`text-xs font-bold flex-1 ${isExpanded ? "text-amber-900" : "text-gray-700"}`}>{group.label}</span>
                  <div className="flex items-center gap-2">
                     {modifiedCount > 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">{modifiedCount} mod.</span>}
                     {isExpanded ? <ChevronDown size={14} className="text-amber-500" /> : <ChevronRight size={14} className="text-gray-300" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-4">
                    {group.items.map((field) => {
                      const isModified = field.currentValue !== field.originalValue;
                      const isMatricula = field.id === "matricula";
                      return (
                        <div key={field.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">{field.label}</label>
                            <span className="text-[9px] text-gray-400 font-mono">Págs: {field.pages.join(", ")}</span>
                          </div>

                          {isMatricula ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={field.currentValue}
                                onChange={(e) => onUpdateField(field.id, e.target.value)}
                                className={`h-9 text-xs border-gray-200 focus-visible:ring-amber-500 transition-all ${
                                  isModified ? "border-amber-500 bg-amber-50" : "bg-white"
                                }`}
                                placeholder="Formato: 1022071"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 px-3 text-[10px] border-amber-200 text-amber-700 font-bold hover:bg-amber-50"
                                onClick={onGenerateMatricula}
                              >
                                <WandSparkles size={11} className="mr-1" />
                                Gerar
                              </Button>
                            </div>
                          ) : (
                            <Input
                              value={field.currentValue}
                              onChange={(e) => onUpdateField(field.id, e.target.value)}
                              className={`h-9 text-xs border-gray-200 focus-visible:ring-amber-500 transition-all ${
                                isModified ? "border-amber-500 bg-amber-50" : "bg-white"
                              }`}
                            />
                          )}
                          {isModified && (
                            <div className="text-[9px] text-gray-400 italic flex items-center gap-1">
                              Original: <span className="line-through">{field.originalValue || "(vazio)"}</span>
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
