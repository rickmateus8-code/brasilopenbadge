// ============================================================
// Histórico Escolar SP — dados, helpers e importação
// ============================================================

export const BRASAO_SP_URL = "/assets/brasao_sp.png";
export const BRASAO_RJ_URL = "/assets/brasao_rj.svg";
export const BRASAO_BA_URL = "/assets/brasao_ba.svg";
export const BRASAO_DF_URL = "/assets/brasao_df.svg";

export const SP_SECURITY_CODE_MODEL = "SP41214853-0SP";
export const SP_RA_MODEL = "26205579-0";

export interface SPStateOption {
  uf: string;
  name: string;
  brasaoUrl?: string;
  secretaria?: string;
  governmentPrefix?: "DE" | "DA" | "DO";
}

export interface SPFieldOption {
  value: string;
  label: string;
}

export interface SPSubstitutionField {
  id: string;
  label: string;
  category: "instituicao" | "aluno" | "academico" | "certificado" | "assinaturas" | "emissao";
  originalValue: string;
  currentValue: string;
  type?: "text" | "select" | "textarea";
  placeholder?: string;
  helperText?: string;
  options?: SPFieldOption[];
}

export interface SPProfile {
  name: string;
  label: string;
  fields: Record<string, string>;
  grades: SPGradeRow[];
}

export interface SPGradeRow {
  disciplina: string;
  nota1: string;
  nota2: string;
  nota3: string;
  ch: string;
}

export const SP_STATE_OPTIONS: SPStateOption[] = [
  { uf: "AC", name: "ACRE", governmentPrefix: "DO" },
  { uf: "AL", name: "ALAGOAS", governmentPrefix: "DE" },
  { uf: "AP", name: "AMAPÁ", governmentPrefix: "DO" },
  { uf: "AM", name: "AMAZONAS", governmentPrefix: "DO" },
  { uf: "BA", name: "BAHIA", brasaoUrl: BRASAO_BA_URL, governmentPrefix: "DA" },
  { uf: "CE", name: "CEARÁ", governmentPrefix: "DO" },
  { uf: "DF", name: "DISTRITO FEDERAL", brasaoUrl: BRASAO_DF_URL, governmentPrefix: "DO" },
  { uf: "ES", name: "ESPÍRITO SANTO", governmentPrefix: "DO" },
  { uf: "GO", name: "GOIÁS", governmentPrefix: "DE" },
  { uf: "MA", name: "MARANHÃO", governmentPrefix: "DO" },
  { uf: "MT", name: "MATO GROSSO", governmentPrefix: "DE" },
  { uf: "MS", name: "MATO GROSSO DO SUL", governmentPrefix: "DO" },
  { uf: "MG", name: "MINAS GERAIS", governmentPrefix: "DE" },
  { uf: "PA", name: "PARÁ", governmentPrefix: "DO" },
  { uf: "PB", name: "PARAÍBA", governmentPrefix: "DA" },
  { uf: "PR", name: "PARANÁ", governmentPrefix: "DO" },
  { uf: "PE", name: "PERNAMBUCO", governmentPrefix: "DE" },
  { uf: "PI", name: "PIAUÍ", governmentPrefix: "DO" },
  { uf: "RJ", name: "RIO DE JANEIRO", brasaoUrl: BRASAO_RJ_URL, governmentPrefix: "DO" },
  { uf: "RN", name: "RIO GRANDE DO NORTE", governmentPrefix: "DO" },
  { uf: "RS", name: "RIO GRANDE DO SUL", governmentPrefix: "DO" },
  { uf: "RO", name: "RONDÔNIA", governmentPrefix: "DE" },
  { uf: "RR", name: "RORAIMA", governmentPrefix: "DE" },
  { uf: "SC", name: "SANTA CATARINA", governmentPrefix: "DE" },
  { uf: "SP", name: "SÃO PAULO", brasaoUrl: BRASAO_SP_URL, governmentPrefix: "DE" },
  { uf: "SE", name: "SERGIPE", governmentPrefix: "DE" },
  { uf: "TO", name: "TOCANTINS", governmentPrefix: "DO" },
];

