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
  "",
  "COMPONENTES CURRICULARES",
  "Ano/Mês*\tDisciplinas\tC.H.\tMédia\tResultado\tDocente\tTitulação",
  "2018/10\tDisciplina Exemplo 01\t80h\t10.0\tAPR.MÉDIA\tDocente Exemplo\tMestrado",
  "2018/11\tDisciplina Exemplo 02\t40h\t9.5\tAPR.MÉDIA\tDocente Exemplo\tDoutorado",
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
// CLEAN PROFILES (HARD RESET)
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
  processo_emec: "201605151",
  processo_seletivo: "VESTIBULAR",
  instituicao_polo: "CENTRO UNIVERSITÁRIO INTERNACIONAL UNINTER | POLO CURITIBA (CENTRO) - PR",
  nome_reitor: "Professor Dr. Benhur Etelberto Gaio",
  nome_secretaria: "SIMONE RAMOS DE OLIVEIRA",
};

export const PROFILES: Record<ProfileKey, Profile> = {
  administracao: { name: "", label: "Administração", curso: "CURSO SUPERIOR DE BACHARELADO EM ADMINISTRAÇÃO", cursoAbreviado: "Administração", fields: { ...BASE_FIELDS, curso: "CURSO SUPERIOR DE BACHARELADO EM ADMINISTRAÇÃO" } },
  ciencias_contabeis: { name: "", label: "Ciências Contábeis", curso: "CURSO SUPERIOR DE BACHARELADO EM CIÊNCIAS CONTÁBEIS", cursoAbreviado: "Ciências Contábeis", fields: { ...BASE_FIELDS, curso: "CURSO SUPERIOR DE BACHARELADO EM CIÊNCIAS CONTÁBEIS" } },
  direito: { name: "", label: "Direito", curso: "CURSO SUPERIOR DE BACHARELADO EM DIREITO", cursoAbreviado: "Direito", fields: { ...BASE_FIELDS, curso: "CURSO SUPERIOR DE BACHARELADO EM DIREITO" } },
  enfermagem: { name: "", label: "Enfermagem", curso: "CURSO SUPERIOR DE BACHARELADO EM ENFERMAGEM", cursoAbreviado: "Enfermagem", fields: { ...BASE_FIELDS, curso: "CURSO SUPERIOR DE BACHARELADO EM ENFERMAGEM" } },
  engenharia_controle_automacao: { name: "", label: "Eng. Controle e Automação", curso: "CURSO SUPERIOR DE BACHARELADO EM ENGENHARIA DE CONTROLE E AUTOMAÇÃO", cursoAbreviado: "Eng. Controle e Automação", fields: { ...BASE_FIELDS, curso: "CURSO SUPERIOR DE BACHARELADO EM ENGENHARIA DE CONTROLE E AUTOMAÇÃO", titulacao: "Bacharel em Engenharia de Controle e Automação" } },
  gestao_recursos_humanos: { name: "", label: "Gestão de RH", curso: "CURSO SUPERIOR DE TECNOLOGIA EM GESTÃO DE RECURSOS HUMANOS", cursoAbreviado: "Gestão RH", fields: { ...BASE_FIELDS, curso: "CURSO SUPERIOR DE TECNOLOGIA EM GESTÃO DE RECURSOS HUMANOS" } },
  historia: { name: "", label: "História", curso: "CURSO SUPERIOR DE LICENCIATURA EM HISTÓRIA", cursoAbreviado: "História", fields: { ...BASE_FIELDS, curso: "CURSO SUPERIOR DE LICENCIATURA EM HISTÓRIA" } },
  letras: { name: "", label: "Letras", curso: "CURSO SUPERIOR DE LICENCIATURA EM LETRAS", cursoAbreviado: "Letras", fields: { ...BASE_FIELDS, curso: "CURSO SUPERIOR DE LICENCIATURA EM LETRAS" } },
  marketing: { name: "", label: "Marketing", curso: "CURSO SUPERIOR DE TECNOLOGIA EM MARKETING", cursoAbreviado: "Marketing", fields: { ...BASE_FIELDS, curso: "CURSO SUPERIOR DE TECNOLOGIA EM MARKETING" } },
  pedagogia: { name: "", label: "Pedagogia", curso: "CURSO SUPERIOR DE LICENCIATURA EM PEDAGOGIA", cursoAbreviado: "Pedagogia", fields: { ...BASE_FIELDS, curso: "CURSO SUPERIOR DE LICENCIATURA EM PEDAGOGIA" } },
  psicologia: { name: "", label: "Psicologia", curso: "CURSO SUPERIOR DE BACHARELADO EM PSICOLOGIA", cursoAbreviado: "Psicologia", fields: { ...BASE_FIELDS, curso: "CURSO SUPERIOR DE BACHARELADO EM PSICOLOGIA" } },
  servico_social: { name: "", label: "Serviço Social", curso: "CURSO SUPERIOR DE BACHARELADO EM SERVIÇO SOCIAL", cursoAbreviado: "Serviço Social", fields: { ...BASE_FIELDS, curso: "CURSO SUPERIOR DE BACHARELADO EM SERVIÇO SOCIAL" } },
  teologia: { name: "", label: "Teologia", curso: "CURSO SUPERIOR DE BACHARELADO EM TEOLOGIA", cursoAbreviado: "Teologia", fields: { ...BASE_FIELDS, curso: "CURSO SUPERIOR DE BACHARELADO EM TEOLOGIA" } },
};

