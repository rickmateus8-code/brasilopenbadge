import DocumentosSalvos from "@/components/DocumentosSalvos";
import { useSettings } from "@/hooks/useSettings";

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
  const { validityDays } = useSettings();
  return (
    <DocumentosSalvos
      title="Históricos SP Salvos"
      apiEndpoint="/api/documents/historico-sp"
      docType="historico-sp"
      validityDays={validityDays}
      fields={FIELDS}
      nameField="nome"
      cpfField="cpf"
    />
  );
}
