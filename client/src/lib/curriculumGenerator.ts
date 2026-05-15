import { type GradeRow, type ProfileKey } from "./documentData_uninter";

// ------------------------------------------------------------
// BANCO DE DISCIPLINAS POR CURSO (REAIS / REALISTAS)
// ------------------------------------------------------------

const SUBJECTS_DATABASE: Record<string, string[]> = {
  administracao: [
    "Fundamentos da Administração", "Matemática Financeira", "Economia Brasileira", "Contabilidade Geral", "Comportamento Organizacional",
    "Gestão de Pessoas", "Gestão de Marketing", "Administração Financeira", "Administração da Produção", "Planejamento Estratégico",
    "Gestão de Projetos", "Empreendedorismo", "Logística e Cadeia de Suprimentos", "Direito Empresarial", "Ética e Responsabilidade Social",
    "Comércio Exterior", "Sistemas de Informação Gerencial", "Gestão da Qualidade", "Administração Pública", "TCC - Projeto"
  ],
  ciencias_contabeis: [
    "Contabilidade Geral I", "Contabilidade Geral II", "Contabilidade de Custos", "Análise de Balanços", "Contabilidade Tributária",
    "Auditoria Contábil", "Perícia Contábil", "Contabilidade Pública", "Contabilidade Gerencial", "Legislação Social e Trabalhista",
    "Teoria da Contabilidade", "Controladoria", "Orçamento Público", "Sistemas de Informações Contábeis", "Contabilidade Internacional",
    "Laboratório Contábil", "Matemática Atuarial", "Estrutura das Demonstrações Contábeis", "Direito Tributário", "TCC - Monografia"
  ],
  direito: [
    "Introdução ao Estudo do Direito", "Teoria Geral do Estado", "Direito Civil - Parte Geral", "Direito Constitucional", "Direito Penal I",
    "Direito Processual Civil I", "Direito do Trabalho I", "Direito Penal II", "Direito Civil - Contratos", "Direito Administrativo",
    "Direito Processual Penal", "Direito Tributário", "Direito Empresarial", "Direito Ambiental", "Direito do Consumidor",
    "Direito Internacional", "Filosofia do Direito", "Sociologia Jurídica", "Prática Jurídica", "Ética Profissional", "TCC - Projeto"
  ],
  enfermagem: [
    "Anatomia Humana", "Fisiologia Humana", "Bioquímica", "Microbiologia e Imunologia", "Fundamentos de Enfermagem I",
    "Fundamentos de Enfermagem II", "Semiologia e Semiotécnica", "Enfermagem na Saúde da Mulher", "Enfermagem na Saúde da Criança", "Enfermagem em Urgência e Emergência",
    "Enfermagem em Centro Cirúrgico", "Gestão em Enfermagem", "Saúde Coletiva", "Enfermagem em Saúde Mental", "Farmacologia",
    "Patologia", "Bioética e Ética Profissional", "Epidemiologia", "Nutrição e Dietética", "TCC - Trabalho de Conclusão"
  ],
  engenharia_controle_automacao: [
    "Cálculo Diferencial e Integral I", "Física Geral I", "Geometria Analítica", "Desenho Técnico", "Algoritmos e Programação",
    "Circuitos Elétricos I", "Sistemas Digitais", "Sinais e Sistemas", "Controle de Sistemas Lineares", "Instrumentação Industrial",
    "Microcontroladores e Microprocessadores", "Eletrônica de Potência", "Redes Industriais", "Robótica Industrial", "Sistemas Supervisórios",
    "CLP - Controladores Lógicos Programáveis", "Automação Industrial", "Manufatura Integrada por Computador", "TCC I", "TCC II"
  ],
  gestao_recursos_humanos: [
    "Rotinas Trabalhistas", "Gestão de Cargos e Salários", "Recrutamento e Seleção", "Treinamento e Desenvolvimento", "Comportamento Organizacional",
    "Legislação Trabalhista e Previdenciária", "Saúde e Segurança no Trabalho", "Gestão de Desempenho", "Cultura e Clima Organizacional", "Psicologia Organizacional",
    "Ética e Relações Humanas no Trabalho", "Gestão por Competências", "Liderança e Motivação", "Responsabilidade Social", "Práticas em RH"
  ],
  historia: [
    "História Antiga", "História Medieval", "História Moderna", "História Contemporânea", "História do Brasil Colônia",
    "História do Brasil Império", "História do Brasil República", "Teoria da História", "Historiografia Geral", "Arqueologia",
    "Antropologia Cultural", "Geografia Humana", "Metodologia do Ensino de História", "Prática Profissional: O Arquivo", "História da África",
    "História da América", "Patrimônio e Museologia", "História e Meio Ambiente", "TCC - Pesquisa Histórica"
  ],
  letras: [
    "Linguística Geral", "Fonética e Fonologia", "Morfossintaxe da Língua Portuguesa", "Teoria da Literatura", "Literatura Brasileira I",
    "Literatura Brasileira II", "Literatura Portuguesa", "Semântica e Pragmática", "Produção de Texto", "Literatura e Outras Artes",
    "Metodologia do Ensino de Língua Portuguesa", "Literatura Infantojuvenil", "Libras", "Latim e Cultura Clássica", "Análise do Discurso"
  ],
  marketing: [
    "Comportamento do Consumidor", "Pesquisa de Marketing", "Gestão de Marcas (Branding)", "Comunicação Integrada de Marketing", "Marketing Digital",
    "Endomarketing", "Marketing de Serviços", "Estratégias de Preço", "Canais de Distribuição", "Marketing Estratégico",
    "Neuromarketing", "Planejamento de Comunicação", "Trade Marketing", "Marketing de Relacionamento", "Projeto Integrador em Marketing"
  ],
  pedagogia: [
    "Fundamentos Históricos da Educação", "Fundamentos Filosóficos da Educação", "Psicologia da Educação", "Sociologia da Educação", "Didática",
    "Currículo Escolar", "Políticas e Organização da Educação Básica", "Educação Inclusiva", "Alfabetização e Letramento", "Educação Infantil: Teorias e Práticas",
    "Metodologia do Ensino da Língua Portuguesa", "Metodologia do Ensino da Matemática", "Metodologia do Ensino de Ciências", "Gestão Escolar", "Avaliação da Aprendizagem",
    "LIBRAS", "Tecnologias na Educação", "Pesquisa em Educação", "TCC", "Estágio Supervisionado"
  ],
  psicologia: [
    "Psicologia Geral", "Teorias e Sistemas em Psicologia", "Anatomia e Fisiologia do Sistema Nervoso", "Processos Psicológicos Básicos", "Psicologia do Desenvolvimento",
    "Psicopatologia I", "Psicologia Social", "Avaliação Psicológica", "Teoria Psicanalítica", "Terapia Cognitivo-Comportamental",
    "Psicologia Humanista", "Neuropsicologia", "Psicologia Organizacional", "Psicologia Hospitalar", "Psicologia Jurídica",
    "Ética Profissional", "Métodos de Pesquisa", "Estágio Básico", "Estágio Específico I", "TCC"
  ],
  servico_social: [
    "Fundamentos do Serviço Social", "Ética Profissional", "Política Social I", "Sociologia", "Direito e Legislação Social",
    "Pesquisa Social", "Trabalho e Sociabilidade", "Planejamento e Gestão Social", "Serviço Social na Saúde", "Serviço Social e Família",
    "Questão Social e Direitos Humanos", "Assessoria e Consultoria", "Prática Profissional", "Seminários de Prática", "TCC - Projeto"
  ],
  teologia: [
    "Teoria Geral da Religião", "Introdução ao Estudo da Teologia", "História do Cristianismo", "Teologia Sistemática", "Exegese Bíblica",
    "Hermenêutica Sagrada", "Filosofia da Religião", "Sociologia da Religião", "Liderança e Gestão Eclesiástica", "Ética Teológica",
    "Cultura e Sociedade Contemporânea", "Missiologia", "Teologia Pastoral", "Línguas Bíblicas (Grego/Hebraico)", "TCC"
  ]
};

