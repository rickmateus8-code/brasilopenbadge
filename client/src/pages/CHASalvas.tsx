import DocumentosSalvos from "@/components/DocumentosSalvos";
import { useSettings } from "@/hooks/useSettings";

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
  const { validityDays } = useSettings();
  return (
    <DocumentosSalvos
      title="CHAs Salvas"
      apiEndpoint="/api/documents/cha"
      docType="cha"
      validityDays={validityDays}
      fields={FIELDS}
      nameField="nome"
      cpfField="cpf"
      editRoute="/cha/editar"
      extraColumns={[
        { key: "categoria", label: "Categoria" },
      ]}
    />
  );
}
