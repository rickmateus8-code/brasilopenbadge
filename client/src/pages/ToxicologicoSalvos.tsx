import DocumentosSalvos from "@/components/DocumentosSalvos";

const FIELDS = [
  { key: "nome", label: "Nome Completo" },
  { key: "cpf", label: "CPF", locked: true },
  { key: "rg", label: "RG" },
  { key: "dataNascimento", label: "Data Nascimento" },
  { key: "dataColeta", label: "Data Coleta" },
  { key: "dataResultado", label: "Data Resultado" },
  { key: "laboratorio", label: "Laboratório" },
  { key: "resultado", label: "Resultado" },
  { key: "observacoes", label: "Observações", type: "textarea" as const },
];

export default function ToxicologicoSalvos() {
  return (
    <DocumentosSalvos
      title="Toxicológicos Salvos"
      apiEndpoint="/api/documents/toxicologico"
      docType="toxicologico"
      validityDays={30}
      fields={FIELDS}
      nameField="nome"
      cpfField="cpf"
    />
  );
}
