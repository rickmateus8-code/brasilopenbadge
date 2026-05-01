/**
 * ToxicriaSalvos — Histórico de Laudos Toxicológicos Sodré
 */
import DocumentosSalvos from "@/components/DocumentosSalvos";

const FIELDS = [
  { key: "nome", label: "Nome Completo" },
  { key: "cpf", label: "CPF", locked: true },
  { key: "labColetor", label: "Lab. Coletor" },
  { key: "comprimento", label: "Comprimento (CM)" },
  { key: "dataColeta", label: "Data da Coleta" },
  { key: "dataRecebimento", label: "Data Recebimento" },
  { key: "dataLiberacao", label: "Data de Liberação" },
  { key: "validadeExame", label: "Validade do Exame" },
  { key: "os", label: "Número O.S" },
];

export default function ToxicriaSalvos() {
  return (
    <DocumentosSalvos
      title="Laudos Toxicológicos Sodré"
      apiEndpoint="/api/documents/toxicria"
      docType="toxicria"
      validityDays={60}
      fields={FIELDS}
      nameField="nome"
      cpfField="cpf"
      idLabel="Código Emissão"
      idField="codigo_qr"
      dateLabel="Data Emissão"
      dateField="dataLiberacao"
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