// ------------------------------------------------------------
// BANCO DE DOCENTES E TITULAÇÕES
// ------------------------------------------------------------

const PROFESSORS = [
  "Adriano de Oliveira", "Beatriz Mendonça", "Carlos Eduardo Santos", "Dinamara Pereira Machado", "Edna Marta Oliveira",
  "Felipe Augusto Rocha", "Gisele do Rocio Cordeiro", "Hélio Ferreira Lima", "Isabel Cristina Silva", "João Paulo Mendes",
  "Katia Cristina Soares", "Luis Fernando Lopes", "Maria Thereza David", "Neliva Terezinha Tessaro", "Oscar Alberto Souza",
  "Paulo Henrique Martins", "Queila Regina Oliveira", "Ricardo Almeida Souza", "Simone Ramos de Oliveira", "Tiago de Campos",
  "Ursula Maria Freitas", "Valéria Pilão", "Wagner Roberto Silva", "Xavier de Arantes", "Yuri Gabriel Castro", "Zuleide de Fátima"
];

const TITLES = ["Especialização", "Mestrado", "Mestrado", "Doutorado", "Doutorado"];

// ------------------------------------------------------------
// AUXILIARES
// ------------------------------------------------------------

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomGrade(): string {
  const grade = (Math.random() * 3 + 7.0).toFixed(1); // 7.0 a 10.0
  return grade.replace(".", ",");
}

