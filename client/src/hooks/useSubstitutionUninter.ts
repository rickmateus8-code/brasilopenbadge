import { useState, useCallback, useMemo } from "react";
import {
  PROFILES,
  createSubstitutionFields,
  getGradesForProfile,
  type GradeRow,
  type HistoricoDisponivelKey,
  type ProfileKey,
  type SubstitutionField,
  HISTORICOS_DISPONIVEIS
} from "@/lib/documentData_uninter";
import { generateAcademicGrades } from "@/lib/curriculumGenerator";
import { toast } from "sonner";

const HISTORICO_TO_PROFILE: Record<HistoricoDisponivelKey, ProfileKey> = {
  administracao: "administracao",
  ciencias_contabeis: "ciencias_contabeis",
  direito: "direito",
  enfermagem: "enfermagem",
  engenharia_controle_automacao: "engenharia_controle_automacao",
  gestao_recursos_humanos: "gestao_recursos_humanos",
  historia: "historia",
  letras: "letras",
  marketing: "marketing",
  pedagogia: "pedagogia",
  psicologia: "psicologia",
  servico_social: "servico_social",
  teologia: "teologia",
};

const DEFAULT_HISTORICO: HistoricoDisponivelKey | null = null;

function createEmptyFields() {
  const blueprint = createSubstitutionFields();
  return blueprint.map((field) => ({
    ...field,
    originalValue: field.originalValue,
    currentValue: field.id === "situacao_matricula" ? "FORMADO" : "",
  }));
}

function buildMatricula() {
  const value = Math.floor(1000000 + Math.random() * 9000000);
  return String(value);
}

function normalizeUpper(value: string) {
  return (value || "").trim().toUpperCase();
}

/**
 * Normaliza datas com base no tipo de campo
 * @param value String de entrada
 * @param fieldId Identificador do campo para determinar o formato
 */
