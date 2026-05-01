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
      idLabel="Código Emissão"
      idField="codigo_qr"
      dateLabel="Data Emissão"
      dateField="dataEmissao"
      extraColumns={[
        { key: "categoria", label: "Categoria" },
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
      editRoute="/cha/editar"
    />
  );
}
