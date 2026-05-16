// ============================================================
// Document Data Model — Histórico Escolar UNINTER Elite 3.0 (Universal)
// Design: "Document Studio" — Swiss Design / Functional
// ============================================================

export const UNINTER_LOGO_B64 = "data:image/png;base64,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";

export const UNINTER_ASSINATURA_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAVcAAAB8CAYAAADdLfNZAAAQAElEQVR4Aex9B3xT5f7+e3Z2OoCyBWW1dCRN03QBFVGve9zLdSuiF2QVyt6WKRtkCiji9op7Xse9FxEoHWnSlQ6mUKDQlTTJ2eMf/F/8IULpblJOPj2c8X7H833ew5Nz3jMCA/kjMyAzIDMgM9DqDMji2uqUygFlBmQGZAYAkMVV3gs6jAGzIS0p2bx4nsU4/0yieXp2XPyLLxgMDwd1GCA5scxAcxi4jg98ne3yZpmBNmUgNnZiOIaFfY2ioQsJoouOJPHBIfrBW1F0wPttmlgOLjPQTgzI4tpORMtp/o+BIZEPJUFQ6C8MD5CqmhM7jp0u7cHznkfOVJx3KPAeKSbTvJn/Zy0vyQwEJgOyuAZmvwU06iD9LdMwXKWgONc2R/mrM8+d20UWl239DwCe+6tr3ScBpJljMI99KqCLlMF3QgaaVpIsrk3jS7ZuIQOG2LTZNK25UwQUxxNnNlwZrqRk13kIob+DYQTnaHzGlW3yssxAoDEgi2ug9VgA442IGI0rsB4TeA7lXfUVz5VbP6i+uhyWPrtBEjheodD3C49+JvLqdnldZiBQGJDFNVB6qhPgRJBeY0hK0ooC83VZ8Z4vr1XS8ePvXPR6Kz9AIQUEA8Wt17KRt8kMtDEDrRJeFtdWoVEOciMGBlim6GBUs1ylQCAvU7WrIXuFElrJ0CykIUKfbchObpMZ8GcGZHH1597pRNg0nPZRBaHBPVRF5q/H9mQ2VJRm+H9mQ2VJrNtvUcBKAfAcBHxcY+Ft6QrdwmM+CvDMji6q8908lw4ah2lCiKAs9dnN6Y0kSJPw0BFGCE/m+NsZdtZAaaw0Bb+sji2pbsyrF/YyApadZtLCfeU+eqLikt/Wf5bxtv8I8ImCMcxwGaxO+9gancLDPglwzI4uqX3dK5QNW6vWsBBBClAvkBNPKD49QPAhAEAgvSNNJFNpMZ8CsGZHH1q+7onGBwNW7CVYjEsGRuYyu0Wne5JEDnCoKid1TU3ODG+sl2MgPXZKADNsri2gGk30wpIy0vhokC0Hjqzwsi5zzYlNoJJUJhqAKBBWloU/xkW5kBf2BAFld/6IVOjEFi8WEYqkKVKvrfx469V9+UUkWOz5YkBgCMVTXFT7aVGfAHBmB/ACFj6LwMqLVd4gAPSxznXN30KvlyGEgARUFU031lj5uTAf+pWhZX/+mLTomE9FDxkiRVFVj/mdfUAlmKZi/5QBBiuDT39yk+flLooKHjY6LjZr4wYMjEuQZD+rcRERMroqKmnA4fkvZr9NC5pw1Ri8/Gxi743mAYP9Df65HxtYwBWVxbxp/s3QADQxNHh6gUOjOKwcUNmF23iVCpTwNIlHwGSt/kt3/m5PShgyKnriBZvVWl7vMDAunW6PXdZnEiHIugmMCwgiCIoIZmOYFkec5DgqFeNuhQXNKMZ/y2KBlYixmQxbXFFMoBrscAzOieFHggshxnu55NQ9tpmvnVd9Qr+UYGLglsQ6bt3hZpnvVYlDljaXjUirOkJ2y/WtXrRQnCCJZ28R7yzMELVbZnigvWdy8sePWW8rLt/cvLN8eWH13fv7xsZT8Id7+IEMqLXgp/1Rg39sF2B985Evp9FbK4+n0XBS5AlSr0MRhGISCwzRLXwsIddaIo1Esi7BcXtPr1G6MYapgwaWjMTDsq6rcwHjBOSeCYwHtEp/PXz0W+8gXKfTzpaPHuhypOfPHt9XqurGDzv0RBnCqJhMCz0P3Xs5O3BzYDsrgGdv/5LfrBgx/UChwagSCIWO2qsjcXqCAKrASgPs31bw2/oZbxEZHGaVnBXXue1RDdlygRoidP1nhUeM1PTmdWemnx8rCT5dvGlxTu/PbkyU9/bUxOjnFVKFFcxFCNsTH2sk3gMSCLa+D1WUAgDg6+NZplIMnrdV84d+Kd08... [truncated]";