function normalizeDateByField(value: string, fieldId: string) {
  const digits = value.replace(/\D/g, "");
  
  // Tipo: AAAA (Apenas Ano)
  if (fieldId === "ingresso_ano") {
    return digits.slice(0, 4);
  }

  // Tipo: MM/AAAA (Mês e Ano)
  if (["ingresso_mes_ano", "conclusao_curso"].includes(fieldId)) {
    const d = digits.slice(0, 6);
    if (d.length <= 2) return d;
    return `${d.slice(0, 2)}/${d.slice(2)}`;
  }

  // Tipo: DD/MM/AAAA (Data Completa)
  const d = digits.slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function detectHistoricoByCurso(curso: string): HistoricoDisponivelKey | null {
  const text = normalizeUpper(curso);
  if (!text) return null;
  if (text.includes("ADMINISTRA")) return "administracao";
  if (text.includes("CONT") && text.includes("CIEN")) return "ciencias_contabeis";
  if (text.includes("DIREITO")) return "direito";
  if (text.includes("ENFERM")) return "enfermagem";
  if (text.includes("ENGENHARIA DE CONTROLE") || text.includes("AUTOMA")) return "engenharia_controle_automacao";
  if (text.includes("RH") || text.includes("HUMANO")) return "gestao_recursos_humanos";
  if (text.includes("HIST")) return "historia";
  if (text.includes("LETRAS")) return "letras";
  if (text.includes("MARKET")) return "marketing";
  if (text.includes("PEDAGOGIA")) return "pedagogia";
  if (text.includes("PSICOL")) return "psicologia";
  if (text.includes("SOCIAL")) return "servico_social";
  if (text.includes("TEOL")) return "teologia";
  return null;
}

function parseGradeLine(line: string): GradeRow | null {
  const normalized = line.trim();
  if (!normalized) return null;
  if (/^ano\/m[eê]s/i.test(normalized)) return null;

  let parts = normalized.includes("\t")
    ? normalized.split(/\t+/).map((p) => p.trim())
    : normalized.split(/\s*\|\s*/).map((p) => p.trim());

  if (parts.length < 7 && normalized.includes(";")) {
    parts = normalized.split(/\s*;\s*/).map((p) => p.trim());
  }

  if (parts.length < 7) return null;
  
  return {
    anoMes: parts[0],
    disciplina: parts[1],
    ch: parts[2],
    media: parts[3],
    resultado: parts[4],
    docente: parts[5],
    titulacao: parts.slice(6).join(" | "),
  };
}

function parseImportText(text: string): {
  updates: Record<string, string>;
  gradeRows: GradeRow[];
  historicoKey: HistoricoDisponivelKey | null;
} {
  const updates: Record<string, string> = {};
  const gradeRows: GradeRow[] = [];
  let historicoKey: HistoricoDisponivelKey | null = null;
  let inGrades = false;

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    const upper = normalizeUpper(line);

    if (upper.includes("COMPONENTES CURRICULARES")) {
      inGrades = true;
      continue;
    }

    if (inGrades) {
      const grade = parseGradeLine(line);
      if (grade) {
        gradeRows.push(grade);
        continue;
      }
    }

    const idx = line.indexOf(":");
    if (idx === -1) continue;

    const rawLabel = normalizeUpper(line.slice(0, idx));
    const rawValue = line.slice(idx + 1).trim();
    if (!rawValue) continue;

    // --- Pessoal ---
    if (rawLabel === "NOME COMPLETO" || rawLabel === "NOME") updates.nome = rawValue;
    if (rawLabel === "CPF") updates.cpf = rawValue;
    if (rawLabel === "RG") updates.rg = rawValue;
    if (rawLabel.includes("ORGAO") || rawLabel.includes("ÓRGÃO")) updates.rg_orgao = normalizeUpper(rawValue);
    if (rawLabel.includes("NACIONALIDADE")) updates.nacionalidade = normalizeUpper(rawValue);
    if (rawLabel.includes("DATA DE NASCIMENTO") || (rawLabel.includes("DATA") && rawLabel.includes("NASC"))) updates.data_nascimento = normalizeDateByField(rawValue, "data_nascimento");
    if (rawLabel.includes("UF NASCIMENTO") || (rawLabel.includes("UF") && rawLabel.includes("NASC"))) updates.uf_nascimento = normalizeUpper(rawValue);
    if (rawLabel.includes("ENDERE")) updates.endereco = rawValue;

    // --- Acadêmico ---
    if (rawLabel.includes("MATR")) updates.matricula = rawValue;
    if (rawLabel.includes("SITUA")) updates.situacao_matricula = normalizeUpper(rawValue);
    if (rawLabel.includes("CURSO")) {
      const cleanCurso = rawValue.replace(/CURSO SUPERIOR DE LICENCIATURA EM\s+/i, "");
      historicoKey = detectHistoricoByCurso(cleanCurso) || historicoKey;
      updates.curso = `CURSO SUPERIOR DE LICENCIATURA EM ${cleanCurso.toUpperCase()}`;
    }
    if (rawLabel.includes("CONCLUSAO") || rawLabel.includes("CONCLUSÃO")) updates.conclusao_curso = normalizeDateByField(rawValue, "conclusao_curso");
    if (rawLabel.includes("COLACAO") || rawLabel.includes("COLAÇÃO")) updates.colacao_grau = normalizeDateByField(rawValue, "colacao_grau");
    if (rawLabel.includes("EXPED") && rawLabel.includes("DIPLOMA")) updates.expedicao_diploma = normalizeDateByField(rawValue, "expedicao_diploma");
    if (rawLabel.includes("EXPED") && rawLabel.includes("HIST")) updates.expedicao_historico = normalizeDateByField(rawValue, "expedicao_historico");
    if (rawLabel.includes("CARGA") && rawLabel.includes("HOR")) updates.carga_horaria = rawValue.replace(/[^\d]/g, "");
    if (rawLabel.includes("TITULA")) updates.titulacao = rawValue;
    
    // --- Portarias e Atos ---
    if (rawLabel.includes("RECONHECIMENTO") || rawLabel.includes("RECONHEC.")) {
      updates.reconhecimento = rawValue; 
      const pMatch = rawValue.match(/n\.º\s*([\d.]+)/i);
      if (pMatch) updates.reconhecimento_portaria = pMatch[1];
      const dates = rawValue.match(/(\d{2}\/\d{2}\/\d{4})/g);
      if (dates && dates[0]) updates.reconhecimento_portaria_dt = dates[0];
      if (dates && dates[1]) updates.reconhecimento_dou_dt = dates[1];
    }
    if (rawLabel.includes("CREDENCIAMENTO")) {
       const pMatch = rawValue.match(/Portaria n\.º\s*([\d.]+)/i);
       if (pMatch) updates.cred_portaria = pMatch[1];
       const dates = rawValue.match(/(\d{2}\/\d{2}\/\d{4})/g);
       if (dates && dates[0]) updates.cred_portaria_dt = dates[0];
       if (dates && dates[1]) updates.cred_dou_dt = dates[1];
    }
    if (rawLabel.includes("RECREDENC")) {
       const pMatch = rawValue.match(/Portaria n\.º\s*([\d.]+)/i);
       if (pMatch) updates.recred_portaria = pMatch[1];
       const dates = rawValue.match(/(\d{2}\/\d{2}\/\d{4})/g);
       if (dates && dates[0]) updates.recred_portaria_dt = dates[0];
    }
    
    // --- Novos Mapeamentos Específicos ---
    if (rawLabel.includes("PORTARIA N.º")) {
       if (rawLabel.includes("CREDENCIAMENTO")) updates.cred_portaria = rawValue;
       if (rawLabel.includes("RECREDENC")) updates.recred_portaria = rawValue;
       if (rawLabel.includes("RECONHEC")) updates.reconhecimento_portaria = rawValue;
    }
    if (rawLabel.includes("DATA PORTARIA")) {
       if (rawLabel.includes("CREDENCIAMENTO")) updates.cred_portaria_dt = normalizeDateByField(rawValue, "cred_portaria_dt");
       if (rawLabel.includes("RECREDENC")) updates.recred_portaria_dt = normalizeDateByField(rawValue, "recred_portaria_dt");
       if (rawLabel.includes("RECONHEC")) updates.reconhecimento_portaria_dt = normalizeDateByField(rawValue, "reconhecimento_portaria_dt");
    }
    if (rawLabel.includes("DATA D.O.U.")) {
       if (rawLabel.includes("CREDENCIAMENTO")) updates.cred_dou_dt = normalizeDateByField(rawValue, "cred_dou_dt");
       if (rawLabel.includes("RECONHEC")) updates.reconhecimento_dou_dt = normalizeDateByField(rawValue, "reconhecimento_dou_dt");
    }

    if (rawLabel.includes("EMEC") || rawLabel.includes("E-MEC")) updates.processo_emec = rawValue;
    if (rawLabel.includes("SELETIVO")) updates.processo_seletivo = normalizeUpper(rawValue);
    if (rawLabel.includes("MES") && rawLabel.includes("REALIZA")) updates.ingresso_mes_ano = normalizeDateByField(rawValue, "ingresso_mes_ano");
    if (rawLabel.includes("ANO") && rawLabel.includes("INGRES")) updates.ingresso_ano = normalizeDateByField(rawValue, "ingresso_ano");

    // --- Institucionais ---
    if (rawLabel.includes("CEP")) updates.cep = rawValue;
    if (rawLabel.includes("INSTITU")) updates.instituicao_polo = rawValue;
    if (rawLabel.includes("VALIDA")) updates.codigo_validacao = rawValue;
    if (rawLabel.includes("HORA")) updates.emissao_hora = rawValue;
  }

  return { updates, gradeRows, historicoKey };
}

