import DocumentosSalvos from "@/components/DocumentosSalvos";
import { useSettings } from "@/hooks/useSettings";

const FIELDS = [
  { key: "nome_paciente", label: "Nome do Paciente" },
  { key: "cpf", label: "CPF", locked: true },
  { key: "tipo_doc", label: "Tipo Documento" },
  { key: "data_emissao", label: "Data Emissão" },
  { key: "hora_emissao", label: "Hora Emissão" },
  { key: "nome_medico", label: "Nome do Médico" },
  { key: "crm", label: "CRM" },
  { key: "uf_crm", label: "UF CRM" },
  { key: "especialidade", label: "Especialidade" },
  { key: "cid", label: "CID" },
  { key: "dias_afastamento", label: "Dias Afastamento" },
  { key: "endereco", label: "Endereço" },
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
