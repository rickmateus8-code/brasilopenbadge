import DocumentosSalvos from "@/components/DocumentosSalvos";
import { useSettings } from "@/hooks/useSettings";

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
  const { validityDays } = useSettings();
  return (
    <DocumentosSalvos
      title="Históricos UNINTER Salvos"
      apiEndpoint="/api/documents/historico-uninter"
      docType="historico-uninter"
      validityDays={validityDays}
      fields={FIELDS}
      nameField="nome"
      cpfField="cpf"
    />
  );
}
