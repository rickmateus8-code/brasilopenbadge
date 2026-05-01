import DocumentosSalvos from "@/components/DocumentosSalvos";
import { useSettings } from "@/hooks/useSettings";

const FIELDS = [
  { key: "codigo_qr", label: "Código Emissão", badge: true },
  { key: "nome_paciente", label: "Nome do Paciente" },
  { key: "cpf", label: "CPF", locked: true },
  { key: "data_emissao", label: "Data Emissão" },
  { key: "nome_medico", label: "Nome do Médico" },
  { 
    key: "created_at", 
    label: "Criação (Painel)", 
    format: (val: string) => {
      if (!val) return "—";
      const date = new Date(val);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },
  { key: "crm", label: "CRM" },
  { key: "especialidade", label: "Especialidade" },
  { key: "cid", label: "CID" },
  { key: "dias_afastamento", label: "Dias Afastamento" },
  { key: "observacoes", label: "Observações", type: "textarea" as const },
];

export default function AtestadosSalvos() {
  const { validityDays } = useSettings();

  return (
    <DocumentosSalvos
      title="Atestados Salvos"
      apiEndpoint="/api/attestations"
      docType="attestation"
      validityDays={validityDays}
      fields={FIELDS}
      nameField="nome_paciente"
      cpfField="cpf"
      editRoute="/atestado/editar"
      downloadRoute="/atestado/editar"
    />
  );
}
