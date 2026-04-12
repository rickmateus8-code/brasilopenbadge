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
      toast.success("Modelo de importação UNINTER copiado.");
    } catch {
      toast.error("Não foi possível copiar o modelo de importação.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1a1a2a] bg-[#0d0d14]">
        <div className="flex items-center gap-2 mb-2">
          <UserRoundPen size={18} className="text-[#c8aa32]" />
          <h2 className="font-semibold text-sm tracking-wide uppercase text-white">
            Substituição de Dados
          </h2>
        </div>
        {modifiedCount > 0 && (
          <div className="text-xs text-amber-400 font-medium bg-amber-900/30 px-2 py-1 rounded">
            {modifiedCount} campo(s) modificado(s)
          </div>
        )}
      </div>

      {/* Histórico disponível */}
      <div className="px-4 py-3 border-b border-[#1a1a2a] bg-[#0a0a12]">
        <p className="text-xs font-medium text-[#666688] mb-2 uppercase tracking-wider">Históricos Disponíveis</p>
        <div className="flex flex-col gap-2">
          {HISTORICO_BUTTONS.map((pb) => (
            <Button
              key={pb.key}
              size="sm"
              variant={activeHistorico === pb.key ? "default" : "outline"}
              className={`w-full text-xs justify-start ${
                activeHistorico === pb.key
                  ? "bg-gradient-to-r from-[#c8aa32] to-[#a08828] text-[#0a0a0f] font-semibold hover:from-[#d4b83a] hover:to-[#b09830]"
                  : "text-[#aaaacc] border-[#2a2a3a] hover:bg-[#1a1a2a] hover:text-white"
              }`}
              onClick={() => onApplyHistorico(pb.key)}
            >
              <ArrowRightLeft size={12} className="mr-2 shrink-0" />
              {pb.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Importação e modelo */}
      <div className="px-4 py-3 border-b border-[#1a1a2a] bg-[#0d0d14] space-y-2">
        <h4 className="text-[10px] text-[#666688] uppercase tracking-wider flex items-center gap-1">
          <FileText size={11} /> Importação e Modelo
        </h4>
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <label className="text-[10px] text-[#666688] uppercase tracking-wider">Modelo para enviar</label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[10px] border-[#2a2a3a] text-[#aaaacc] hover:bg-[#1a1a2a]"
              onClick={handleCopyTemplate}
            >
              <Copy size={11} className="mr-1" />
              Copiar
            </Button>
          </div>
          <Textarea
            value={UNINTER_IMPORT_TEMPLATE}
            readOnly
            className="h-24 overflow-y-auto text-[10px] leading-4 bg-[#0a0a0f] border-[#2a2a3a] text-[#b9b9d0] resize-none"
          />
        </div>
        <div>
          <label className="text-[10px] text-[#666688] uppercase tracking-wider block mb-1">Importar dados</label>
          <Textarea
            value={importText}
            onChange={(e) => onUpdateImportText(e.target.value)}
            placeholder="Cole aqui o texto preenchido para distribuir automaticamente os dados do aluno e componentes curriculares."
            className="min-h-24 text-[11px] bg-[#0a0a0f] border-[#2a2a3a] text-white resize-none"
          />
          <div className="flex justify-end mt-2">
            <Button
              type="button"
              size="sm"
              className="h-7 text-[10px] bg-gradient-to-r from-[#2d8c4e] to-[#1a6b35] hover:from-[#35a05a] hover:to-[#1f7a3e] text-white"
              onClick={onApplyImportText}
            >
              Importar dados
            </Button>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto">
        {grouped.map((group) => (
          <div key={group.category}>
            <button
              className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#666688] hover:bg-[#1a1a2a]/50 transition-colors border-b border-[#1a1a2a]"
              onClick={() => toggleCategory(group.category)}
            >
              {expandedCategories[group.category] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {group.label}
              <span className="ml-auto text-[10px] font-normal">
                {group.items.filter((i) => i.currentValue !== i.originalValue).length}/{group.items.length}
              </span>
            </button>
            {expandedCategories[group.category] && (
              <div className="px-4 py-2 space-y-3">
                {group.items.map((field) => {
                  const isModified = field.currentValue !== field.originalValue;
                  const showGerarMatricula = field.id === "matricula";
                  return (
                    <div key={field.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-[#ccccdd]">{field.label}</label>
                        {isModified && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-400 font-medium">
                            modificado
                          </span>
                        )}
                      </div>
                      {isModified && (
                        <div className="text-[10px] text-[#555566] line-through">
                          {field.originalValue}
                        </div>
                      )}
                      {showGerarMatricula ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={field.currentValue}
                            onChange={(e) => onUpdateField(field.id, e.target.value)}
                            className={`h-7 text-xs font-mono bg-[#0a0a12] border-[#2a2a3a] text-[#ccccdd] flex-1 ${isModified ? "border-amber-600 bg-amber-900/10" : ""}`}
                            placeholder="Formato: 1022071"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[10px] border-[#2a2a3a] text-white hover:bg-[#1a1a2a]"
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
                          className={`h-7 text-xs font-mono bg-[#0a0a12] border-[#2a2a3a] text-[#ccccdd] ${isModified ? "border-amber-600 bg-amber-900/10" : ""}`}
                        />
                      )}
                      <div className="text-[10px] text-[#444455]">
                        Páginas: {field.pages.join(", ")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1a1a2a] bg-[#0d0d14]">
        <Button size="sm" variant="outline" className="w-full text-xs text-[#aaaacc] border-[#2a2a3a]" onClick={onReset}>
          <RotateCcw size={12} className="mr-1" />
          Restaurar Original
        </Button>
      </div>
    </div>
  );
}
