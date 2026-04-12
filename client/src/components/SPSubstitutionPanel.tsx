import { useState, useRef, type ElementType, type RefObject } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  RotateCcw,
  User,
  Building2,
  GraduationCap,
  FileCheck,
  PenTool,
  Upload,
  Image,
  FileText,
  Copy,
  X,
  CircleHelp,
} from "lucide-react";
import { SP_IMPORT_TEMPLATE, type SPSubstitutionField } from "@/lib/historicoSPData";

interface Props {
  fields: SPSubstitutionField[];
  modifiedCount: number;
  importText: string;
  onUpdateImportText: (value: string) => void;
  onApplyImportText: () => void;
  onUpdateField: (id: string, value: string) => void;
  onGenerateSecurityCode?: () => void;
  onGenerateRA?: () => void;
  onReset: () => void;
  onBrasaoUpload: (file: File) => void;
  onBrasaoReset?: () => void;
  brasaoUrl?: string;
  hasCustomBrasao?: boolean;
  onAssinaturaGerenteUpload?: (file: File) => void;
  onAssinaturaGerenteReset?: () => void;
  onAssinaturaDiretorUpload?: (file: File) => void;
  onAssinaturaDiretorReset?: () => void;
  assinaturaGerenteUrl?: string | null;
  assinaturaDiretorUrl?: string | null;
  hasCustomAssinaturaGerente?: boolean;
  hasCustomAssinaturaDiretor?: boolean;
  onOpenHowToUse?: () => void;
}

const CATEGORY_META: Record<string, { label: string; icon: ElementType }> = {
  instituicao: { label: "Dados da Instituição", icon: Building2 },
  aluno: { label: "Dados do Aluno", icon: User },
  academico: { label: "Dados Escolares", icon: GraduationCap },
  certificado: { label: "Certificado", icon: FileCheck },
  assinaturas: { label: "Responsáveis Administrativos", icon: PenTool },
  emissao: { label: "Emissão", icon: FileText },
};

function UploadCard({
  title,
  preview,
  hasCustom,
  helper,
  inputRef,
  onUpload,
  onReset,
}: {
  title: string;
  preview?: string | null;
  hasCustom?: boolean;
  helper: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onUpload?: (file: File) => void;
  onReset?: () => void;
}) {
  return (
    <div className="p-3 border-b border-[#1a1a2a]">
      <h4 className="text-[10px] text-[#666688] uppercase tracking-wider mb-1.5 flex items-center gap-1">
        {title.includes("Brasão") ? <Image size={11} /> : <PenTool size={11} />} {title}
      </h4>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && onUpload) onUpload(file);
          }}
        />
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7 text-[#aaaacc] border-[#2a2a3a] hover:bg-[#1a1a2a] flex-1"
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={12} className="mr-1" />
          {hasCustom ? "Trocar arquivo" : "Selecionar arquivo"}
        </Button>
        {preview && (
          <div className="relative w-10 h-8 rounded border border-[#2a2a3a] overflow-hidden flex items-center justify-center bg-white shrink-0">
            <img src={preview} alt={title} className="w-full h-full object-contain" />
            {hasCustom && onReset && (
              <button
                type="button"
                onClick={onReset}
                className="absolute top-0 right-0 bg-black/70 text-white p-[2px] rounded-bl"
                aria-label={`Remover ${title}`}
              >
                <X size={10} />
              </button>
            )}
          </div>
        )}
      </div>
      <p className="text-[9px] text-[#555566] mt-1">{helper}</p>
    </div>
  );
}

