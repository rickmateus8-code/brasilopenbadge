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
  ChevronDown,
  ChevronRight,
  History,
  Save,
  Trash2,
  CheckCircle2,
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
  onGenerateRGGerente?: () => void;
  onGenerateRGDiretor?: () => void;
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
    <div className="p-4 border-b border-gray-100 bg-white">
      <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
        {title.includes("Brasão") ? <Image size={12} className="text-amber-600" /> : <PenTool size={12} className="text-amber-600" />} {title}
      </h4>
      <div className="flex items-center gap-3">
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
          className="text-xs h-9 text-gray-700 border-gray-200 hover:bg-gray-50 flex-1 shadow-sm"
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={14} className="mr-2" />
          {hasCustom ? "Trocar arquivo" : "Selecionar arquivo"}
        </Button>
        {preview && (
          <div className="relative w-12 h-10 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center bg-white shrink-0 shadow-inner">
            <img src={preview} alt={title} className="w-full h-full object-contain p-1" />
            {hasCustom && onReset && (
              <button
                type="button"
                onClick={onReset}
                className="absolute top-0 right-0 bg-red-500 text-white p-[2px] hover:bg-red-600 transition-colors"
                aria-label={`Remover ${title}`}
              >
                <X size={10} />
              </button>
            )}
          </div>
        )}
      </div>
      <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">{helper}</p>
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
  onGenerateRGGerente,
  onGenerateRGDiretor,
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
    <div className="flex h-full min-h-0 flex-col bg-white">
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 border border-amber-100">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[11px] font-bold text-amber-700">{modifiedCount} campos preenchidos</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[10px] border-gray-200 text-gray-500 hover:bg-white hover:text-amber-600 shadow-sm"
            onClick={() => onOpenHowToUse?.()}
          >
            <CircleHelp size={12} className="mr-1" /> Guia de Uso
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {/* Sessão de Importação */}
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
              {SP_IMPORT_TEMPLATE}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase block">2. Colar Resposta</label>
            <Textarea
              value={importText}
              onChange={(e) => onUpdateImportText(e.target.value)}
              placeholder="Cole os dados preenchidos pelo cliente aqui..."
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

        {/* Uploads */}
        <UploadCard
          title="Brasão / Logo Estadual"
          preview={brasaoUrl}
          hasCustom={hasCustomBrasao}
          helper="Recomendado: PNG transparente ou SVG. Substitui o brasão do topo da página."
          inputRef={fileInputRef}
          onUpload={onBrasaoUpload}
          onReset={onBrasaoReset}
        />

        <UploadCard
          title="Assinatura do Gerente"
          preview={assinaturaGerenteUrl}
          hasCustom={hasCustomAssinaturaGerente}
          helper="A imagem enviada substituirá a assinatura digital padrão no rodapé."
          inputRef={gerenteInputRef}
          onUpload={onAssinaturaGerenteUpload}
          onReset={onAssinaturaGerenteReset}
        />

        <UploadCard
          title="Assinatura do Diretor"
          preview={assinaturaDiretorUrl}
          hasCustom={hasCustomAssinaturaDiretor}
          helper="Assinatura manuscrita para o campo de Direção da Unidade Escolar."
          inputRef={diretorInputRef}
          onUpload={onAssinaturaDiretorUpload}
          onReset={onAssinaturaDiretorReset}
        />

        {/* Categorias de Campos */}
        <div className="p-3 space-y-2 pb-10">
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat];
            const catFields = fields.filter((f) => f.category === cat);
            const isExpanded = expandedCategory === cat;
            const Icon = meta.icon;

            return (
              <div key={cat} className={`rounded-xl border transition-all ${isExpanded ? "border-amber-200 bg-amber-50/20 shadow-sm" : "border-gray-100 bg-white"}`}>
                <button
                  type="button"
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isExpanded ? "bg-amber-50/50" : "hover:bg-gray-50"}`}
                  onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                >
                  <div className={`p-1.5 rounded-lg ${isExpanded ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                    <Icon size={14} className="shrink-0" />
                  </div>
                  <span className={`text-xs font-bold flex-1 ${isExpanded ? "text-amber-900" : "text-gray-700"}`}>{meta.label}</span>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{catFields.length}</span>
                     {isExpanded ? <ChevronDown size={14} className="text-amber-500" /> : <ChevronRight size={14} className="text-gray-300" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-3">
                    {catFields.map((field) => {
                      const changed = field.currentValue !== field.originalValue;

                      return (
                        <div key={field.id} className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center justify-between">
                            {field.label}
                            {changed && <span className="text-[9px] text-amber-600 bg-amber-100 px-1 rounded">Modificado</span>}
                          </label>

                          {field.type === "select" ? (
                            <select
                              value={field.currentValue}
                              onChange={(e) => onUpdateField(field.id, e.target.value)}
                              className={`h-9 w-full rounded-lg border px-3 text-xs outline-none transition-all ${
                                changed ? "border-amber-500 bg-amber-50" : "border-gray-200 bg-white focus:border-amber-400"
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
                                className={`h-9 text-xs border-gray-200 focus-visible:ring-amber-500 transition-all ${
                                  changed ? "border-amber-500 bg-amber-50" : "bg-white"
                                }`}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 px-3 text-[10px] border-amber-200 text-amber-700 font-bold hover:bg-amber-50"
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
                                className={`h-9 text-xs border-gray-200 focus-visible:ring-amber-500 transition-all ${
                                  changed ? "border-amber-500 bg-amber-50" : "bg-white"
                                }`}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 px-3 text-[10px] border-amber-200 text-amber-700 font-bold hover:bg-amber-50"
                                onClick={() => onGenerateRA?.()}
                              >
                                GERAR
                              </Button>
                            </div>
                          ) : field.id === "gerente_rg" ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={field.currentValue}
                                onChange={(e) => onUpdateField(field.id, e.target.value)}
                                placeholder={field.placeholder}
                                className={`h-9 text-xs border-gray-200 focus-visible:ring-amber-500 transition-all ${
                                  changed ? "border-amber-500 bg-amber-50" : "bg-white"
                                }`}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 px-3 text-[10px] border-amber-200 text-amber-700 font-bold hover:bg-amber-50"
                                onClick={() => onGenerateRGGerente?.()}
                              >
                                GERAR
                              </Button>
                            </div>
                          ) : field.id === "diretor_rg" ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={field.currentValue}
                                onChange={(e) => onUpdateField(field.id, e.target.value)}
                                placeholder={field.placeholder}
                                className={`h-9 text-xs border-gray-200 focus-visible:ring-amber-500 transition-all ${
                                  changed ? "border-amber-500 bg-amber-50" : "bg-white"
                                }`}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 px-3 text-[10px] border-amber-200 text-amber-700 font-bold hover:bg-amber-50"
                                onClick={() => onGenerateRGDiretor?.()}
                              >
                                GERAR
                              </Button>
                            </div>
                          ) : (
                            <Input
                              value={field.currentValue}
                              onChange={(e) => onUpdateField(field.id, e.target.value)}
                              placeholder={field.placeholder}
                              className={`h-9 text-xs border-gray-200 focus-visible:ring-amber-500 transition-all ${
                                changed ? "border-amber-500 bg-amber-50" : "bg-white"
                              }`}
                            />
                          )}

                          {(field.placeholder || field.helperText) && (
                            <p className="text-[10px] text-gray-400 italic">
                              {field.helperText || `Sugestão: ${field.placeholder}`}
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
