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
    paciente: "LUCAS MESSIAS MARON",
    sexo: "MALE",
    nascimento: "07/10/1987",
    cpf: "033.548.725-43",
    nomeMae: "DIANE MESSIAS MARON",
    endereco: "RUA DE ITABORAHY, 749 AP 103, AMARALINA - SALVADOR - BA, 41900-000",
    passaporte: "GN406067",
    condicao: "O paciente apresenta histórico de reação alérgica grave (anafilática) a proteínas do ovo, caracterizando condição de risco para administração de imunobiológicos que contenham esse componente.",
    vacinacao: "FEBRE AMARELA / YELLOW FEVER",
    cid: "T78.0 REAÇÃO ANAFILÁTICA DEVIDO A ALIMENTO (OVO) / ANAPHYLACTIC REACTION DUE TO FOOD (EGG)",
    codigoQR: "P792.GL02",
    dataAssinatura: "16/03/2026",
    horaAssinatura: "15:41",
    medico: "DIMITRI GUSMAO FLORES",
    crm: "CRM/BA 14180",
    especialidade: "ALERGIA E IMUNOLOGIA / ALLERGY AND IMMUNOLOGY",
    dataEmissao: "16 DE MARÇO DE 2026",
  },
  thielsily: {
    id: "UMS4.9Z40",
    paciente: "THIELSILY MONIQUE CÂNDIDA DA SILVA PEREIRA",
    sexo: "FEMALE",
    nascimento: "01/11/1994",
    cpf: "167.709.317-02",
    nomeMae: "CRISTIANA CANDIDA DA SILVA",
    endereco: "RUA CASTELO BRANCO, 290 - CENTRO, ITABORAI/RJ - 24800-089",
    passaporte: "FX255093",
    condicao: "O paciente apresenta histórico de reação alérgica grave (anafilática) a proteínas do ovo, caracterizando condição de risco para administração de imunobiológicos que contenham esse componente.",
    vacinacao: "FEBRE AMARELA / YELLOW FEVER",
    cid: "T78.0 REAÇÃO ANAFILÁTICA DEVIDO A ALIMENTO (OVO) / ANAPHYLACTIC REACTION DUE TO FOOD (EGG)",
    codigoQR: "UMS4.9Z40",
    dataAssinatura: "16/03/2026",
    horaAssinatura: "14:53",
    medico: "DIMITRI GUSMAO FLORES",
    crm: "CRM/BA 14180",
    especialidade: "ALERGIA E IMUNOLOGIA / ALLERGY AND IMMUNOLOGY",
    dataEmissao: "16 DE MARÇO DE 2026",
  },
};
