// ============================================================
// Document Data Model — Histórico Escolar UNINTER Elite 3.0 (Universal)
// Design: "Document Studio" — Swiss Design / Functional
// ============================================================

export const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663380726083/LSKlJlDWSFXTKSLM.png";
export const ASSINATURA_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663380914608/sWeWwfmzoBJtdiXv.png";
export const SELO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663380914608/NxEAVgNOkxUCbVre.png";

export interface SubstitutionField {
  id: string;
  label: string;
  category: "pessoal" | "academico" | "institucional";
  originalValue: string;
  currentValue: string;
  pages: number[];
}

export type ProfileKey =
  | "historia"
  | "pedagogia"
  | "engenharia_controle_automacao"
  | "administracao"
  | "letras"
  | "direito"
  | "ciencias_contabeis"
  | "enfermagem"
  | "psicologia"
  | "marketing"
  | "gestao_recursos_humanos"
  | "servico_social"
  | "teologia";

export type HistoricoDisponivelKey = ProfileKey;

export interface HistoricoDisponivel {
  key: HistoricoDisponivelKey;
  label: string;
  shortLabel: string;
}

export const HISTORICOS_DISPONIVEIS: HistoricoDisponivel[] = [
  { key: "administracao", label: "ADMINISTRAÇÃO", shortLabel: "ADM" },
  { key: "ciencias_contabeis", label: "CIÊNCIAS CONTÁBEIS", shortLabel: "CONT" },
  { key: "direito", label: "DIREITO", shortLabel: "DIR" },
  { key: "enfermagem", label: "ENFERMAGEM", shortLabel: "ENF" },
  { key: "engenharia_controle_automacao", label: "ENG. CONTROLE E AUTOMAÇÃO", shortLabel: "ENG" },
  { key: "gestao_recursos_humanos", label: "GESTÃO DE REC. HUMANOS", shortLabel: "RH" },
  { key: "historia", label: "HISTÓRIA", shortLabel: "HIST" },
  { key: "letras", label: "LETRAS", shortLabel: "LET" },
  { key: "marketing", label: "MARKETING", shortLabel: "MKT" },
  { key: "pedagogia", label: "PEDAGOGIA", shortLabel: "PED" },
  { key: "psicologia", label: "PSICOLOGIA", shortLabel: "PSI" },
  { key: "servico_social", label: "SERVIÇO SOCIAL", shortLabel: "SERV" },
  { key: "teologia", label: "TEOLOGIA", shortLabel: "TEO" },
];

export const UNINTER_IMPORT_TEMPLATE = [
  "DADOS DO ALUNO",
  "Nome:",
  "CPF:",
  "RG:",
  "Órgão Emissor RG:",
  "Nacionalidade:",
  "Data de Nascimento:",
  "UF Nascimento:",
  "Endereço:",
  "",
  "DADOS ACADÊMICOS / MATRÍCULA",
  "Matrícula:",
  "Situação de Matrícula:",
  "Curso:",
  "Ato Autorizativo de Reconhecimento:",
  "Ato Autorizativo de Credenciamento:",
  "Processo e-MEC:",
  "Processo Seletivo:",
  "Mês / Ano de Realização:",
  "Ano de Ingresso:",
  "Conclusão do Curso:",
  "Colação de Grau:",
  "Expedição do Diploma:",
  "Expedição do Histórico:",
  "Carga Horária:",
  "Titulação:",
  "",
  "DADOS INSTITUCIONAIS",
  "Instituição / Polo:",
  "Nome do Reitor:",
  "Nome da Secretária:",
].join("\n");

export interface Profile {
  name: string;
  label: string;
  curso: string;
  cursoAbreviado: string;
  fields: Record<string, string>;
}

export interface CourseMetadata {
  cursoCompleto: string;
  reconhecimento: string;
  reconhecimentoInline: string;
  dateText: string;
  ingressoMesAno: string;
  ingressoAno: string;
  unidadeLabel: string;
  unidadeEndereco: string;
  codigoValidacao: string;
}

// ------------------------------------------------------------
// CLEAN PROFILES (HARD RESET) - ALL EMPTY
// ------------------------------------------------------------