function getResultFromGrade(grade: string): string {
  const val = parseFloat(grade.replace(",", "."));
  if (val >= 7.0) return "APR.MÉDIA";
  if (val >= 5.0) return "APR.EXAME";
  return "APR.RECUP";
}

// ------------------------------------------------------------
// MOTOR DE GERAÇÃO
// ------------------------------------------------------------

export function generateAcademicGrades(
  courseKey: ProfileKey,
  startMonthYear?: string, // Formato "Mês / Ano" ou "MM/AAAA"
  endMonthYear?: string    // Formato "MM/AAAA"
): GradeRow[] {
  const subjects = SUBJECTS_DATABASE[courseKey] || SUBJECTS_DATABASE.historia;
  const rows: GradeRow[] = [];

  // Tenta extrair o ano de início e fim das datas fornecidas
  const getYear = (d?: string, fallback = 2018) => {
    if (!d) return fallback;
    const match = d.match(/\d{4}/);
    return match ? parseInt(match[0]) : fallback;
  };

  const startYear = getYear(startMonthYear, 2018);
  const endYear = getYear(endMonthYear, startYear + 4);
  const durationYears = Math.max(2, endYear - startYear);
  
  // Distribuir disciplinas ao longo do tempo
  const subjectsPerYear = Math.ceil(subjects.length / durationYears);
  
  subjects.forEach((subj, idx) => {
    const yearOffset = Math.floor(idx / subjectsPerYear);
    const monthOffset = (idx % subjectsPerYear) * 2 + 1; // Espaça em meses
    const currentYear = startYear + yearOffset;
    const currentMonth = monthOffset > 12 ? 12 : monthOffset;
    
    const anoMes = `${currentYear}/${String(currentMonth).padStart(2, "0")}`;
    const grade = getRandomGrade();
    const isActivity = subj.toLowerCase().includes("atividades") || subj.toLowerCase().includes("orientação");

    rows.push({
      anoMes,
      disciplina: subj,
      ch: getRandomItem(["40h", "80h", "80h", "100h"]),
      media: isActivity ? "-" : grade,
      resultado: isActivity ? "CONCLUÍDA" : getResultFromGrade(grade),
      docente: getRandomItem(PROFESSORS),
      titulacao: getRandomItem(TITLES)
    });
  });

  // Ordenar cronologicamente
  return rows.sort((a, b) => a.anoMes.localeCompare(b.anoMes));
}
