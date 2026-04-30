import DocumentosSalvos from "@/components/DocumentosSalvos";
import { useSettings } from "@/hooks/useSettings";

const FIELDS = [
  { key: "requerente", label: "Nome do Requerente" },
  { key: "processo", label: "Número do Processo" },
  { key: "advogado", label: "Advogado" },
  { key: "oab", label: "OAB" },
  { key: "cidade", label: "Comarca" },
  { key: "data", label: "Data" },
  { key: "corpo", label: "Conteúdo", type: "textarea" as const },
];

export default function PetitionSTJSalvos() {
  const { validityDays } = useSettings();
  return (
    <DocumentosSalvos
      title="Petições Jurídicas Salvas"
      apiEndpoint="/api/documents/peticaocria"
      docType="peticaocria"
      validityDays={validityDays}
      fields={FIELDS}
      nameField="requerente"
      cpfField="processo" // Usando processo como campo de identificação secundário
    />
  );
}