const BASE_FIELDS: Record<string, string> = {
  nome: "",
  cpf: "",
  rg: "",
  rg_orgao: "",
  data_nascimento: "",
  uf_nascimento: "",
  nacionalidade: "",
  matricula: "",
  situacao_matricula: "FORMADO",
  endereco: "",
  conclusao_curso: "",
  colacao_grau: "",
  expedicao_diploma: "",
  expedicao_historico: "",
  carga_horaria: "",
  titulacao: "",
  ingresso_mes_ano: "",
  ingresso_ano: "",
  reconhecimento: "",
  credenciamento: "",
  processo_emec: "",
  processo_seletivo: "",
  instituicao_polo: "",
  nome_reitor: "",
  nome_secretaria: "",
};

export const PROFILES: Record<ProfileKey, Profile> = {
  administracao: { name: "", label: "Administração", curso: "", cursoAbreviado: "Administração", fields: { ...BASE_FIELDS } },
  ciencias_contabeis: { name: "", label: "Ciências Contábeis", curso: "", cursoAbreviado: "Ciências Contábeis", fields: { ...BASE_FIELDS } },
  direito: { name: "", label: "Direito", curso: "", cursoAbreviado: "Direito", fields: { ...BASE_FIELDS } },
  enfermagem: { name: "", label: "Enfermagem", curso: "", cursoAbreviado: "Enfermagem", fields: { ...BASE_FIELDS } },
  engenharia_controle_automacao: { name: "", label: "Eng. Controle e Automação", curso: "", cursoAbreviado: "Eng. Controle e Automação", fields: { ...BASE_FIELDS } },
  gestao_recursos_humanos: { name: "", label: "Gestão de RH", curso: "", cursoAbreviado: "Gestão RH", fields: { ...BASE_FIELDS } },
  historia: { name: "", label: "História", curso: "", cursoAbreviado: "História", fields: { ...BASE_FIELDS } },
  letras: { name: "", label: "Letras", curso: "", cursoAbreviado: "Letras", fields: { ...BASE_FIELDS } },
  marketing: { name: "", label: "Marketing", curso: "", cursoAbreviado: "Marketing", fields: { ...BASE_FIELDS } },
  pedagogia: { name: "", label: "Pedagogia", curso: "", cursoAbreviado: "Pedagogia", fields: { ...BASE_FIELDS } },
  psicologia: { name: "", label: "Psicologia", curso: "", cursoAbreviado: "Psicologia", fields: { ...BASE_FIELDS } },
  servico_social: { name: "", label: "Serviço Social", curso: "", cursoAbreviado: "Serviço Social", fields: { ...BASE_FIELDS } },
  teologia: { name: "", label: "Teologia", curso: "", cursoAbreviado: "Teologia", fields: { ...BASE_FIELDS } },
};

const BASE_META: CourseMetadata = {
  cursoCompleto: "",
  reconhecimento: "",
  reconhecimentoInline: "",
  dateText: "Curitiba/PR, ____ de __________ de ____.",
  ingressoMesAno: "",
  ingressoAno: "",
  unidadeLabel: "Unidade Curitiba:",
  unidadeEndereco: "Rua do Rosário, 147 | Centro - Curitiba/PR | CEP 80020-110",
  codigoValidacao: "",
};

export const COURSE_METADATA: Record<ProfileKey, CourseMetadata> = {
  administracao: { ...BASE_META },
  ciencias_contabeis: { ...BASE_META },
  direito: { ...BASE_META },
  enfermagem: { ...BASE_META },
  engenharia_controle_automacao: { ...BASE_META },
  gestao_recursos_humanos: { ...BASE_META },
  historia: { ...BASE_META },
  letras: { ...BASE_META },
  marketing: { ...BASE_META },
  pedagogia: { ...BASE_META },
  psicologia: { ...BASE_META },
  servico_social: { ...BASE_META },
  teologia: { ...BASE_META },
};

