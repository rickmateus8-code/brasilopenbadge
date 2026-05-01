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
      idLabel="ID Emissão"
      idField="id"
      dateLabel="Data Emissão"
      dateField="data"
      extraColumns={[
        {
          key: "created_at",
          label: "Criação (Painel)",
          render: (doc) => {
            const date = new Date(doc.created_at);
            return (
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {date.toLocaleDateString("pt-BR")}
                </span>
                <span className="text-[10px] text-gray-400">
                  {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          }
        }
      ]}
    />
  );
}
