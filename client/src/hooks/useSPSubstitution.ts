import { useState, useCallback, useMemo } from "react";
import {
  BRASAO_SP_URL,
  SP_EMPTY_PROFILE,
  SP_GRADES_DEFAULT,
  SP_RA_MODEL,
  SP_REFERENCE_FIELDS,
  createSPSubstitutionFields,
  buildSPCertificateSchoolName,
  buildSPFullSchoolName,
  buildSPRA,
  buildSPRG,
  buildSPSecurityCode,
  formatSPDate,
  formatSPRA,
  formatSPSecurityCode,
  getSPStateLayout,
  normalizeSchoolType,
  normalizeStateName,
  normalizeStateUf,
  normalizeUppercase,
  normalizeUppercasePreserveSpacing,
  parseSPImportText,
  type SPGradeRow,
  type SPSubstitutionField,
} from "@/lib/historicoSPData";

function applyFieldUpdates(fields: SPSubstitutionField[], updates: Record<string, string>) {
  return fields.map((field) =>
    Object.prototype.hasOwnProperty.call(updates, field.id)
      ? { ...field, currentValue: updates[field.id] }
      : field
  );
}

function normalizeInitialFields(fields: SPSubstitutionField[]) {
  return fields;
}

function hasField(fields: SPSubstitutionField[], id: string) {
  return fields.some((field) => field.id === id);
}

function normalizeFieldValue(fieldId: string, value: string) {
  if (["diretor_nome", "gerente_nome", "nome_aluno"].includes(fieldId)) {
    // Mantém o espaço digitado em tempo real (não usar trim),
    // permitindo escrever nomes compostos naturalmente.
    return value.toUpperCase();
  }

  if (["nome_escola", "pais", "email_escola", "secretaria_estado", "local_emissao"].includes(fieldId)) {
    return normalizeUppercasePreserveSpacing(value);
  }

  if (fieldId === "tipo_escola") return normalizeSchoolType(value);
  if (fieldId === "estado_instituicao" || fieldId === "estado_nascimento") return normalizeStateName(value);
  if (fieldId === "ra") return formatSPRA(value);
  if (fieldId === "data_nascimento" || fieldId === "data_emissao") return formatSPDate(value);

  return value;
}

function buildDerivedFieldMap(fields: SPSubstitutionField[]) {
  const raw = Object.fromEntries(fields.map((field) => [field.id, field.currentValue])) as Record<string, string>;
  const hasInstitutionState = Boolean(raw.estado_instituicao || raw.uf_documento);
  const stateLayout = hasInstitutionState
    ? getSPStateLayout(raw.estado_instituicao || raw.uf_documento)
    : { uf: "", name: "", brasaoUrl: undefined, governmentPrefix: "DE" as const };
  const schoolType = raw.tipo_escola ? normalizeSchoolType(raw.tipo_escola) : "";
  const schoolName = normalizeUppercasePreserveSpacing(raw.nome_escola || "");
  const fullSchoolName = schoolName ? buildSPFullSchoolName(schoolName, schoolType || SP_REFERENCE_FIELDS.tipo_escola) : "";
  const certificateSchoolName = fullSchoolName ? buildSPCertificateSchoolName(fullSchoolName) : "";
  const municipioEscola = raw.municipio_escola || "";
  const anoConclusao = raw.ano_3a_serie || raw.ano_conclusao || "";
  const codigoSeguranca = raw.codigo_seguranca
    ? formatSPSecurityCode(raw.codigo_seguranca, stateLayout.uf || "SP")
    : "";
  const registroGdae = raw.registro_gdae
    ? formatSPSecurityCode(raw.registro_gdae, stateLayout.uf || "SP")
    : codigoSeguranca;
  const localEmissao = raw.local_emissao
    ? normalizeUppercasePreserveSpacing(raw.local_emissao)
    : municipioEscola && stateLayout.uf
      ? normalizeUppercasePreserveSpacing(`${municipioEscola} - ${stateLayout.uf}`)
      : "";
  const dataEmissao = raw.data_emissao || (anoConclusao ? `04/12/${anoConclusao}` : "");

  return {
    ...raw,
    disciplina_apoio_1: "Língua Portuguesa e Literatura",
    disciplina_apoio_2: "",
    tipo_escola: schoolType,
    estado_instituicao: stateLayout.name,
    uf_documento: stateLayout.uf,
    governo_estado: normalizeUppercasePreserveSpacing(raw.governo_estado || stateLayout.name || ""),
    secretaria_estado: normalizeUppercasePreserveSpacing(raw.secretaria_estado || ""),
    nome_escola: schoolName,
    nome_escola_full: fullSchoolName,
    nome_escola_certificado: certificateSchoolName,
    nome_aluno: normalizeUppercasePreserveSpacing(raw.nome_aluno || ""),
    pais: normalizeUppercasePreserveSpacing(raw.pais || ""),
    email_escola: normalizeUppercasePreserveSpacing(raw.email_escola || ""),
    ra: raw.ra ? formatSPRA(raw.ra) : "",
    estado_nascimento: raw.estado_nascimento ? normalizeStateUf(raw.estado_nascimento) : "",
    codigo_seguranca: codigoSeguranca,
    registro_gdae: registroGdae,
    ano_conclusao: anoConclusao,
    local_emissao: localEmissao,
    data_emissao: dataEmissao,
    local_data: localEmissao && dataEmissao ? `${localEmissao}, ${dataEmissao}` : "",
  };
}