export const SP_STATE_LAYOUTS = Object.fromEntries(
  SP_STATE_OPTIONS.map((state) => [state.uf, state]),
) as Record<string, SPStateOption>;

export const SP_STATE_SELECT_OPTIONS: SPFieldOption[] = SP_STATE_OPTIONS.map((state) => ({
  value: state.name,
  label: `${state.name} (${state.uf})`,
}));

export const SP_SCHOOL_TYPE_OPTIONS: SPFieldOption[] = [
  { value: "ESCOLA ESTADUAL", label: "ESTADUAL" },
  { value: "ESCOLA MUNICIPAL", label: "MUNICIPAL" },
];

function normalizeText(value?: string): string {
  return (value || "").trim();
}

export function normalizeUppercase(value?: string): string {
  return normalizeText(value).toUpperCase();
}

// Versão sem trim para campos onde o usuário precisa digitar com espaçamento livre.
export function normalizeUppercasePreserveSpacing(value?: string): string {
  return (value || "").toUpperCase();
}

function normalizeComparable(value?: string): string {
  return normalizeUppercase(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getSPStateLayout(input?: string): SPStateOption {
  const normalized = normalizeComparable(input);

  if (!normalized) return SP_STATE_LAYOUTS.SP;
  if (SP_STATE_LAYOUTS[normalized]) return SP_STATE_LAYOUTS[normalized];

  const match = SP_STATE_OPTIONS.find((state) => normalizeComparable(state.name) === normalized);
  return match || SP_STATE_LAYOUTS.SP;
}

export function normalizeStateUf(input?: string): string {
  return getSPStateLayout(input).uf;
}

export function normalizeStateName(input?: string): string {
  return getSPStateLayout(input).name;
}

export function getSPGovernmentLabel(uf?: string, stateName?: string): string {
  const layout = getSPStateLayout(uf || stateName);
  const prefix = layout.governmentPrefix || "DE";
  const name = normalizeUppercase(stateName || layout.name || "SÃO PAULO");
  return `GOVERNO DO ESTADO ${prefix} ${name}`;
}

export function normalizeSchoolType(value?: string): string {
  const normalized = normalizeComparable(value);
  if (normalized.includes("MUNICIPAL")) return "ESCOLA MUNICIPAL";
  return "ESCOLA ESTADUAL";
}

export function buildSPFullSchoolName(name?: string, schoolType?: string): string {
  const normalizedName = normalizeUppercase(name);
  const normalizedType = normalizeSchoolType(schoolType);

  if (!normalizedName) return "";
  if (
    normalizedName.startsWith("ESCOLA ") ||
    normalizedName.startsWith("COLÉGIO ") ||
    normalizedName.startsWith("COLEGIO ") ||
    normalizedName.startsWith("E. E.") ||
    normalizedName.startsWith(normalizedType)
  ) {
    return normalizedName;
  }

  return `${normalizedType} ${normalizedName}`.trim();
}

export function buildSPCertificateSchoolName(fullSchoolName?: string): string {
  return normalizeUppercase(fullSchoolName).replace(/^ESCOLA (ESTADUAL|MUNICIPAL)\s+/i, "").trim();
}

export function formatSPRA(value?: string): string {
  const raw = normalizeText(value);
  if (!raw) return "";

  const digits = raw.replace(/\D/g, "");
  const main = digits.slice(0, 8);
  const suffix = digits.length > 8 ? digits.slice(8, 9) : "0";

  if (!main) return "";
  return `${main}-${suffix || "0"}`;
}

export function formatSPDate(value?: string): string {
  const raw = (value || "").replace(/[^\d/]/g, "");
  if (!raw) return "";

  // Se o usuário digitar barras manualmente, respeita a estrutura DD/MM/AAAA.
  if (raw.includes("/")) {
    const hasTrailingSlash = raw.endsWith("/");
    const parts = raw.split("/");
    const day = (parts[0] || "").slice(0, 2);
    const month = (parts[1] || "").slice(0, 2);
    const year = (parts.slice(2).join("") || "").slice(0, 4);

    let formatted = day;
    if (parts.length > 1 || hasTrailingSlash) {
      formatted += `/${month}`;
    }
    if (parts.length > 2 || (hasTrailingSlash && parts.length > 1) || year) {
      if (!formatted.endsWith("/")) formatted += "/";
      formatted += year;
    }

    return formatted.slice(0, 10);
  }

  // Também aceita entrada contínua (ex.: 01012000 -> 01/01/2000).
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function buildSPRA(): string {
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
  return `${randomDigits}-0`;
}

export function formatSPSecurityCode(value?: string, uf?: string): string {
  const raw = normalizeText(value);
  if (!raw) return "";

  const normalizedUf = normalizeStateUf(uf || "SP");
  const digits = raw.replace(/\D/g, "").slice(0, 8);

  if (!digits) return "";
  return `${normalizedUf}${digits}-0${normalizedUf}`;
}

export function buildSPSecurityCode(uf?: string): string {
  const normalizedUf = normalizeStateUf(uf || "SP");
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
  return `${normalizedUf}${randomDigits}-0${normalizedUf}`;
}

export const SP_GRADES_DEFAULT: SPGradeRow[] = [
  { disciplina: "Língua Portuguesa e Literatura", nota1: "8,0", nota2: "6,9", nota3: "8,5", ch: "360" },
  { disciplina: "Arte", nota1: "", nota2: "", nota3: "", ch: "" },
  { disciplina: "Educação Física", nota1: "7,0", nota2: "7,2", nota3: "8,5", ch: "240" },
  { disciplina: "Matemática", nota1: "6,5", nota2: "6,8", nota3: "7,1", ch: "360" },
  { disciplina: "Biologia", nota1: "6,7", nota2: "6,0", nota3: "5,5", ch: "240" },
  { disciplina: "Física", nota1: "5,5", nota2: "6,0", nota3: "6,5", ch: "360" },
  { disciplina: "Química", nota1: "6,0", nota2: "6,9", nota3: "5,7", ch: "360" },
  { disciplina: "História", nota1: "7,5", nota2: "8,0", nota3: "7,0", ch: "240" },
  { disciplina: "Geografia", nota1: "8,0", nota2: "7,5", nota3: "8,5", ch: "240" },
  { disciplina: "Filosofia", nota1: "7,0", nota2: "8,9", nota3: "9,0", ch: "240" },
  { disciplina: "Sociologia", nota1: "9,0", nota2: "8,0", nota3: "7,0", ch: "240" },
];

export const SP_REFERENCE_FIELDS: Record<string, string> = {
  tipo_escola: "ESCOLA ESTADUAL",
  estado_instituicao: "SÃO PAULO",
  uf_documento: "SP",
  governo_estado: "SÃO PAULO",
  secretaria_estado: "SECRETARIA DE ESTADO DA EDUCAÇÃO",
  nome_escola: "E. E. Mª APDA. FRANÇA B. ARAUJO PROFª",
  ato_legal: "906748",
  endereco_escola: "Av. Honorio Ferreira Pedrosa",
  numero_escola: "611",
  bairro: "Pq Nova Cacapava",
  municipio_escola: "Cacapava",
  cep_escola: "06411-160",
  telefone_escola: "(12) 36521267",
  email_escola: "E906748A@EDUCACAO.SP.GOV.BR",
  nome_aluno: "GIOVANE SILVA DOS SANTOS",
  rg: "555285753",
  ra: "26205579-0",
  municipio_nascimento: "Cacapava",
  estado_nascimento: "SP",
  pais: "BRASIL",
  data_nascimento: "01/12/1999",
  ano_fund_serie: "8ª Série",
  ano_fund: "2016",
  ano_1a_serie: "2017",
  ano_2a_serie: "2018",
  ano_3a_serie: "2019",
  disciplina_apoio_1: "Língua Portuguesa e Literatura",
  codigo_seguranca: SP_SECURITY_CODE_MODEL,
  registro_gdae: SP_SECURITY_CODE_MODEL,
  ano_conclusao: "2019",
  gerente_nome: "MARISTELA GALVANI MACHADO",
  gerente_rg: "23.425.125-45",
  diretor_nome: "ANGELA PEREIRA DOS SANTOS",
  diretor_rg: "13.068.721-63",
  local_emissao: "CACAPAVA - SP",
  data_emissao: "04/12/2019",
};

export const SP_EMPTY_PROFILE: SPProfile = {
  name: "",
  label: "VAZIO",
  grades: SP_GRADES_DEFAULT,
  fields: {
    tipo_escola: "",
    estado_instituicao: "",
    uf_documento: "",
    governo_estado: "",
    secretaria_estado: "",
    nome_escola: "",
    ato_legal: "",
    endereco_escola: "",
    numero_escola: "",
    bairro: "",
    municipio_escola: "",
    cep_escola: "",
    telefone_escola: "",
    email_escola: "",
    nome_aluno: "",
    rg: "",
    ra: "",
    municipio_nascimento: "",
    estado_nascimento: "",
    pais: "",
    data_nascimento: "",
    ano_fund_serie: "",
    ano_fund: "",
    ano_1a_serie: "",
    ano_2a_serie: "",
    ano_3a_serie: "",
    disciplina_apoio_1: "",
    codigo_seguranca: "",
    registro_gdae: "",
    ano_conclusao: "",
    gerente_nome: "",
    gerente_rg: "",
    diretor_nome: "",
    diretor_rg: "",
    local_emissao: "",
    data_emissao: "",
  },
};

export const SP_IMPORT_TEMPLATE = [
  "DADOS DA INSTITUIÇÃO",
  "",
  "Governo do Estado:",
  "Secretaria de Estado:",
  "Nome da Escola:",
  "Ato Legal de Criação:",
  "Endereço:",
  "Número:",
  "Bairro:",
  "Município:",
  "Estado:",
  "CEP:",
  "Telefone:",
  "E-mail:",
  "",
  "DADOS DO ALUNO",
  "",
  "Nome do Aluno:",
  "R.G.:",
  "R.A.:",
  "Município de Nascimento:",
  "Estado:",
  "País:",
  "Data de Nascimento:",
  "",
  "DADOS ESCOLARES",
  "",
  "Série Ensino Fundamental:",
  "Ano Ensino Fundamental:",
  "Ano 1ª Série Ensino Médio:",
  "Ano 2ª Série Ensino Médio:",
  "Ano 3ª Série Ensino Médio:",
  "Código de Segurança:",
  "",
  "RESPONSÁVEIS ADMINISTRATIVOS",
  "",
  "Nome Gerente Organização Escolar:",
  "RG Gerente:",
  "Nome Diretor de Escola:",
  "RG Diretor:",
  "",
  "EMISSÃO",
  "",
  "Local:",
  "Data:",
].join("\n");

function importedSchoolParts(value: string): { schoolType: string; schoolName: string } {
  const upper = normalizeUppercase(value);

  if (upper.startsWith("ESCOLA MUNICIPAL ")) {
    return { schoolType: "ESCOLA MUNICIPAL", schoolName: upper.replace(/^ESCOLA MUNICIPAL\s+/i, "") };
  }
  if (upper.startsWith("ESCOLA ESTADUAL ")) {
    return { schoolType: "ESCOLA ESTADUAL", schoolName: upper.replace(/^ESCOLA ESTADUAL\s+/i, "") };
  }
  if (upper.includes("MUNICIPAL")) {
    return { schoolType: "ESCOLA MUNICIPAL", schoolName: upper };
  }

  return { schoolType: "ESCOLA ESTADUAL", schoolName: upper };
}

export function parseSPImportText(text: string): Partial<Record<string, string>> {
  const updates: Partial<Record<string, string>> = {};
  let section = "";

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    const heading = normalizeComparable(line);
    if ([
      "DADOS DA INSTITUICAO",
      "DADOS DO ALUNO",
      "DADOS ESCOLARES",
      "RESPONSAVEIS ADMINISTRATIVOS",
      "EMISSAO",
    ].includes(heading)) {
      section = heading;
      continue;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;

    const label = normalizeComparable(line.slice(0, separatorIndex));
    const value = normalizeText(line.slice(separatorIndex + 1));

    if (section === "DADOS DA INSTITUICAO") {
      if (label === "GOVERNO DO ESTADO") updates.governo_estado = normalizeUppercase(value);
      if (label === "SECRETARIA DE ESTADO") updates.secretaria_estado = normalizeUppercase(value);
      if (label === "NOME DA ESCOLA") {
        const schoolParts = importedSchoolParts(value);
        updates.tipo_escola = schoolParts.schoolType;
        updates.nome_escola = schoolParts.schoolName;
      }
      if (label === "ATO LEGAL DE CRIACAO") updates.ato_legal = value;
      if (label === "ENDERECO") updates.endereco_escola = value;
      if (label === "NUMERO") updates.numero_escola = value;
      if (label === "BAIRRO") updates.bairro = value;
      if (label === "MUNICIPIO") updates.municipio_escola = value;
      if (label === "ESTADO") {
        const layout = getSPStateLayout(value);
        updates.estado_instituicao = layout.name;
        updates.uf_documento = layout.uf;
        updates.governo_estado = layout.name;
      }
      if (label === "CEP") updates.cep_escola = value;
      if (label === "TELEFONE") updates.telefone_escola = value;
      if (label === "E-MAIL" || label === "EMAIL") updates.email_escola = normalizeUppercase(value);
    }

    if (section === "DADOS DO ALUNO") {
      if (label === "NOME DO ALUNO") updates.nome_aluno = normalizeUppercase(value);
      if (label === "R.G." || label === "RG") updates.rg = value;
      if (label === "R.A." || label === "RA") updates.ra = formatSPRA(value);
      if (label === "MUNICIPIO DE NASCIMENTO") updates.municipio_nascimento = value;
      if (label === "ESTADO") updates.estado_nascimento = normalizeStateName(value);
      if (label === "PAIS") updates.pais = normalizeUppercase(value);
      if (label === "DATA DE NASCIMENTO") updates.data_nascimento = formatSPDate(value);
    }

    if (section === "DADOS ESCOLARES") {
      if (label === "SERIE ENSINO FUNDAMENTAL") updates.ano_fund_serie = value;
      if (label === "ANO ENSINO FUNDAMENTAL") updates.ano_fund = value;
      if (label === "ANO 1A SERIE ENSINO MEDIO") updates.ano_1a_serie = value;
      if (label === "ANO 2A SERIE ENSINO MEDIO") updates.ano_2a_serie = value;
      if (label === "ANO 3A SERIE ENSINO MEDIO") {
        updates.ano_3a_serie = value;
        updates.ano_conclusao = value;
      }
      if (label === "CODIGO DE SEGURANCA") updates.codigo_seguranca = value;
    }

    if (section === "RESPONSAVEIS ADMINISTRATIVOS") {
      if (label === "NOME GERENTE ORGANIZACAO ESCOLAR") updates.gerente_nome = normalizeUppercasePreserveSpacing(value);
      if (label === "RG GERENTE") updates.gerente_rg = value;
      if (label === "NOME DIRETOR DE ESCOLA") updates.diretor_nome = normalizeUppercasePreserveSpacing(value);
      if (label === "RG DIRETOR") updates.diretor_rg = value;
    }

    if (section === "EMISSAO") {
      if (label === "LOCAL") updates.local_emissao = normalizeUppercase(value);
      if (label === "DATA") updates.data_emissao = formatSPDate(value);
    }
  }

  const stateLayout = getSPStateLayout(updates.estado_instituicao || updates.uf_documento || SP_REFERENCE_FIELDS.uf_documento);
  updates.estado_instituicao = normalizeUppercase(updates.estado_instituicao || stateLayout.name);
  updates.uf_documento = stateLayout.uf;
  updates.governo_estado = normalizeUppercase(updates.governo_estado || stateLayout.name);

  if (updates.estado_nascimento) {
    updates.estado_nascimento = normalizeStateName(updates.estado_nascimento);
  }
  if (updates.ra) {
    updates.ra = formatSPRA(updates.ra);
  }
  if (updates.codigo_seguranca) {
    updates.codigo_seguranca = formatSPSecurityCode(updates.codigo_seguranca, updates.uf_documento);
    updates.registro_gdae = updates.codigo_seguranca;
  }

  return updates;
}

function createField(
  id: string,
  label: string,
  category: SPSubstitutionField["category"],
  type: SPSubstitutionField["type"] = "text",
  options?: SPFieldOption[],
  helperText?: string,
): SPSubstitutionField {
  return {
    id,
    label,
    category,
    type,
    options,
    helperText,
    originalValue: "",
    currentValue: SP_EMPTY_PROFILE.fields[id] || "",
    placeholder: SP_REFERENCE_FIELDS[id] || "",
  };
}

export function createSPSubstitutionFields(profile: SPProfile = SP_EMPTY_PROFILE): SPSubstitutionField[] {
  const base = [
    createField("tipo_escola", "Tipo de Escola", "instituicao", "select", SP_SCHOOL_TYPE_OPTIONS),
    createField("estado_instituicao", "Estado", "instituicao", "select", SP_STATE_SELECT_OPTIONS, "Define o brasão, o cabeçalho do governo e o prefixo dos códigos."),
    createField("secretaria_estado", "Secretaria de Estado", "instituicao"),
    createField("nome_escola", "Nome da Escola", "instituicao", "text", undefined, "Será convertido para MAIÚSCULO automaticamente."),
    createField("ato_legal", "Ato Legal de Criação", "instituicao"),
    createField("endereco_escola", "Endereço", "instituicao"),
    createField("numero_escola", "Número", "instituicao"),
    createField("bairro", "Bairro", "instituicao"),
    createField("municipio_escola", "Município", "instituicao"),
    createField("cep_escola", "CEP", "instituicao"),
    createField("telefone_escola", "Telefone", "instituicao"),
    createField("email_escola", "E-mail", "instituicao"),

    createField("nome_aluno", "Nome do Aluno", "aluno"),
    createField("rg", "R.G.", "aluno"),
    createField("ra", "R.A.", "aluno", "text", undefined, `Formato: ${SP_RA_MODEL}`),
    createField("municipio_nascimento", "Município de Nascimento", "aluno"),
    createField("estado_nascimento", "Estado", "aluno", "select", SP_STATE_SELECT_OPTIONS),
    createField("pais", "País", "aluno"),
    createField("data_nascimento", "Data de Nascimento", "aluno", "text", undefined, "Formato: DD/MM/AAAA"),

    createField("ano_fund_serie", "Série Ensino Fundamental", "academico"),
    createField("ano_fund", "Ano Ensino Fundamental", "academico"),
    createField("ano_1a_serie", "Ano 1ª Série Ensino Médio", "academico"),
    createField("ano_2a_serie", "Ano 2ª Série Ensino Médio", "academico"),
    createField("ano_3a_serie", "Ano 3ª Série Ensino Médio", "academico"),

    createField("codigo_seguranca", "Código de Segurança", "certificado", "text", undefined, `Modelo: ${SP_SECURITY_CODE_MODEL}`),

    createField("gerente_nome", "Nome Gerente Organização Escolar", "assinaturas"),
    createField("gerente_rg", "RG Gerente", "assinaturas"),
    createField("diretor_nome", "Nome Diretor de Escola", "assinaturas"),
    createField("diretor_rg", "RG Diretor", "assinaturas"),

    createField("local_emissao", "Local", "emissao"),
    createField("data_emissao", "Data", "emissao", "text", undefined, "Formato: DD/MM/AAAA"),
  ];

  return base.map((field) => ({
    ...field,
    currentValue: profile.fields[field.id] || "",
  }));
}