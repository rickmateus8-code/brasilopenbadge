import DocumentosSalvos from "@/components/DocumentosSalvos";
import { useSettings } from "@/hooks/useSettings";

const FIELDS = [
  { key: "nome_paciente", label: "Nome do Paciente" },
  { key: "cpf", label: "CPF", locked: true },
  { key: "data_emissao", label: "Data Emissão" },
  { key: "nome_medico", label: "Nome do Médico" },
  { key: "crm", label: "CRM" },
  { key: "uf_crm", label: "UF CRM" },
  { key: "especialidade", label: "Especialidade" },
  { key: "medicamento", label: "Medicamento" },
  { key: "posologia", label: "Posologia" },
  { key: "endereco", label: "Endereço" },
  { key: "observacoes", label: "Observações", type: "textarea" as const },
];

export default function ReceitasSalvas() {
  const { validityDays } = useSettings();
  return (
    <DocumentosSalvos
      title="Receitas Salvas"
      apiEndpoint="/api/receitas"
      docType="receita"
      validityDays={validityDays}
      fields={FIELDS}
      nameField="nome_paciente"
      cpfField="cpf"
      editRoute="/receita/editar"
      downloadRoute="/receita/editar"
    />
  );
}