export function useSPSubstitution() {
  const [fields, setFields] = useState<SPSubstitutionField[]>(
    () => normalizeInitialFields(createSPSubstitutionFields(SP_EMPTY_PROFILE))
  );
  const [importText, setImportText] = useState("");
  const [uploadedBrasaoUrl, setUploadedBrasaoUrl] = useState<string>("");
  const [hasCustomBrasao, setHasCustomBrasao] = useState(false);

  const fieldMap = useMemo(() => buildDerivedFieldMap(fields), [fields]);

  const brasaoUrl = useMemo(() => {
    if (uploadedBrasaoUrl) return uploadedBrasaoUrl;
    return getSPStateLayout(fieldMap.estado_instituicao || fieldMap.uf_documento).brasaoUrl || BRASAO_SP_URL;
  }, [fieldMap.estado_instituicao, fieldMap.uf_documento, uploadedBrasaoUrl]);

  const modifiedCount = useMemo(() => {
    return fields.filter((field) => field.currentValue.trim() !== "").length;
  }, [fields]);

  const currentGrades: SPGradeRow[] = SP_GRADES_DEFAULT;

  const updateField = useCallback((fieldId: string, newValue: string) => {
    setFields((prev) => {
      const updates: Record<string, string> = {};
      const currentMap = Object.fromEntries(prev.map((field) => [field.id, field.currentValue])) as Record<string, string>;
      const layout = getSPStateLayout(currentMap.estado_instituicao || currentMap.uf_documento || SP_REFERENCE_FIELDS.uf_documento);
      const normalizedValue = normalizeFieldValue(fieldId, newValue);

      updates[fieldId] = normalizedValue;

      if (fieldId === "estado_instituicao") {
        const selectedLayout = getSPStateLayout(newValue);
        if (currentMap.codigo_seguranca) {
          updates.codigo_seguranca = formatSPSecurityCode(currentMap.codigo_seguranca, selectedLayout.uf);
        }
      }

      if (fieldId === "codigo_seguranca") {
        const formatted = formatSPSecurityCode(newValue, layout.uf);
        updates.codigo_seguranca = formatted;
      }

      return applyFieldUpdates(prev, updates);
    });
  }, []);

  const generateSecurityCode = useCallback(() => {
    setFields((prev) => {
      const map = Object.fromEntries(prev.map((field) => [field.id, field.currentValue])) as Record<string, string>;
      const generatedCode = buildSPSecurityCode(map.estado_instituicao || map.uf_documento || SP_REFERENCE_FIELDS.uf_documento);

      return applyFieldUpdates(prev, {
        codigo_seguranca: generatedCode,
      });
    });
  }, []);

  const generateRA = useCallback(() => {
    setFields((prev) => applyFieldUpdates(prev, { ra: buildSPRA() || SP_RA_MODEL }));
  }, []);

  const generateRGGerente = useCallback(() => {
    setFields((prev) => applyFieldUpdates(prev, { gerente_rg: buildSPRG() }));
  }, []);

  const generateRGDiretor = useCallback(() => {
    setFields((prev) => applyFieldUpdates(prev, { diretor_rg: buildSPRG() }));
  }, []);

  const applyImportText = useCallback(() => {
    if (!importText.trim()) return;

    setFields((prev) => {
      const parsed = parseSPImportText(importText);
      const updates = Object.entries(parsed).reduce<Record<string, string>>((acc, [key, value]) => {
        if (typeof value === "string" && hasField(prev, key)) {
          acc[key] = normalizeFieldValue(key, value);
        }
        return acc;
      }, {});

      return applyFieldUpdates(prev, updates);
    });
  }, [importText]);

  const loadFromFieldMap = useCallback((incoming: Record<string, unknown>) => {
    setFields((prev) => {
      const updates: Record<string, string> = {};

      prev.forEach((field) => {
        const value = incoming[field.id];
        if (value === undefined || value === null) return;
        updates[field.id] = normalizeFieldValue(field.id, String(value));
      });

      return applyFieldUpdates(prev, updates);
    });
  }, []);

  const resetToOriginal = useCallback(() => {
    setFields(normalizeInitialFields(createSPSubstitutionFields(SP_EMPTY_PROFILE)));
    setImportText("");
    setUploadedBrasaoUrl("");
    setHasCustomBrasao(false);
  }, []);

  const handleBrasaoUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setUploadedBrasaoUrl(url);
    setHasCustomBrasao(true);
  }, []);

  const resetBrasaoUpload = useCallback(() => {
    setUploadedBrasaoUrl("");
    setHasCustomBrasao(false);
  }, []);

  return {
    fields,
    fieldMap,
    modifiedCount,
    currentGrades,
    importText,
    brasaoUrl,
    hasCustomBrasao,
    updateField,
    setImportText,
    applyImportText,
    generateSecurityCode,
    generateRA,
    generateRGGerente,
    generateRGDiretor,
    resetToOriginal,
    loadFromFieldMap,
    handleBrasaoUpload,
    resetBrasaoUpload,
  };
}
