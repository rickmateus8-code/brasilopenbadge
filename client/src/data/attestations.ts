export interface AttestationData {
  id: string;
  paciente: string;
  sexo: string;
  nascimento: string;
  cpf: string;
  nomeMae: string;
  endereco: string;
  passaporte: string;
  condicao: string;
  vacinacao: string;
  cid: string;
  codigoQR: string;
  dataAssinatura: string;
  horaAssinatura: string;
  medico: string;
  crm: string;
  especialidade: string;
  dataEmissao: string;
  logoUrl?: string;
}

export const attestations: Record<string, AttestationData> = {
  lucas: {
    id: "P792.GL02",
    paciente: "",
    sexo: "MALE",
    nascimento: "07/10/1987",
    cpf: "033.548.725-43",
    nomeMae: "DIANE MESSIAS MARON",
    endereco: "RUA DE ITABORAHY, 749 AP 103, AMARALINA - SALVADOR - BA, 41900-000",
    passaporte: "GN406067",
    condicao: "The patient has a history of severe allergic reaction (anaphylaxis) to egg proteins, representing a risk condition for administration of vaccines containing this component.",
    vacinacao: "YELLOW FEVER",
    cid: "T78.0 ANAPHYLACTIC REACTION DUE TO FOOD (EGG)",
    codigoQR: "P792.GL02",
    dataAssinatura: "03/16/2026",
    horaAssinatura: "15:41",
    medico: "DIMITRI GUSMAO FLORES",
    crm: "CRM/BA 14180",
    especialidade: "ALLERGY AND IMMUNOLOGY",
    dataEmissao: "MARCH 16, 2026",
  },
  exemplo2: {
    id: "UMS4.9Z40",
    paciente: "",
    sexo: "FEMALE",
    nascimento: "01/11/1994",
    cpf: "167.709.317-02",
    nomeMae: "CRISTIANA CANDIDA DA SILVA",
    endereco: "RUA CASTELO BRANCO, 290 - CENTRO, ITABORAI/RJ - 24800-089",
    passaporte: "FX255093",
    condicao: "The patient has a history of severe allergic reaction (anaphylaxis) to egg proteins, representing a risk condition for administration of vaccines containing this component.",
    vacinacao: "YELLOW FEVER",
    cid: "T78.0 ANAPHYLACTIC REACTION DUE TO FOOD (EGG)",
    codigoQR: "UMS4.9Z40",
    dataAssinatura: "03/16/2026",
    horaAssinatura: "14:53",
    medico: "DIMITRI GUSMAO FLORES",
    crm: "CRM/BA 14180",
    especialidade: "ALLERGY AND IMMUNOLOGY",
    dataEmissao: "MARCH 16, 2026",
  },
};
