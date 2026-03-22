import DocumentosSalvos from "@/components/DocumentosSalvos";

const FIELDS = [
  { key: "nome_paciente", label: "Nome do Paciente" },
  { key: "cpf", label: "CPF", locked: true },
  { key: "data_emissao", label: "Data Emissão" },
  { key: "nome_medico", label: "Nome do Médico" },
  { key: "crm", label: "CRM" },
  { key: "uf_crm", label: "UF CRM" },
  { key: "especialidade", label: "Especialidade" },
  { key: "medicamento", label: "Medicamento" },
  { key: "posologia", label: "Posologia" },
  { key: "endereco", label: "Endereço" },
  { key: "observacoes", label: "Observações", type: "textarea" as const },
];

export default function ReceitasSalvas() {
  return (
    <DocumentosSalvos
      title="Receitas Salvas"
      apiEndpoint="/api/receitas"
      docType="receita"
      validityDays={30}
      fields={FIELDS}
      nameField="nome_paciente"
      cpfField="cpf"
    />
  );
}
