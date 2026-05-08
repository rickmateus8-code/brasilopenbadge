import { useState, useCallback, useMemo } from "react";
import {
  PROFILES,
  createSubstitutionFields,
  getGradesForProfile,
  type GradeRow,
  type HistoricoDisponivelKey,
  type ProfileKey,
  type SubstitutionField,
} from "@/lib/documentData_uninter";

const HISTORICO_TO_PROFILE: Record<HistoricoDisponivelKey, ProfileKey> = {
  historia: "historia",
  pedagogia: "pedagogia",
  engenharia_controle_automacao: "engenharia_controle_automacao",
};

const DEFAULT_HISTORICO: HistoricoDisponivelKey = "historia";

function createEmptyFields() {
  const blueprint = createSubstitutionFields(PROFILES.historia);
  return blueprint.map((field) => ({
    ...field,
    originalValue: "",
    currentValue: "",
  }));
}

function buildMatricula() {
  const value = Math.floor(1000000 + Math.random() * 9000000);
  return String(value);
}

function normalizeUpper(value: string) {
  return (value || "").trim().toUpperCase();
}

function normalizeDate(value: string) {
  const raw = (value || "").trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function detectHistoricoByCurso(curso: string): HistoricoDisponivelKey | null {
  const text = normalizeUpper(curso);
  if (!text) return null;
  if (text.includes("ENGENHARIA DE CONTROLE") || text.includes("AUTOMA")) {
    return "engenharia_controle_automacao";
  }
  if (text.includes("PEDAGOGIA")) return "pedagogia";
  if (text.includes("HIST")) return "historia";
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
  if (!/^\d{4}\/\d{2}$/.test(parts[0])) return null;

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

    if (rawLabel.includes("NOME") && rawLabel.includes("ALUNO")) updates.nome = rawValue;
    if (rawLabel === "NOME") updates.nome = rawValue;
    if (rawLabel === "CPF") updates.cpf = rawValue;
    if (rawLabel === "RG") updates.rg = rawValue;
    if (rawLabel.includes("ORGAO") || rawLabel.includes("ÓRGÃO")) updates.rg_orgao = normalizeUpper(rawValue);
    if (rawLabel.includes("NACIONALIDADE")) updates.nacionalidade = normalizeUpper(rawValue);
    if (rawLabel.includes("DATA") && rawLabel.includes("NASC")) updates.data_nascimento = normalizeDate(rawValue);
    if (rawLabel.includes("UF") && rawLabel.includes("NASC")) updates.uf_nascimento = normalizeUpper(rawValue);
    if (rawLabel.includes("ENDERE")) updates.endereco = rawValue;
    if (rawLabel.includes("MATR")) updates.matricula = rawValue;
    if (rawLabel.includes("SITUA")) updates.situacao_matricula = normalizeUpper(rawValue);
    if (rawLabel.includes("CURSO")) {
      updates.curso = rawValue;
      historicoKey = detectHistoricoByCurso(rawValue) || historicoKey;
    }
    if (rawLabel.includes("CONCLUSAO") || rawLabel.includes("CONCLUSÃO")) updates.conclusao_curso = normalizeDate(rawValue);
    if (rawLabel.includes("COLACAO") || rawLabel.includes("COLAÇÃO")) updates.colacao_grau = normalizeDate(rawValue);
    if (rawLabel.includes("EXPED") && rawLabel.includes("DIPLOMA")) updates.expedicao_diploma = normalizeDate(rawValue);
    if (rawLabel.includes("EXPED") && rawLabel.includes("HIST")) updates.expedicao_historico = normalizeDate(rawValue);
    if (rawLabel.includes("CARGA") && rawLabel.includes("HOR")) updates.carga_horaria = rawValue.replace(/[^\d]/g, "");
    if (rawLabel.includes("TITULA")) updates.titulacao = rawValue;
  }

  return { updates, gradeRows, historicoKey };
}

function normalizeHistoricoKey(input?: string): HistoricoDisponivelKey {
  const value = normalizeUpper(input || "");
  if (value.includes("ENG")) return "engenharia_controle_automacao";
  if (value.includes("PED")) return "pedagogia";
  return "historia";
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
  const [activeHistorico, setActiveHistorico] = useState<HistoricoDisponivelKey>(DEFAULT_HISTORICO);
  const [fields, setFields] = useState<SubstitutionField[]>(() => createEmptyFields());
  const [importText, setImportText] = useState("");
  const [customGrades, setCustomGrades] = useState<GradeRow[]>([]);

  const activeProfile = HISTORICO_TO_PROFILE[activeHistorico];

  const fieldMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of fields) map[f.id] = f.currentValue;
    return map;
  }, [fields]);

  const modifiedCount = useMemo(() => {
    return fields.filter((f) => f.currentValue.trim() !== "").length;
  }, [fields]);

  const defaultGrades = useMemo(() => {
    const { page5, page6 } = getGradesForProfile(activeProfile);
    return [...page5, ...page6];
  }, [activeProfile]);

  const gradeRows = useMemo(() => {
    return customGrades.length > 0 ? customGrades : defaultGrades;
  }, [customGrades, defaultGrades]);

  const applyHistorico = useCallback((historico: HistoricoDisponivelKey) => {
    setActiveHistorico(historico);
    setFields(createEmptyFields());
    setCustomGrades([]);
  }, []);

  const updateField = useCallback((fieldId: string, newValue: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, currentValue: newValue } : f))
    );
  }, []);

  const generateMatricula = useCallback(() => {
    setFields((prev) => applyFieldUpdates(prev, { matricula: buildMatricula() }));
  }, []);

  const applyImportText = useCallback(() => {
    if (!importText.trim()) return;

    const parsed = parseImportText(importText);

    if (parsed.historicoKey) {
      setActiveHistorico(parsed.historicoKey);
    }

    setFields((prev) => applyFieldUpdates(prev, parsed.updates));

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
    const historico = normalizeHistoricoKey(historicoInput);
    setActiveHistorico(historico);

    const baseFields = createEmptyFields();
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
  };
}
