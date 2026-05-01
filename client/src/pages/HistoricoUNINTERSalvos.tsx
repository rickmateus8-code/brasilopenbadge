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
      idLabel="Código Emissão"
      idField="codigo_qr"
      dateLabel="Data Emissão"
      dateField="dataEmissao"
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
