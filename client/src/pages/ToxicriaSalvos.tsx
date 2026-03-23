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
    />
  );
}