function normalizeHistoricoKey(input?: string): HistoricoDisponivelKey | null {
  if (!input) return null;
  const value = normalizeUpper(input);
  if (value.includes("ENG")) return "engenharia_controle_automacao";
  if (value.includes("PED")) return "pedagogia";
  if (value.includes("ADM")) return "administracao";
  if (value.includes("DIR")) return "direito";
  const keys = Object.keys(HISTORICO_TO_PROFILE) as HistoricoDisponivelKey[];
  return keys.find(k => k.toUpperCase() === value) || null;
}

function applyFieldUpdates(fields: SubstitutionField[], updates: Record<string, string>) {
  return fields.map((field) =>
    Object.prototype.hasOwnProperty.call(updates, field.id)
      ? { ...field, currentValue: updates[field.id] }
      : field
  );
}

export function useSubstitutionUninter() {
  return useSubstitution();
}

export function useSubstitution() {
  const [activeHistorico, setActiveHistorico] = useState<HistoricoDisponivelKey | null>(DEFAULT_HISTORICO);
  const [fields, setFields] = useState<SubstitutionField[]>(() => createEmptyFields());
  const [importText, setImportText] = useState("");
  const [customGrades, setCustomGrades] = useState<GradeRow[]>([]);

  const activeProfile = activeHistorico ? HISTORICO_TO_PROFILE[activeHistorico] : null;

  const fieldMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of fields) map[f.id] = f.currentValue;
    return map;
  }, [fields]);

  const modifiedCount = useMemo(() => {
    return fields.filter((f) => f.currentValue.trim() !== "" && f.currentValue !== f.originalValue).length;
  }, [fields]);

  const gradeRows = useMemo(() => {
    return customGrades;
  }, [customGrades]);

  const applyHistorico = useCallback((historico: HistoricoDisponivelKey) => {
    setActiveHistorico(historico);
    const label = HISTORICOS_DISPONIVEIS.find(c => c.key === historico)?.label || "";
    const cursoFinal = `CURSO SUPERIOR DE LICENCIATURA EM ${label}`;
    
    setFields(prev => prev.map(f => {
      if (f.id === "curso") return { ...f, currentValue: cursoFinal };
      return f;
    }));
    
    setCustomGrades([]);
  }, []);

  const updateField = useCallback((fieldId: string, newValue: string) => {
    if (["nome_reitor", "nome_secretaria"].includes(fieldId)) return;
    
    let val = newValue;
    // Aplicar máscara de data em tempo real se for um campo de data
    if (fieldId.includes("data") || fieldId.includes("_dt") || ["conclusao_curso", "colacao_grau", "expedicao_diploma", "expedicao_historico", "ingresso_mes_ano", "ingresso_ano"].includes(fieldId)) {
       val = normalizeDateByField(newValue, fieldId);
    }

    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, currentValue: val } : f))
    );
  }, []);

  const generateMatricula = useCallback(() => {
    setFields((prev) => applyFieldUpdates(prev, { matricula: buildMatricula() }));
  }, []);

  const handleGenerateGrade = useCallback(() => {
    if (!activeProfile) {
      toast.error("Selecione um curso primeiro");
      return;
    }
    const start = fieldMap.ingresso_mes_ano || fieldMap.ingresso_ano;
    const end = fieldMap.conclusao_curso || fieldMap.colacao_grau;
    
    const newGrades = generateAcademicGrades(activeProfile, start, end);
    setCustomGrades(newGrades);
    toast.success(`Grade de ${PROFILES[activeProfile].label} gerada com sucesso!`);
  }, [activeProfile, fieldMap]);

  const applyImportText = useCallback(() => {
    if (!importText.trim()) return;

    const parsed = parseImportText(importText);

    if (parsed.historicoKey) {
      setActiveHistorico(parsed.historicoKey);
    }

    const updates = { ...parsed.updates };
    if (!updates.matricula) {
      updates.matricula = buildMatricula();
    }
    if (!updates.situacao_matricula) {
      updates.situacao_matricula = "FORMADO";
    }

    setFields((prev) => applyFieldUpdates(prev, updates));

    if (parsed.gradeRows.length > 0) {
      setCustomGrades(parsed.gradeRows);
    }
  }, [importText]);

  const resetToOriginal = useCallback(() => {
    setActiveHistorico(DEFAULT_HISTORICO);
    setFields(createEmptyFields());
    setImportText("");
    setCustomGrades([]);
  }, []);

  const loadFromFieldMap = useCallback((incoming: Record<string, unknown>, historicoInput?: string, incomingGrades?: unknown) => {
    const historico = normalizeHistoricoKey(historicoInput as string);
    setActiveHistorico(historico);

    const baseFields = createSubstitutionFields(historico ? PROFILES[HISTORICO_TO_PROFILE[historico]] : undefined);
    const normalized = baseFields.map((field) => {
      const value = incoming[field.id];
      if (value === undefined || value === null) return field;
      return { ...field, currentValue: String(value) };
    });

    setFields(normalized);

    if (Array.isArray(incomingGrades)) {
      const validGrades = incomingGrades
        .map((row: any) => ({
          anoMes: String(row?.anoMes || ""),
          disciplina: String(row?.disciplina || ""),
          ch: String(row?.ch || ""),
          media: String(row?.media || ""),
          resultado: String(row?.resultado || ""),
          docente: String(row?.docente || ""),
          titulacao: String(row?.titulacao || ""),
        }))
        .filter((row) => row.anoMes && row.disciplina);

      setCustomGrades(validGrades);
    }
  }, []);

  return {
    fields,
    fieldMap,
    activeHistorico,
    activeProfile,
    modifiedCount,
    importText,
    gradeRows,
    applyHistorico,
    updateField,
    resetToOriginal,
    loadFromFieldMap,
    setImportText,
    applyImportText,
    generateMatricula,
    handleGenerateGrade
  };
}