export default function SPSubstitutionPanel({
  fields,
  modifiedCount,
  importText,
  onUpdateImportText,
  onApplyImportText,
  onUpdateField,
  onGenerateSecurityCode,
  onGenerateRA,
  onReset,
  onBrasaoUpload,
  onBrasaoReset,
  brasaoUrl,
  hasCustomBrasao,
  onAssinaturaGerenteUpload,
  onAssinaturaGerenteReset,
  onAssinaturaDiretorUpload,
  onAssinaturaDiretorReset,
  assinaturaGerenteUrl,
  assinaturaDiretorUrl,
  hasCustomAssinaturaGerente,
  hasCustomAssinaturaDiretor,
  onOpenHowToUse,
}: Props) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>("instituicao");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gerenteInputRef = useRef<HTMLInputElement>(null);
  const diretorInputRef = useRef<HTMLInputElement>(null);

  const categories = ["instituicao", "aluno", "academico", "certificado", "assinaturas", "emissao"];

  const handleCopyTemplate = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(SP_IMPORT_TEMPLATE);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = SP_IMPORT_TEMPLATE;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      toast.success("Modelo para enviar copiado.");
    } catch {
      toast.error("Não foi possível copiar o modelo.");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="p-3 border-b border-[#1a1a2a] space-y-2">
        <div>
          <h3 className="text-sm font-semibold text-white mb-1">Histórico Escolar SP</h3>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-amber-400">{modifiedCount} campo(s) preenchido(s)</span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[10px] border-[#2a2a3a] text-[#aaaacc] hover:bg-[#1a1a2a]"
              onClick={() => onOpenHowToUse?.()}
            >
              <CircleHelp size={11} className="mr-1" /> Como usar
            </Button>
            <Button size="sm" variant="ghost" className="text-xs h-6 text-[#666688] hover:text-white" onClick={onReset}>
              <RotateCcw size={12} className="mr-1" /> Resetar vazio
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-3 border-b border-[#1a1a2a] space-y-2">
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
              value={SP_IMPORT_TEMPLATE}
              readOnly
              className="h-28 overflow-y-auto text-[10px] leading-4 bg-[#0a0a0f] border-[#2a2a3a] text-[#b9b9d0] resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-[#666688] uppercase tracking-wider block mb-1">Importar dados</label>
            <Textarea
              value={importText}
              onChange={(e) => onUpdateImportText(e.target.value)}
              placeholder="Cole aqui o texto preenchido para distribuir os dados automaticamente no formulário."
              className="min-h-28 text-[11px] bg-[#0a0a0f] border-[#2a2a3a] text-white resize-none"
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

        <UploadCard
          title="Brasão / Logo do Estado"
          preview={brasaoUrl}
          hasCustom={hasCustomBrasao}
          helper="Use PNG/SVG proporcional ao original. O X remove o upload e restaura o brasão padrão do layout."
          inputRef={fileInputRef}
          onUpload={onBrasaoUpload}
          onReset={onBrasaoReset}
        />

        <UploadCard
          title="Assinatura Gerente"
          preview={assinaturaGerenteUrl}
          hasCustom={hasCustomAssinaturaGerente}
          helper="Ao remover com o X, a assinatura original volta automaticamente."
          inputRef={gerenteInputRef}
          onUpload={onAssinaturaGerenteUpload}
          onReset={onAssinaturaGerenteReset}
        />

        <UploadCard
          title="Assinatura Diretor"
          preview={assinaturaDiretorUrl}
          hasCustom={hasCustomAssinaturaDiretor}
          helper="Ao remover com o X, a assinatura original volta automaticamente."
          inputRef={diretorInputRef}
          onUpload={onAssinaturaDiretorUpload}
          onReset={onAssinaturaDiretorReset}
        />

        <div className="p-3 space-y-2">
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat];
            const catFields = fields.filter((f) => f.category === cat);
            const isExpanded = expandedCategory === cat;
            const Icon = meta.icon;

            return (
              <div key={cat} className="rounded-lg border border-[#1a1a2a] overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#1a1a2a] transition-colors"
                  onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                >
                  <Icon size={14} className="text-[#2d8c4e] shrink-0" />
                  <span className="text-xs font-medium text-[#aaaacc] flex-1">{meta.label}</span>
                  <span className="text-[10px] text-[#555566]">{catFields.length}</span>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2">
                    {catFields.map((field) => {
                      const changed = field.currentValue !== field.originalValue;

                      return (
                        <div key={field.id}>
                          <label className="text-[10px] text-[#666688] uppercase tracking-wider block mb-0.5">
                            {field.label}
                          </label>

                          {field.type === "select" ? (
                            <select
                              value={field.currentValue}
                              onChange={(e) => onUpdateField(field.id, e.target.value)}
                              className={`h-8 w-full rounded-md border px-2 text-xs bg-[#0a0a0f] text-white outline-none ${
                                changed ? "border-amber-500/50 bg-amber-900/10" : "border-[#2a2a3a]"
                              }`}
                            >
                              <option value="">Selecione</option>
                              {field.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : field.id === "codigo_seguranca" ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={field.currentValue}
                                onChange={(e) => onUpdateField(field.id, e.target.value)}
                                placeholder={field.placeholder}
                                className={`h-8 text-xs bg-[#0a0a0f] border-[#2a2a3a] text-white flex-1 ${
                                  changed ? "border-amber-500/50 bg-amber-900/10" : ""
                                }`}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-[10px] border-[#2a2a3a] text-white hover:bg-[#1a1a2a]"
                                onClick={() => onGenerateSecurityCode?.()}
                              >
                                GERAR
                              </Button>
                            </div>
                          ) : field.id === "ra" ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={field.currentValue}
                                onChange={(e) => onUpdateField(field.id, e.target.value)}
                                placeholder={field.placeholder}
                                className={`h-8 text-xs bg-[#0a0a0f] border-[#2a2a3a] text-white flex-1 ${
                                  changed ? "border-amber-500/50 bg-amber-900/10" : ""
                                }`}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-[10px] border-[#2a2a3a] text-white hover:bg-[#1a1a2a]"
                                onClick={() => onGenerateRA?.()}
                              >
                                GERAR
                              </Button>
                            </div>
                          ) : (
                            <Input
                              value={field.currentValue}
                              onChange={(e) => onUpdateField(field.id, e.target.value)}
                              placeholder={field.placeholder}
                              className={`h-8 text-xs bg-[#0a0a0f] border-[#2a2a3a] text-white ${
                                changed ? "border-amber-500/50 bg-amber-900/10" : ""
                              }`}
                            />
                          )}

                          {(field.placeholder || field.helperText) && (
                            <p className="text-[9px] text-[#555566] mt-1">
                              {field.helperText || `Exemplo: ${field.placeholder}`}
                            </p>
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