// ==================== SUBSTITUTION FIELDS ====================
export function createSubstitutionFields(profile?: Profile): SubstitutionField[] {
  const fields = profile ? profile.fields : BASE_FIELDS;
  return [
    { id: "nome", label: "Nome Completo", category: "pessoal", originalValue: "", currentValue: fields.nome, pages: [1, 2, 3, 5] },
    { id: "cpf", label: "CPF", category: "pessoal", originalValue: "", currentValue: fields.cpf, pages: [1, 2, 3, 5] },
    { id: "rg", label: "RG", category: "pessoal", originalValue: "", currentValue: fields.rg, pages: [3, 5] },
    { id: "rg_orgao", label: "Órgão Emissor RG", category: "pessoal", originalValue: "", currentValue: fields.rg_orgao, pages: [3, 5] },
    { id: "data_nascimento", label: "Data de Nascimento", category: "pessoal", originalValue: "", currentValue: fields.data_nascimento, pages: [3, 5] },
    { id: "uf_nascimento", label: "UF Nascimento", category: "pessoal", originalValue: "", currentValue: fields.uf_nascimento, pages: [3, 5] },
    { id: "nacionalidade", label: "Nacionalidade", category: "pessoal", originalValue: "", currentValue: fields.nacionalidade, pages: [3, 5] },
    { id: "matricula", label: "Matrícula", category: "academico", originalValue: "", currentValue: fields.matricula, pages: [1, 2, 3, 5] },
    { id: "situacao_matricula", label: "Situação de Matrícula", category: "academico", originalValue: "", currentValue: fields.situacao_matricula, pages: [3, 5] },
    { id: "endereco", label: "Endereço", category: "institucional", originalValue: "", currentValue: fields.endereco, pages: [3] },
    { id: "conclusao_curso", label: "Conclusão do Curso", category: "academico", originalValue: "", currentValue: fields.conclusao_curso, pages: [1, 2, 3] },
    { id: "colacao_grau", label: "Colação de Grau", category: "academico", originalValue: "", currentValue: fields.colacao_grau, pages: [1, 2, 3] },
    { id: "ingresso_mes_ano", label: "Mês / Ano de Realização", category: "academico", originalValue: "", currentValue: fields.ingresso_mes_ano, pages: [3] },
    { id: "ingresso_ano", label: "Ano de Ingresso", category: "academico", originalValue: "", currentValue: fields.ingresso_ano, pages: [3] },
    { id: "reconhecimento", label: "Ato de Reconhecimento", category: "academico", originalValue: "", currentValue: fields.reconhecimento, pages: [1, 2, 3] },
    { id: "credenciamento", label: "Ato de Credenciamento", category: "academico", originalValue: "", currentValue: fields.credenciamento, pages: [3] },
    { id: "processo_emec", label: "Processo e-MEC*", category: "academico", originalValue: "", currentValue: fields.processo_emec, pages: [3] },
    { id: "processo_seletivo", label: "Processo Seletivo", category: "academico", originalValue: "", currentValue: fields.processo_seletivo, pages: [3] },
    { id: "expedicao_diploma", label: "Expedição do Diploma", category: "academico", originalValue: "", currentValue: fields.expedicao_diploma, pages: [3] },
    { id: "expedicao_historico", label: "Expedição do Histórico", category: "academico", originalValue: "", currentValue: fields.expedicao_historico, pages: [3] },
    { id: "carga_horaria", label: "Carga Horária", category: "academico", originalValue: "", currentValue: fields.carga_horaria, pages: [2, 6] },
    { id: "titulacao", label: "Titulação", category: "academico", originalValue: "", currentValue: fields.titulacao, pages: [5, 6] },
    { id: "instituicao_polo", label: "Instituição / Polo", category: "institucional", originalValue: "", currentValue: fields.instituicao_polo, pages: [3] },
    { id: "nome_reitor", label: "Nome do Reitor", category: "institucional", originalValue: "", currentValue: fields.nome_reitor, pages: [1] },
    { id: "nome_secretaria", label: "Nome da Secretária", category: "institucional", originalValue: "", currentValue: fields.nome_secretaria, pages: [1, 2, 6] },
  ];
}

export interface GradeRow {
  anoMes: string;
  disciplina: string;
  ch: string;
  media: string;
  resultado: string;
  docente: string;
  titulacao: string;
}

export function getGradesForProfile(profileKey: ProfileKey): { page5: GradeRow[]; page6: GradeRow[] } {
  return { 
    page5: [{ anoMes: "", disciplina: "Clique em 'GERAR GRADE' ou 'Importar Inteligente' para preencher", ch: "", media: "", resultado: "", docente: "", titulacao: "" }], 
    page6: [] 
  };
}
