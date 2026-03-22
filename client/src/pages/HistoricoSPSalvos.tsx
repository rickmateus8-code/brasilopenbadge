import DocumentosSalvos from "@/components/DocumentosSalvos";

const FIELDS = [
  { key: "nome", label: "Nome Completo" },
  { key: "cpf", label: "CPF", locked: true },
  { key: "rg", label: "RG" },
  { key: "ra", label: "RA" },
  { key: "curso", label: "Curso" },
  { key: "instituicao", label: "Instituição" },
  { key: "dataEmissao", label: "Data Emissão" },
  { key: "dataConclusao", label: "Data Conclusão" },
  { key: "observacoes", label: "Observações", type: "textarea" as const },
];

export default function HistoricoSPSalvos() {
  return (
    <DocumentosSalvos
      title="Históricos SP Salvos"
      apiEndpoint="/api/documents/historico-sp"
      docType="historico-sp"
      validityDays={30}
      fields={FIELDS}
      nameField="nome"
      cpfField="cpf"
    />
  );
}
