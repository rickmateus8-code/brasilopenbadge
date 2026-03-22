import DocumentosSalvos from "@/components/DocumentosSalvos";

const FIELDS = [
  { key: "nome", label: "Nome Completo" },
  { key: "cpf", label: "CPF", locked: true },
  { key: "rg", label: "RG" },
  { key: "categoria", label: "Categoria" },
  { key: "registro", label: "Nº Registro" },
  { key: "validade", label: "Validade" },
  { key: "dataEmissao", label: "Data Emissão" },
  { key: "dataNascimento", label: "Data Nascimento" },
  { key: "localNascimento", label: "Local Nascimento" },
  { key: "nomePai", label: "Nome do Pai" },
  { key: "nomeMae", label: "Nome da Mãe" },
  { key: "observacoes", label: "Observações", type: "textarea" as const },
];

export default function CHASalvas() {
  return (
    <DocumentosSalvos
      title="CHAs Salvas"
      apiEndpoint="/api/documents/cha"
      docType="cha"
      validityDays={30}
      fields={FIELDS}
      nameField="nome"
      cpfField="cpf"
      extraColumns={[
        { key: "categoria", label: "Categoria" },
      ]}
    />
  );
}