export const UNINTER_SELO_B64 = "data:image/png;base64,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";

export interface SubstitutionField {
  id: string;
  label: string;
  category: "pessoal" | "academico" | "institucional";
  originalValue: string;
  currentValue: string;
  pages: number[];
  placeholder?: string;
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
  "Credenciamento: Portaria n.º",
  "Credenciamento: Data Portaria",
  "Credenciamento: Data D.O.U.",
  "Recredenc.: Portaria n.º",
  "Recredenc.: Data Portaria",
  "Reconhec.: Portaria n.º",
  "Reconhec.: Data Portaria",
  "Reconhec.: Data D.O.U.",
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
  "Código de Validação:",
  "Hora de Emissão:",
  "",
  "DADOS INSTITUCIONAIS",
  "Instituição / Polo:",
  "CEP:",
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
  cred_portaria: "688",
  cred_portaria_dt: "25/05/2012",
  cred_dou_dt: "28/05/2012",
  recred_portaria: "1.219",
  recred_portaria_dt: "28/11/2019",
  reconhecimento_portaria: "357",
  reconhecimento_portaria_dt: "24/05/2018",
  reconhecimento_dou_dt: "25/05/2018",
  processo_emec: "201605151",
  processo_seletivo: "VESTIBULAR",
  instituicao_polo: "CENTRO UNIVERSITÁRIO INTERNACIONAL UNINTER | POLO CURITIBA (CENTRO) - PR",
  cep: "",
  unidade_uf: "",
  unidade_cidade: "",
  codigo_validacao: "",
  emissao_hora: "15:01:39",
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
  unidadeLabel: "UNIDADE:",
  unidadeEndereco: "",
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
    { id: "nome", label: "Nome Completo", category: "pessoal", originalValue: "", currentValue: fields.nome, pages: [1, 2, 3, 5], placeholder: "JOÃO DA SILVA" },
    { id: "cpf", label: "CPF", category: "pessoal", originalValue: "", currentValue: fields.cpf, pages: [1, 2, 3, 5], placeholder: "000.000.000-00" },
    { id: "rg", label: "RG", category: "pessoal", originalValue: "", currentValue: fields.rg, pages: [3, 5], placeholder: "00.000.000-0" },
    { id: "rg_orgao", label: "Órgão Emissor RG", category: "pessoal", originalValue: "", currentValue: fields.rg_orgao, pages: [3, 5], placeholder: "SSP/PR" },
    { id: "data_nascimento", label: "Data de Nascimento", category: "pessoal", originalValue: "", currentValue: fields.data_nascimento, pages: [3, 5], placeholder: "01/01/1990" },
    { id: "uf_nascimento", label: "UF Nascimento", category: "pessoal", originalValue: "", currentValue: fields.uf_nascimento, pages: [3, 5], placeholder: "PR" },
    { id: "nacionalidade", label: "Nacionalidade", category: "pessoal", originalValue: "", currentValue: fields.nacionalidade, pages: [3, 5], placeholder: "BRASILEIRA" },
    { id: "matricula", label: "Matrícula", category: "academico", originalValue: "", currentValue: fields.matricula, pages: [1, 2, 3, 5], placeholder: "1022071" },
    { id: "situacao_matricula", label: "Situação de Matrícula", category: "academico", originalValue: "FORMADO", currentValue: fields.situacao_matricula, pages: [3, 5] },
    { id: "curso", label: "Nome do Curso", category: "academico", originalValue: "", currentValue: fields.curso, pages: [1, 2, 3], placeholder: "PEDAGOGIA" },
    { id: "conclusao_curso", label: "Conclusão do Curso", category: "academico", originalValue: "", currentValue: fields.conclusao_curso, pages: [1, 2, 3], placeholder: "12/2025" },
    { id: "colacao_grau", label: "Colação de Grau", category: "academico", originalValue: "", currentValue: fields.colacao_grau, pages: [1, 2, 3], placeholder: "22/12/2025" },
    { id: "ingresso_mes_ano", label: "Mês / Ano de Realização", category: "academico", originalValue: "", currentValue: fields.ingresso_mes_ano, pages: [3], placeholder: "01/2021" },
    { id: "ingresso_ano", label: "Ano de Ingresso", category: "academico", originalValue: "", currentValue: fields.ingresso_ano, pages: [3], placeholder: "2021" },
    { id: "expedicao_diploma", label: "Expedição do Diploma", category: "academico", originalValue: "", currentValue: fields.expedicao_diploma, pages: [3, 4], placeholder: "22/12/2025" },
    { id: "expedicao_historico", label: "Expedição do Histórico", category: "academico", originalValue: "", currentValue: fields.expedicao_historico, pages: [3], placeholder: "22/12/2025" },
    { id: "carga_horaria", label: "Carga Horária", category: "academico", originalValue: "", currentValue: fields.carga_horaria, pages: [2, 6], placeholder: "3200" },
    { id: "titulacao", label: "Titulação", category: "academico", originalValue: "", currentValue: fields.titulacao, pages: [5, 6], placeholder: "LICENCIADA EM PEDAGOGIA" },
    { id: "processo_emec", label: "Processo e-MEC*", category: "academico", originalValue: "201605151", currentValue: fields.processo_emec, pages: [3], placeholder: "201605151" },
    { id: "processo_seletivo", label: "Processo Seletivo", category: "academico", originalValue: "VESTIBULAR", currentValue: fields.processo_seletivo, pages: [3], placeholder: "VESTIBULAR" },
    { id: "cred_portaria", label: "Credenciamento: Portaria n.º", category: "academico", originalValue: "688", currentValue: fields.cred_portaria, pages: [2, 3], placeholder: "688" },
    { id: "cred_portaria_dt", label: "Credenciamento: Data Portaria", category: "academico", originalValue: "25/05/2012", currentValue: fields.cred_portaria_dt, pages: [2, 3], placeholder: "25/05/2012" },
    { id: "cred_dou_dt", label: "Credenciamento: Data D.O.U.", category: "academico", originalValue: "28/05/2012", currentValue: fields.cred_dou_dt, pages: [2, 3], placeholder: "28/05/2012" },
    { id: "recred_portaria", label: "Recredenc.: Portaria n.º", category: "academico", originalValue: "1.219", currentValue: fields.recred_portaria, pages: [2, 3], placeholder: "1.219" },
    { id: "recred_portaria_dt", label: "Recredenc.: Data Portaria", category: "academico", originalValue: "28/11/2019", currentValue: fields.recred_portaria_dt, pages: [2, 3], placeholder: "28/11/2019" },
    { id: "reconhecimento_portaria", label: "Reconhec.: Portaria n.º", category: "academico", originalValue: "357", currentValue: fields.reconhecimento_portaria, pages: [1, 2, 3], placeholder: "357" },
    { id: "reconhecimento_portaria_dt", label: "Reconhec.: Data Portaria", category: "academico", originalValue: "24/05/2018", currentValue: fields.reconhecimento_portaria_dt, pages: [1, 2, 3], placeholder: "24/05/2018" },
    { id: "reconhecimento_dou_dt", label: "Reconhec.: Data D.O.U.", category: "academico", originalValue: "25/05/2018", currentValue: fields.reconhecimento_dou_dt, pages: [1, 2, 3], placeholder: "25/05/2018" },
    { id: "codigo_validacao", label: "Código de Validação", category: "academico", originalValue: "", currentValue: fields.codigo_validacao, pages: [4], placeholder: "732.551/822.441" },
    { id: "emissao_hora", label: "Hora de Emissão", category: "academico", originalValue: "15:01:39", currentValue: fields.emissao_hora, pages: [4], placeholder: "15:01:39" },
    // Institucional
    { id: "instituicao_polo", label: "Instituição / Polo", category: "institucional", originalValue: "CENTRO UNIVERSITÁRIO INTERNACIONAL UNINTER | POLO CURITIBA (CENTRO) - PR", currentValue: fields.instituicao_polo, pages: [3] },
    { id: "cep", label: "CEP Busca", category: "institucional", originalValue: "", currentValue: fields.cep, pages: [], placeholder: "81200-170" },
    { id: "endereco", label: "Endereço Completo", category: "institucional", originalValue: "", currentValue: fields.endereco, pages: [3], placeholder: "RUA CLARA VENDRAMIN, 58..." },
    { id: "unidade_uf", label: "UF da Unidade", category: "institucional", originalValue: "", currentValue: fields.unidade_uf, pages: [], placeholder: "PR" },
    { id: "unidade_cidade", label: "Cidade da Unidade", category: "institucional", originalValue: "", currentValue: fields.unidade_cidade || "", pages: [], placeholder: "CURITIBA" },
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