// ------------------------------------------------------------
// COURSE METADATA (TEMPLATES)
// ------------------------------------------------------------

const BASE_META: CourseMetadata = {
  cursoCompleto: "CURSO SUPERIOR DE GRADUAÇÃO",
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
  administracao: { ...BASE_META, cursoCompleto: "CURSO SUPERIOR DE BACHARELADO EM ADMINISTRAÇÃO" },
  ciencias_contabeis: { ...BASE_META, cursoCompleto: "CURSO SUPERIOR DE BACHARELADO EM CIÊNCIAS CONTÁBEIS" },
  direito: { ...BASE_META, cursoCompleto: "CURSO SUPERIOR DE BACHARELADO EM DIREITO" },
  enfermagem: { ...BASE_META, cursoCompleto: "CURSO SUPERIOR DE BACHARELADO EM ENFERMAGEM" },
  engenharia_controle_automacao: { ...BASE_META, cursoCompleto: "CURSO SUPERIOR DE BACHARELADO EM ENGENHARIA DE CONTROLE E AUTOMAÇÃO" },
  gestao_recursos_humanos: { ...BASE_META, cursoCompleto: "CURSO SUPERIOR DE TECNOLOGIA EM GESTÃO DE RECURSOS HUMANOS" },
  historia: { ...BASE_META, cursoCompleto: "CURSO SUPERIOR DE LICENCIATURA EM HISTÓRIA" },
  letras: { ...BASE_META, cursoCompleto: "CURSO SUPERIOR DE LICENCIATURA EM LETRAS" },
  marketing: { ...BASE_META, cursoCompleto: "CURSO SUPERIOR DE TECNOLOGIA EM MARKETING" },
  pedagogia: { ...BASE_META, cursoCompleto: "CURSO SUPERIOR DE LICENCIATURA EM PEDAGOGIA" },
  psicologia: { ...BASE_META, cursoCompleto: "CURSO SUPERIOR DE BACHARELADO EM PSICOLOGIA" },
  servico_social: { ...BASE_META, cursoCompleto: "CURSO SUPERIOR DE BACHARELADO EM SERVIÇO SOCIAL" },
  teologia: { ...BASE_META, cursoCompleto: "CURSO SUPERIOR DE BACHARELADO EM TEOLOGIA" },
};

