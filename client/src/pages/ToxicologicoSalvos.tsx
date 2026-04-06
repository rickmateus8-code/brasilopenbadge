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
      editRoute="/toxicologico/editar"
      extraColumns={[
        { key: "resultado", label: "Resultado" },
      ]}
    />
  );
}
