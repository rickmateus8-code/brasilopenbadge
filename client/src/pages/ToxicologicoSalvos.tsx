import DocumentosSalvos from "@/components/DocumentosSalvos";
import { useSettings } from "@/hooks/useSettings";

const FIELDS = [
  { key: "nome", label: "Nome Completo" },
  { key: "cpf", label: "CPF", locked: true },
  { key: "rg", label: "RG" },
  { key: "dataNascimento", label: "Data Nascimento" },
  { key: "dataColeta", label: "Data Coleta" },
  { key: "dataEmissao", label: "Data Emissão" },
  { key: "validade", label: "Validade" },
  { key: "laboratorio", label: "Laboratório" },
  { key: "resultado", label: "Resultado" },
  { key: "protocolo", label: "Protocolo" },
  { key: "responsavel", label: "Responsável Técnico" },
  { key: "crf", label: "CRF" },
  { key: "observacoes", label: "Observações", type: "textarea" as const },
];

export default function ToxicologicoSalvos() {
  const { validityDays } = useSettings();
  return (
    <DocumentosSalvos
      title="Toxicológicos Salvos"
      apiEndpoint="/api/documents/toxicologico"
      docType="toxicologico"
      validityDays={validityDays}
      fields={FIELDS}
      nameField="nome"
      cpfField="cpf"
      idLabel="Código Emissão"
      idField="codigo_qr"
      dateLabel="Data Emissão"
      dateField="dataEmissao"
      editRoute="/toxicologico/editar"
      extraColumns={[
        { key: "resultado", label: "Resultado" },
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
