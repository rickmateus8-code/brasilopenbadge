import DocumentosSalvos from "@/components/DocumentosSalvos";

const FIELDS = [
  { key: "nome", label: "Nome Completo" },
  { key: "cpf", label: "CPF", locked: true },
  { key: "rg", label: "RG" },
  { key: "ra", label: "RA" },
  { key: "curso", label: "Curso" },
  { key: "polo", label: "Polo" },
  { key: "dataEmissao", label: "Data Emissão" },
  { key: "dataConclusao", label: "Data Conclusão" },
  { key: "observacoes", label: "Observações", type: "textarea" as const },
];

export default function HistoricoUNINTERSalvos() {
  return (
    <DocumentosSalvos
      title="Históricos UNINTER Salvos"
      apiEndpoint="/api/documents/historico-uninter"
      docType="historico-uninter"
      validityDays={30}
      fields={FIELDS}
      nameField="nome"
      cpfField="cpf"
    />
  );
}
