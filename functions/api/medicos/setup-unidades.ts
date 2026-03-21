// /api/medicos/setup-unidades — Cria tabela e popula com unidades Dr. Consulta
// EXECUTAR UMA VEZ: GET /api/medicos/setup-unidades?key=docmaster2024
interface Env { DB: D1Database; }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

const UNIDADES = [
  {id_unit:7562,nome:"Metrô Sacomã",key:"sacoma",endereco:"Rua Silva Bueno, 2408 - Próximo ao terminal Sacomã - Ipiranga",bairro:"Ipiranga",cidade:"São Paulo",uf:"SP",cep:"04208002",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dr.Giulliano Giovannino Accetta",rt_crm:"CRM SP 169960"},
  {id_unit:7652,nome:"Metrô Jabaquara",key:"jabaquara",endereco:"Rua dos Buritis, 128 - Ao lado do terminal",bairro:"Jabaquara",cidade:"São Paulo",uf:"SP",cep:"04321000",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dr.Leandro Gomes Da Silva",rt_crm:"CRM SP 81195"},
  {id_unit:7679,nome:"Tatuapé Metro",key:"tatuape",endereco:"Rua Domingos Agostin, 91 - Shopping Metro Tatuapé",bairro:"Tatuapé",cidade:"São Paulo",uf:"SP",cep:"03316000",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dr.Luccas Santos Patto De Goes",rt_crm:"CRM SP 133985"},
  {id_unit:7738,nome:"Diadema",key:"diadema",endereco:"Rua Graciosa, 415, Piso Palmeira (térreo)",bairro:"Centro",cidade:"Diadema",uf:"SP",cep:"09911290",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dr.Edjarbas Maluf Hernandes",rt_crm:"CRM SP 66281"},
  {id_unit:7745,nome:"Santo André",key:"santo-andre",endereco:"Rua Senador Fláquer, 72",bairro:"Centro",cidade:"Santo André",uf:"SP",cep:"09010160",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dr.Ricardo Magalhaes De Souza",rt_crm:"CRM SP 177136"},
  {id_unit:7751,nome:"Tucuruvi",key:"tucuruvi",endereco:"Av. Tucuruvi, 990",bairro:"Tucuruvi",cidade:"São Paulo",uf:"SP",cep:"02340000",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dra.Grasiele Cristina De Oliveira Abreu Pessoa",rt_crm:"CRM SP 108703"},
  {id_unit:7780,nome:"Republica",key:"republica",endereco:"Rua Conselheiro Crispiniano, 155",bairro:"República",cidade:"São Paulo",uf:"SP",cep:"01037001",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dra.Michelle Sena Dos Prazeres",rt_crm:"CRM SP 213057"},
  {id_unit:7800,nome:"Teodoro",key:"teodoro",endereco:"Rua Teodoro Sampaio, 2767 - Pinheiros",bairro:"Pinheiros",cidade:"São Paulo",uf:"SP",cep:"05405250",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dr.Saint Clair Augusto Magalhaes Borges",rt_crm:"CRM SP 186103"},
  {id_unit:8011,nome:"Santana",key:"santana",endereco:"Av Cruzeiro do Sul, 3099",bairro:"Santana",cidade:"São Paulo",uf:"SP",cep:"02031100",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dr.Rogerio Bueno Da Rosa",rt_crm:"CRM SP 133883"},
  {id_unit:8012,nome:"Itaquera - Piso Metrô",key:"itaquera",endereco:"Av. José Pinheiro Borges, s/n - Shopping Metro Itaquera - Piso Metrô",bairro:"Itaquera",cidade:"São Paulo",uf:"SP",cep:"08210000",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dr.Marco Antonio Palmieri",rt_crm:"CRM SP 24604"},
  {id_unit:8013,nome:"Largo Treze",key:"largo-treze",endereco:"Rua Barão do Rio Branco, 184",bairro:"Santo Amaro",cidade:"São Paulo",uf:"SP",cep:"04757000",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dra.Sabrina Pisciotta Buso",rt_crm:"CRM SP 116444"},
  {id_unit:8014,nome:"SP Market",key:"spmarket",endereco:"Av das Nações Unidas, 22540 - Shopping SP Market",bairro:"Jurubatuba",cidade:"São Paulo",uf:"SP",cep:"04795100",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dra.Daniela Pires Marques",rt_crm:"CRM SP 238773"},
  {id_unit:8017,nome:"Santa Cruz",key:"santa-cruz",endereco:"Rua Domingos de Morais, 2432",bairro:"Vila Mariana",cidade:"São Paulo",uf:"SP",cep:"04036100",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dra.Lillian De Oliveira Ataide",rt_crm:"CRM SP 160282"},
  {id_unit:8021,nome:"Osasco",key:"osasco-centro",endereco:"Rua Dona Primitiva Vianco, 145",bairro:"Centro",cidade:"Osasco",uf:"SP",cep:"06018010",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dr.Marcelo Thiers Silveira",rt_crm:"CRM SP 90625"},
  {id_unit:8023,nome:"Lapa",key:"lapa",endereco:"Rua John Harrison, 51",bairro:"Lapa",cidade:"São Paulo",uf:"SP",cep:"05038000",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dra.Alessandra Inacio",rt_crm:"CRM SP 108813"},
  {id_unit:8024,nome:"Guarulhos Centro",key:"guarulhos",endereco:"Rua João Gonçalves, 261",bairro:"Centro",cidade:"Guarulhos",uf:"SP",cep:"07011030",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dr.Roberto Kioshi Gushken",rt_crm:"CRM SP 63792"},
  {id_unit:8025,nome:"Taboão",key:"taboao",endereco:"Praça Nicola Vivilechio, 103",bairro:"Centro",cidade:"Taboão da Serra",uf:"SP",cep:"06763080",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dra.Camilla Rochelle De Moraes Teixeira",rt_crm:"CRM SP 117013"},
  {id_unit:8028,nome:"Paraíso",key:"paraiso",endereco:"Av. Bernardino de Campos, 358",bairro:"Paraíso",cidade:"São Paulo",uf:"SP",cep:"04004050",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dra.Marcia Okawara",rt_crm:"CRM SP 157556"},
  {id_unit:8029,nome:"Butantã",key:"butanta",endereco:"Av. Vital Brasil, 466",bairro:"Butantã",cidade:"São Paulo",uf:"SP",cep:"05503000",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dra.Livia Maria Rolim Adami",rt_crm:"CRM SP 183991"},
  {id_unit:8030,nome:"Luz",key:"luz",endereco:"R. Brigadeiro Tobias, 600 - frente ao Ministerio da Fazenda",bairro:"Luz",cidade:"São Paulo",uf:"SP",cep:"01032001",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dr.Guilherme Lima Andrade Alves De Toledo",rt_crm:"CRM SP 139157"},
  {id_unit:8034,nome:"Ibirapuera",key:"ibirapuera",endereco:"Av. Jandira, 40 - esquina com Av. Ibirapuera 2523",bairro:"Moema",cidade:"São Paulo",uf:"SP",cep:"04080000",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"",rt_crm:""},
  {id_unit:8035,nome:"Tatuapé - Praça Silvio Romero",key:"tatuape-2",endereco:"Praça Silvio Romero, 12",bairro:"Tatuapé",cidade:"São Paulo",uf:"SP",cep:"03323000",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dr.Mauricio Monteiro",rt_crm:"CRM SP 84818"},
  {id_unit:8039,nome:"Mooca",key:"mooca",endereco:"Av.Paes de Barros, 75",bairro:"Mooca",cidade:"São Paulo",uf:"SP",cep:"03100000",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dra.Janaina Pimenta De Morais",rt_crm:"CRM SP 124109"},
  {id_unit:8040,nome:"São Bernardo Centro",key:"sao-bernardo-centro",endereco:"Av. Lucas Nogueira Garcez, 441",bairro:"Centro",cidade:"São Bernardo do Campo",uf:"SP",cep:"09750670",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dr.Thiago Lusvarghi Cardoso",rt_crm:"CRM SP 155160"},
  {id_unit:8046,nome:"Itaquera - Piso Superior",key:"itaquera-piso-superior",endereco:"Av. José Pinheiro Borges, s/n - Shopping Metrô Itaquera - Piso Campanela",bairro:"Itaquera",cidade:"São Paulo",uf:"SP",cep:"08210000",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"",rt_crm:""},
  {id_unit:8049,nome:"Internacional Shopping Guarulhos",key:"internacional-shopping-guarulhos",endereco:"Rua Engenheiro Camilo Olivetti, 295",bairro:"Vila Endres",cidade:"Guarulhos",uf:"SP",cep:"07092080",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dr.Pedro Vilela Santoro De Castro Vianna",rt_crm:"CRM SP 153889"},
  {id_unit:8057,nome:"Tatuapé Shopping Boulevard",key:"tatuape-3",endereco:"Rua Goncalves Crespo, 78 - Shopping Boulevard - Térreo",bairro:"Tatuapé",cidade:"São Paulo",uf:"SP",cep:"03323000",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dr.Roberto Kioshi Gushken",rt_crm:"CRM SP 63792"},
  {id_unit:8065,nome:"Centro Virtual de Telemedicina",key:"telemed",endereco:"Av. das Nações Unidas, 12995",bairro:"Cidade Monções",cidade:"São Paulo",uf:"SP",cep:"04578911",telefone:"(11) 40901510",horario:"24h",rt_nome:"Dr.Tin Hung Ho",rt_crm:"CRM SP 121152"},
  {id_unit:8081,nome:"Teodoro 2",key:"teodoro-2",endereco:"Rua Teodoro Sampaio, 2809",bairro:"Pinheiros",cidade:"São Paulo",uf:"SP",cep:"05405250",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dr.Jose Donizeti Costa Junior",rt_crm:"CRM SP 134951"},
  {id_unit:8082,nome:"CDB Morumbi",key:"cdb-morumbi",endereco:"Rua Pasquale Gallupi, 7",bairro:"Morumbi",cidade:"São Paulo",uf:"SP",cep:"05653070",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"",rt_crm:""},
  {id_unit:8084,nome:"COOP Café Filho",key:"coop-cafe-filho",endereco:"Avenida Presidente João Café Filho, 2231",bairro:"Rudge Ramos",cidade:"São Bernardo do Campo",uf:"SP",cep:"09836000",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"",rt_crm:""},
  {id_unit:8085,nome:"General Glicerio",key:"general-glicerio",endereco:"Rua General Glicerio, 346",bairro:"Centro",cidade:"Santo André",uf:"SP",cep:"09020110",telefone:"(11) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"Dra.Milena Alcara Vitrio",rt_crm:"CRM SP 199630"},
  {id_unit:8086,nome:"Guanabara Tijuca",key:"guanabara-tijuca",endereco:"Rua Almirante Cochrane, 146 - Loja 211",bairro:"Tijuca",cidade:"Rio de Janeiro",uf:"RJ",cep:"20550040",telefone:"(21) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"",rt_crm:""},
  {id_unit:8088,nome:"Copacabana 2",key:"copacabana-2",endereco:"Av Nossa Senhora de Copacabana, 581 - Loj E Loj F",bairro:"Copacabana",cidade:"Rio de Janeiro",uf:"RJ",cep:"22050002",telefone:"(21) 40901510",horario:"2ª a 6°das 6:45 às 18h e sábado das 06:45 as 13:00",rt_nome:"",rt_crm:""},
];

const ESPECIALIDADES = [
  "ACUPUNTURA","ALERGIA E IMUNOLOGIA","CARDIOLOGIA","CIRURGIA GERAL","CIRURGIA PLASTICA",
  "CIRURGIA VASCULAR","CLINICA GERAL","COLOPROCTOLOGIA","DERMATOLOGIA CLINICA","ENDOCRINOLOGIA",
  "GASTROENTEROLOGIA","GERIATRIA","GINECOLOGIA","HEMATOLOGIA","HEPATOLOGIA","INFECTOLOGIA",
  "MASTOLOGIA","NEFROLOGIA","NEUROLOGIA","NUTRICIONISTA","OBSTETRICIA","ODONTOLOGIA",
  "OFTALMOLOGIA","ORTOPEDIA","OTORRINOLARINGOLOGIA","PEDIATRIA","PNEUMOLOGIA","PSICOLOGIA",
  "PSIQUIATRIA","REUMATOLOGIA","UROLOGIA"
];

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (key !== "docmaster2024") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  try {
    // 1. Criar tabela unidades
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS unidades_drconsulta (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_unit INTEGER,
        nome TEXT,
        key TEXT,
        endereco TEXT,
        bairro TEXT,
        cidade TEXT,
        uf TEXT,
        cep TEXT,
        telefone TEXT,
        horario TEXT,
        rt_nome TEXT,
        rt_crm TEXT
      )
    `).run();

    // 2. Criar tabela especialidades
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS especialidades_drconsulta (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT UNIQUE
      )
    `).run();

    // 3. Limpar dados antigos
    await env.DB.prepare("DELETE FROM unidades_drconsulta").run();
    await env.DB.prepare("DELETE FROM especialidades_drconsulta").run();

    // 4. Inserir unidades
    const stmtU = env.DB.prepare(
      "INSERT INTO unidades_drconsulta (id_unit,nome,key,endereco,bairro,cidade,uf,cep,telefone,horario,rt_nome,rt_crm) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
    );
    const batchU = UNIDADES.map(u =>
      stmtU.bind(u.id_unit, u.nome, u.key, u.endereco, u.bairro, u.cidade, u.uf, u.cep, u.telefone, u.horario, u.rt_nome, u.rt_crm)
    );
    await env.DB.batch(batchU);

    // 5. Inserir especialidades
    const stmtE = env.DB.prepare("INSERT INTO especialidades_drconsulta (nome) VALUES (?)");
    const batchE = ESPECIALIDADES.map(e => stmtE.bind(e));
    await env.DB.batch(batchE);

    // 6. Verificar
    const countU = await env.DB.prepare("SELECT COUNT(*) as total FROM unidades_drconsulta").first();
    const countE = await env.DB.prepare("SELECT COUNT(*) as total FROM especialidades_drconsulta").first();

    return new Response(JSON.stringify({
      success: true,
      unidades: countU?.total,
      especialidades: countE?.total,
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { status: 500, headers: corsHeaders });
  }
};