// ==================== SUBSTITUTION FIELDS ====================
export function createSubstitutionFields(profile: Profile): SubstitutionField[] {
  return [
    { id: "nome", label: "Nome Completo", category: "pessoal", originalValue: "", currentValue: profile.fields.nome, pages: [1, 2, 3, 5] },
    { id: "cpf", label: "CPF", category: "pessoal", originalValue: "", currentValue: profile.fields.cpf, pages: [1, 2, 3, 5] },
    { id: "rg", label: "RG", category: "pessoal", originalValue: "", currentValue: profile.fields.rg, pages: [3, 5] },
    { id: "rg_orgao", label: "Órgão Emissor RG", category: "pessoal", originalValue: "", currentValue: profile.fields.rg_orgao, pages: [3, 5] },
    { id: "data_nascimento", label: "Data de Nascimento", category: "pessoal", originalValue: "", currentValue: profile.fields.data_nascimento, pages: [3, 5] },
    { id: "uf_nascimento", label: "UF Nascimento", category: "pessoal", originalValue: "", currentValue: profile.fields.uf_nascimento, pages: [3, 5] },
    { id: "nacionalidade", label: "Nacionalidade", category: "pessoal", originalValue: "", currentValue: profile.fields.nacionalidade, pages: [3, 5] },
    { id: "matricula", label: "Matrícula", category: "academico", originalValue: "", currentValue: profile.fields.matricula, pages: [1, 2, 3, 5] },
    { id: "situacao_matricula", label: "Situação de Matrícula", category: "academico", originalValue: "", currentValue: profile.fields.situacao_matricula, pages: [3, 5] },
    { id: "endereco", label: "Endereço", category: "institucional", originalValue: "", currentValue: profile.fields.endereco, pages: [3] },
    { id: "conclusao_curso", label: "Conclusão do Curso", category: "academico", originalValue: "", currentValue: profile.fields.conclusao_curso, pages: [1, 2, 3] },
    { id: "colacao_grau", label: "Colação de Grau", category: "academico", originalValue: "", currentValue: profile.fields.colacao_grau, pages: [1, 2, 3] },
    { id: "ingresso_mes_ano", label: "Mês / Ano de Realização", category: "academico", originalValue: "", currentValue: profile.fields.ingresso_mes_ano, pages: [3] },
    { id: "ingresso_ano", label: "Ano de Ingresso", category: "academico", originalValue: "", currentValue: profile.fields.ingresso_ano, pages: [3] },
    { id: "reconhecimento", label: "Ato de Reconhecimento", category: "academico", originalValue: "", currentValue: profile.fields.reconhecimento, pages: [1, 2, 3] },
    { id: "credenciamento", label: "Ato de Credenciamento", category: "academico", originalValue: "", currentValue: profile.fields.credenciamento, pages: [3] },
    { id: "processo_emec", label: "Processo e-MEC*", category: "academico", originalValue: "", currentValue: profile.fields.processo_emec, pages: [3] },
    { id: "processo_seletivo", label: "Processo Seletivo", category: "academico", originalValue: "", currentValue: profile.fields.processo_seletivo, pages: [3] },
    { id: "expedicao_diploma", label: "Expedição do Diploma", category: "academico", originalValue: "", currentValue: profile.fields.expedicao_diploma, pages: [3] },
    { id: "expedicao_historico", label: "Expedição do Histórico", category: "academico", originalValue: "", currentValue: profile.fields.expedicao_historico, pages: [3] },
    { id: "carga_horaria", label: "Carga Horária", category: "academico", originalValue: "", currentValue: profile.fields.carga_horaria, pages: [2, 6] },
    { id: "titulacao", label: "Titulação", category: "academico", originalValue: "", currentValue: profile.fields.titulacao, pages: [5, 6] },
    { id: "instituicao_polo", label: "Instituição / Polo", category: "institucional", originalValue: "", currentValue: profile.fields.instituicao_polo, pages: [3] },
    { id: "nome_reitor", label: "Nome do Reitor", category: "institucional", originalValue: "", currentValue: profile.fields.nome_reitor, pages: [1] },
    { id: "nome_secretaria", label: "Nome da Secretária", category: "institucional", originalValue: "", currentValue: profile.fields.nome_secretaria, pages: [1, 2, 6] },
  ];
}

// ==================== GRADE DATA ====================
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
  // Retornar grade vazia para novos cursos, incentivando a importação rápida
  return { 
    page5: [{ anoMes: "", disciplina: "Clique em 'GERAR GRADE' ou 'Importar Inteligente' para preencher", ch: "", media: "", resultado: "", docente: "", titulacao: "" }], 
    page6: [] 
  };
}
